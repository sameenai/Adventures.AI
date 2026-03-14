"use client";

import { useCallback, useState, useTransition } from "react";

interface UseVoteOptions {
  adventureId: string;
  initialVoted: boolean;
  initialCount: number;
}

export function useVote({ adventureId, initialVoted, initialCount }: UseVoteOptions) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleVote = useCallback(() => {
    const newVoted = !voted;
    const newCount = newVoted ? count + 1 : count - 1;

    // Optimistic update
    setVoted(newVoted);
    setCount(newCount);
    setRateLimitError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/adventures/${adventureId}/vote`, {
          method: "POST",
        });

        if (!response.ok) {
          // Rollback on failure
          setVoted(voted);
          setCount(count);
          if (response.status === 429) {
            const data = await response.json().catch(() => ({}));
            const seconds = data.retryAfter ?? 60;
            setRateLimitError(`Too many votes. Try again in ${seconds}s.`);
          }
        }
      } catch {
        // Rollback on error
        setVoted(voted);
        setCount(count);
      }
    });
  }, [adventureId, voted, count]);

  return { voted, count, toggleVote, isPending, rateLimitError };
}
