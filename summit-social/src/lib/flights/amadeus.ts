import { logger } from "@/lib/logger";
import type { FlightOffer, FlightSearch } from "./types";

type AmadeusSegment = {
  carrierCode: string;
  number: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
};

type AmadeusItinerary = {
  duration: string;
  segments: AmadeusSegment[];
};

const FETCH_TIMEOUT_MS = 8_000;

/** Fetch with a timeout, retrying once on network error or a 5xx response. */
async function fetchWithRetry(url: string, init: RequestInit = {}): Promise<Response> {
  const attempt = () => fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  try {
    const response = await attempt();
    return response.status >= 500 ? await attempt() : response;
  } catch {
    return attempt();
  }
}

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
  const response = await fetchWithRetry(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID ?? "",
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.access_token as string;
  accessToken = token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  return token;
}

export async function searchAmadeusFlights(search: FlightSearch): Promise<FlightOffer[]> {
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
    return [];
  }
  const token = await getAccessToken();
  const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";

  const params = new URLSearchParams({
    originLocationCode: search.origin,
    destinationLocationCode: search.destination,
    departureDate: search.departureDate,
    adults: String(search.passengers),
    travelClass: search.cabinClass.toUpperCase(),
    max: "20",
    currencyCode: "GBP",
  });

  if (search.returnDate) {
    params.set("returnDate", search.returnDate);
  }

  const response = await fetchWithRetry(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    logger.error(`Amadeus search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return (data.data ?? []).map((offer: Record<string, unknown>): FlightOffer => {
    const itineraries = offer.itineraries as AmadeusItinerary[];
    const firstSegment = itineraries[0].segments[0];
    const lastSegment = itineraries[0].segments.at(-1) ?? firstSegment;
    const segments = itineraries[0].segments;

    const flightOffer: FlightOffer = {
      id: `amadeus-${offer.id}`,
      provider: "amadeus",
      providerRef: offer.id as string,
      airline: firstSegment.carrierCode,
      flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureAt: firstSegment.departure.at,
      arrivalAt: lastSegment.arrival.at,
      durationMinutes: parseDuration(itineraries[0].duration),
      stops: segments.length - 1,
      stopCities: segments.slice(0, -1).map((s) => s.arrival.iataCode),
      priceGBP: Math.round(Number((offer.price as { grandTotal: string }).grandTotal) * 100),
      currency: "GBP",
      cabinClass: search.cabinClass,
      deepLink: "",
      baggageIncluded: true,
    };

    // Round trips: price.grandTotal covers both legs, so surface the return
    // itinerary instead of silently discarding it.
    const returnItinerary = itineraries.at(1);
    if (returnItinerary) {
      const returnFirst = returnItinerary.segments[0];
      const returnLast = returnItinerary.segments.at(-1) ?? returnFirst;
      flightOffer.returnDepartureAt = returnFirst.departure.at;
      flightOffer.returnArrivalAt = returnLast.arrival.at;
      flightOffer.returnDurationMinutes = parseDuration(returnItinerary.duration);
      flightOffer.returnStops = returnItinerary.segments.length - 1;
    }

    return flightOffer;
  });
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}
