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
  const [isPending, startTransition] = useTransition();

  const toggleVote = useCallback(() => {
    const newVoted = !voted;
    const newCount = newVoted ? count + 1 : count - 1;

    // Optimistic update
    setVoted(newVoted);
    setCount(newCount);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/adventures/${adventureId}/vote`, {
          method: "POST",
        });

        if (!response.ok) {
          // Rollback on failure
          setVoted(voted);
          setCount(count);
        }
      } catch {
        // Rollback on error
        setVoted(voted);
        setCount(count);
      }
    });
  }, [adventureId, voted, count]);

  return { voted, count, toggleVote, isPending };
}
