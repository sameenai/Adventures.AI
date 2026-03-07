import type { FlightOffer, FlightSearch } from "./types";

export async function searchSkyscannerFlights(search: FlightSearch): Promise<FlightOffer[]> {
  const baseUrl = process.env.SKYSCANNER_BASE_URL ?? "https://partners.api.skyscanner.net/apiservices";
  const apiKey = process.env.SKYSCANNER_API_KEY;

  if (!apiKey) {
    console.warn("Skyscanner API key not configured");
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

  const response = await fetch(`${baseUrl}/v3/flights/live/search/create`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(`Skyscanner search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return normaliseSkyscannerResults(data, search);
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

function normaliseSkyscannerResults(
  data: Record<string, unknown>,
  search: FlightSearch,
): FlightOffer[] {
  const results = (data.content?.results?.itineraries ?? {}) as Record<
    string,
    { pricingOptions: Array<{ price: { amount: string }; items: Array<{ deepLink: string }> }>; legIds: string[] }
  >;

  return Object.entries(results)
    .slice(0, 20)
    .map(([id, itinerary]): FlightOffer => {
      const pricing = itinerary.pricingOptions[0];
      return {
        id: `skyscanner-${id}`,
        provider: "skyscanner",
        providerRef: id,
        airline: "Various",
        flightNumber: "",
        origin: search.origin,
        destination: search.destination,
        departureAt: search.departureDate,
        arrivalAt: search.departureDate,
        durationMinutes: 0,
        stops: 0,
        stopCities: [],
        priceGBP: Math.round(Number(pricing?.price.amount ?? 0) * 100),
        currency: "GBP",
        cabinClass: search.cabinClass,
        deepLink: pricing?.items[0]?.deepLink ?? "",
        baggageIncluded: false,
      };
    });
}
