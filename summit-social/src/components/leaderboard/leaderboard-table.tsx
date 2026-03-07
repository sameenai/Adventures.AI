import type { LeaderboardEntry } from "@/types";
import { RankBadge } from "./rank-badge";
import { TrendArrow } from "./trend-arrow";
import Image from "next/image";
import Link from "next/link";
import { cn, pluralise } from "@/lib/utils";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Adventure</th>
            <th className="px-4 py-3 hidden md:table-cell">Category</th>
            <th className="px-4 py-3 hidden lg:table-cell">Difficulty</th>
            <th className="px-4 py-3 text-right">Votes</th>
            <th className="px-4 py-3 text-center">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const difficulty = DIFFICULTY_MAP.get(entry.adventure.difficulty);
            return (
              <tr key={entry.adventure.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/adventures/${entry.adventure.id}`} className="flex items-center gap-3">
                    <Image
                      src={entry.adventure.coverImageUrl}
                      alt={entry.adventure.title}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{entry.adventure.title}</p>
                      <p className="text-xs text-gray-500">{entry.adventure.location}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                  {entry.adventure.category.replace("_", " ")}
                </td>
                <td className={cn("px-4 py-3 hidden lg:table-cell text-sm font-medium", difficulty?.color)}>
                  {difficulty?.label}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {entry.adventure.voteCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <TrendArrow trend={entry.trend} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
