import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock ioredis before any module imports that use it
// ---------------------------------------------------------------------------
vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }));
  return { default: Redis };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { searchAmadeusFlights } from "@/lib/flights/amadeus";
import { searchSkyscannerFlights } from "@/lib/flights/skyscanner";
import { searchFlights } from "@/lib/flights/aggregator";
import type { FlightSearch } from "@/lib/flights/types";

const baseSearch: FlightSearch = {
  origin: "LHR",
  destination: "JFK",
  departureDate: "2025-08-01",
  passengers: 1,
  cabinClass: "economy",
};

// ---------------------------------------------------------------------------
// Amadeus
// ---------------------------------------------------------------------------
describe("searchAmadeusFlights", () => {
  beforeEach(() => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty array when credentials are not set", async () => {
    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("returns empty array on failed auth", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://invalid.example.com");

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    await expect(searchAmadeusFlights(baseSearch)).rejects.toThrow("Amadeus auth failed: 401");
  });

  it("returns empty array when search call fails", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    // Auth succeeds, search fails
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok", expires_in: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("maps Amadeus flight data to FlightOffer shape", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const amadeusOffer = {
      id: "1",
      itineraries: [
        {
          duration: "PT7H30M",
          segments: [
            {
              carrierCode: "BA",
              number: "117",
              departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
              arrival: { iataCode: "JFK", at: "2025-08-01T17:30:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "450.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok", expires_in: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: [amadeusOffer] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "amadeus-1",
      provider: "amadeus",
      airline: "BA",
      flightNumber: "BA117",
      origin: "LHR",
      destination: "JFK",
      durationMinutes: 450,
      stops: 0,
      priceGBP: 45000,
      currency: "GBP",
      cabinClass: "economy",
      baggageIncluded: true,
    });
  });

  it("correctly maps a multi-stop itinerary", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const amadeusOffer = {
      id: "2",
      itineraries: [
        {
          duration: "PT12H00M",
          segments: [
            {
              carrierCode: "EK",
              number: "001",
              departure: { iataCode: "LHR", at: "2025-08-01T08:00:00" },
              arrival: { iataCode: "DXB", at: "2025-08-01T19:00:00" },
            },
            {
              carrierCode: "EK",
              number: "002",
              departure: { iataCode: "DXB", at: "2025-08-01T21:00:00" },
              arrival: { iataCode: "JFK", at: "2025-08-02T04:00:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "600.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok", expires_in: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: [amadeusOffer] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].stops).toBe(1);
    expect(result[0].stopCities).toEqual(["DXB"]);
    expect(result[0].durationMinutes).toBe(720);
  });

  it("appends returnDate param when provided", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    let capturedUrl = "";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockImplementationOnce(async (url) => {
        capturedUrl = String(url);
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

    await searchAmadeusFlights({ ...baseSearch, returnDate: "2025-08-15" });
    expect(capturedUrl).toContain("returnDate=2025-08-15");
  });

  it("returns empty array when response data field is null", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("parses duration with hours only (no minutes component)", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "hrs",
      itineraries: [{
        duration: "PT2H",
        segments: [{
          carrierCode: "BA", number: "100",
          departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
          arrival: { iataCode: "CDG", at: "2025-08-01T12:00:00" },
        }],
      }],
      price: { grandTotal: "200.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [offer] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].durationMinutes).toBe(120);
  });

  it("parses duration with minutes only (no hours component)", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "mins",
      itineraries: [{
        duration: "PT45M",
        segments: [{
          carrierCode: "FR", number: "200",
          departure: { iataCode: "STN", at: "2025-08-01T06:00:00" },
          arrival: { iataCode: "DUB", at: "2025-08-01T06:45:00" },
        }],
      }],
      price: { grandTotal: "50.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [offer] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].durationMinutes).toBe(45);
  });

  it("falls back to default base url when AMADEUS_BASE_URL is not set", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    // deliberately do NOT stub AMADEUS_BASE_URL so the ?? fallback branch is taken

    let capturedAuthUrl = "";
    let capturedSearchUrl = "";
    vi.spyOn(global, "fetch")
      .mockImplementationOnce(async (url) => {
        capturedAuthUrl = String(url);
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
      .mockImplementationOnce(async (url) => {
        capturedSearchUrl = String(url);
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

    await searchAmadeusFlights(baseSearch);
    expect(capturedAuthUrl).toContain("https://test.api.amadeus.com");
    expect(capturedSearchUrl).toContain("https://test.api.amadeus.com");
  });

  it("returns 0 minutes for an unrecognised duration format", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "bad",
      itineraries: [{
        duration: "INVALID",
        segments: [{
          carrierCode: "XX", number: "000",
          departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
          arrival: { iataCode: "JFK", at: "2025-08-01T20:00:00" },
        }],
      }],
      price: { grandTotal: "300.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [offer] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].durationMinutes).toBe(0);
  });

  it("reuses cached access token on second call", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "1",
      itineraries: [
        {
          duration: "PT7H30M",
          segments: [
            {
              carrierCode: "BA",
              number: "117",
              departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
              arrival: { iataCode: "JFK", at: "2025-08-01T17:30:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "450.00" },
    };

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "cached-tok", expires_in: 3600 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [offer] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [offer] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await searchAmadeusFlights(baseSearch);
    await searchAmadeusFlights(baseSearch);

    // Auth called once; two search calls = 3 fetch calls total
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// Skyscanner
// ---------------------------------------------------------------------------
describe("searchSkyscannerFlights", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty array when API key is not set", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "");
    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("returns empty array on failed API call", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );
    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("maps Skyscanner itinerary data to FlightOffer shape", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const skyscannerData = {
      content: {
        results: {
          itineraries: {
            "itin-1": {
              legIds: ["leg-1"],
              pricingOptions: [
                {
                  price: { amount: "380.00" },
                  items: [{ deepLink: "https://skyscanner.com/link" }],
                },
              ],
            },
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(skyscannerData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "skyscanner-itin-1",
      provider: "skyscanner",
      origin: "LHR",
      destination: "JFK",
      priceGBP: 38000,
      currency: "GBP",
      deepLink: "https://skyscanner.com/link",
      baggageIncluded: false,
    });
  });

  it("returns at most 20 offers", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const itineraries: Record<string, unknown> = {};
    for (let i = 0; i < 25; i++) {
      itineraries[`itin-${i}`] = {
        legIds: [`leg-${i}`],
        pricingOptions: [{ price: { amount: "100.00" }, items: [{ deepLink: "" }] }],
      };
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: { results: { itineraries } } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("includes return leg in request body when returnDate is provided", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    let capturedBody: unknown;
    vi.spyOn(global, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ content: { results: { itineraries: {} } } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await searchSkyscannerFlights({ ...baseSearch, returnDate: "2025-08-15" });
    const body = capturedBody as { query: { queryLegs: unknown[] } };
    expect(body.query.queryLegs).toHaveLength(2);
  });

  it("falls back to CABIN_CLASS_ECONOMY for unknown cabin class", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    let capturedBody: unknown;
    vi.spyOn(global, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ content: { results: { itineraries: {} } } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await searchSkyscannerFlights({ ...baseSearch, cabinClass: "unknown_class" as "economy" });
    const reqBody = capturedBody as { query: { cabinClass: string } };
    expect(reqBody.query.cabinClass).toBe("CABIN_CLASS_ECONOMY");
  });

  it("returns empty array when API response has no content field", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("uses zero price and empty deepLink when pricing data is missing", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const skyscannerData = {
      content: {
        results: {
          itineraries: {
            "itin-no-price": {
              legIds: ["leg-1"],
              pricingOptions: [{ price: {}, items: [] }],
            },
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(skyscannerData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toHaveLength(1);
    expect(result[0].priceGBP).toBe(0);
    expect(result[0].deepLink).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------
describe("searchFlights (aggregator)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns mock offers when no API providers are configured", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    // Also mock redis so getCached returns null (no cache hit)
    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    vi.spyOn(redis, "set").mockResolvedValue("OK");

    const result = await searchFlights(baseSearch);
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.offers[0].provider).toMatch(/amadeus|skyscanner/);
  });

  it("mock offers contain all expected airlines", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    vi.spyOn(redis, "set").mockResolvedValue("OK");

    const result = await searchFlights(baseSearch);
    const airlines = result.offers.map((o) => o.airline);
    expect(airlines).toContain("British Airways");
    expect(airlines).toContain("Emirates");
    expect(airlines).toContain("Qatar Airways");
  });

  it("includes cachedAt timestamp in result", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    vi.spyOn(redis, "set").mockResolvedValue("OK");

    const result = await searchFlights(baseSearch);
    expect(result.cachedAt).toBeDefined();
    expect(new Date(result.cachedAt ?? "").getTime()).not.toBeNaN();
  });

  it("returns cached result without calling providers", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const cachedResult = {
      search: baseSearch,
      offers: [{ id: "cached-offer", provider: "amadeus" }],
      cachedAt: "2025-08-01T10:00:00Z",
    };

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(JSON.stringify(cachedResult));

    const fetchSpy = vi.spyOn(global, "fetch");
    const result = await searchFlights(baseSearch);

    expect(result.offers[0].id).toBe("cached-offer");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("echo's back the search params in the result", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    vi.spyOn(redis, "set").mockResolvedValue("OK");

    const result = await searchFlights(baseSearch);
    expect(result.search).toEqual(baseSearch);
  });
});
