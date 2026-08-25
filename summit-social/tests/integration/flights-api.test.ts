import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
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

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  redis: { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue("OK") },
}));

vi.mock("@/lib/flights/aggregator", () => ({
  searchFlights: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { POST as searchFlightsRoute } from "@/app/api/flights/route";
import { searchFlights } from "@/lib/flights/aggregator";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;
const mockSearchFlights = searchFlights as ReturnType<typeof vi.fn>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

function noSession() {
  mockGetSession.mockResolvedValue(null);
}

const validFlightBody = {
  origin: "LHR",
  destination: "JFK",
  departureDate: "2025-08-01",
};

const mockFlightResult = {
  search: validFlightBody,
  offers: [
    {
      id: "mock-0",
      provider: "amadeus",
      airline: "British Airways",
      flightNumber: "BA200",
      origin: "LHR",
      destination: "JFK",
      departureAt: "2025-08-01T08:30:00.000Z",
      arrivalAt: "2025-08-01T11:30:00.000Z",
      durationMinutes: 180,
      stops: 0,
      stopCities: [],
      priceGBP: 32000,
      currency: "GBP",
      cabinClass: "economy",
      deepLink: "",
      baggageIncluded: true,
    },
  ],
  cachedAt: "2025-08-01T10:00:00Z",
};

// ---------------------------------------------------------------------------
// POST /api/flights
// ---------------------------------------------------------------------------
describe("POST /api/flights", () => {
  beforeEach(() => {
    mockSession();
    mockSearchFlights.mockResolvedValue(mockFlightResult);
  });

  afterEach(() => vi.clearAllMocks());

  it("returns 200 with flight results for valid request", async () => {
    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify(validFlightBody),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0].airline).toBe("British Airways");
  });

  it("returns 401 when not authenticated", async () => {
    noSession();

    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify(validFlightBody),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });

    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify(validFlightBody),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for invalid IATA code", async () => {
    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify({ ...validFlightBody, origin: "INVALID" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid date format", async () => {
    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify({ ...validFlightBody, departureDate: "Aug 1 2025" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
  });

  it("calls searchFlights with parsed data", async () => {
    await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify({ ...validFlightBody, passengers: 2, cabinClass: "business" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );

    expect(mockSearchFlights).toHaveBeenCalledWith(
      expect.objectContaining({ passengers: 2, cabinClass: "business" }),
    );
  });

  it("includes cachedAt in response", async () => {
    const response = await searchFlightsRoute(
      new NextRequest("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify(validFlightBody),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    const data = await response.json();
    expect(data.cachedAt).toBeDefined();
  });
});
