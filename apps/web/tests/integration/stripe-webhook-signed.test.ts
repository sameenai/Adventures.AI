// The webhook's REAL signature path: the `stripe` module is deliberately NOT
// mocked here. Requests are signed with the SDK's own
// webhooks.generateTestHeaderString and verified by the route through
// stripe.webhooks.constructEvent — so a tampered body genuinely fails HMAC
// verification instead of passing through a stubbed constructEvent.
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    flightBooking: { findUnique: vi.fn(), updateMany: vi.fn() },
    itinerary: { updateMany: vi.fn() },
    notification: { create: vi.fn() },
    user: { update: vi.fn(), updateMany: vi.fn() },
    stripeEvent: { create: vi.fn() },
  },
}));
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ status: "SENT" }),
}));
vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/route";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";

const WEBHOOK_SECRET = "whsec_test_signing_secret";

// The webhooks namespace does local HMAC crypto only — no API calls — so a
// dummy key is enough to both sign (here) and verify (in the route).
const stripeSdk = new Stripe("sk_test_dummy");
const sign = (payload: string) =>
  stripeSdk.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

const p = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

const webhookRequest = (body: string, signature: string) =>
  stripeWebhook(
    new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body,
    }),
  );

const paidBooking = {
  id: "bk-1",
  userId: "user-1",
  itineraryId: "it-1",
  status: "PAID",
  origin: "LHR",
  destination: "KTM",
  airline: "Qatar Airways",
  flightNumber: "QR8",
  departureAt: new Date("2026-10-02T08:30:00Z"),
  arrivalAt: new Date("2026-10-02T20:30:00Z"),
  priceGBP: 45600,
  cabinClass: "economy",
  user: { id: "user-1", email: "sam@example.com", name: "Sam" },
};

// Minimal but honest event JSON: id, type, and only the data.object fields
// the route and billing handlers actually read.
const flightPaidEvent = JSON.stringify({
  id: "evt_flight_paid_1",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_flight_1",
      object: "checkout.session",
      metadata: { kind: "flight_booking", bookingId: "bk-1", userId: "user-1" },
      payment_intent: "pi_123",
    },
  },
});

const subscriptionEvent = JSON.stringify({
  id: "evt_sub_paid_1",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_sub_1",
      object: "checkout.session",
      metadata: { userId: "user-1" },
      subscription: "sub_123",
    },
  },
});

const refundEvent = JSON.stringify({
  id: "evt_refund_1",
  type: "charge.refunded",
  data: {
    object: {
      id: "ch_1",
      object: "charge",
      payment_intent: "pi_123",
      refunded: true,
    },
  },
});

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
  p.stripeEvent.create.mockResolvedValue({});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/webhooks/stripe — genuinely signed requests", () => {
  it("checkout.session.completed (flight): booking PAID, itinerary BOOKED, email sent", async () => {
    p.flightBooking.updateMany.mockResolvedValue({ count: 1 });
    p.flightBooking.findUnique.mockResolvedValue(paidBooking);
    p.itinerary.updateMany.mockResolvedValue({ count: 1 });
    p.notification.create.mockResolvedValue({});

    const res = await webhookRequest(flightPaidEvent, sign(flightPaidEvent));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(p.stripeEvent.create).toHaveBeenCalledWith({
      data: { id: "evt_flight_paid_1", type: "checkout.session.completed" },
    });
    expect(p.flightBooking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk-1", status: { in: ["SELECTED", "PRICE_CONFIRMED"] } },
        data: expect.objectContaining({ status: "PAID", stripePaymentIntentId: "pi_123" }),
      }),
    );
    expect(p.itinerary.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "it-1" }),
        data: { status: "BOOKED" },
      }),
    );
    expect(p.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "BOOKING_CONFIRMED" }) }),
    );
    expect(vi.mocked(sendEmail).mock.calls[0][0].template).toBe("booking-confirmed");
  });

  it("checkout.session.completed (subscription): user upgraded to PRO", async () => {
    p.user.update.mockResolvedValue({});

    const res = await webhookRequest(subscriptionEvent, sign(subscriptionEvent));

    expect(res.status).toBe(200);
    expect(p.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { plan: "PRO", stripeSubId: "sub_123" },
    });
    // Not a flight booking — the booking rail is untouched.
    expect(p.flightBooking.updateMany).not.toHaveBeenCalled();
  });

  it("charge.refunded: PAID/TICKETED booking transitions to REFUNDED", async () => {
    p.flightBooking.updateMany.mockResolvedValue({ count: 1 });

    const res = await webhookRequest(refundEvent, sign(refundEvent));

    expect(res.status).toBe(200);
    expect(p.flightBooking.updateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_123", status: { in: ["PAID", "TICKETED"] } },
      data: { status: "REFUNDED" },
    });
  });

  it("tampered payload (signature from a different body) is rejected with 400, nothing touched", async () => {
    // A valid signature — but over a different body than the one delivered.
    const forged = flightPaidEvent.replace("bk-1", "bk-attacker");
    const res = await webhookRequest(forged, sign(flightPaidEvent));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid signature");
    expect(p.stripeEvent.create).not.toHaveBeenCalled();
    expect(p.flightBooking.updateMany).not.toHaveBeenCalled();
    expect(p.user.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("replayed event id: ledger P2002 short-circuits with duplicate:true, handler not re-run", async () => {
    p.stripeEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`id`)", {
        code: "P2002",
        clientVersion: "6.4.0",
      }),
    );

    const res = await webhookRequest(flightPaidEvent, sign(flightPaidEvent));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(p.flightBooking.updateMany).not.toHaveBeenCalled();
    expect(p.itinerary.updateMany).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
