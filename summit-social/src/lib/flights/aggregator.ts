import { createHash } from "node:crypto";
import { getCached, setCache } from "@/lib/db/redis";
import { searchAmadeusFlights } from "./amadeus";
import { searchSkyscannerFlights } from "./skyscanner";
import type { FlightOffer, FlightSearch, FlightSearchResult } from "./types";

const CACHE_TTL_SECONDS = 900; // 15 minutes

function searchCacheKey(search: FlightSearch): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(search))
    .digest("hex")
    .slice(0, 16);
  return `flights:${hash}`;
}

export async function searchFlights(search: FlightSearch): Promise<FlightSearchResult> {
  const cacheKey = searchCacheKey(search);
  const cached = await getCached<FlightSearchResult>(cacheKey);
  if (cached) {
    return { ...cached, cachedAt: cached.cachedAt };
  }

  const [amadeusResults, skyscannerResults] = await Promise.allSettled([
    searchAmadeusFlights(search),
    searchSkyscannerFlights(search),
  ]);

  const offers: FlightOffer[] = [];

  if (amadeusResults.status === "fulfilled") {
    offers.push(...amadeusResults.value);
  } else {
    console.error("Amadeus search failed:", amadeusResults.reason);
  }

  if (skyscannerResults.status === "fulfilled") {
    offers.push(...skyscannerResults.value);
  } else {
    console.error("Skyscanner search failed:", skyscannerResults.reason);
  }

  offers.sort((a, b) => a.priceGBP - b.priceGBP);

  const result: FlightSearchResult = {
    search,
    offers,
    cachedAt: new Date().toISOString(),
  };

  await setCache(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}
