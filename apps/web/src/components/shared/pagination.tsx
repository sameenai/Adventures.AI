import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-10 flex items-center justify-between border-t border-stone-800 pt-6">
      <div>
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            className="border border-stone-700 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            ← Prev
          </Link>
        ) : (
          <span className="border border-stone-800 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-600 cursor-not-allowed">
            ← Prev
          </span>
        )}
      </div>

      <span className="font-mono text-xs text-stone-500">
        {page} / {totalPages}
      </span>

      <div>
        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            className="border border-stone-700 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            Next →
          </Link>
        ) : (
          <span className="border border-stone-800 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-600 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
