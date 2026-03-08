"use client";

import { FlightComparison } from "@/components/flights/flight-comparison";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useState } from "react";

export default function FlightsPage() {
  const { offers, loading, error, search } = useFlightSearch();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && departureDate) {
      search({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        ...(returnDate && { returnDate }),
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

      <form onSubmit={handleSearch} className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Input
          label="From"
          placeholder="LHR"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          maxLength={3}
          required
        />
        <Input
          label="To"
          placeholder="KTM"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          maxLength={3}
          required
        />
        <Input
          label="Departure"
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          required
        />
        <Input
          label="Return"
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
        />
        <div className="flex items-end">
          <Button type="submit" loading={loading} className="w-full">
            Search
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}

      <div className="mt-8">
        <FlightComparison offers={offers} loading={loading} />
      </div>
    </div>
  );
}
