import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { prisma } from "@/lib/db/prisma";
import type { LeaderboardEntry } from "@/types";
import Link from "next/link";

export const metadata = { title: "Leaderboard | SummitSocial" };

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

  const adventures = await prisma.adventure.findMany({
    where: {
      published: true,
      ...(dateFilter && { createdAt: { gte: dateFilter } }),
    },
    orderBy: { voteCount: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
    },
  });

  const entries: LeaderboardEntry[] = adventures.map((adventure, index) => ({
    rank: index + 1,
    adventure,
    trend: "stable" as const,
  }));

  const windows = [
    { value: "all", label: "All Time" },
    { value: "year", label: "This Year" },
    { value: "month", label: "This Month" },
    { value: "week", label: "This Week" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Adventure Leaderboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        The most voted adventures from the SummitSocial community.
      </p>

      <div className="mt-6 flex gap-2">
        {windows.map((w) => (
          <Link
            key={w.value}
            href={`/leaderboard?window=${w.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              timeWindow === w.value
                ? "bg-summit-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
