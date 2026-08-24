"use client";

import { formatPrice } from "@/lib/utils";
import { useState } from "react";

export interface BookingListItem {
  id: string;
  status: string;
  origin: string;
  destination: string;
  airline: string;
  flightNumber: string;
  departureAt: string;
  priceGBP: number;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SELECTED: { label: "saved", className: "border-stone-700 text-stone-400" },
  PRICE_CONFIRMED: { label: "fare confirmed", className: "border-amber-500 text-amber-500" },
  PAID: { label: "paid — ticketing", className: "border-emerald-600 text-emerald-400" },
  TICKETED: { label: "ticketed", className: "border-emerald-600 text-emerald-400" },
  CANCELLED: { label: "cancelled", className: "border-stone-700 text-stone-500" },
  REFUNDED: { label: "refunded", className: "border-stone-700 text-stone-500" },
};

/**
 * Saved flights on an itinerary, with the confirm-and-pay flow:
 * re-validate the fare (price can move or vanish), then hand off to Stripe
 * Checkout. Every state is visible — never a dead button.
 */
export function BookingList({ bookings }: { bookings: BookingListItem[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function note(id: string, message: string) {
    setNotes((n) => ({ ...n, [id]: message }));
  }

  async function confirmAndPay(id: string) {
    setBusy(id);
    note(id, "");
    try {
      const repriceRes = await fetch(`/api/bookings/${id}/reprice`, { method: "POST" });
      const reprice = (await repriceRes.json().catch(() => ({}))) as {
        error?: string;
        priceChanged?: boolean;
        booking?: { priceGBP: number };
      };
      if (!repriceRes.ok) {
        note(id, reprice.error ?? "Fare check failed — try again");
        return;
      }
      if (reprice.priceChanged && reprice.booking) {
        note(id, `Fare updated to ${formatPrice(reprice.booking.priceGBP)} — continuing`);
      }

      const checkoutRes = await fetch(`/api/bookings/${id}/checkout`, { method: "POST" });
      const checkout = (await checkoutRes.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!checkoutRes.ok || !checkout.url) {
        note(id, checkout.error ?? "Could not start payment — try again");
        return;
      }
      window.location.assign(checkout.url);
    } catch {
      note(id, "Network error — try again");
    } finally {
      setBusy(null);
    }
  }

  if (bookings.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
        Flights
      </h2>
      <ul className="space-y-3">
        {bookings.map((b) => {
          const status = STATUS_LABELS[b.status] ?? STATUS_LABELS.SELECTED;
          const payable = b.status === "SELECTED" || b.status === "PRICE_CONFIRMED";
          return (
            <li key={b.id} className="border border-stone-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-stone-200">
                    {b.origin} → {b.destination}
                    <span className="ml-3 text-stone-500">
                      {b.airline} {b.flightNumber}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-stone-500">
                    departs {new Date(b.departureAt).toISOString().slice(0, 16).replace("T", " ")}{" "}
                    UTC · {formatPrice(b.priceGBP)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest ${status.className}`}
                  >
                    {status.label}
                  </span>
                  {payable && (
                    <button
                      type="button"
                      onClick={() => confirmAndPay(b.id)}
                      disabled={busy === b.id}
                      className="border border-amber-500 bg-amber-500 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                      {busy === b.id ? "Checking fare…" : "Confirm fare & pay"}
                    </button>
                  )}
                </div>
              </div>
              {notes[b.id] && (
                <p className="mt-2 font-mono text-xs text-amber-500">{notes[b.id]}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
