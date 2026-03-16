import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { prisma } from "@/lib/db/prisma";
import type { LeaderboardEntry } from "@/types";
import Link from "next/link";

export const metadata = { title: "Leaderboard | Basecamp" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const timeWindow = params.window ?? "all";

  const dateFilter =
    timeWindow === "week"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : timeWindow === "month"
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : timeWindow === "year"
          ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          : undefined;

  const includeOpts = {
    user: { select: { id: true, name: true, avatarUrl: true } },
    tags: true,
  } as const;

  const [adventures, allTimeAdventures] = await Promise.all([
    prisma.adventure.findMany({
      where: {
        published: true,
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
      orderBy: { voteCount: "desc" },
      take: 100,
      include: includeOpts,
    }),
    // Always fetch all-time ranks as the comparison baseline
    timeWindow !== "all"
      ? prisma.adventure.findMany({
          where: { published: true },
          orderBy: { voteCount: "desc" },
          take: 100,
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  // Build a map of id → 1-based all-time rank
  const allTimeRankMap = new Map(allTimeAdventures.map((a, i) => [a.id, i + 1]));

  const entries: LeaderboardEntry[] = adventures.map((adventure, index) => {
    const currentRank = index + 1;
    if (timeWindow === "all") {
      return { rank: currentRank, adventure, trend: "stable" as const };
    }
    const allTimeRank = allTimeRankMap.get(adventure.id);
    if (allTimeRank === undefined) {
      return { rank: currentRank, adventure, trend: "new" as const, previousRank: undefined };
    }
    const trend = currentRank < allTimeRank ? "up" : currentRank > allTimeRank ? "down" : "stable";
    return { rank: currentRank, adventure, trend, previousRank: allTimeRank };
  });

  const windows = [
    { value: "all", label: "All Time" },
    { value: "year", label: "This Year" },
    { value: "month", label: "This Month" },
    { value: "week", label: "This Week" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between border-b border-stone-800 pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
            Rankings
          </p>
          <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
            Leaderboard
          </h1>
        </div>
        <p className="font-mono text-xs text-stone-600 hidden sm:block">
          Top {entries.length} adventures by vote
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        {windows.map((w) => (
          <Link
            key={w.value}
            href={`/leaderboard?window=${w.value}`}
            className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
              timeWindow === w.value
                ? "border border-amber-500 text-amber-500"
                : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
            }`}
          >
            {w.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
