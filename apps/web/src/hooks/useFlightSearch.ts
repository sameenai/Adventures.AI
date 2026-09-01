"use client";

import type { FlightOffer } from "@/lib/flights/types";
import { useCallback, useState } from "react";

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
}

export function useFlightSearch() {
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: FlightSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Flight search failed");
      }

      const data = await response.json();
      setOffers(data.offers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { offers, loading, error, search };
}
