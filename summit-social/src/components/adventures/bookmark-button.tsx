"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BookmarkButtonProps {
  adventureId: string;
  isBookmarked: boolean;
  disabled?: boolean;
}

export function BookmarkButton({ adventureId, isBookmarked, disabled }: BookmarkButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const toggle = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/bookmark`, {
        method: bookmarked ? "DELETE" : "POST",
      });
      if (res.ok) {
        setBookmarked(!bookmarked);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || loading}
      title={bookmarked ? "Remove from bucket list" : "Add to bucket list"}
      className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40 ${
        bookmarked
          ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-red-800 hover:bg-transparent hover:text-red-400"
          : "border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
      }`}
      aria-label={bookmarked ? "Remove from bucket list" : "Add to bucket list"}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
      {loading ? "…" : bookmarked ? "Saved" : "Save"}
    </button>
  );
}
