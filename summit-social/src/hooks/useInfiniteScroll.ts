"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions<T> {
  fetchFn: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>;
  initialItems?: T[];
  initialCursor?: string;
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialItems = [],
  initialCursor,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCursor !== undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const result = await fetchFn(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      if (!result.nextCursor) setHasMore(false);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cursor, loading, hasMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            loadMore();
          }
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(node);
    },
    [loadMore, hasMore, loading],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { items, loading, hasMore, sentinelRef, loadMore };
}
