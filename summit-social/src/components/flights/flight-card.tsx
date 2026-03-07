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
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-lg font-semibold">{departureTime}</p>
            <p className="text-xs text-gray-500">{offer.origin}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500">{formatDuration(offer.durationMinutes)}</p>
            <div className="relative h-px w-24 bg-gray-300">
              <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-gray-400" />
              <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              {offer.stops === 0 ? "Direct" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{arrivalTime}</p>
            <p className="text-xs text-gray-500">{offer.destination}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">{offer.airline}</p>
            <p className="text-xs text-gray-400">{offer.flightNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-summit-700">{formatPrice(offer.priceGBP)}</p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          {offer.deepLink && (
            <a href={offer.deepLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Book</Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
