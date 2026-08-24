import { authOptions } from "@/lib/auth/config";
import { APP_URL, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * A native <form method="POST"> navigation cannot consume a JSON body — it would
 * render raw JSON in the browser. Detect that case (no explicit JSON Accept, or a
 * form-encoded submission) so we can 303-redirect straight to Stripe instead.
 */
function isFormNavigation(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return (
    !accept.includes("application/json") ||
    contentType.includes("application/x-www-form-urlencoded")
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `stripe-checkout:${session.user.id}`,
    RATE_LIMITS.stripeCheckout.limit,
    RATE_LIMITS.stripeCheckout.windowSeconds,
    { failClosed: true },
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Pro price not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.plan === "PRO") {
    return NextResponse.json({ error: "Already on Pro plan" }, { status: 400 });
  }

  // Reuse existing Stripe customer or create one
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pro`,
    // Pass userId in both places so the webhook can resolve the user
    metadata: { userId: session.user.id },
    subscription_data: { metadata: { userId: session.user.id } },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Checkout session has no URL" }, { status: 502 });
  }

  // Browser form navigations must be redirected to Stripe; fetch callers get JSON.
  if (isFormNavigation(request)) {
    return NextResponse.redirect(checkoutSession.url, 303);
  }

  return NextResponse.json({ url: checkoutSession.url });
}
