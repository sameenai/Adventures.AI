"use client";

import { useState } from "react";

/** Opens the Stripe Billing Portal — card, invoices, cancellation. */
export function ManageBillingButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing — try again");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="w-full border border-stone-700 px-4 py-2.5 font-display text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-amber-500 hover:text-amber-500 disabled:opacity-50"
      >
        {busy ? "Opening…" : "Manage billing"}
      </button>
      {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
