"use client";

import type { FlightOffer } from "@/lib/flights/types";
import { useMemo, useState } from "react";
import { FlightCard } from "./flight-card";

type SortKey = "price" | "duration" | "stops";

interface FlightComparisonProps {
  offers: FlightOffer[];
  loading?: boolean;
}

export function FlightComparison({ offers, loading }: FlightComparisonProps) {
  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [directOnly, setDirectOnly] = useState(false);

  const filtered = useMemo(
    () => (directOnly ? offers.filter((o) => o.stops === 0) : offers),
    [offers, directOnly],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sortBy === "duration") return a.durationMinutes - b.durationMinutes;
        if (sortBy === "stops") return a.stops - b.stops;
        return a.priceGBP - b.priceGBP;
      }),
    [filtered, sortBy],
  );

  // Smart labels — one each for cheapest, fastest, best value (price per minute of travel)
  const byPrice = useMemo(() => [...sorted].sort((a, b) => a.priceGBP - b.priceGBP), [sorted]);
  const byDuration = useMemo(
    () => [...sorted].sort((a, b) => a.durationMinutes - b.durationMinutes),
    [sorted],
  );
  const byValue = useMemo(
    () =>
      [...sorted].sort((a, b) => a.priceGBP / a.durationMinutes - b.priceGBP / b.durationMinutes),
    [sorted],
  );
  const cheapestId = byPrice[0]?.id;
  const fastestId = byDuration[0]?.id !== cheapestId ? byDuration[0]?.id : undefined;
  const bestValueId =
    byValue[0]?.id !== cheapestId && byValue[0]?.id !== fastestId ? byValue[0]?.id : undefined;

  const minPrice = sorted[0] ? Math.min(...sorted.map((o) => o.priceGBP)) : 0;
  const maxPrice = sorted[0] ? Math.max(...sorted.map((o) => o.priceGBP)) : 0;
  const priceRange = maxPrice - minPrice;

  const getLabel = (id: string): "cheapest" | "fastest" | "best-value" | undefined => {
    if (id === cheapestId) return "cheapest";
    if (id === fastestId) return "fastest";
    if (id === bestValueId) return "best-value";
    return undefined;
  };

  const getPriceBarPercent = (priceGBP: number): number => {
    if (priceRange === 0) return 0;
    return Math.round(((priceGBP - minPrice) / priceRange) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {["sk-1", "sk-2", "sk-3"].map((id) => (
          <div key={id} className="h-16 animate-pulse border border-stone-800 bg-stone-900" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xs uppercase tracking-widest text-stone-600">
          No flights found
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Try adjusting your dates or searching nearby airports.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {(["price", "duration", "stops"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={`border font-display text-[10px] uppercase tracking-widest px-3 py-1.5 transition-colors ${
                sortBy === key
                  ? "border-amber-500 bg-amber-500/10 text-amber-500"
                  : "border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-400"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-stone-600">
            {sorted.length} of {offers.length}
          </span>
          <button
            type="button"
            onClick={() => setDirectOnly((v) => !v)}
            className={`border font-display text-[10px] uppercase tracking-widest px-3 py-1.5 transition-colors ${
              directOnly
                ? "border-amber-500 bg-amber-500/10 text-amber-500"
                : "border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-400"
            }`}
          >
            Direct only
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="border border-stone-800 py-8 text-center">
          <p className="font-mono text-xs text-stone-600">
            No direct flights — turn off the filter to see connecting options.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((offer) => (
            <FlightCard
              key={offer.id}
              offer={offer}
              label={getLabel(offer.id)}
              priceBarPercent={getPriceBarPercent(offer.priceGBP)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
