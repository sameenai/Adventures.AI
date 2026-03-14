"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ManageAdventureActionsProps {
  adventureId: string;
  published: boolean;
}

export function ManageAdventureActions({ adventureId, published }: ManageAdventureActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(published);

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

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/duplicate`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setDuplicating(false);
    }
  };

  const handlePublishToggle = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/adventures/${adventureId}/publish`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { published: boolean };
        setIsPublished(data.published);
        router.refresh();
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 border-t border-stone-800 pt-2">
      {!isPublished && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-600">Draft</p>
      )}
      <div className="flex items-center gap-2">
        <a
          href={`/adventures/${adventureId}/edit`}
          className="flex-1 border border-stone-700 py-1 text-center font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
        >
          Edit
        </a>
        <button
          type="button"
          onClick={handlePublishToggle}
          disabled={publishing}
          className={`flex-1 border py-1 font-display text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
            isPublished
              ? "border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-300"
              : "border-amber-600 text-amber-500 hover:bg-amber-500/10"
          }`}
        >
          {publishing ? "…" : isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={duplicating}
          className="flex-1 border border-stone-700 py-1 font-display text-xs uppercase tracking-widest text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-300 disabled:opacity-50"
        >
          {duplicating ? "…" : "Dupe"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 border border-stone-800 py-1 font-display text-xs uppercase tracking-widest text-stone-600 transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
