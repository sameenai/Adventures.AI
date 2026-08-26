// GDPR self-service: account deletion (Art 17) and data export (Art 20)
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockCustomersDel } = vi.hoisted(() => ({ mockCustomersDel: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({ customers: { del: mockCustomersDel } })),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), delete: vi.fn() },
    adventure: { findMany: vi.fn().mockResolvedValue([]) },
    comment: { findMany: vi.fn().mockResolvedValue([]) },
    vote: { findMany: vi.fn().mockResolvedValue([]) },
    itinerary: { findMany: vi.fn().mockResolvedValue([]) },
    bookmark: { findMany: vi.fn().mockResolvedValue([]) },
    collection: { findMany: vi.fn().mockResolvedValue([]) },
    follow: { findMany: vi.fn().mockResolvedValue([]) },
    notification: { findMany: vi.fn().mockResolvedValue([]) },
    messageFeedback: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { DELETE } from "@/app/api/user/me/route";
import { GET as exportRoute } from "@/app/api/user/me/export/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;

const deleteRequest = (body?: object) =>
  new NextRequest("http://localhost/api/user/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe("DELETE /api/user/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockUser.findUnique.mockResolvedValue({ stripeCustomerId: null });
    mockUser.delete.mockResolvedValue({});
  });

  it("returns 401 when not authenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await DELETE(deleteRequest({ confirm: "DELETE" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("requires the typed confirmation", async () => {
    const res = await DELETE(deleteRequest({ confirm: "yes please" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect(mockUser.delete).not.toHaveBeenCalled();
  });

  it("deletes the user row (cascading all owned content)", async () => {
    const res = await DELETE(deleteRequest({ confirm: "DELETE" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(204);
    expect(mockUser.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("deletes the Stripe customer when one exists", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    mockUser.findUnique.mockResolvedValue({ stripeCustomerId: "cus_123" });
    mockCustomersDel.mockResolvedValue({});

    const res = await DELETE(deleteRequest({ confirm: "DELETE" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(204);
    expect(mockCustomersDel).toHaveBeenCalledWith("cus_123");
    vi.unstubAllEnvs();
  });

  it("still deletes the account when Stripe cleanup fails", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    mockUser.findUnique.mockResolvedValue({ stripeCustomerId: "cus_123" });
    mockCustomersDel.mockRejectedValue(new Error("stripe down"));

    const res = await DELETE(deleteRequest({ confirm: "DELETE" }), { params: Promise.resolve({}) });
    expect(res.status).toBe(204);
    expect(mockUser.delete).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe("GET /api/user/me/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockUser.findUnique.mockResolvedValue({
      id: "user-1",
      email: "me@example.com",
      name: "Me",
      avatarUrl: null,
      bio: null,
      instagramUrl: null,
      twitterUrl: null,
      websiteUrl: null,
      plan: "FREE",
      openAiApiKey: "encrypted-blob",
      marketingConsent: false,
      marketingConsentAt: null,
      termsAcceptedAt: null,
      termsVersion: null,
      createdAt: new Date("2026-01-01"),
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await exportRoute(new NextRequest("http://localhost/api/user/me/export"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(401);
  });

  it("returns a complete bundle as a download, never the raw key", async () => {
    // The bundle must include AI answer feedback — its DOWN-rated rows hold a
    // conversation snapshot that survives itinerary deletion, so this export
    // is the only place a user can see it.
    const mockFeedback = prisma.messageFeedback as unknown as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    mockFeedback.findMany.mockResolvedValue([
      {
        id: "fb-1",
        rating: "DOWN",
        comment: "fares look invented",
        transcript: [{ role: "assistant", content: "Qatar Airways via Doha." }],
        itineraryId: null,
        createdAt: new Date("2026-08-01"),
      },
    ]);

    const res = await exportRoute(new NextRequest("http://localhost/api/user/me/export"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("basecamper-export.json");

    const body = await res.text();
    expect(body).not.toContain("encrypted-blob");

    const bundle = JSON.parse(body);
    expect(bundle.format).toBe("basecamper-export/v1");
    expect(bundle.profile.email).toBe("me@example.com");
    expect(bundle.profile.hasStoredOpenAiKey).toBe(true);
    for (const key of [
      "adventures",
      "comments",
      "votes",
      "itineraries",
      "bookmarks",
      "collections",
      "follows",
      "notifications",
      "messageFeedback",
    ]) {
      expect(Array.isArray(bundle[key])).toBe(true);
    }

    expect(mockFeedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
    expect(bundle.messageFeedback).toHaveLength(1);
    expect(bundle.messageFeedback[0]).toMatchObject({
      id: "fb-1",
      rating: "DOWN",
      comment: "fares look invented",
      itineraryId: null,
    });
    expect(bundle.messageFeedback[0].transcript[0].content).toBe("Qatar Airways via Doha.");
  });
});
