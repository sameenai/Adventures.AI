import { createHash } from "node:crypto";
import { CACHE_TTL } from "@/lib/constants";
import { getCached, setCache } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { searchAmadeusFlights } from "./amadeus";
import { searchSkyscannerFlights } from "./skyscanner";
import type { FlightOffer, FlightSearch, FlightSearchResult } from "./types";

// Evaluated per call, not at module load — env vars can change between
// Cloud Run revisions sharing a warm container.
function hasConfiguredProviders(): boolean {
  return Boolean(
    (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) ||
      process.env.SKYSCANNER_API_KEY,
  );
}

// Mock offers are a dev/demo convenience only — production must never
// fabricate flights.
function mockOffersAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
}

function buildMockOffers(search: FlightSearch): FlightOffer[] {
  const dep = new Date(`${search.departureDate}T08:30:00Z`);
  const airlines = [
    { code: "BA", name: "British Airways" },
    { code: "EK", name: "Emirates" },
    { code: "QR", name: "Qatar Airways" },
    { code: "TK", name: "Turkish Airlines" },
    { code: "LH", name: "Lufthansa" },
  ];
  return airlines.map((airline, i): FlightOffer => {
    const departure = new Date(dep.getTime() + i * 90 * 60_000);
    const duration = 180 + i * 45;
    const arrival = new Date(departure.getTime() + duration * 60_000);
    return {
      id: `mock-${i}`,
      provider: i % 2 === 0 ? "amadeus" : "skyscanner",
      providerRef: `mock-ref-${i}`,
      airline: airline.name,
      flightNumber: `${airline.code}${200 + i * 11}`,
      origin: search.origin,
      destination: search.destination,
      departureAt: departure.toISOString(),
      arrivalAt: arrival.toISOString(),
      durationMinutes: duration,
      stops: i === 1 ? 1 : 0,
      stopCities: i === 1 ? ["DXB"] : [],
      priceGBP: 32000 + i * 4500 + (search.passengers - 1) * 18000,
      currency: "GBP",
      cabinClass: search.cabinClass,
      deepLink: "",
      baggageIncluded: i % 2 === 0,
    };
  });
}

// Empty result sets are cached only briefly — a transient provider outage
// must not pin "no flights" for the full TTL.
const EMPTY_RESULT_TTL_SECONDS = 60;

function searchCacheKey(search: FlightSearch): string {
  const hash = createHash("sha256").update(JSON.stringify(search)).digest("hex").slice(0, 16);
  return `flights:${hash}`;
}

export async function searchFlights(search: FlightSearch): Promise<FlightSearchResult> {
  const cacheKey = searchCacheKey(search);
  const cached = await getCached<FlightSearchResult>(cacheKey);
  if (cached) {
    return { ...cached, cachedAt: cached.cachedAt };
  }

  if (!hasConfiguredProviders()) {
    if (mockOffersAllowed()) {
      return {
        search,
        offers: buildMockOffers(search),
        cachedAt: new Date().toISOString(),
      };
    }
    logger.error("No flight providers configured — returning empty result");
    return {
      search,
      offers: [],
      cachedAt: new Date().toISOString(),
      providersUnavailable: true,
    };
  }

  const [amadeusResults, skyscannerResults] = await Promise.allSettled([
    searchAmadeusFlights(search),
    searchSkyscannerFlights(search),
  ]);

  const offers: FlightOffer[] = [];

  if (amadeusResults.status === "fulfilled") {
    offers.push(...amadeusResults.value);
  } else {
    logger.error("Amadeus search failed", amadeusResults.reason);
  }

  if (skyscannerResults.status === "fulfilled") {
    offers.push(...skyscannerResults.value);
  } else {
    logger.error("Skyscanner search failed", skyscannerResults.reason);
  }

  offers.sort((a, b) => a.priceGBP - b.priceGBP);

  const result: FlightSearchResult = {
    search,
    offers,
    cachedAt: new Date().toISOString(),
  };

  const ttlSeconds = offers.length > 0 ? CACHE_TTL.flightResults : EMPTY_RESULT_TTL_SECONDS;
  await setCache(cacheKey, result, ttlSeconds);
  return result;
}
