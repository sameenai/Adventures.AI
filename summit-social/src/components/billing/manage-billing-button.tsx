"use client";

import { MutationError, useMutation } from "@/lib/client/use-mutation";

/** Opens the Stripe Billing Portal — card, invoices, cancellation. */
export function ManageBillingButton() {
  const {
    run: open,
    busy,
    error,
  } = useMutation(
    async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new MutationError(data.error ?? "Could not open billing — try again");
      }
      window.location.assign(data.url);
    },
    { fallbackError: "Network error — try again" },
  );

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
