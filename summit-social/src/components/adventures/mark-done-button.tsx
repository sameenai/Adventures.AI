"use client";

import { useState } from "react";

interface MarkDoneButtonProps {
  adventureId: string;
  initialCompleted: boolean;
  isAuthenticated: boolean;
}

/**
 * The logbook write: "I did this". Anchors the travel-cadence clock and
 * builds the adventurer's expedition record.
 */
export function MarkDoneButton({
  adventureId,
  initialCompleted,
  isAuthenticated,
}: MarkDoneButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) {
    return (
      <a
        href={`/login?callbackUrl=/adventures/${adventureId}`}
        title="Sign in to log this adventure"
        className="inline-flex items-center gap-2 border border-stone-700 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:border-amber-500 hover:text-amber-500"
      >
        ✓ I did this
      </a>
    );
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !completed;
    setCompleted(next); // optimistic
    try {
      const res = await fetch(`/api/adventures/${adventureId}/complete`, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        ...(next ? { body: JSON.stringify({}) } : {}),
      });
      if (!res.ok) setCompleted(!next); // rollback
    } catch {
      setCompleted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={completed}
      className={`inline-flex items-center gap-2 border px-4 py-2 font-display text-xs uppercase tracking-widest transition-colors ${
        completed
          ? "border-emerald-600 text-emerald-400 hover:border-emerald-500"
          : "border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-500"
      }`}
    >
      {completed ? "✓ Logged — you did this" : "✓ I did this"}
    </button>
  );
}
