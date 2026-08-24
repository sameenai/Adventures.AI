import { ChatWindow } from "@/components/chat/chat-window";
import { ApiKeyCallout } from "@/components/ui/api-key-callout";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plan Trip | Basecamper" };

export default async function ItineraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const { prompt } = await searchParams;

  // Fetch credit info for authenticated users
  let creditsUsed = 0;
  let isPro = false;
  let isByok = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, aiCreditsUsed: true, aiCreditsResetAt: true, openAiApiKey: true },
    });
    if (user) {
      isPro = user.plan === "PRO";
      isByok = Boolean(user.openAiApiKey);
      const now = new Date();
      const resetAt = user.aiCreditsResetAt ?? now;
      const sameMonth =
        resetAt.getUTCFullYear() === now.getUTCFullYear() &&
        resetAt.getUTCMonth() === now.getUTCMonth();
      creditsUsed = sameMonth ? user.aiCreditsUsed : 0;
    }
  }

  const limit = PLANS.FREE.aiCreditsPerMonth;
  const creditsRemaining = Math.max(0, limit - creditsUsed);
  const showCreditBanner = session && !isPro && !isByok;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          AI-Powered
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Trip Planner
        </h1>
      </div>

      {session ? (
        <>
          {!isByok && !isPro && (
            <ApiKeyCallout
              className="mt-6"
              title="Add your OpenAI API key to unlock full AI planning"
              description="Without a key, responses are demo-only. Add your own GPT-4o key in your profile to get real, personalised itineraries — and bypass the monthly session limit."
            />
          )}
          {showCreditBanner && (
            <div
              className={`mt-4 flex flex-wrap items-center justify-between gap-2 border px-4 py-2 ${
                creditsRemaining === 0
                  ? "border-red-800/60 bg-red-950/30"
                  : creditsRemaining === 1
                    ? "border-amber-700/60 bg-amber-950/20"
                    : "border-stone-800 bg-stone-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: limit }).map((_, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: static indicator dots
                      key={i}
                      className={`h-1.5 w-5 ${i < creditsUsed ? "bg-stone-700" : "bg-amber-500"}`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-stone-500">
                  {creditsRemaining === 0
                    ? "Monthly sessions used"
                    : `${creditsRemaining} of ${limit} sessions remaining`}
                </span>
              </div>
              <Link
                href="/pro"
                className="font-display text-[10px] uppercase tracking-widest text-amber-500 transition-colors hover:text-amber-400"
              >
                Upgrade →
              </Link>
            </div>
          )}
          <div className="mt-4 h-[calc(100dvh-280px)] min-h-[400px] overflow-hidden border border-stone-800">
            <ChatWindow initialPrompt={prompt} />
          </div>
        </>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-stone-700">
            <svg
              className="h-7 w-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-xl uppercase tracking-widest text-stone-100">
              Sign in to start planning
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
              The AI Trip Planner builds personalised day-by-day itineraries around your pace,
              budget, and ambitions. Create a free account to get started.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup">
              <Button>Create free account</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
