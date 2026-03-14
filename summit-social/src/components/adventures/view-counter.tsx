"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  adventureId: string;
  isAuthor: boolean;
}

export function ViewCounter({ adventureId, isAuthor }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Generate a stable per-browser fingerprint using localStorage
    let fp = localStorage.getItem("ss_fp");
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem("ss_fp", fp);
    }

    fetch(`/api/adventures/${adventureId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: `${fp}:${adventureId}` }),
    })
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
