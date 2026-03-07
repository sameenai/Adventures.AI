import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { FlightOffer } from "@/lib/flights/types";

interface BookingCTAProps {
  offer: FlightOffer;
}

export function BookingCTA({ offer }: BookingCTAProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-summit-200 bg-summit-50 p-6">
      <div>
        <h3 className="font-semibold text-gray-900">
          {offer.origin} to {offer.destination}
        </h3>
        <p className="text-sm text-gray-600">
          {offer.airline} {offer.flightNumber} &middot; {offer.cabinClass}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-summit-700">
          {formatPrice(offer.priceGBP)}
        </span>
        <a href={offer.deepLink} target="_blank" rel="noopener noreferrer">
          <Button size="lg">Book Now</Button>
        </a>
      </div>
    </div>
  );
}
