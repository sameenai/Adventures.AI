"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-red-500 mb-4">Error</p>
      <h2 className="font-display text-5xl uppercase tracking-widest text-stone-100 mb-6">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-stone-500 mb-8">
        {error.message || "An unexpected error occurred. Try again or head back to base."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="border border-amber-500 bg-amber-500 px-8 py-3 font-display text-sm uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
      >
        Try Again
      </button>
    </div>
  );
}
