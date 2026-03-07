"use client";

import { cn } from "@/lib/utils";
import { useVote } from "@/hooks/useVote";

interface VoteButtonProps {
  adventureId: string;
  voteCount: number;
  hasVoted: boolean;
  disabled?: boolean;
}

export function VoteButton({ adventureId, voteCount, hasVoted, disabled }: VoteButtonProps) {
  const { voted, count, toggleVote, isPending } = useVote({
    adventureId,
    initialVoted: hasVoted,
    initialCount: voteCount,
  });

  return (
    <button
      type="button"
      onClick={toggleVote}
      disabled={disabled || isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
        voted
          ? "bg-summit-100 text-summit-700"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
        disabled && "cursor-not-allowed opacity-50",
      )}
      title={disabled ? "Sign in to vote" : voted ? "Remove vote" : "Vote"}
    >
      <svg
        className={cn("h-4 w-4", voted && "fill-current")}
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
  );
}
