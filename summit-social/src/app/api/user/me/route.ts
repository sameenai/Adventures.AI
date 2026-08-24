import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";

/**
 * Permanent account deletion (UK GDPR Art 17). Cascades all owned content —
 * adventures, votes, comments, itineraries (incl. chat history), bookmarks,
 * collections, follows, notifications, view records — and deletes the Stripe
 * customer so billing data does not outlive the account.
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `account-delete:${session.user.id}`,
    RATE_LIMITS.profileUpdate.limit,
    RATE_LIMITS.profileUpdate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Deliberate-action check: the client must echo the exact confirmation.
  const body = await request.json().catch(() => null);
  if (body?.confirm !== "DELETE") {
    return NextResponse.json(
      {
        error: 'Send { "confirm": "DELETE" } to permanently delete your account',
        code: "CONFIRM_REQUIRED",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Best-effort Stripe cleanup first: if it fails we still delete the account
  // (the DB is the record we control) but log loudly for manual follow-up.
  if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.customers.del(user.stripeCustomerId);
    } catch (err) {
      logger.error("Stripe customer deletion failed during account erasure", err);
    }
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return new NextResponse(null, { status: 204 });
}
