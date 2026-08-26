"use client";

import { useMutation } from "@/lib/client/use-mutation";
import { useState } from "react";

interface UseVoteOptions {
  adventureId: string;
  initialVoted: boolean;
  initialCount: number;
}

export function useVote({ adventureId, initialVoted, initialCount }: UseVoteOptions) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const { run: toggleVote, busy: isPending } = useMutation(async () => {
    const previousVoted = voted;
    const previousCount = count;

    // Optimistic update
    setVoted(!previousVoted);
    setCount(previousVoted ? previousCount - 1 : previousCount + 1);
    setRateLimitError(null);

    const response = await fetch(`/api/adventures/${adventureId}/vote`, {
      method: "POST",
    }).catch(() => null);

    if (!response || !response.ok) {
      // Rollback on failure or network error
      setVoted(previousVoted);
      setCount(previousCount);
      if (response?.status === 429) {
        const data = (await response.json().catch(() => ({}))) as { retryAfter?: number };
        setRateLimitError(`Too many votes. Try again in ${data.retryAfter ?? 60}s.`);
      }
    }
  });

  return { voted, count, toggleVote, isPending, rateLimitError };
}
