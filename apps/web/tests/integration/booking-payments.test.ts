// The booking rail: fare re-validation, checkout, and webhook-driven
// PAID → BOOKED transitions with confirmation email.
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    flightBooking: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    itinerary: { updateMany: vi.fn() },
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    stripeEvent: { create: vi.fn() },
  },
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));
vi.mock("@/lib/flights/aggregator", () => ({ searchFlights: vi.fn() }));
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ status: "SENT" }),
}));

import { POST as reprice } from "@/app/api/bookings/[id]/reprice/route";
import { POST as bookingCheckout } from "@/app/api/bookings/[id]/checkout/route";
import { searchFlights } from "@/lib/flights/aggregator";
import { sendEmail } from "@/lib/email/send";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const p = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
const mockSearch = vi.mocked(searchFlights);

const params = { params: Promise.resolve({ id: "bk-1" }) };
const req = () => new NextRequest("http://localhost/api/test", { method: "POST" });

const baseBooking = {
  id: "bk-1",
  userId: "user-1",
  itineraryId: "it-1",
  status: "SELECTED",
  origin: "LHR",
  destination: "KTM",
  airline: "Qatar Airways",
  flightNumber: "QR8",
  departureAt: new Date("2026-10-02T08:30:00Z"),
  arrivalAt: new Date("2026-10-02T20:30:00Z"),
  priceGBP: 45600,
  cabinClass: "economy",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("POST /api/bookings/[id]/reprice", () => {
  it("confirms the fare at the current price when the offer still exists", async () => {
    p.flightBooking.findUnique.mockResolvedValue(baseBooking);
    p.flightBooking.update.mockResolvedValue({ ...baseBooking, status: "PRICE_CONFIRMED" });
    mockSearch.mockResolvedValue({
      search: {} as never,
      offers: [
        {
          id: "real-1",
          flightNumber: "QR8",
          departureAt: "2026-10-02T08:30:00.000Z",
          priceGBP: 47100,
        } as never,
      ],
      cachedAt: "",
    });

    const res = await reprice(req(), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.priceChanged).toBe(true);
    expect(p.flightBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "PRICE_CONFIRMED", priceGBP: 47100 },
      }),
    );
  });

  it("409s when the fare is gone and leaves the booking SELECTED", async () => {
    p.flightBooking.findUnique.mockResolvedValue(baseBooking);
    mockSearch.mockResolvedValue({
      search: {} as never,
      offers: [
        { id: "real-2", flightNumber: "BA143", departureAt: "2026-10-02T10:00:00.000Z" } as never,
      ],
      cachedAt: "",
    });

    const res = await reprice(req(), params);
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("FARE_GONE");
    expect(p.flightBooking.update).not.toHaveBeenCalled();
  });

  it("confirms unverified in demo mode (mock offers) without pretending", async () => {
    p.flightBooking.findUnique.mockResolvedValue(baseBooking);
    p.flightBooking.update.mockResolvedValue({ ...baseBooking, status: "PRICE_CONFIRMED" });
    mockSearch.mockResolvedValue({
      search: {} as never,
      offers: [{ id: "mock-0", flightNumber: "BA200" } as never],
      cachedAt: "",
    });

    const res = await reprice(req(), params);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verified).toBe(false);
  });

  it("503s when providers are unavailable in production", async () => {
    p.flightBooking.findUnique.mockResolvedValue(baseBooking);
    mockSearch.mockResolvedValue({
      search: {} as never,
      offers: [],
      cachedAt: "",
      providersUnavailable: true,
    } as never);

    const res = await reprice(req(), params);
    expect(res.status).toBe(503);
  });

  it("404s for another user's booking (IDOR)", async () => {
    p.flightBooking.findUnique.mockResolvedValue({ ...baseBooking, userId: "attacker-target" });
    const res = await reprice(req(), params);
    expect(res.status).toBe(404);
  });

  it("refuses to re-price a PAID booking", async () => {
    p.flightBooking.findUnique.mockResolvedValue({ ...baseBooking, status: "PAID" });
    const res = await reprice(req(), params);
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("INVALID_STATE");
  });
});

describe("POST /api/bookings/[id]/checkout", () => {
  it("requires a confirmed fare before taking money", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    p.flightBooking.findUnique.mockResolvedValue(baseBooking); // still SELECTED
    const res = await bookingCheckout(req(), params);
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("INVALID_STATE");
  });

  it("503s when payments are not configured", async () => {
    const prev = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "";
    const res = await bookingCheckout(req(), params);
    expect(res.status).toBe(503);
    process.env.STRIPE_SECRET_KEY = prev;
  });
});

describe("stripe webhook — flight booking paid", () => {
  it("advances PAID, flips itinerary BOOKED, notifies, emails", async () => {
    const { handleFlightBookingPaid } = await import("@/lib/billing/flight-booking");
    p.flightBooking.updateMany.mockResolvedValue({ count: 1 });
    p.flightBooking.findUnique.mockResolvedValue({
      ...baseBooking,
      status: "PAID",
      user: { id: "user-1", email: "sam@example.com", name: "Sam" },
    });
    p.itinerary.updateMany.mockResolvedValue({ count: 1 });
    p.notification.create.mockResolvedValue({});

    await handleFlightBookingPaid({
      metadata: { kind: "flight_booking", bookingId: "bk-1", userId: "user-1" },
      payment_intent: "pi_123",
    } as never);

    expect(p.flightBooking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk-1", status: { in: ["SELECTED", "PRICE_CONFIRMED"] } },
        data: expect.objectContaining({ status: "PAID", stripePaymentIntentId: "pi_123" }),
      }),
    );
    expect(p.itinerary.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "BOOKED" } }),
    );
    expect(p.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "BOOKING_CONFIRMED" }),
      }),
    );
    expect(vi.mocked(sendEmail).mock.calls[0][0].template).toBe("booking-confirmed");
  });

  it("is a no-op when the booking is already past PAID (replay safety)", async () => {
    const { handleFlightBookingPaid } = await import("@/lib/billing/flight-booking");
    p.flightBooking.updateMany.mockResolvedValue({ count: 0 });

    await handleFlightBookingPaid({
      metadata: { kind: "flight_booking", bookingId: "bk-1", userId: "user-1" },
      payment_intent: "pi_123",
    } as never);

    expect(p.notification.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
