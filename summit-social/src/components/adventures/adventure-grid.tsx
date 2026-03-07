import type { AdventureWithUser } from "@/types";
import { AdventureCard } from "./adventure-card";

interface AdventureGridProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
  votedAdventureIds?: Set<string>;
}

export function AdventureGrid({
  adventures,
  currentUserId,
  votedAdventureIds = new Set(),
}: AdventureGridProps) {
  if (adventures.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">No adventures found</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {adventures.map((adventure) => (
        <AdventureCard
          key={adventure.id}
          adventure={adventure}
          currentUserId={currentUserId}
          hasVoted={votedAdventureIds.has(adventure.id)}
        />
      ))}
    </div>
  );
}
