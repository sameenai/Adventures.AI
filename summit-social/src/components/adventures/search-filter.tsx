"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchParam = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "votes";

  const [inputValue, setInputValue] = useState(searchParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync when the URL search param changes externally
  useEffect(() => {
    setInputValue(searchParam);
  }, [searchParam]);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor");
      startTransition(() => {
        router.push(`/adventures?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        update("search", value);
      }, 300);
    },
    [update],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="search"
          value={inputValue}
          placeholder="Search adventures…"
          onChange={handleSearchChange}
          className="w-full border border-stone-700 bg-stone-900 px-4 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
        )}
      </div>
      <select
        value={sortBy}
        onChange={(e) => update("sortBy", e.target.value)}
        className="border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
      >
        <option value="votes">Most Voted</option>
        <option value="trending">Trending</option>
        <option value="newest">Newest</option>
        <option value="duration">Shortest First</option>
      </select>
    </div>
  );
}
