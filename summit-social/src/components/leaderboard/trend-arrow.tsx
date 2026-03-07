import { cn } from "@/lib/utils";

interface TrendArrowProps {
  trend: "up" | "down" | "stable" | "new";
}

export function TrendArrow({ trend }: TrendArrowProps) {
  if (trend === "new") {
    return <span className="text-xs font-medium text-summit-600">NEW</span>;
  }

  if (trend === "stable") {
    return <span className="text-gray-400">&mdash;</span>;
  }

  return (
    <span
      className={cn(
        "text-lg",
        trend === "up" ? "text-green-500" : "text-red-500",
      )}
    >
      {trend === "up" ? "\u25B2" : "\u25BC"}
    </span>
  );
}
