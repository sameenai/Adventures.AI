import { Button } from "@/components/ui/button";
import type { FlightOffer } from "@/lib/flights/types";
import { formatPrice } from "@/lib/utils";

interface BookingCTAProps {
  offer: FlightOffer;
}

export function BookingCTA({ offer }: BookingCTAProps) {
  return (
    <div className="flex items-center justify-between border border-amber-500/30 bg-amber-500/10 p-6">
      <div>
        <h3 className="font-display uppercase tracking-widest text-stone-100">
          {offer.origin} to {offer.destination}
        </h3>
        <p className="text-sm text-stone-400">
          {offer.airline} {offer.flightNumber} &middot; {offer.cabinClass}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-2xl font-bold text-amber-500">{formatPrice(offer.priceGBP)}</span>
        <a href={offer.deepLink} target="_blank" rel="noopener noreferrer">
          <Button size="lg">Book Now</Button>
        </a>
      </div>
    </div>
  );
}
