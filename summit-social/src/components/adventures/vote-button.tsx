"use client";

import { useVote } from "@/hooks/useVote";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface VoteButtonProps {
  adventureId: string;
  voteCount: number;
  hasVoted: boolean;
  disabled?: boolean;
}

function VoteIcon({ voted }: { voted?: boolean }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5", voted && "fill-current")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6l3-6z" />
    </svg>
  );
}

export function VoteButton({ adventureId, voteCount, hasVoted, disabled }: VoteButtonProps) {
  const pathname = usePathname();
  const { voted, count, toggleVote, isPending, rateLimitError } = useVote({
    adventureId,
    initialVoted: hasVoted,
    initialCount: voteCount,
  });

  // Signed-out: the vote moment becomes a signup moment — link to login and
  // bounce back to the page the visitor was on.
  if (disabled) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <a
          href={`/login?callbackUrl=${encodeURIComponent(pathname ?? "/")}`}
          title="Sign in to vote"
          aria-label="Sign in to vote"
          className="flex items-center gap-1.5 border border-stone-700 px-2.5 py-1 font-mono text-xs text-stone-500 opacity-40 transition-all hover:border-amber-500 hover:text-amber-500 hover:opacity-100"
        >
          <VoteIcon />
          {voteCount}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={toggleVote}
        disabled={isPending}
        className={cn(
          "flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors",
          voted
            ? "border-amber-500 text-amber-500 bg-amber-500/10"
            : "border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300",
          isPending && "opacity-60",
        )}
        aria-label={voted ? "Remove vote" : "Vote"}
      >
        <VoteIcon voted={voted} />
        {count}
      </button>
      {rateLimitError && (
        <p className="font-mono text-[10px] text-red-400 whitespace-nowrap">{rateLimitError}</p>
      )}
    </div>
  );
}
