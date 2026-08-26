import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any route imports
// ---------------------------------------------------------------------------
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));

// Partial mock: only logRequest is stubbed (to assert telemetry); the
// scrubber and everything else stay real.
vi.mock("@/lib/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/logger")>();
  return { ...actual, logRequest: vi.fn() };
});

import { GET as getGeo } from "@/app/api/adventures/geo/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { logRequest } from "@/lib/logger";

const mockFindMany = prisma.adventure.findMany as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;
const mockLogRequest = logRequest as ReturnType<typeof vi.fn>;

function geoRequest(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/adventures/geo?${query}`);
}

const markerBbox = { west: "5", south: "40", east: "15", north: "50", zoom: "8" };

function adventureRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "adv-1",
    title: "Alpine Traverse",
    location: "Chamonix",
    country: "France",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    latitude: 45.9,
    longitude: 6.9,
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
});

describe("GET /api/adventures/geo — marker mode", () => {
  it("returns markers for published adventures inside the bbox", async () => {
    mockFindMany.mockResolvedValue([adventureRow()]);

    const response = await getGeo(geoRequest(markerBbox));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.clusters).toBeUndefined();
    expect(data.markers).toEqual([
      {
        id: "adv-1",
        title: "Alpine Traverse",
        location: "Chamonix",
        country: "France",
        category: "TREKKING",
        difficulty: "CHALLENGING",
        lat: 45.9,
        lng: 6.9,
      },
    ]);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          latitude: { gte: 40, lte: 50 },
          longitude: { gte: 5, lte: 15 },
        }),
      }),
    );
  });

  it("caps the row fetch at 300, ordered by voteCount desc", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await getGeo(geoRequest(markerBbox));
    expect(response.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 300,
        orderBy: [{ voteCount: "desc" }, { id: "asc" }],
      }),
    );
  });

  it("splits the longitude filter when the bbox wraps the antimeridian", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await getGeo(
      geoRequest({ west: "170", south: "-10", east: "-170", north: "10", zoom: "7" }),
    );
    expect(response.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ longitude: { gte: 170 } }, { longitude: { lte: -170 } }],
        }),
      }),
    );
  });

  it("drops the longitude range when the viewport spans the whole world", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await getGeo(
      geoRequest({ west: "-200", south: "-60", east: "200", north: "60", zoom: "6" }),
    );
    expect(response.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ longitude: { not: null } }),
      }),
    );
  });

  it("skips rows with null coordinates instead of emitting broken markers", async () => {
    mockFindMany.mockResolvedValue([
      adventureRow(),
      adventureRow({ id: "adv-2", latitude: null }),
      adventureRow({ id: "adv-3", longitude: null }),
    ]);

    const response = await getGeo(geoRequest(markerBbox));
    const data = await response.json();
    expect(data.markers).toHaveLength(1);
    expect(data.markers[0].id).toBe("adv-1");
  });
});

describe("GET /api/adventures/geo — cluster mode (zoom < 6)", () => {
  it("returns grid clusters instead of markers at low zoom", async () => {
    // Grid cell at zoom 3 is 360/8/8 = 5.625° — the first two points share a
    // cell, the third lands far away in its own.
    mockFindMany.mockResolvedValue([
      { latitude: 10, longitude: 10 },
      { latitude: 11, longitude: 11 },
      { latitude: 40, longitude: 40 },
    ]);

    const response = await getGeo(
      geoRequest({ west: "0", south: "0", east: "60", north: "60", zoom: "3" }),
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.markers).toBeUndefined();
    expect(data.clusters).toHaveLength(2);

    const pair = data.clusters.find((c: { count: number }) => c.count === 2);
    const single = data.clusters.find((c: { count: number }) => c.count === 1);
    expect(pair).toEqual({ lat: 10.5, lng: 10.5, count: 2 });
    expect(single).toEqual({ lat: 40, lng: 40, count: 1 });
  });

  it("selects only lat/lng and never caps the cluster pass", async () => {
    mockFindMany.mockResolvedValue([]);

    await getGeo(geoRequest({ west: "0", south: "0", east: "60", north: "60", zoom: "5" }));

    const args = mockFindMany.mock.calls[0][0];
    expect(args.select).toEqual({ latitude: true, longitude: true });
    expect(args.take).toBeUndefined();
    expect(args.orderBy).toBeUndefined();
  });

  it("ignores null coordinates when counting cluster members", async () => {
    mockFindMany.mockResolvedValue([
      { latitude: 10, longitude: 10 },
      { latitude: null, longitude: 10 },
      { latitude: 10, longitude: null },
    ]);

    const response = await getGeo(
      geoRequest({ west: "0", south: "0", east: "60", north: "60", zoom: "2" }),
    );
    const data = await response.json();
    expect(data.clusters).toEqual([{ lat: 10, lng: 10, count: 1 }]);
  });
});

describe("GET /api/adventures/geo — validation and rate limiting", () => {
  it("returns 400 when south is not below north", async () => {
    const response = await getGeo(
      geoRequest({ west: "0", south: "50", east: "10", north: "40", zoom: "8" }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-numeric bbox", async () => {
    const response = await getGeo(
      geoRequest({ west: "left", south: "40", east: "15", north: "50", zoom: "8" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when zoom is outside 1-18", async () => {
    const response = await getGeo(
      geoRequest({ west: "5", south: "40", east: "15", north: "50", zoom: "0" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when a bound is missing", async () => {
    const response = await getGeo(geoRequest({ south: "40", east: "15", north: "50", zoom: "8" }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 before touching the database when the IP limiter rejects", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 });

    const response = await getGeo(geoRequest(markerBbox));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect((await response.json()).code).toBe("RATE_LIMITED");
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/adventures/geo — latency telemetry", () => {
  it("logs method, path, status and latency once for a successful request", async () => {
    mockFindMany.mockResolvedValue([adventureRow()]);

    const response = await getGeo(geoRequest(markerBbox));
    expect(response.status).toBe(200);

    expect(mockLogRequest).toHaveBeenCalledTimes(1);
    expect(mockLogRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/adventures/geo",
      status: 200,
      latencyMs: expect.any(Number),
      requestId: expect.any(String),
    });
  });

  it("logs the 400 status when validation rejects the bbox", async () => {
    const response = await getGeo(
      geoRequest({ west: "left", south: "40", east: "15", north: "50", zoom: "8" }),
    );
    expect(response.status).toBe(400);

    expect(mockLogRequest).toHaveBeenCalledTimes(1);
    expect(mockLogRequest).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it("adopts an incoming x-request-id as the correlation id", async () => {
    mockFindMany.mockResolvedValue([]);
    const query = new URLSearchParams(markerBbox).toString();
    const request = new NextRequest(`http://localhost/api/adventures/geo?${query}`, {
      headers: { "x-request-id": "trace-me-123" },
    });

    await getGeo(request);

    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "trace-me-123" }),
    );
  });
});
