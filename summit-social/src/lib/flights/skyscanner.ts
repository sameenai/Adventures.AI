import { logger } from "@/lib/logger";
import type { FlightOffer, FlightSearch } from "./types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_POLL_ATTEMPTS = 3;
const POLL_DELAY_MS = 1_000;
const MAX_OFFERS = 20;

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchSkyscannerFlights(search: FlightSearch): Promise<FlightOffer[]> {
  const baseUrl =
    process.env.SKYSCANNER_BASE_URL ?? "https://partners.api.skyscanner.net/apiservices";
  const apiKey = process.env.SKYSCANNER_API_KEY;

  if (!apiKey) {
    logger.warn("Skyscanner API key not configured");
    return [];
  }

  const body = {
    query: {
      market: "UK",
      locale: "en-GB",
      currency: "GBP",
      queryLegs: [
        {
          originPlaceId: { iata: search.origin },
          destinationPlaceId: { iata: search.destination },
          date: parseDateParts(search.departureDate),
        },
        ...(search.returnDate
          ? [
              {
                originPlaceId: { iata: search.destination },
                destinationPlaceId: { iata: search.origin },
                date: parseDateParts(search.returnDate),
              },
            ]
          : []),
      ],
      cabinClass: mapCabinClass(search.cabinClass),
      adults: search.passengers,
    },
  };

  const createResponse = await fetchWithRetry(`${baseUrl}/v3/flights/live/search/create`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!createResponse.ok) {
    logger.error(`Skyscanner search failed: ${createResponse.status}`);
    return [];
  }

  let data = (await createResponse.json()) as SkyscannerResponse;
  const sessionToken = data.sessionToken;

  // live/search/create is session-based: the first response is usually
  // RESULT_STATUS_INCOMPLETE with few or no itineraries, so poll the session
  // until it completes (or we run out of attempts).
  for (
    let attempt = 0;
    attempt < MAX_POLL_ATTEMPTS &&
    sessionToken &&
    data.content?.status !== "RESULT_STATUS_COMPLETE";
    attempt++
  ) {
    await delay(POLL_DELAY_MS);
    const pollResponse = await fetchWithRetry(
      `${baseUrl}/v3/flights/live/search/poll/${sessionToken}`,
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
      },
    );
    if (!pollResponse.ok) {
      logger.warn(`Skyscanner poll failed: ${pollResponse.status}`);
      break;
    }
    data = (await pollResponse.json()) as SkyscannerResponse;
  }

  return normaliseSkyscannerResults(data, search);
}

function appendAffiliateId(url: string): string {
  const affiliateId = process.env.SKYSCANNER_AFFILIATE_ID;
  if (!affiliateId || !url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}associateid=${encodeURIComponent(affiliateId)}`;
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function mapCabinClass(cabin: string): string {
  const map: Record<string, string> = {
    economy: "CABIN_CLASS_ECONOMY",
    premium_economy: "CABIN_CLASS_PREMIUM_ECONOMY",
    business: "CABIN_CLASS_BUSINESS",
    first: "CABIN_CLASS_FIRST",
  };
  return map[cabin] ?? "CABIN_CLASS_ECONOMY";
}

type SkyscannerDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type SkyscannerLeg = {
  departureDateTime: SkyscannerDateTime;
  arrivalDateTime: SkyscannerDateTime;
  durationInMinutes: number;
  stopCount: number;
  operatingCarrierIds?: string[];
  marketingCarrierIds?: string[];
};

type SkyscannerCarrier = {
  name?: string;
};

type SkyscannerItinerary = {
  pricingOptions: Array<{ price: { amount?: string }; items: Array<{ deepLink?: string }> }>;
  legIds: string[];
};

type SkyscannerContent = {
  status?: string;
  results?: {
    itineraries?: Record<string, SkyscannerItinerary>;
    legs?: Record<string, SkyscannerLeg>;
    carriers?: Record<string, SkyscannerCarrier>;
  };
};

type SkyscannerResponse = {
  sessionToken?: string;
  content?: SkyscannerContent;
};

function toIsoDateTime(dt: SkyscannerDateTime): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.year}-${pad(dt.month)}-${pad(dt.day)}T${pad(dt.hour)}:${pad(dt.minute)}:00`;
}

function airlineName(
  leg: SkyscannerLeg,
  carriers: Record<string, SkyscannerCarrier>,
): string | null {
  const carrierId = leg.operatingCarrierIds?.[0] ?? leg.marketingCarrierIds?.[0];
  if (!carrierId) return null;
  return carriers[carrierId]?.name ?? null;
}

function normaliseSkyscannerResults(data: SkyscannerResponse, search: FlightSearch): FlightOffer[] {
  const results = data.content?.results;
  const itineraries = results?.itineraries ?? {};
  const legs = results?.legs ?? {};
  const carriers = results?.carriers ?? {};

  const offers: FlightOffer[] = [];
  for (const [id, itinerary] of Object.entries(itineraries)) {
    if (offers.length >= MAX_OFFERS) break;

    // Skip itineraries whose legs/carriers cannot be resolved rather than
    // emitting "Various"/zero placeholders.
    const outboundLeg = legs[itinerary.legIds[0] ?? ""];
    if (!outboundLeg) continue;
    const airline = airlineName(outboundLeg, carriers);
    if (!airline) continue;

    const pricing = itinerary.pricingOptions[0];
    const offer: FlightOffer = {
      id: `skyscanner-${id}`,
      provider: "skyscanner",
      providerRef: id,
      airline,
      flightNumber: "",
      origin: search.origin,
      destination: search.destination,
      departureAt: toIsoDateTime(outboundLeg.departureDateTime),
      arrivalAt: toIsoDateTime(outboundLeg.arrivalDateTime),
      durationMinutes: outboundLeg.durationInMinutes,
      stops: outboundLeg.stopCount,
      stopCities: [],
      priceGBP: Math.round(Number(pricing?.price.amount ?? 0) * 100),
      currency: "GBP",
      cabinClass: search.cabinClass,
      deepLink: appendAffiliateId(pricing?.items[0]?.deepLink ?? ""),
      baggageIncluded: false,
    };

    const returnLegId = itinerary.legIds[1];
    if (returnLegId) {
      const returnLeg = legs[returnLegId];
      if (!returnLeg) continue;
      offer.returnDepartureAt = toIsoDateTime(returnLeg.departureDateTime);
      offer.returnArrivalAt = toIsoDateTime(returnLeg.arrivalDateTime);
      offer.returnDurationMinutes = returnLeg.durationInMinutes;
      offer.returnStops = returnLeg.stopCount;
    }

    offers.push(offer);
  }

  return offers;
}
