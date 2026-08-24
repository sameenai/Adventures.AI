import { withApi } from "@/lib/api/handler";
import { getOrCreateStripeCustomer } from "@/lib/billing/customer";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Payment for a saved flight via Stripe Checkout (mode: payment). Requires a
 * PRICE_CONFIRMED booking — the UI re-validates the fare first, so the amount
 * charged is the amount just verified, never a stale price. The webhook
 * (checkout.session.completed with metadata.kind=flight_booking) flips the
 * booking to PAID and the itinerary to BOOKED.
 */
export const POST = withApi(
  { rateLimit: { name: "stripeCheckout", prefix: "stripe-checkout", failClosed: true } },
  async ({ userId, params }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    }

    const booking = await prisma.flightBooking.findUnique({ where: { id: params.id } });
    if (!booking || booking.userId !== userId) {
      return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
    }
    if (booking.status !== "PRICE_CONFIRMED") {
      return NextResponse.json(
        { error: "Confirm the fare before paying", code: "INVALID_STATE" },
        { status: 409 },
      );
    }

    const stripe = new Stripe(stripeKey);
    const customerId = await getOrCreateStripeCustomer(stripe, userId);
    if (!customerId) {
      return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const returnPath = booking.itineraryId ? `/itinerary/${booking.itineraryId}` : "/itineraries";
    const metadata = { kind: "flight_booking", bookingId: booking.id, userId };

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Flight ${booking.origin} → ${booking.destination}`,
              description: `${booking.airline} ${booking.flightNumber} · departs ${booking.departureAt
                .toISOString()
                .slice(0, 16)
                .replace("T", " ")} UTC`,
            },
            unit_amount: booking.priceGBP,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}${returnPath}?payment=success`,
      cancel_url: `${APP_URL}${returnPath}?payment=cancelled`,
      metadata,
      payment_intent_data: { metadata },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 502 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  },
);
