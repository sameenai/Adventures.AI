"use client";

import type { FlightOffer } from "@/lib/flights/types";
import { formatDuration, formatPrice } from "@/lib/utils";
import { useState } from "react";

interface FlightCardProps {
  offer: FlightOffer;
  label?: "cheapest" | "fastest" | "best-value";
  priceBarPercent?: number;
}

const LABEL_CONFIG = {
  cheapest: { text: "Cheapest", cls: "border-emerald-700/50 text-emerald-400" },
  fastest: { text: "Fastest", cls: "border-sky-700/50 text-sky-400" },
  "best-value": { text: "Best Value", cls: "border-amber-700/50 text-amber-400" },
};

export function FlightCard({ offer, label, priceBarPercent = 0 }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const dep = new Date(offer.departureAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const arr = new Date(offer.arrivalAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const nextDay =
    new Date(offer.arrivalAt).getUTCDate() !== new Date(offer.departureAt).getUTCDate();
  const stopLabel =
    offer.stops === 0 ? "Direct" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`;

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(offer.deepLink, "_blank", "noopener,noreferrer");
  };

  const routeCodes = [
    { code: offer.origin, pos: "dep" },
    ...offer.stopCities.map((code, i) => ({ code, pos: `stop-${i}` })),
    { code: offer.destination, pos: "arr" },
  ];

  return (
    <div className="border border-stone-800 bg-stone-950 transition-colors hover:border-stone-700">
      {/* Toggle button — the entire summary row is clickable */}
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Summary row */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-5">
            {label && (
              <span
                className={`hidden border font-display text-[9px] uppercase tracking-widest px-2 py-0.5 sm:block ${LABEL_CONFIG[label].cls}`}
              >
                {LABEL_CONFIG[label].text}
              </span>
            )}
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-stone-100">{dep}</p>
              <p className="font-display text-[10px] uppercase tracking-widest text-stone-500">
                {offer.origin}
              </p>
            </div>
            <div className="flex min-w-[5rem] flex-col items-center gap-1">
              <p className="font-mono text-[10px] text-stone-500">
                {formatDuration(offer.durationMinutes)}
              </p>
              <div className="relative h-px w-16 bg-stone-700">
                <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-stone-600" />
                {offer.stops > 0 && (
                  <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600" />
                )}
                <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-stone-600" />
              </div>
              <p className="font-mono text-[10px] text-stone-600">{stopLabel}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-stone-100">
                {arr}
                {nextDay && <span className="ml-1 align-super text-[10px] text-amber-500">+1</span>}
              </p>
              <p className="font-display text-[10px] uppercase tracking-widest text-stone-500">
                {offer.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden text-right md:block">
              <p className="font-display text-[10px] uppercase tracking-wider text-stone-400">
                {offer.airline}
              </p>
              <p className="font-mono text-[10px] text-stone-600">{offer.flightNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-bold text-amber-500">
                {formatPrice(offer.priceGBP)}
              </p>
              <p className="font-mono text-[10px] text-stone-600">per person</p>
            </div>
            <svg
              className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Price-relative bar — wider = better value */}
        <div className="h-0.5 bg-stone-900">
          <div
            className="h-full bg-amber-500/30 transition-all duration-500"
            style={{ width: `${Math.max(5, 100 - priceBarPercent)}%` }}
          />
        </div>
      </button>

      {/* Expanded detail panel — sibling of the toggle button, not nested inside it */}
      {expanded && (
        <div className="border-t border-stone-800 bg-stone-900/40 px-5 py-4">
          {/* Route breakdown */}
          <div className="mb-4">
            <p className="mb-2 font-display text-[9px] uppercase tracking-widest text-stone-600">
              {offer.stops === 0
                ? "Direct route"
                : `${offer.stops} stop${offer.stops > 1 ? "s" : ""} via ${offer.stopCities.join(", ")}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-stone-300">
              {routeCodes.map(({ code, pos }, i) => (
                <span key={pos} className="flex items-center gap-2">
                  <span>{code}</span>
                  {i < routeCodes.length - 1 && (
                    <svg
                      className="h-3 w-3 text-stone-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Info chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span
              className={`border font-display text-[9px] uppercase tracking-widest px-2 py-1 ${offer.baggageIncluded ? "border-emerald-700/50 text-emerald-400" : "border-stone-700 text-stone-500"}`}
            >
              {offer.baggageIncluded ? "✓ Baggage included" : "No checked bag"}
            </span>
            <span className="border border-stone-700 font-display text-[9px] uppercase tracking-widest px-2 py-1 text-stone-500">
              {offer.cabinClass}
            </span>
            <span className="border border-stone-700 font-display text-[9px] uppercase tracking-widest px-2 py-1 text-stone-600">
              via {offer.provider}
            </span>
          </div>

          {/* Book CTA */}
          {offer.deepLink ? (
            <button
              type="button"
              onClick={handleBook}
              className="w-full border border-amber-500 bg-amber-500 py-2.5 font-display text-xs uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
            >
              Book on {offer.airline} →
            </button>
          ) : (
            <p className="py-2 text-center font-display text-[10px] uppercase tracking-widest text-stone-600">
              No booking link available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
