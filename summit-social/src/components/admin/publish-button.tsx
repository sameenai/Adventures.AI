"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PublishButtonProps {
  adventureId: string;
  published: boolean;
}

export function PublishButton({ adventureId, published }: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/adventures/${adventureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
        published
          ? "border border-stone-700 text-stone-400 hover:border-red-800 hover:text-red-400"
          : "border border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      }`}
    >
      {loading ? "…" : published ? "Unpublish" : "Publish"}
    </button>
  );
}
