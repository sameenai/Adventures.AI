import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { cn, pluralise } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { RankBadge } from "./rank-badge";
import { TrendArrow } from "./trend-arrow";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const TABLE_HEADER = "px-4 py-3 font-display text-xs uppercase tracking-widest text-stone-500";

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="border border-stone-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-800 bg-stone-900/50 text-left">
            <th className={TABLE_HEADER}>#</th>
            <th className={TABLE_HEADER}>Adventure</th>
            <th className={cn(TABLE_HEADER, "hidden md:table-cell")}>Category</th>
            <th className={cn(TABLE_HEADER, "hidden lg:table-cell")}>Difficulty</th>
            <th className={cn(TABLE_HEADER, "text-right")}>Votes</th>
            <th className={cn(TABLE_HEADER, "text-center")}>Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800/60">
          {entries.map((entry) => {
            const difficulty = DIFFICULTY_MAP.get(entry.adventure.difficulty);
            return (
              <tr
                key={entry.adventure.id}
                className="bg-stone-950 hover:bg-stone-900/70 transition-colors"
              >
                <td className="px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/adventures/${entry.adventure.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Image
                      src={entry.adventure.coverImageUrl}
                      alt={entry.adventure.title}
                      width={44}
                      height={44}
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div>
                      <p className="font-display text-sm uppercase tracking-wider text-stone-200 group-hover:text-amber-400 transition-colors">
                        {entry.adventure.title}
                      </p>
                      <p className="font-mono text-xs text-stone-600">{entry.adventure.location}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-display text-xs uppercase tracking-widest text-stone-500">
                    {entry.adventure.category.replace(/_/g, " ")}
                  </span>
                </td>
                <td
                  className={cn(
                    "px-4 py-3 hidden lg:table-cell font-mono text-xs font-medium",
                    difficulty?.color,
                  )}
                >
                  {difficulty?.label}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-stone-300">
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
