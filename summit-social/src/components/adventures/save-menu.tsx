"use client";

import { useState } from "react";

interface CollectionOption {
  id: string;
  name: string;
}

interface SaveMenuProps {
  adventureId: string;
  onClose: () => void;
}

type MenuState = "prompt" | "loading" | "list" | "added" | "error";

/**
 * Small popover shown after a successful bookmark: "Saved — add to collection?".
 * Lazily fetches the user's collections and adds the adventure to the chosen one.
 */
export function SaveMenu({ adventureId, onClose }: SaveMenuProps) {
  const [state, setState] = useState<MenuState>("prompt");
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [addedTo, setAddedTo] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadCollections = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed to load collections");
      const data = (await res.json()) as CollectionOption[];
      setCollections(data);
      setState("list");
    } catch {
      setState("error");
    }
  };

  const addToCollection = async (collection: CollectionOption) => {
    if (addingId) return;
    setAddingId(collection.id);
    try {
      const res = await fetch(`/api/collections/${collection.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adventureId }),
      });
      if (!res.ok) throw new Error("Failed to add to collection");
      setAddedTo(collection.name);
      setState("added");
    } catch {
      setState("error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-60 border border-stone-700 bg-stone-950 p-3 text-left shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-xs text-amber-500">Saved to bucket list</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="font-mono text-xs leading-none text-stone-600 transition-colors hover:text-stone-300"
        >
          ×
        </button>
      </div>

      {state === "prompt" && (
        <button
          type="button"
          onClick={loadCollections}
          className="mt-2 font-mono text-xs text-stone-400 underline decoration-stone-700 transition-colors hover:text-amber-500"
        >
          Add to collection?
        </button>
      )}

      {state === "loading" && <p className="mt-2 font-mono text-xs text-stone-600">Loading…</p>}

      {state === "list" &&
        (collections.length === 0 ? (
          <p className="mt-2 font-mono text-xs text-stone-600">
            No collections yet — create one on your profile.
          </p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {collections.map((collection) => (
              <li key={collection.id}>
                <button
                  type="button"
                  onClick={() => addToCollection(collection)}
                  disabled={addingId !== null}
                  className="w-full truncate text-left font-mono text-xs text-stone-400 transition-colors hover:text-amber-500 disabled:opacity-40"
                >
                  {addingId === collection.id ? "Adding…" : collection.name}
                </button>
              </li>
            ))}
          </ul>
        ))}

      {state === "added" && (
        <p className="mt-2 font-mono text-xs text-stone-400">
          Added to <span className="text-amber-500">{addedTo}</span>
        </p>
      )}

      {state === "error" && (
        <p className="mt-2 font-mono text-xs text-red-400">
          Something went wrong.{" "}
          <button
            type="button"
            onClick={loadCollections}
            className="underline transition-colors hover:text-red-300"
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
