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
}
