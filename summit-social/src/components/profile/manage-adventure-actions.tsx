"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ManageAdventureActionsProps {
  adventureId: string;
}

export function ManageAdventureActions({ adventureId }: ManageAdventureActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this adventure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-stone-800 pt-2">
      <a
        href={`/adventures/${adventureId}/edit`}
        className="flex-1 border border-stone-700 py-1 text-center font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
      >
        Edit
      </a>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex-1 border border-stone-800 py-1 font-display text-xs uppercase tracking-widest text-stone-600 transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-50"
      >
        {deleting ? "…" : "Delete"}
      </button>
    </div>
  );
}
