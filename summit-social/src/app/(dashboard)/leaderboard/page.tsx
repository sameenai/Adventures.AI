import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Pagination } from "@/components/shared/pagination";
import { CACHE_TTL } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getCached, setCache } from "@/lib/db/redis";
import type { LeaderboardEntry } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leaderboard | Basecamper" };

const PAGE_SIZE = 25;

// Windowed rankings draw from a bounded pool of the adventures with the most
// votes cast inside the window; pages beyond the pool are simply empty.
const WINDOW_POOL_SIZE = 100;

// All-time top ranks fetched as the trend-comparison baseline for windowed views.
const ALL_TIME_BASELINE_SIZE = 100;

const LEADERBOARD_INCLUDE = {
  user: { select: { id: true, name: true, avatarUrl: true } },
  tags: true,
} as const;

interface LeaderboardData {
  total: number;
  entries: LeaderboardEntry[];
}

// "All time" ranks by the denormalised all-time voteCount.
async function getAllTimeLeaderboard(page: number): Promise<LeaderboardData> {
  const [total, adventures] = await Promise.all([
    prisma.adventure.count({ where: { published: true } }),
    prisma.adventure.findMany({
      where: { published: true },
      orderBy: { voteCount: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: LEADERBOARD_INCLUDE,
    }),
  ]);

  const rankOffset = (page - 1) * PAGE_SIZE;
  const entries: LeaderboardEntry[] = adventures.map((adventure, index) => ({
    rank: rankOffset + index + 1,
    adventure,
    trend: "stable" as const,
  }));

  return { total, entries };
}

// Windowed views rank by votes CAST within the window (not all-time voteCount):
// group votes since windowStart by adventure, order by that count, then fetch
// the page's adventures and re-order them to match the ranking.
async function getWindowedLeaderboard(windowStart: Date, page: number): Promise<LeaderboardData> {
  const [voteGroups, allTimeTop] = await Promise.all([
    prisma.vote.groupBy({
      by: ["adventureId"],
      where: {
        createdAt: { gte: windowStart },
        adventure: { is: { published: true } },
      },
      _count: { adventureId: true },
      orderBy: { _count: { adventureId: "desc" } },
      take: WINDOW_POOL_SIZE,
    }),
    prisma.adventure.findMany({
      where: { published: true },
      orderBy: { voteCount: "desc" },
      take: ALL_TIME_BASELINE_SIZE,
      select: { id: true },
    }),
  ]);

  const rankedIds = voteGroups.map((g) => g.adventureId);
  const rankOffset = (page - 1) * PAGE_SIZE;
  const pageIds = rankedIds.slice(rankOffset, rankOffset + PAGE_SIZE);
  if (pageIds.length === 0) return { total: rankedIds.length, entries: [] };

  const adventuresById = await prisma.adventure
    .findMany({
      where: { id: { in: pageIds } },
      include: LEADERBOARD_INCLUDE,
    })
    .then((list) => new Map(list.map((a) => [a.id, a])));

  // Build a map of id → 1-based all-time rank for the trend comparison.
  const allTimeRankMap = new Map(allTimeTop.map((a, i) => [a.id, i + 1]));

  const entries: LeaderboardEntry[] = [];
  pageIds.forEach((adventureId, index) => {
    const adventure = adventuresById.get(adventureId);
    if (!adventure) return;
    const currentRank = rankOffset + index + 1;
    const allTimeRank = allTimeRankMap.get(adventureId);
    if (allTimeRank === undefined) {
      entries.push({ rank: currentRank, adventure, trend: "new", previousRank: undefined });
      return;
    }
    const trend = currentRank < allTimeRank ? "up" : currentRank > allTimeRank ? "down" : "stable";
    entries.push({ rank: currentRank, adventure, trend, previousRank: allTimeRank });
  });

  return { total: rankedIds.length, entries };
}

// The leaderboard is identical for every visitor with the same window/page, so
// serve it from Redis (CACHE_TTL.leaderboardTop) instead of re-running the
// ranking queries on every request.
async function getLeaderboardData(timeWindow: string, page: number): Promise<LeaderboardData> {
  const cacheKey = `leaderboard:${timeWindow}:${page}`;
  const cached = await getCached<LeaderboardData>(cacheKey);
  if (cached) return cached;

  const windowStart =
    timeWindow === "week"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : timeWindow === "month"
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : timeWindow === "year"
          ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          : undefined;

  const data = windowStart
    ? await getWindowedLeaderboard(windowStart, page)
    : await getAllTimeLeaderboard(page);

  await setCache(cacheKey, data, CACHE_TTL.leaderboardTop);
  return data;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const timeWindow = params.window ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { total, entries } = await getLeaderboardData(timeWindow, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

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
          {total} adventures ranked
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

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => `/leaderboard?window=${timeWindow}&page=${p}`}
      />
    </div>
  );
}
