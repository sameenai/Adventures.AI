import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock ioredis before any module imports that use it
// ---------------------------------------------------------------------------
vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    eval: vi.fn().mockResolvedValue([1, 3600]),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }));
  return { default: Redis };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { CACHE_TTL } from "@/lib/constants";
import { searchFlights } from "@/lib/flights/aggregator";
import { searchAmadeusFlights } from "@/lib/flights/amadeus";
import { searchSkyscannerFlights } from "@/lib/flights/skyscanner";
import type { FlightSearch } from "@/lib/flights/types";

const baseSearch: FlightSearch = {
  origin: "LHR",
  destination: "JFK",
  departureDate: "2025-08-01",
  passengers: 1,
  cabinClass: "economy",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A completed Skyscanner v3 session response with resolvable legs/carriers. */
function skyscannerCompleteResponse() {
  return {
    sessionToken: "sess-1",
    content: {
      status: "RESULT_STATUS_COMPLETE",
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
        legs: {
          "leg-1": {
            departureDateTime: { year: 2025, month: 8, day: 1, hour: 10, minute: 30 },
            arrivalDateTime: { year: 2025, month: 8, day: 1, hour: 18, minute: 45 },
            durationInMinutes: 495,
            stopCount: 1,
            operatingCarrierIds: ["carrier-ba"],
            marketingCarrierIds: ["carrier-ba"],
          },
        },
        carriers: { "carrier-ba": { name: "British Airways" } },
      },
    },
  };
}

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
    vi.restoreAllMocks();
  });

  it("returns empty array when credentials are not set", async () => {
    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("returns empty array on failed auth", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://invalid.example.com");

    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(searchAmadeusFlights(baseSearch)).rejects.toThrow("Amadeus auth failed: 401");
  });

  it("returns empty array when search call fails after the retry", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    // Auth succeeds, search 500s twice (initial attempt + one retry)
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
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
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [amadeusOffer] }));

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
    // One-way searches carry no return leg
    expect(result[0].returnDepartureAt).toBeUndefined();
    expect(result[0].returnStops).toBeUndefined();
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
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [amadeusOffer] }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].stops).toBe(1);
    expect(result[0].stopCities).toEqual(["DXB"]);
    expect(result[0].durationMinutes).toBe(720);
  });

  it("maps the return leg from itineraries[1] on round trips", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const amadeusOffer = {
      id: "rt-1",
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
        {
          duration: "PT9H15M",
          segments: [
            {
              carrierCode: "BA",
              number: "118",
              departure: { iataCode: "JFK", at: "2025-08-15T18:00:00" },
              arrival: { iataCode: "BOS", at: "2025-08-15T19:10:00" },
            },
            {
              carrierCode: "BA",
              number: "212",
              departure: { iataCode: "BOS", at: "2025-08-15T21:00:00" },
              arrival: { iataCode: "LHR", at: "2025-08-16T08:15:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "820.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [amadeusOffer] }));

    const result = await searchAmadeusFlights({ ...baseSearch, returnDate: "2025-08-15" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      departureAt: "2025-08-01T10:00:00",
      arrivalAt: "2025-08-01T17:30:00",
      returnDepartureAt: "2025-08-15T18:00:00",
      returnArrivalAt: "2025-08-16T08:15:00",
      returnDurationMinutes: 555,
      returnStops: 1,
    });
  });

  it("sends PREMIUM_ECONOMY travelClass with the underscore preserved", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockImplementationOnce(async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return jsonResponse({ data: [] });
      });

    await searchAmadeusFlights({ ...baseSearch, cabinClass: "premium_economy" });
    expect(capturedUrl).toContain("travelClass=PREMIUM_ECONOMY");
    expect(capturedUrl).not.toContain("PREMIUM%20ECONOMY");
    // Every request carries an abort signal (8s timeout)
    expect(capturedInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries once when the auth request fails with a network error", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
    // 1 failed auth + 1 auth retry + 1 search
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("retries once on a 5xx search response and uses the retry result", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const amadeusOffer = {
      id: "retry-1",
      itineraries: [
        {
          duration: "PT2H",
          segments: [
            {
              carrierCode: "BA",
              number: "100",
              departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
              arrival: { iataCode: "CDG", at: "2025-08-01T12:00:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "200.00" },
    };

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ data: [amadeusOffer] }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("amadeus-retry-1");
    // 1 auth + 1 failed search + 1 search retry
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("appends returnDate param when provided", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    let capturedUrl = "";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockImplementationOnce(async (url) => {
        capturedUrl = String(url);
        return jsonResponse({ data: [] });
      });

    await searchAmadeusFlights({ ...baseSearch, returnDate: "2025-08-15" });
    expect(capturedUrl).toContain("returnDate=2025-08-15");
  });

  it("returns empty array when response data field is null", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: null }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("parses duration with hours only (no minutes component)", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "hrs",
      itineraries: [
        {
          duration: "PT2H",
          segments: [
            {
              carrierCode: "BA",
              number: "100",
              departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
              arrival: { iataCode: "CDG", at: "2025-08-01T12:00:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "200.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [offer] }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].durationMinutes).toBe(120);
  });

  it("parses duration with minutes only (no hours component)", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("AMADEUS_BASE_URL", "https://test.api.amadeus.com");

    const offer = {
      id: "mins",
      itineraries: [
        {
          duration: "PT45M",
          segments: [
            {
              carrierCode: "FR",
              number: "200",
              departure: { iataCode: "STN", at: "2025-08-01T06:00:00" },
              arrival: { iataCode: "DUB", at: "2025-08-01T06:45:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "50.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [offer] }));

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
        return jsonResponse({ access_token: "tok", expires_in: 0 });
      })
      .mockImplementationOnce(async (url) => {
        capturedSearchUrl = String(url);
        return jsonResponse({ data: [] });
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
      itineraries: [
        {
          duration: "INVALID",
          segments: [
            {
              carrierCode: "XX",
              number: "000",
              departure: { iataCode: "LHR", at: "2025-08-01T10:00:00" },
              arrival: { iataCode: "JFK", at: "2025-08-01T20:00:00" },
            },
          ],
        },
      ],
      price: { grandTotal: "300.00" },
    };

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 0 }))
      .mockResolvedValueOnce(jsonResponse({ data: [offer] }));

    const result = await searchAmadeusFlights(baseSearch);
    expect(result[0].durationMinutes).toBe(0);
  });

  // Keep this test LAST in the describe: it caches a token for 3600s in the
  // adapter's module state, which would suppress auth calls in later tests.
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
      .mockResolvedValueOnce(jsonResponse({ access_token: "cached-tok", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ data: [offer] }))
      .mockResolvedValueOnce(jsonResponse({ data: [offer] }));

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
    vi.useRealTimers();
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
    // 5xx is retried once, so both attempts fail
    vi.spyOn(global, "fetch").mockImplementation(async () => new Response(null, { status: 500 }));
    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("maps Skyscanner legs and carriers to FlightOffer shape", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(skyscannerCompleteResponse()));

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "skyscanner-itin-1",
      provider: "skyscanner",
      airline: "British Airways",
      origin: "LHR",
      destination: "JFK",
      departureAt: "2025-08-01T10:30:00",
      arrivalAt: "2025-08-01T18:45:00",
      durationMinutes: 495,
      stops: 1,
      priceGBP: 38000,
      currency: "GBP",
      deepLink: "https://skyscanner.com/link",
      baggageIncluded: false,
    });
  });

  it("polls the session until complete and normalises the final response", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const incomplete = {
      sessionToken: "sess-1",
      content: { status: "RESULT_STATUS_INCOMPLETE", results: { itineraries: {} } },
    };

    const calls: Array<{ url: string; method?: string }> = [];
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      const isPoll = String(url).includes("/poll/");
      return jsonResponse(isPoll ? skyscannerCompleteResponse() : incomplete);
    });

    const promise = searchSkyscannerFlights(baseSearch);
    await vi.runAllTimersAsync();
    const result = await promise;

    // create (incomplete) + one poll (complete) — stops early
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(calls[0].url).toContain("/v3/flights/live/search/create");
    expect(calls[1].url).toContain("/v3/flights/live/search/poll/sess-1");
    expect(calls[1].method).toBe("POST");

    expect(result).toHaveLength(1);
    expect(result[0].airline).toBe("British Airways");
    expect(result[0].durationMinutes).toBe(495);
  });

  it("stops after 3 poll attempts when the session never completes", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    const incomplete = {
      sessionToken: "sess-2",
      content: { status: "RESULT_STATUS_INCOMPLETE", results: { itineraries: {} } },
    };

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(async () => jsonResponse(incomplete));

    const promise = searchSkyscannerFlights(baseSearch);
    await vi.runAllTimersAsync();
    const result = await promise;

    // create + 3 polls, then give up with whatever we have
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(result).toEqual([]);
  });

  it("skips itineraries whose leg or carrier cannot be resolved", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const data = {
      sessionToken: "sess-1",
      content: {
        status: "RESULT_STATUS_COMPLETE",
        results: {
          itineraries: {
            "itin-missing-leg": {
              legIds: ["no-such-leg"],
              pricingOptions: [{ price: { amount: "100.00" }, items: [{ deepLink: "" }] }],
            },
            "itin-missing-carrier": {
              legIds: ["leg-x"],
              pricingOptions: [{ price: { amount: "120.00" }, items: [{ deepLink: "" }] }],
            },
          },
          legs: {
            "leg-x": {
              departureDateTime: { year: 2025, month: 8, day: 1, hour: 6, minute: 0 },
              arrivalDateTime: { year: 2025, month: 8, day: 1, hour: 9, minute: 0 },
              durationInMinutes: 180,
              stopCount: 0,
              operatingCarrierIds: ["ghost-carrier"],
            },
          },
          carriers: {},
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(data));

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("maps the return leg for round-trip itineraries", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const data = {
      sessionToken: "sess-1",
      content: {
        status: "RESULT_STATUS_COMPLETE",
        results: {
          itineraries: {
            "itin-rt": {
              legIds: ["leg-out", "leg-back"],
              pricingOptions: [{ price: { amount: "500.00" }, items: [{ deepLink: "" }] }],
            },
          },
          legs: {
            "leg-out": {
              departureDateTime: { year: 2025, month: 8, day: 1, hour: 9, minute: 0 },
              arrivalDateTime: { year: 2025, month: 8, day: 1, hour: 17, minute: 0 },
              durationInMinutes: 480,
              stopCount: 0,
              operatingCarrierIds: ["c1"],
            },
            "leg-back": {
              departureDateTime: { year: 2025, month: 8, day: 15, hour: 20, minute: 5 },
              arrivalDateTime: { year: 2025, month: 8, day: 16, hour: 8, minute: 30 },
              durationInMinutes: 445,
              stopCount: 1,
              operatingCarrierIds: ["c1"],
            },
          },
          carriers: { c1: { name: "Emirates" } },
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(data));

    const result = await searchSkyscannerFlights({ ...baseSearch, returnDate: "2025-08-15" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      airline: "Emirates",
      departureAt: "2025-08-01T09:00:00",
      arrivalAt: "2025-08-01T17:00:00",
      returnDepartureAt: "2025-08-15T20:05:00",
      returnArrivalAt: "2025-08-16T08:30:00",
      returnDurationMinutes: 445,
      returnStops: 1,
    });
  });

  it("retries once when the create request fails with a network error", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(skyscannerCompleteResponse()));

    const result = await searchSkyscannerFlights(baseSearch);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].airline).toBe("British Airways");
  });

  it("returns at most 20 offers", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const itineraries: Record<string, unknown> = {};
    for (let i = 0; i < 25; i++) {
      itineraries[`itin-${i}`] = {
        legIds: ["leg-1"],
        pricingOptions: [{ price: { amount: "100.00" }, items: [{ deepLink: "" }] }],
      };
    }
    const data = skyscannerCompleteResponse();
    data.content.results.itineraries = itineraries as never;

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(data));

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toHaveLength(20);
  });

  it("includes return leg in request body when returnDate is provided", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    let capturedBody: unknown;
    vi.spyOn(global, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return jsonResponse({ content: { results: { itineraries: {} } } });
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
      return jsonResponse({ content: { results: { itineraries: {} } } });
    });

    await searchSkyscannerFlights({ ...baseSearch, cabinClass: "unknown_class" as "economy" });
    const reqBody = capturedBody as { query: { cabinClass: string } };
    expect(reqBody.query.cabinClass).toBe("CABIN_CLASS_ECONOMY");
  });

  it("returns empty array when API response has no content field", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({}));

    const result = await searchSkyscannerFlights(baseSearch);
    expect(result).toEqual([]);
  });

  it("uses zero price and empty deepLink when pricing data is missing", async () => {
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const data = skyscannerCompleteResponse();
    data.content.results.itineraries = {
      "itin-no-price": {
        legIds: ["leg-1"],
        pricingOptions: [{ price: {}, items: [] }],
      },
    } as never;

    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(data));

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

  it("caches empty provider results for only 60 seconds", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    const setSpy = vi.spyOn(redis, "set").mockResolvedValue("OK");

    // Skyscanner completes with zero itineraries
    vi.spyOn(global, "fetch").mockImplementation(async () =>
      jsonResponse({
        sessionToken: "sess-1",
        content: { status: "RESULT_STATUS_COMPLETE", results: { itineraries: {} } },
      }),
    );

    const result = await searchFlights(baseSearch);
    expect(result.offers).toEqual([]);
    expect(setSpy).toHaveBeenCalledWith(
      expect.stringContaining("flights:"),
      expect.any(String),
      "EX",
      60,
    );
  });

  it("caches non-empty provider results for CACHE_TTL.flightResults", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "test-key");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    const setSpy = vi.spyOn(redis, "set").mockResolvedValue("OK");

    vi.spyOn(global, "fetch").mockImplementation(async () =>
      jsonResponse(skyscannerCompleteResponse()),
    );

    const result = await searchFlights(baseSearch);
    expect(result.offers).toHaveLength(1);
    expect(setSpy).toHaveBeenCalledWith(
      expect.stringContaining("flights:"),
      expect.any(String),
      "EX",
      CACHE_TTL.flightResults,
    );
  });

  it("returns providersUnavailable in production when no providers are configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    const setSpy = vi.spyOn(redis, "set").mockResolvedValue("OK");
    const fetchSpy = vi.spyOn(global, "fetch");

    const result = await searchFlights(baseSearch);
    expect(result.offers).toEqual([]);
    expect(result.providersUnavailable).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("returns mock offers in production when DEMO_MODE is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");
    vi.stubEnv("SKYSCANNER_API_KEY", "");

    const { redis } = await import("@/lib/db/redis");
    vi.spyOn(redis, "get").mockResolvedValue(null);
    vi.spyOn(redis, "set").mockResolvedValue("OK");

    const result = await searchFlights(baseSearch);
    expect(result.offers).toHaveLength(5);
    expect(result.providersUnavailable).toBeUndefined();
  });
});
