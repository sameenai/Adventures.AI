import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FlightOffer, FlightSearch } from "@/lib/flights/types";

const BASE_SEARCH: FlightSearch = {
  origin: "LHR",
  destination: "JFK",
  departureDate: "2025-09-01",
  passengers: 1,
  cabinClass: "economy",
};

const makeOffer = (id: string, priceGBP: number, provider: "amadeus" | "skyscanner"): FlightOffer => ({
  id,
  provider,
  providerRef: `ref-${id}`,
  airline: "Test Air",
  flightNumber: `TA${id}`,
  origin: "LHR",
  destination: "JFK",
  departureAt: "2025-09-01T08:00:00Z",
  arrivalAt: "2025-09-01T14:00:00Z",
  durationMinutes: 360,
  stops: 0,
  stopCities: [],
  priceGBP,
  currency: "GBP",
  cabinClass: "economy",
  deepLink: "",
  baggageIncluded: false,
});

// ---------------------------------------------------------------------------
// Helper: set up mocks and dynamically import aggregator so NO_PROVIDERS
// re-evaluates with AMADEUS_CLIENT_ID set.
// ---------------------------------------------------------------------------
interface LoadOptions {
  getCached?: ReturnType<typeof vi.fn>;
  setCache?: ReturnType<typeof vi.fn>;
  amadeus?: ReturnType<typeof vi.fn>;
  skyscanner?: ReturnType<typeof vi.fn>;
}

async function loadAggregator({
  getCached = vi.fn().mockResolvedValue(null),
  setCache = vi.fn().mockResolvedValue(undefined),
  amadeus = vi.fn().mockResolvedValue([]),
  skyscanner = vi.fn().mockResolvedValue([]),
}: LoadOptions = {}) {
  vi.resetModules();
  vi.doMock("@/lib/db/redis", () => ({ getCached, setCache }));
  vi.doMock("@/lib/flights/amadeus", () => ({ searchAmadeusFlights: amadeus }));
  vi.doMock("@/lib/flights/skyscanner", () => ({ searchSkyscannerFlights: skyscanner }));
  const { searchFlights } = await import("@/lib/flights/aggregator");
  return { searchFlights, getCached, setCache, amadeus, skyscanner };
}

// ---------------------------------------------------------------------------
// Real-provider path (NO_PROVIDERS = false)
// ---------------------------------------------------------------------------
describe("searchFlights — real providers", () => {
  beforeEach(() => {
    process.env.AMADEUS_CLIENT_ID = "test-client";
    process.env.AMADEUS_CLIENT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("merges results from both providers and sorts by price", async () => {
    const { searchFlights } = await loadAggregator({
      amadeus: vi.fn().mockResolvedValue([makeOffer("am1", 50000, "amadeus")]),
      skyscanner: vi.fn().mockResolvedValue([makeOffer("sk1", 40000, "skyscanner")]),
    });

    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(2);
    expect(result.offers[0].priceGBP).toBe(40000);
    expect(result.offers[1].priceGBP).toBe(50000);
    expect(result.offers[0].provider).toBe("skyscanner");
    expect(result.cachedAt).toBeDefined();
  });

  it("returns only amadeus results when skyscanner rejects", async () => {
    const { searchFlights } = await loadAggregator({
      amadeus: vi.fn().mockResolvedValue([makeOffer("am2", 55000, "amadeus")]),
      skyscanner: vi.fn().mockRejectedValue(new Error("Skyscanner down")),
    });

    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].provider).toBe("amadeus");
  });

  it("returns only skyscanner results when amadeus rejects", async () => {
    const { searchFlights } = await loadAggregator({
      amadeus: vi.fn().mockRejectedValue(new Error("Amadeus down")),
      skyscanner: vi.fn().mockResolvedValue([makeOffer("sk2", 45000, "skyscanner")]),
    });

    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].provider).toBe("skyscanner");
  });

  it("returns empty offers when both providers fail", async () => {
    const { searchFlights } = await loadAggregator({
      amadeus: vi.fn().mockRejectedValue(new Error("Amadeus error")),
      skyscanner: vi.fn().mockRejectedValue(new Error("Skyscanner error")),
    });

    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(0);
    expect(result.search).toEqual(BASE_SEARCH);
  });

  it("persists result to cache via setCache", async () => {
    const setCache = vi.fn().mockResolvedValue(undefined);
    const { searchFlights } = await loadAggregator({
      amadeus: vi.fn().mockResolvedValue([makeOffer("am3", 60000, "amadeus")]),
      setCache,
    });

    await searchFlights(BASE_SEARCH);

    expect(setCache).toHaveBeenCalledOnce();
    const [, cachedResult, ttl] = setCache.mock.calls[0];
    expect(cachedResult.offers).toHaveLength(1);
    expect(ttl).toBeGreaterThan(0);
  });

  it("returns cached result without calling providers", async () => {
    const cached = {
      search: BASE_SEARCH,
      offers: [makeOffer("cached1", 30000, "amadeus")],
      cachedAt: "2025-09-01T00:00:00Z",
    };
    const amadeus = vi.fn();
    const { searchFlights } = await loadAggregator({
      getCached: vi.fn().mockResolvedValue(cached),
      amadeus,
    });

    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(1);
    expect(amadeus).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Mock-provider path (NO_PROVIDERS = true, no env vars)
// ---------------------------------------------------------------------------
describe("searchFlights — mock mode (no providers)", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns 5 mock offers when no provider env vars are set", async () => {
    delete process.env.AMADEUS_CLIENT_ID;
    delete process.env.AMADEUS_CLIENT_SECRET;
    delete process.env.SKYSCANNER_API_KEY;

    const { searchFlights } = await loadAggregator();
    const result = await searchFlights(BASE_SEARCH);

    expect(result.offers).toHaveLength(5);
    expect(result.offers[0].origin).toBe("LHR");
    expect(result.offers[0].destination).toBe("JFK");
  });
});
