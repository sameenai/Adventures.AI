// Travel cadence substrate: logbook writes, stated preferences, the scan job
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findUnique: vi.fn(), findMany: vi.fn() },
    tripEvent: { upsert: vi.fn(), deleteMany: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    travelerProfile: { findUnique: vi.fn(), upsert: vi.fn() },
    cadenceRecommendation: { count: vi.fn(), createMany: vi.fn() },
    notification: { create: vi.fn() },
    bookmark: { findMany: vi.fn() },
    vote: { findMany: vi.fn() },
    adventureView: { findMany: vi.fn() },
  },
}));

import { POST as markDone, DELETE as unmarkDone } from "@/app/api/adventures/[id]/complete/route";
import { PUT as putProfile } from "@/app/api/user/traveler-profile/route";
import { runCadenceScan } from "@/lib/jobs/cadence";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const p = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

const params = { params: Promise.resolve({ id: "adv-1" }) };
const req = (method: string, body?: object) =>
  new NextRequest("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("POST /api/adventures/[id]/complete — the logbook write", () => {
  it("records a MARKED_DONE trip event anchored to the trip date", async () => {
    p.adventure.findUnique.mockResolvedValue({ id: "adv-1", country: "Nepal", published: true });
    p.tripEvent.upsert.mockResolvedValue({ id: "te-1" });

    const res = await markDone(req("POST", { completedAt: "2026-05-10" }), params);
    expect(res.status).toBe(201);

    const arg = p.tripEvent.upsert.mock.calls[0][0];
    expect(arg.create.source).toBe("MARKED_DONE");
    expect(arg.create.destinationCountry).toBe("Nepal");
    expect(arg.create.startedAt.toISOString()).toContain("2026-05-10");
  });

  it("404s for unpublished adventures", async () => {
    p.adventure.findUnique.mockResolvedValue({ id: "adv-1", country: "Nepal", published: false });
    const res = await markDone(req("POST", {}), params);
    expect(res.status).toBe(404);
  });

  it("unlogs via DELETE", async () => {
    p.tripEvent.deleteMany.mockResolvedValue({ count: 1 });
    const res = await unmarkDone(req("DELETE"), params);
    expect(res.status).toBe(200);
    expect(p.tripEvent.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", adventureId: "adv-1", source: "MARKED_DONE" },
    });
  });
});

describe("PUT /api/user/traveler-profile — stated preferences", () => {
  it("upserts the profile", async () => {
    p.travelerProfile.upsert.mockResolvedValue({ id: "tp-1", cadenceMonths: 3 });
    const res = await putProfile(
      req("PUT", {
        cadenceMonths: 3,
        homeAirport: "LHR",
        preferredCategories: ["TREKKING", "MOUNTAINEERING"],
        maxDifficulty: "CHALLENGING",
        budgetBandPence: 250000,
      }),
    );
    expect(res.status).toBe(200);
    expect(p.travelerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });

  it("rejects invalid cadence and airports", async () => {
    const res = await putProfile(req("PUT", { cadenceMonths: 0, homeAirport: "Heathrow" }));
    expect(res.status).toBe(400);
    expect(p.travelerProfile.upsert).not.toHaveBeenCalled();
  });
});

describe("runCadenceScan", () => {
  const monthsAgo = (n: number) => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - n);
    return d;
  };

  function primeSignalMocks() {
    p.bookmark.findMany.mockResolvedValue([
      { adventureId: "adv-picked", adventure: facets() },
    ] as never);
    p.vote.findMany.mockResolvedValue([]);
    p.adventureView.findMany.mockResolvedValue([]);
    p.tripEvent.findMany.mockResolvedValue([]);
    p.adventure.findMany.mockResolvedValue([
      {
        id: "adv-picked",
        category: "TREKKING",
        estimatedCost: 120000,
        viewCount: 10,
        voteCount: 5,
        bestMonths: [new Date().getUTCMonth() + 1],
      },
    ]);
    p.cadenceRecommendation.createMany.mockResolvedValue({ count: 1 });
    p.notification.create.mockResolvedValue({});
  }
  const facets = () => ({
    category: "TREKKING",
    continent: "Asia",
    difficulty: "MODERATE",
    durationDays: 12,
  });

  it("recommends and notifies users whose window is open", async () => {
    p.tripEvent.groupBy.mockResolvedValue([
      { userId: "user-1", _max: { startedAt: monthsAgo(7) } },
    ]);
    p.travelerProfile.findUnique.mockResolvedValue({ cadenceMonths: 6 });
    p.cadenceRecommendation.count.mockResolvedValue(0);
    primeSignalMocks();

    const stats = await runCadenceScan();
    expect(stats.usersDue).toBe(1);
    expect(stats.recommendationsCreated).toBe(1);
    expect(stats.notificationsCreated).toBe(1);

    const rec = p.cadenceRecommendation.createMany.mock.calls[0][0].data[0];
    expect(rec.reasons).toContain("bookmarked");
    expect(p.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "TRIP_DUE", linkUrl: "/next-trip" }),
      }),
    );
  });

  it("skips users who are not yet due", async () => {
    p.tripEvent.groupBy.mockResolvedValue([
      { userId: "user-1", _max: { startedAt: monthsAgo(1) } },
    ]);
    p.travelerProfile.findUnique.mockResolvedValue({ cadenceMonths: 12 });

    const stats = await runCadenceScan();
    expect(stats.usersDue).toBe(0);
    expect(p.cadenceRecommendation.createMany).not.toHaveBeenCalled();
  });

  it("is idempotent per window — never double-recommends", async () => {
    p.tripEvent.groupBy.mockResolvedValue([
      { userId: "user-1", _max: { startedAt: monthsAgo(7) } },
    ]);
    p.travelerProfile.findUnique.mockResolvedValue(null);
    p.cadenceRecommendation.count.mockResolvedValue(5); // already recommended

    const stats = await runCadenceScan();
    expect(stats.usersDue).toBe(1);
    expect(stats.recommendationsCreated).toBe(0);
    expect(p.notification.create).not.toHaveBeenCalled();
  });
});
