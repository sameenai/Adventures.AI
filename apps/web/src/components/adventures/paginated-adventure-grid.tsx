"use client";

import type { AdventureWithUser } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdventureCard } from "./adventure-card";
import { AdventureListRow } from "./adventure-list-row";

interface PaginatedAdventureGridProps {
  adventures: AdventureWithUser[];
  currentUserId?: string;
  votedAdventureIds: string[];
  bookmarkedAdventureIds: string[];
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
  view?: "grid" | "list";
}

function buildPageUrl(
  params: URLSearchParams,
  overrides: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams(params);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return `/adventures${qs ? `?${qs}` : ""}`;
}

export function PaginatedAdventureGrid({
  adventures,
  currentUserId,
  votedAdventureIds,
  bookmarkedAdventureIds,
  page,
  perPage,
  totalPages,
  total,
  view = "grid",
}: PaginatedAdventureGridProps) {
  const searchParams = useSearchParams();
  const votedSet = new Set(votedAdventureIds);
  const bookmarkedSet = new Set(bookmarkedAdventureIds);

  if (adventures.length === 0) {
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
        </div>
      </div>
    );
  }

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <>
      {view === "list" ? (
        <div className="flex flex-col gap-2">
          {adventures.map((adventure) => (
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
          {adventures.map((adventure, i) => (
            <div
              key={adventure.id}
              className={i === 0 && adventures.length > 1 ? "sm:col-span-2 lg:col-span-2" : ""}
            >
              <AdventureCard
                adventure={adventure}
                currentUserId={currentUserId}
                hasVoted={votedSet.has(adventure.id)}
                hasBookmarked={bookmarkedSet.has(adventure.id)}
                featured={i === 0 && adventures.length > 1}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        {/* Per-page selector */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-600">
            Show
          </span>
          {[10, 20, 50].map((size) => (
            <Link
              key={size}
              href={buildPageUrl(searchParams, {
                perPage: String(size),
                page: "1",
              })}
              className={`px-2.5 py-1 font-mono text-xs transition-colors ${
                perPage === size
                  ? "border border-amber-500 text-amber-500"
                  : "border border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300"
              }`}
            >
              {size}
            </Link>
          ))}
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-600">
            per page
          </span>
        </div>

        {/* Page info */}
        <p className="font-mono text-[10px] text-stone-600 uppercase tracking-widest">
          {startItem}–{endItem} of {total.toLocaleString()}
        </p>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link
              href={buildPageUrl(searchParams, { page: String(page - 1) })}
              className="border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-300"
            >
              Prev
            </Link>
          ) : (
            <span className="border border-stone-900 px-3 py-1.5 font-mono text-xs text-stone-800 cursor-not-allowed">
              Prev
            </span>
          )}

          {start > 1 && (
            <>
              <Link
                href={buildPageUrl(searchParams, { page: "1" })}
                className="border border-stone-800 px-2.5 py-1.5 font-mono text-xs text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-300"
              >
                1
              </Link>
              {start > 2 && <span className="px-1 font-mono text-xs text-stone-700">...</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <Link
              key={p}
              href={buildPageUrl(searchParams, { page: String(p) })}
              className={`border px-2.5 py-1.5 font-mono text-xs transition-colors ${
                p === page
                  ? "border-amber-500 text-amber-500"
                  : "border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300"
              }`}
            >
              {p}
            </Link>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="px-1 font-mono text-xs text-stone-700">...</span>
              )}
              <Link
                href={buildPageUrl(searchParams, { page: String(totalPages) })}
                className="border border-stone-800 px-2.5 py-1.5 font-mono text-xs text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-300"
              >
                {totalPages}
              </Link>
            </>
          )}

          {page < totalPages ? (
            <Link
              href={buildPageUrl(searchParams, { page: String(page + 1) })}
              className="border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-300"
            >
              Next
            </Link>
          ) : (
            <span className="border border-stone-900 px-3 py-1.5 font-mono text-xs text-stone-800 cursor-not-allowed">
              Next
            </span>
          )}
        </div>
      </div>
    </>
  );
}
