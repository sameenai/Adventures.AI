"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteItineraryButtonProps {
  itineraryId: string;
}

export function DeleteItineraryButton({ itineraryId }: DeleteItineraryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this itinerary? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="border border-stone-800 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-600 transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
