"use client";

import { SaveMenu } from "@/components/adventures/save-menu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface BookmarkButtonProps {
  adventureId: string;
  isBookmarked: boolean;
  /** True when there is no logged-in user — renders a login link instead of a button. */
  disabled?: boolean;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill={filled ? "currentColor" : "none"}
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
  );
}

export function BookmarkButton({ adventureId, isBookmarked, disabled }: BookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [limitReached, setLimitReached] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // Logged out: turn the save-moment into a signup/login conversion instead of a dead button.
  if (disabled) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}
        title="Log in to save to your bucket list"
        aria-label="Log in to save to your bucket list"
        className="flex items-center gap-1.5 border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-300"
      >
        <BookmarkIcon filled={false} />
        Save
      </Link>
    );
  }

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    setLimitReached(false);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/bookmark`, {
        method: bookmarked ? "DELETE" : "POST",
      });
      if (res.ok) {
        const nowBookmarked = !bookmarked;
        setBookmarked(nowBookmarked);
        setShowSaveMenu(nowBookmarked);
        router.refresh();
      } else if (res.status === 402) {
        setLimitReached(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        title={bookmarked ? "Remove from bucket list" : "Add to bucket list"}
        className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40 ${
          bookmarked
            ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-red-800 hover:bg-transparent hover:text-red-400"
            : "border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
        }`}
        aria-label={bookmarked ? "Remove from bucket list" : "Add to bucket list"}
      >
        <BookmarkIcon filled={bookmarked} />
        {loading ? "…" : bookmarked ? "Saved" : "Save"}
      </button>

      {limitReached && (
        <div
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-60 border border-amber-500/40 bg-stone-950 p-3 text-left shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-xs text-stone-300">
              Bucket list full —{" "}
              <Link
                href="/pro"
                className="text-amber-500 underline transition-colors hover:text-amber-400"
              >
                Basecamper Pro
              </Link>{" "}
              is unlimited
            </p>
            <button
              type="button"
              onClick={() => setLimitReached(false)}
              aria-label="Dismiss"
              className="font-mono text-xs leading-none text-stone-600 transition-colors hover:text-stone-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showSaveMenu && (
        <SaveMenu adventureId={adventureId} onClose={() => setShowSaveMenu(false)} />
      )}
    </div>
  );
}
