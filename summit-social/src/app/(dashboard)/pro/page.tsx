import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { UpgradeButton } from "./upgrade-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Go Pro | Basecamper" };

const FREE_FEATURES = [
  `${PLANS.FREE.aiMessagesPerMonth} AI planner messages / month`,
  `Up to ${PLANS.FREE.bookmarkLimit} bookmarks`,
  "Unlimited adventure posts",
  "Community feed & leaderboard",
  "Flight search",
];

const PRO_FEATURES = [
  "Unlimited AI planning sessions",
  "Unlimited bookmarks",
  "Everything in Free",
  "Pro badge on your profile",
  "Priority support",
];

export default async function ProPage() {
  const session = await getServerSession(authOptions);

  let isPro = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    isPro = user?.plan === "PRO";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-500 mb-2">
          Pricing
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Upgrade to Pro
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-sm leading-relaxed text-stone-500">
          Unlock unlimited AI trip planning sessions and remove all usage caps. Built for serious
          adventurers who plan more than they sleep.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {/* Free tier */}
        <div className="border border-stone-800 p-8">
          <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-600">Free</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-4xl text-stone-300">£0</span>
            <span className="font-mono text-sm text-stone-600">/ month</span>
          </div>
          <ul className="mt-8 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 font-mono text-xs text-stone-500">
                <span className="mt-0.5 shrink-0 text-stone-700">–</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {session ? (
              <p className="font-mono text-xs text-stone-600">Your current plan</p>
            ) : (
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  Get started free
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Pro tier */}
        <div className="relative border border-amber-500/60 p-8">
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
          <div className="flex items-center gap-2">
            <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-500">Pro</p>
            <span className="border border-amber-500/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-500">
              Recommended
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-4xl text-amber-400">£{PLANS.PRO.priceGBP}</span>
            <span className="font-mono text-sm text-stone-600">/ month</span>
          </div>
          <ul className="mt-8 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 font-mono text-xs text-stone-300">
                <span className="mt-0.5 shrink-0 text-amber-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {isPro ? (
              <p className="font-mono text-xs text-amber-500">You&apos;re on Pro — thank you!</p>
            ) : session ? (
              <UpgradeButton />
            ) : (
              <Link href="/signup">
                <Button className="w-full">Start with Pro</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[10px] text-stone-700">
        Cancel anytime. Billed monthly. Prices in GBP.
      </p>
    </div>
  );
}
