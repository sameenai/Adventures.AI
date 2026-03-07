import type { FlightOffer, FlightSearch } from "./types";

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
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
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  return accessToken;
}

export async function searchAmadeusFlights(search: FlightSearch): Promise<FlightOffer[]> {
  const token = await getAccessToken();
  const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";

  const params = new URLSearchParams({
    originLocationCode: search.origin,
    destinationLocationCode: search.destination,
    departureDate: search.departureDate,
    adults: String(search.passengers),
    travelClass: search.cabinClass.toUpperCase().replace("_", " "),
    max: "20",
    currencyCode: "GBP",
  });

  if (search.returnDate) {
    params.set("returnDate", search.returnDate);
  }

  const response = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error(`Amadeus search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return (data.data ?? []).map((offer: Record<string, unknown>): FlightOffer => {
    const firstSegment = (offer.itineraries as Array<{ segments: Array<Record<string, string>> }>)[0]
      .segments[0];
    const lastSegment = (offer.itineraries as Array<{ segments: Array<Record<string, string>> }>)[0]
      .segments.at(-1)!;
    const segments = (offer.itineraries as Array<{ segments: Array<Record<string, string>> }>)[0].segments;

    return {
      id: `amadeus-${offer.id}`,
      provider: "amadeus",
      providerRef: offer.id as string,
      airline: firstSegment.carrierCode,
      flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureAt: firstSegment.departure.at,
      arrivalAt: lastSegment.arrival.at,
      durationMinutes: parseDuration(
        (offer.itineraries as Array<{ duration: string }>)[0].duration,
      ),
      stops: segments.length - 1,
      stopCities: segments.slice(0, -1).map((s) => s.arrival.iataCode),
      priceGBP: Math.round(
        Number((offer.price as { grandTotal: string }).grandTotal) * 100,
      ),
      currency: "GBP",
      cabinClass: search.cabinClass,
      deepLink: "",
      baggageIncluded: true,
    };
  });
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (Number(match[1] ?? 0)) * 60 + Number(match[2] ?? 0);
}
