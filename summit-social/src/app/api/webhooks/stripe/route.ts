import { track } from "@/lib/analytics/track";
import { handleFlightBookingPaid, handleFlightBookingRefund } from "@/lib/billing/flight-booking";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    logger.error(
      "Stripe webhook received but STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY not configured",
    );
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Stripe retries deliveries and may replay events within the signing
  // window. The unique ledger insert makes reprocessing a no-op.
  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" // unique violation: already processed
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "flight_booking") {
          await handleFlightBookingPaid(session);
          break;
        }
        const userId = session.metadata?.userId;
        const subId = typeof session.subscription === "string" ? session.subscription : null;
        if (userId && subId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "PRO", stripeSubId: subId },
          });
          track("pro_subscribed", { userId });
        }
        break;
      }

      case "charge.refunded": {
        await handleFlightBookingRefund(event.data.object as Stripe.Charge);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        track("pro_cancelled", { userId: userId ?? undefined });
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "FREE", stripeSubId: null },
          });
        } else {
          // Fall back to looking up by stripeSubId
          await prisma.user.updateMany({
            where: { stripeSubId: sub.id },
            data: { plan: "FREE", stripeSubId: null },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const isActive = sub.status === "active" || sub.status === "trialing";
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: isActive ? "PRO" : "FREE" },
          });
        } else {
          // Metadata can be absent on subscriptions mutated outside checkout
          // (dashboard edits, API changes) — fall back to the stored sub id
          // so plan state cannot silently go stale.
          await prisma.user.updateMany({
            where: { stripeSubId: sub.id },
            data: { plan: isActive ? "PRO" : "FREE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    logger.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
