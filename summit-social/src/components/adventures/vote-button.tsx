"use client";

import { useVote } from "@/hooks/useVote";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  adventureId: string;
  voteCount: number;
  hasVoted: boolean;
  disabled?: boolean;
}

export function VoteButton({ adventureId, voteCount, hasVoted, disabled }: VoteButtonProps) {
  const { voted, count, toggleVote, isPending, rateLimitError } = useVote({
    adventureId,
    initialVoted: hasVoted,
    initialCount: voteCount,
  });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={toggleVote}
        disabled={disabled || isPending}
        className={cn(
          "flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs transition-colors",
          voted
            ? "border-amber-500 text-amber-500 bg-amber-500/10"
            : "border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300",
          disabled && "cursor-not-allowed opacity-40",
          isPending && "opacity-60",
        )}
        title={disabled ? "Sign in to vote" : voted ? "Remove vote" : "Vote"}
      >
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
        {count}
      </button>
      {rateLimitError && (
        <p className="font-mono text-[10px] text-red-400 whitespace-nowrap">{rateLimitError}</p>
      )}
    </div>
  );
}
