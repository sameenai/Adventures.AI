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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Flight Search</h1>
      <p className="mt-2 text-sm text-gray-600">
        Compare flights from multiple providers and find the best deals.
      </p>

      <form onSubmit={handleSearch} className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
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

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-8">
        <FlightComparison offers={offers} loading={loading} />
      </div>
    </div>
  );
}
