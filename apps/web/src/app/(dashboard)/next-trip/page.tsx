import { AdventureCard } from "@/components/adventures/adventure-card";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your Next Trip | Basecamper" };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthsBetween(from: Date, to: Date): number {
  return Math.max(
    0,
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()),
  );
}

/**
 * The cadence surface: "you're up for your next trip — here's where".
 * Shows the countdown from the last logged trip and the persisted
 * recommendations for the upcoming window, each explaining why it was picked.
 */
export default async function NextTripPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [lastTrip, profile, recommendations] = await Promise.all([
    prisma.tripEvent.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: { adventure: { select: { title: true } } },
    }),
    prisma.travelerProfile.findUnique({ where: { userId } }),
    prisma.cadenceRecommendation.findMany({
      where: { userId, status: { in: ["PENDING", "SENT", "CLICKED"] } },
      orderBy: [{ windowStart: "desc" }, { score: "desc" }],
      take: 5,
      include: {
        adventure: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
            _count: { select: { comments: true } },
          },
        },
      },
    }),
  ]);

  const cadenceMonths = profile?.cadenceMonths ?? 6;
  const now = new Date();

  let countdown: { dueLabel: string; sinceLabel: string | null } | null = null;
  if (lastTrip) {
    const due = new Date(lastTrip.startedAt);
    due.setUTCMonth(due.getUTCMonth() + cadenceMonths);
    const monthsSince = monthsBetween(lastTrip.startedAt, now);
    const overdue = due <= now;
    countdown = {
      dueLabel: overdue
        ? "Your next trip window is open"
        : `Your next window opens in ${MONTH_NAMES[due.getUTCMonth()]}`,
      sinceLabel: lastTrip.adventure
        ? `${monthsSince} month${monthsSince === 1 ? "" : "s"} since ${lastTrip.adventure.title}`
        : `${monthsSince} month${monthsSince === 1 ? "" : "s"} since your last trip`,
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6">
        <p className="mb-1 font-display text-xs uppercase tracking-[0.35em] text-stone-500">
          Travel cadence
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Your next trip
        </h1>
        {countdown ? (
          <div className="mt-4">
            <p className="text-lg text-amber-500">{countdown.dueLabel}</p>
            {countdown.sinceLabel && (
              <p className="mt-1 font-mono text-xs text-stone-500">{countdown.sinceLabel}</p>
            )}
          </div>
        ) : (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
            Log a trip to start your cadence clock: open any adventure you&rsquo;ve done and hit
            &ldquo;I did this&rdquo;. From then on, Basecamper watches your rhythm and lines up
            where to go next.
          </p>
        )}
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-sm uppercase tracking-widest text-stone-300">
            Picked for your window
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex flex-col gap-2">
                <AdventureCard adventure={rec.adventure} />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="font-mono text-[10px] text-stone-600">
                    {(rec.reasons as string[]).join(" · ")}
                  </p>
                  <Link
                    href={`/itinerary?prompt=${encodeURIComponent(
                      `Plan a trip around "${rec.adventure.title}" (${rec.adventure.location}, ${rec.adventure.country})`,
                    )}`}
                    className="font-display text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400"
                  >
                    Plan it →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 border border-stone-800 p-8 text-center">
          <p className="text-sm text-stone-400">
            No picks yet. Save adventures to your bucket list and log past trips — the nightly
            cadence scan turns them into a shortlist when your window approaches.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/adventures"
              className="font-display text-xs uppercase tracking-widest text-amber-500 hover:text-amber-400"
            >
              Browse adventures →
            </Link>
            <Link
              href="/profile/edit"
              className="font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200"
            >
              Set your travel cadence →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
