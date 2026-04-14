"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions<T extends { id: string }> {
  fetchFn: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>;
  initialItems?: T[];
  initialCursor?: string;
}

export function useInfiniteScroll<T extends { id: string }>({
  fetchFn,
  initialItems = [],
  initialCursor,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCursor !== undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Tracks which cursor value is currently in-flight. null = nothing in flight.
  // Using the cursor value itself (rather than a boolean) means the guard is
  // implicitly correct across React StrictMode double-mounts: after a remount
  // the cursor hasn't changed, so fetchingCursorRef === cursor still blocks any
  // duplicate call. It's reset naturally when the cursor advances (new cursor ≠
  // old fetchingCursorRef), not via a useEffect that fires on every mount.
  const fetchingCursorRef = useRef<string | undefined | null>(null);

  const loadMore = useCallback(async () => {
    if (fetchingCursorRef.current === cursor || !hasMore) return;
    fetchingCursorRef.current = cursor;
    setLoading(true);

    try {
      const result = await fetchFn(cursor);
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const fresh = result.items.filter((item) => !seen.has(item.id));
        return [...prev, ...fresh];
      });
      setCursor(result.nextCursor);
      if (!result.nextCursor) setHasMore(false);
    } catch (error) {
      console.error("Failed to load more:", error);
      fetchingCursorRef.current = null; // allow retry (cursor won't change on error)
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cursor, hasMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(node);
    },
    [loadMore, hasMore],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { items, loading, hasMore, sentinelRef, loadMore };
}
