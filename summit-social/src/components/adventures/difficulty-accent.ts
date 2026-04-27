export function difficultyAccentClass(difficulty: string): string {
  switch (difficulty) {
    case "EASY":
      return "bg-emerald-500";
    case "MODERATE":
      return "bg-amber-400";
    case "CHALLENGING":
      return "bg-orange-400";
    case "EXTREME":
      return "bg-red-500";
    case "EXPEDITION_GRADE":
      return "bg-purple-500";
    default:
      return "bg-stone-600";
  }
}
