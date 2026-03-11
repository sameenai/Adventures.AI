"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = {
    search: searchParams.get("search") ?? "",
    sortBy: searchParams.get("sortBy") ?? "votes",
    category: searchParams.get("category") ?? "",
  };

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // reset cursor when filters change
      params.delete("cursor");
      startTransition(() => {
        router.push(`/adventures?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="search"
          defaultValue={current.search}
          placeholder="Search adventures…"
          onChange={(e) => update("search", e.target.value)}
          className="w-full border border-stone-700 bg-stone-900 px-4 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
        )}
      </div>
      <select
        value={current.sortBy}
        onChange={(e) => update("sortBy", e.target.value)}
        className="border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
      >
        <option value="votes">Most Voted</option>
        <option value="newest">Newest</option>
        <option value="duration">Shortest First</option>
      </select>
    </div>
  );
}
