"use client";

import { FlightComparison } from "@/components/flights/flight-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type CabinClass = "economy" | "premium_economy" | "business" | "first";

const ADVENTURE_ROUTES = [
  { from: "LHR", to: "KTM", label: "Nepal treks" },
  { from: "LHR", to: "BOG", label: "Colombia trails" },
  { from: "BCN", to: "PMI", label: "Balearic islands" },
  { from: "LAX", to: "LPB", label: "Bolivian Andes" },
  { from: "SYD", to: "CHC", label: "NZ South Island" },
  { from: "LHR", to: "JNB", label: "Kruger safari" },
];

export default function FlightsPage() {
  const { offers, loading, error, search } = useFlightSearch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [origin, setOrigin] = useState(searchParams.get("from") ?? "");
  const [destination, setDestination] = useState(searchParams.get("to") ?? "");
  const [departureDate, setDepartureDate] = useState(searchParams.get("dep") ?? "");
  const [returnDate, setReturnDate] = useState(searchParams.get("ret") ?? "");
  const [passengers, setPassengers] = useState(
    Math.max(1, Math.min(9, Number(searchParams.get("pax")) || 1)),
  );
  const [cabinClass, setCabinClass] = useState<CabinClass>(
    (searchParams.get("class") as CabinClass) ?? "economy",
  );
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && departureDate) {
      setHasSearched(true);
      const params = new URLSearchParams();
      params.set("from", origin);
      params.set("to", destination);
      params.set("dep", departureDate);
      if (returnDate) params.set("ret", returnDate);
      params.set("pax", String(passengers));
      params.set("class", cabinClass);
      router.push(`/flights?${params.toString()}`, { scroll: false });
      search({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        ...(returnDate && { returnDate }),
        passengers,
        cabinClass,
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Multi-provider
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">Flights</h1>
      </div>

      <form onSubmit={handleSearch} className="mt-8 space-y-4">
        {/* Route and dates row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Input
            label="From"
            name="origin"
            autoComplete="off"
            placeholder="LHR"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
          <Input
            label="To"
            name="destination"
            autoComplete="off"
            placeholder="KTM"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
          <Input
            label="Departure"
            type="date"
            name="departureDate"
            autoComplete="off"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            required
          />
          <Input
            label="Return"
            type="date"
            name="returnDate"
            autoComplete="off"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        {/* Passengers, cabin class, submit */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Passenger stepper */}
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-xs uppercase tracking-widest text-stone-400">
              Passengers
            </span>
            <div className="flex items-stretch border border-stone-700 bg-stone-900">
              <button
                type="button"
                onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                className="px-3 font-mono text-stone-400 transition-colors hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label="Decrease passengers"
              >
                −
              </button>
              <span className="min-w-[2.5rem] border-x border-stone-700 px-4 py-2 text-center font-mono text-sm text-stone-200">
                {passengers}
              </span>
              <button
                type="button"
                onClick={() => setPassengers((p) => Math.min(9, p + 1))}
                className="px-3 font-mono text-stone-400 transition-colors hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label="Increase passengers"
              >
                +
              </button>
            </div>
          </div>

          {/* Cabin class */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cabin-class"
              className="font-display text-xs uppercase tracking-widest text-stone-400"
            >
              Class
            </label>
            <select
              id="cabin-class"
              name="cabinClass"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm text-stone-200 focus:border-amber-500 focus:outline-none"
              style={{ colorScheme: "dark" }}
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div className="flex-1 min-w-[8rem] flex items-end">
            <Button type="submit" loading={loading} className="w-full">
              Search flights
            </Button>
          </div>
        </div>
      </form>

      {/* Adventure route suggestions — shown before first search */}
      {!hasSearched && (
        <div className="mt-6">
          <p className="mb-3 font-display text-[10px] uppercase tracking-widest text-stone-600">
            Popular adventure routes
          </p>
          <div className="flex flex-wrap gap-2">
            {ADVENTURE_ROUTES.map(({ from, to, label }) => (
              <button
                key={`${from}-${to}`}
                type="button"
                onClick={() => {
                  setOrigin(from);
                  setDestination(to);
                }}
                className="border border-stone-700 px-3 py-1.5 font-mono text-xs text-stone-400 transition-colors hover:border-amber-500/50 hover:text-amber-500"
              >
                {from} → {to} <span className="ml-1 text-stone-600">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}

      <div className="mt-8">
        <FlightComparison offers={offers} loading={loading} />
      </div>
    </div>
  );
}
