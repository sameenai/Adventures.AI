import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  const isTop3 = rank <= 3;
  const colors: Record<number, string> = {
    1: "bg-yellow-100 text-yellow-800 border-yellow-300",
    2: "bg-gray-100 text-gray-700 border-gray-300",
    3: "bg-orange-100 text-orange-800 border-orange-300",
  };

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
        isTop3 ? `border ${colors[rank]}` : "text-gray-500",
      )}
    >
      {rank}
    </span>
  );
}
