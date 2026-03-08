import type { FlightOffer } from "@/lib/flights/types";
import { FlightCard } from "./flight-card";

interface FlightComparisonProps {
  offers: FlightOffer[];
  loading?: boolean;
}

export function FlightComparison({ offers, loading }: FlightComparisonProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {["sk-1", "sk-2", "sk-3"].map((id) => (
          <div key={id} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No flights found for your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{offers.length} flights found</p>
      {offers.map((offer) => (
        <FlightCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
