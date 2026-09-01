export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightOffer {
  id: string;
  provider: "amadeus" | "skyscanner";
  providerRef: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  stopCities: string[];
  /** Return leg (round trips only) — the offer price covers both legs. */
  returnDepartureAt?: string;
  returnArrivalAt?: string;
  returnDurationMinutes?: number;
  returnStops?: number;
  priceGBP: number;
  currency: string;
  cabinClass: string;
  deepLink: string;
  baggageIncluded: boolean;
}

export interface FlightSearchResult {
  search: FlightSearch;
  offers: FlightOffer[];
  cachedAt?: string;
  /** True when no flight providers are configured and mock data is not permitted. */
  providersUnavailable?: boolean;
}
