// Real tool executors behind the agent loop — honesty and correctness
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type OpenAI from "openai";

const { mockSearchFlights } = vi.hoisted(() => ({ mockSearchFlights: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findMany: vi.fn() },
    itineraryDay: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    searchEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));
vi.mock("@/lib/flights/aggregator", () => ({ searchFlights: mockSearchFlights }));

import { chatToolExecutors } from "@/lib/ai/tool-executors";
import { prisma } from "@/lib/db/prisma";

const mockAdventure = prisma.adventure as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockDay = prisma.itineraryDay as unknown as Record<string, ReturnType<typeof vi.fn>>;

const gearCreate = vi.fn();
const ctx = {
  userId: "u1",
  itineraryId: "itin-1",
  client: { chat: { completions: { create: gearCreate } } } as unknown as OpenAI,
};

beforeEach(() => vi.clearAllMocks());

describe("search_adventures executor", () => {
  it("searches published adventures including country matches", async () => {
    mockAdventure.findMany.mockResolvedValue([{ id: "a1", title: "EBC" }]);
    const out = JSON.parse(
      await chatToolExecutors.search_adventures({ query: "nepal" }, ctx),
    );
    expect(out.success).toBe(true);
    expect(out.results).toHaveLength(1);
    const where = mockAdventure.findMany.mock.calls[0][0].where;
    expect(where.published).toBe(true);
    expect(where.OR.some((c: Record<string, unknown>) => "country" in c)).toBe(true);
  });

  it("rejects invalid arguments without querying", async () => {
    const out = JSON.parse(
      await chatToolExecutors.search_adventures({ maxDuration: "soon" }, ctx),
    );
    expect(out.success).toBe(false);
    expect(mockAdventure.findMany).not.toHaveBeenCalled();
  });
});

describe("create_itinerary_day executor", () => {
  const day = {
    dayNumber: 2,
    title: "Namche",
    activities: [{ time: "08:00", activity: "Trek", location: "Namche Bazaar" }],
  };

  it("creates a new day scoped to the context itinerary", async () => {
    mockDay.findFirst.mockResolvedValue(null);
    mockDay.create.mockResolvedValue({});
    const out = JSON.parse(await chatToolExecutors.create_itinerary_day(day, ctx));
    expect(out.success).toBe(true);
    expect(mockDay.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ itineraryId: "itin-1", dayNumber: 2 }),
    });
  });

  it("updates an existing day instead of duplicating it", async () => {
    mockDay.findFirst.mockResolvedValue({ id: "day-1" });
    mockDay.update.mockResolvedValue({});
    await chatToolExecutors.create_itinerary_day(day, ctx);
    expect(mockDay.update).toHaveBeenCalled();
    expect(mockDay.create).not.toHaveBeenCalled();
  });

  it("reports schema failures honestly", async () => {
    const out = JSON.parse(
      await chatToolExecutors.create_itinerary_day({ dayNumber: -1 }, ctx),
    );
    expect(out.success).toBe(false);
  });
});

describe("search_flights executor", () => {
  const args = { origin: "LHR", destination: "KTM", departureDate: "2026-10-01" };

  it("returns compact real offers capped at five", async () => {
    mockSearchFlights.mockResolvedValue({
      offers: Array.from({ length: 8 }, (_, i) => ({
        airline: `Air ${i}`,
        flightNumber: `X${i}`,
        departureAt: "2026-10-01T09:00:00Z",
        arrivalAt: "2026-10-01T21:00:00Z",
        durationMinutes: 720,
        stops: 1,
        priceGBP: 60000 + i,
        cabinClass: "economy",
        deepLink: i === 0 ? "https://partner.example/deep" : "",
      })),
    });
    const out = JSON.parse(await chatToolExecutors.search_flights(args, ctx));
    expect(out.success).toBe(true);
    expect(out.offers).toHaveLength(5);
    expect(out.offers[0].bookingLink).toBe("https://partner.example/deep");
    expect(out.offers[1].bookingLink).toBeNull();
    expect(out.note).toContain("never adjust prices");
  });

  it("tells the model the truth when providers are unavailable", async () => {
    mockSearchFlights.mockResolvedValue({ offers: [], providersUnavailable: true });
    const out = JSON.parse(await chatToolExecutors.search_flights(args, ctx));
    expect(out.success).toBe(false);
    expect(out.error).toContain("do not invent prices");
  });

  it("rejects non-IATA arguments", async () => {
    const out = JSON.parse(
      await chatToolExecutors.search_flights({ ...args, origin: "London" }, ctx),
    );
    expect(out.success).toBe(false);
    expect(mockSearchFlights).not.toHaveBeenCalled();
  });
});

describe("suggest_gear executor", () => {
  it("runs a nested completion with the gear system prompt", async () => {
    gearCreate.mockResolvedValue({
      choices: [{ message: { content: "- Ice axe\n- Crampons" } }],
    });
    const out = JSON.parse(
      await chatToolExecutors.suggest_gear(
        { activity: "mountaineering", conditions: "glacial", duration: 10 },
        ctx,
      ),
    );
    expect(out.success).toBe(true);
    expect(out.recommendations).toContain("Ice axe");
    const call = gearCreate.mock.calls[0][0];
    expect(call.messages[0].role).toBe("system");
    expect(call.messages[0].content.toLowerCase()).toContain("gear");
  });
});

describe("get_weather_forecast executor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("geocodes and returns historical monthly averages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          results: [{ latitude: 27.7, longitude: 85.3, name: "Kathmandu", country: "Nepal" }],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          daily: {
            temperature_2m_max: [20, 22],
            temperature_2m_min: [8, 10],
            precipitation_sum: [1, 3],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const out = JSON.parse(
      await chatToolExecutors.get_weather_forecast({ destination: "Kathmandu", month: 10 }, ctx),
    );
    expect(out.success).toBe(true);
    expect(out.destination).toBe("Kathmandu, Nepal");
    expect(out.avgHighC).toBe(21);
    expect(out.avgLowC).toBe(9);
    expect(out.note).toContain("not a forecast");
  });

  it("fails honestly when the destination cannot be located", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ results: [] }) }),
    );
    const out = JSON.parse(
      await chatToolExecutors.get_weather_forecast({ destination: "Xyzzy", month: 5 }, ctx),
    );
    expect(out.success).toBe(false);
  });

  it("fails honestly when the weather service errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const out = JSON.parse(
      await chatToolExecutors.get_weather_forecast({ destination: "Kathmandu", month: 5 }, ctx),
    );
    expect(out.success).toBe(false);
    expect(out.error).toBe("Weather lookup failed");
  });
});
