"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  adventureId: string;
  isAuthor: boolean;
}

export function ViewCounter({ adventureId, isAuthor }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // View identity is derived server-side (salted daily-rotating hash) —
    // nothing is stored on the visitor's device. Clean up the identifier a
    // previous version of the app kept in localStorage.
    try {
      localStorage.removeItem("ss_fp");
    } catch {
      // storage unavailable (private mode) — nothing to clean
    }

    fetch(`/api/adventures/${adventureId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data: { count: number }) => {
        if (isAuthor) setCount(data.count);
      })
      .catch(() => {});
  }, [adventureId, isAuthor]);

  if (!isAuthor || count === null) return null;

  return (
    <span className="font-mono text-xs text-stone-600">
      {count} {count === 1 ? "view" : "views"}
    </span>
  );
}
