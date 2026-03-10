import { AdventureGrid } from "@/components/adventures/adventure-grid";
import type { AdventureWithUser } from "@/types";

interface AdventureHistoryProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
}

export function AdventureHistory({ adventures, currentUserId }: AdventureHistoryProps) {
  return (
    <div>
      <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-stone-100">Adventures</h2>
      <AdventureGrid adventures={adventures} currentUserId={currentUserId} />
    </div>
  );
}
