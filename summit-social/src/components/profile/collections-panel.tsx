"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CollectionSummary {
  id: string;
  name: string;
  _count: { items: number };
  items: { adventure: { coverImageUrl: string } }[];
}

interface CollectionsPanelProps {
  initialCollections: CollectionSummary[];
}

export function CollectionsPanel({ initialCollections }: CollectionsPanelProps) {
  const [collections, setCollections] = useState(initialCollections);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create collection");
        return;
      }
      const created = await res.json();
      setCollections((prev) => [created, ...prev]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="mt-12">
      <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
        Collections · {collections.length}
      </h2>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name…"
          maxLength={100}
          className="flex-1 border border-stone-700 bg-stone-900 px-3 py-1.5 font-mono text-xs text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newName.trim() || creating}
          className="border border-amber-500 bg-amber-500 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? "…" : "Create"}
        </button>
      </form>
      {error && <p className="mb-4 font-mono text-xs text-red-400">{error}</p>}

      {collections.length === 0 ? (
        <p className="font-mono text-xs text-stone-600">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {collections.map((col) => {
            const thumb = col.items[0]?.adventure.coverImageUrl;
            return (
              <div
                key={col.id}
                className="flex items-center gap-3 border border-stone-800 p-3 hover:border-stone-700 transition-colors group"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-stone-800">
                  {thumb && (
                    <Image
                      src={thumb}
                      alt={col.name}
                      fill
                      className="object-cover brightness-75 group-hover:brightness-90 transition-all"
                      sizes="80px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/collections/${col.id}`}
                    className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors truncate block"
                  >
                    {col.name}
                  </Link>
                  <p className="font-mono text-xs text-stone-600">
                    {col._count.items} adventure{col._count.items !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(col.id)}
                  className="font-mono text-xs text-stone-700 hover:text-red-400 transition-colors shrink-0"
                  aria-label={`Delete ${col.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
