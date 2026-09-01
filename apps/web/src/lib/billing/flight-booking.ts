import { track } from "@/lib/analytics/track";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmedEmail } from "@/lib/email/templates";
import type Stripe from "stripe";

/**
 * Money landed for a saved flight: advance the booking to PAID, flip the
 * itinerary to BOOKED, notify, and send the confirmation email. The guarded
 * updateMany means a replayed or out-of-order event can never regress a
 * TICKETED/CANCELLED/REFUNDED booking back to PAID.
 */
export async function handleFlightBookingPaid(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const advanced = await prisma.flightBooking.updateMany({
    where: { id: bookingId, status: { in: ["SELECTED", "PRICE_CONFIRMED"] } },
    data: {
      status: "PAID",
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
  if (advanced.count === 0) return; // already past PAID — nothing to redo

  const booking = await prisma.flightBooking.findUnique({
    where: { id: bookingId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!booking) return;

  track("payment_succeeded", {
    userId: booking.userId,
    props: { kind: "flight", amountGBP: booking.priceGBP },
  });

  if (booking.itineraryId) {
    await prisma.itinerary.updateMany({
      where: { id: booking.itineraryId, status: { in: ["DRAFT", "PLANNING"] } },
      data: { status: "BOOKED" },
    });
  }

  if (booking.user) {
    await prisma.notification.create({
      data: {
        userId: booking.user.id,
        type: "BOOKING_CONFIRMED",
        message: `Payment received for ${booking.origin} → ${booking.destination} (${booking.airline} ${booking.flightNumber})`,
        linkUrl: booking.itineraryId ? `/itinerary/${booking.itineraryId}` : "/itineraries",
      },
    });

    const content = bookingConfirmedEmail({
      name: booking.user.name,
      airline: booking.airline,
      flightNumber: booking.flightNumber,
      origin: booking.origin,
      destination: booking.destination,
      departureAt: booking.departureAt,
      priceGBP: booking.priceGBP,
      itineraryUrl: `${APP_URL}${
        booking.itineraryId ? `/itinerary/${booking.itineraryId}` : "/itineraries"
      }`,
    });
    await sendEmail({
      to: booking.user.email,
      userId: booking.user.id,
      template: "booking-confirmed",
      subject: content.subject,
      html: content.html,
      text: content.text,
      meta: { bookingId: booking.id },
    });
  }
}

/** A full refund on the payment intent walks the booking to REFUNDED. */
export async function handleFlightBookingRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!paymentIntentId || !charge.refunded) return;
  const refunded = await prisma.flightBooking.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { in: ["PAID", "TICKETED"] } },
    data: { status: "REFUNDED" },
  });
  if (refunded.count > 0) track("booking_refunded", { props: { kind: "flight" } });
}
