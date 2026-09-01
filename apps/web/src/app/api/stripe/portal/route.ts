import { withApi } from "@/lib/api/handler";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe Billing Portal: the "cancel anytime" the pricing page promises.
 * Card updates, invoices, cancellation — all Stripe-hosted; plan state comes
 * back through the existing subscription webhooks.
 */
export const POST = withApi(
  { rateLimit: { name: "stripeCheckout", prefix: "stripe-portal", failClosed: true } },
  async ({ userId }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing history for this account", code: "NO_CUSTOMER" },
        { status: 404 },
      );
    }

    const stripe = new Stripe(stripeKey);
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/pro`,
    });

    return NextResponse.json({ url: portal.url });
  },
);
