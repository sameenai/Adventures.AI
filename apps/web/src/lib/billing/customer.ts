import { prisma } from "@/lib/db/prisma";
import type Stripe from "stripe";

/**
 * One Stripe customer per user, created lazily and reused for subscriptions
 * and one-off flight payments alike — refunds, receipts and disputes all
 * resolve to the same customer record.
 */
export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}
