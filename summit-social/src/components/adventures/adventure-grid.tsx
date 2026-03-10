import type { AdventureWithUser } from "@/types";
import { AdventureCard } from "./adventure-card";

const EMPTY_VOTED_IDS = new Set<string>();

interface AdventureGridProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
  votedAdventureIds?: Set<string>;
}

export function AdventureGrid({
  adventures,
  currentUserId,
  votedAdventureIds = EMPTY_VOTED_IDS,
}: AdventureGridProps) {
  if (adventures.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg uppercase tracking-widest text-stone-500">No adventures found</p>
        <p className="mt-1 text-sm text-stone-600">Try adjusting your filters or search query.</p>
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
