import type { AdventureWithUser } from "@/types";
import { AdventureGrid } from "@/components/adventures/adventure-grid";

interface AdventureHistoryProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
}

export function AdventureHistory({ adventures, currentUserId }: AdventureHistoryProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Adventures</h2>
      <AdventureGrid adventures={adventures} currentUserId={currentUserId} />
    </div>
  );
}
