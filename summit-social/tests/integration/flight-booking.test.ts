// The first booking write path + itinerary lifecycle rules
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
    itinerary: { findUnique: vi.fn(), update: vi.fn() },
    flightBooking: { create: vi.fn() },
  },
}));

import { POST as saveFlight } from "@/app/api/itineraries/[id]/flights/route";
import { PATCH as patchItinerary } from "@/app/api/itineraries/[id]/route";
import { isLegalStatusTransition } from "@/lib/validators/itinerary";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockItinerary = prisma.itinerary as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBooking = prisma.flightBooking as unknown as Record<string, ReturnType<typeof vi.fn>>;

const params = { params: Promise.resolve({ id: "itin-1" }) };
const validOffer = {
  provider: "amadeus",
  providerRef: "offer-123",
  origin: "LHR",
  destination: "KTM",
  departureAt: "2026-10-01T09:00:00Z",
  arrivalAt: "2026-10-01T22:30:00Z",
  airline: "Qatar Airways",
  flightNumber: "QR8",
  priceGBP: 62000,
  cabinClass: "economy",
};

const req = (body: object) =>
  new NextRequest("http://localhost/api/itineraries/itin-1/flights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/itineraries/[id]/flights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockItinerary.findUnique.mockResolvedValue({ id: "itin-1", status: "DRAFT" });
    mockItinerary.update.mockResolvedValue({});
    mockBooking.create.mockResolvedValue({ id: "fb-1", status: "SELECTED" });
  });

  it("requires authentication", async () => {
    mockSession.mockResolvedValue(null);
    const res = await saveFlight(req(validOffer), params);
    expect(res.status).toBe(401);
  });

  it("404s for itineraries the caller does not own", async () => {
    mockItinerary.findUnique.mockResolvedValue(null);
    const res = await saveFlight(req(validOffer), params);
    expect(res.status).toBe(404);
    expect(mockItinerary.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "itin-1", userId: "user-1" } }),
    );
    expect(mockBooking.create).not.toHaveBeenCalled();
  });

  it("rejects invalid offers", async () => {
    const res = await saveFlight(req({ ...validOffer, origin: "London" }), params);
    expect(res.status).toBe(400);
  });

  it("persists the booking as SELECTED for the caller and advances DRAFT to PLANNING", async () => {
    const res = await saveFlight(req(validOffer), params);
    expect(res.status).toBe(201);

    expect(mockBooking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "SELECTED",
        origin: "LHR",
        destination: "KTM",
        priceGBP: 62000,
        userId: "user-1",
        itineraryId: "itin-1",
      }),
    });
    expect(mockItinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PLANNING" } }),
    );
  });

  it("does not touch status when the itinerary is already PLANNING", async () => {
    mockItinerary.findUnique.mockResolvedValue({ id: "itin-1", status: "PLANNING" });
    const res = await saveFlight(req(validOffer), params);
    expect(res.status).toBe(201);
    expect(mockItinerary.update).not.toHaveBeenCalled();
  });
});

describe("itinerary status transitions", () => {
  it("encodes the forward-only lifecycle", () => {
    expect(isLegalStatusTransition("DRAFT", "PLANNING")).toBe(true);
    expect(isLegalStatusTransition("PLANNING", "BOOKED")).toBe(true);
    expect(isLegalStatusTransition("BOOKED", "COMPLETED")).toBe(true);
    expect(isLegalStatusTransition("BOOKED", "PLANNING")).toBe(true); // cancellation/re-plan
    expect(isLegalStatusTransition("COMPLETED", "DRAFT")).toBe(false);
    expect(isLegalStatusTransition("BOOKED", "DRAFT")).toBe(false);
    expect(isLegalStatusTransition("DRAFT", "COMPLETED")).toBe(false);
    expect(isLegalStatusTransition("PLANNING", "PLANNING")).toBe(true); // no-op allowed
  });

  it("PATCH rejects illegal transitions with 409", async () => {
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockItinerary.findUnique.mockResolvedValue({ id: "itin-1", status: "COMPLETED" });

    const res = await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      }) as never,
      params as never,
    );
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.code).toBe("ILLEGAL_TRANSITION");
    expect(mockItinerary.update).not.toHaveBeenCalled();
  });
});
