"use client";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { AdventureWithUser } from "@/types";
import Link from "next/link";
import { useCallback } from "react";
import { AdventureCard } from "./adventure-card";
import { AdventureListRow } from "./adventure-list-row";

interface InfiniteAdventureGridProps {
  initialAdventures: AdventureWithUser[];
  initialNextCursor?: string;
  currentUserId?: string;
  votedAdventureIds: string[];
  bookmarkedAdventureIds: string[];
  category?: string;
  continent?: string;
  difficulty?: string;
  duration?: string;
  month?: string;
  climate?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  view?: "grid" | "list";
}

export function InfiniteAdventureGrid({
  initialAdventures,
  initialNextCursor,
  currentUserId,
  votedAdventureIds,
  bookmarkedAdventureIds,
  category,
  continent,
  difficulty,
  duration,
  month,
  climate,
  tag,
  search,
  sortBy,
  view = "grid",
}: InfiniteAdventureGridProps) {
  const votedSet = new Set(votedAdventureIds);
  const bookmarkedSet = new Set(bookmarkedAdventureIds);

  // Individual primitives as deps so fetchFn only recreates when filter values
  // actually change, not on every setItems re-render (which would cause
  // sentinelRef to reconnect the IntersectionObserver and fire a duplicate fetch).
  const fetchFn = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (continent) params.set("continent", continent);
      if (difficulty) params.set("difficulty", difficulty);
      if (duration) params.set("duration", duration);
      if (month) params.set("month", month);
      if (climate) params.set("climate", climate);
      if (tag) params.set("tag", tag);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const res = await fetch(`/api/adventures?${params.toString()}`);
      if (!res.ok) {
        console.error(`Failed to fetch adventures: ${res.status} ${res.statusText}`);
        return { items: [], nextCursor: undefined };
      }
      return res.json() as Promise<{ items: AdventureWithUser[]; nextCursor?: string }>;
    },
    [category, continent, difficulty, duration, month, climate, tag, search, sortBy],
  );

  const { items, loading, hasMore, sentinelRef } = useInfiniteScroll<AdventureWithUser>({
    fetchFn,
    initialItems: initialAdventures,
    initialCursor: initialNextCursor,
  });

  if (items.length === 0 && !loading) {
    const planPrompt = search?.trim() || "Help me plan my next adventure";
    return (
      <div className="py-16 text-center">
        <p className="font-display text-lg uppercase tracking-widest text-stone-500">
          No adventures found
        </p>
        <p className="mt-1 text-sm text-stone-600">Try adjusting your filters or search query.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/adventures"
            className="border border-stone-700 px-4 py-2 font-mono text-xs uppercase tracking-widest text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-200"
          >
            Clear filters
          </Link>
          <Link
            href={`/itinerary?prompt=${encodeURIComponent(planPrompt)}`}
            className="border border-amber-500/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-amber-500 transition-colors hover:border-amber-500 hover:bg-amber-500/10"
          >
            Plan it with AI instead →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === "list" ? (
        <div className="flex flex-col gap-2">
          {items.map((adventure) => (
            <AdventureListRow
              key={adventure.id}
              adventure={adventure}
              currentUserId={currentUserId}
              hasVoted={votedSet.has(adventure.id)}
              hasBookmarked={bookmarkedSet.has(adventure.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((adventure, i) => (
            <div
              key={adventure.id}
              className={i === 0 && items.length > 1 ? "sm:col-span-2 lg:col-span-2" : ""}
            >
              <AdventureCard
                adventure={adventure}
                currentUserId={currentUserId}
                hasVoted={votedSet.has(adventure.id)}
                hasBookmarked={bookmarkedSet.has(adventure.id)}
                featured={i === 0 && items.length > 1}
              />
            </div>
          ))}
        </div>
      )}

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
        <p className="mt-8 text-center font-mono text-xs text-stone-600 uppercase tracking-widest">
          All adventures loaded
        </p>
      )}
    </>
  );
}
