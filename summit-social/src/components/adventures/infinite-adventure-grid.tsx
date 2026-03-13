"use client";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { AdventureWithUser } from "@/types";
import { useCallback } from "react";
import { AdventureCard } from "./adventure-card";

interface InfiniteAdventureGridProps {
  initialAdventures: AdventureWithUser[];
  initialNextCursor?: string;
  currentUserId?: string;
  votedAdventureIds: string[];
  bookmarkedAdventureIds: string[];
  queryParams: Record<string, string | undefined>;
}

export function InfiniteAdventureGrid({
  initialAdventures,
  initialNextCursor,
  currentUserId,
  votedAdventureIds,
  bookmarkedAdventureIds,
  queryParams,
}: InfiniteAdventureGridProps) {
  const votedSet = new Set(votedAdventureIds);
  const bookmarkedSet = new Set(bookmarkedAdventureIds);

  const fetchFn = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(queryParams)) {
        if (v) params.set(k, v);
      }
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const res = await fetch(`/api/adventures?${params.toString()}`);
      if (!res.ok) return { items: [], nextCursor: undefined };
      return res.json() as Promise<{ items: AdventureWithUser[]; nextCursor?: string }>;
    },
    [queryParams],
  );

  const { items, loading, hasMore, sentinelRef } = useInfiniteScroll<AdventureWithUser>({
    fetchFn,
    initialItems: initialAdventures,
    initialCursor: initialNextCursor,
  });

  if (items.length === 0 && !loading) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg uppercase tracking-widest text-stone-500">
          No adventures found
        </p>
        <p className="mt-1 text-sm text-stone-600">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((adventure) => (
          <AdventureCard
            key={adventure.id}
            adventure={adventure}
            currentUserId={currentUserId}
            hasVoted={votedSet.has(adventure.id)}
            hasBookmarked={bookmarkedSet.has(adventure.id)}
          />
        ))}
      </div>

      {/* Sentinel for intersection observer */}
      {hasMore && (
        <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
          {loading && (
            <div className="font-mono text-xs text-stone-600 tracking-widest uppercase">
              Loading…
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="mt-8 text-center font-mono text-xs text-stone-700 uppercase tracking-widest">
          All adventures loaded
        </p>
      )}
    </>
  );
}
