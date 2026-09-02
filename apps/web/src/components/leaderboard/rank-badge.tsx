import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
}

const TOP3_STYLES: Record<number, string> = {
  1: "border border-amber-500 bg-amber-500/10 text-amber-400",
  2: "border border-stone-500 bg-stone-500/10 text-stone-300",
  3: "border border-amber-800 bg-amber-800/10 text-amber-600",
};

export function RankBadge({ rank }: RankBadgeProps) {
  const isTop3 = rank <= 3;

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center font-mono text-sm font-bold",
        isTop3 ? TOP3_STYLES[rank] : "text-stone-600",
      )}
    >
      {rank}
    </span>
  );
}
