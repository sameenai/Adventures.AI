import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration, formatPrice } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flights/types";

interface FlightCardProps {
  offer: FlightOffer;
}

export function FlightCard({ offer }: FlightCardProps) {
  const departureTime = new Date(offer.departureAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const arrivalTime = new Date(offer.arrivalAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border border-stone-800 bg-stone-900 transition-colors hover:border-stone-700">
      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-stone-100">{departureTime}</p>
            <p className="font-display text-xs uppercase tracking-widest text-stone-500">{offer.origin}</p>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-[6rem]">
            <p className="font-mono text-xs text-stone-600">{formatDuration(offer.durationMinutes)}</p>
            <div className="relative h-px w-24 bg-stone-700">
              <div className="absolute -top-1 left-0 h-2 w-2 bg-stone-600" />
              <div className="absolute -top-1 right-0 h-2 w-2 bg-stone-600" />
            </div>
            <p className="font-mono text-xs text-stone-600">
              {offer.stops === 0 ? "Direct" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-stone-100">{arrivalTime}</p>
            <p className="font-display text-xs uppercase tracking-widest text-stone-500">{offer.destination}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="font-display text-xs uppercase tracking-wider text-stone-400">{offer.airline}</p>
            <p className="font-mono text-xs text-stone-600">{offer.flightNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-amber-500">{formatPrice(offer.priceGBP)}</p>
            <p className="font-mono text-xs text-stone-600">per person</p>
          </div>
          {offer.deepLink && (
            <a href={offer.deepLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Book</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
