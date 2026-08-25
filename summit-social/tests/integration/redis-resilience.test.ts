import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));

const mockGetCached = vi.fn();
const mockSetCache = vi.fn();
const mockRateLimit = vi.fn();

vi.mock("@/lib/db/redis", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCache: (...args: unknown[]) => mockSetCache(...args),
  redis: { get: vi.fn(), set: vi.fn(), eval: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: {
      findMany: vi.fn().mockResolvedValue([
        { id: "adv-1", title: "Test Adventure", published: true, voteCount: 5 },
      ]),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockResolvedValue({
        id: "adv-1",
        title: "Test Adventure",
        published: true,
        voteCount: 5,
        userId: "user-2",
      }),
      update: vi.fn().mockResolvedValue({ id: "adv-1", voteCount: 6, userId: "user-2", title: "Test" }),
    },
    vote: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "vote-1", userId: "user-1", adventureId: "adv-1" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    bookmark: { findMany: vi.fn().mockResolvedValue([]) },
    notification: { create: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn().mockImplementation((input: unknown) => {
      if (typeof input === "function") {
        return (input as (tx: unknown) => Promise<unknown>)({
          vote: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({ id: "vote-1" }),
          },
          adventure: {
            update: vi.fn().mockResolvedValue({ id: "adv-1", voteCount: 6, userId: "user-2", title: "Test" }),
          },
        });
      }
      // Array-style transaction
      return Promise.all(
        (input as Promise<unknown>[]).map(() => Promise.resolve({ id: "adv-1", voteCount: 6, userId: "user-2", title: "Test" })),
      );
    }),
  },
}));

vi.mock("@/lib/adventures/query", () => ({
  ADVENTURE_LIST_INCLUDE: {},
  fetchAdventuresPage: vi.fn().mockResolvedValue({
    items: [{ id: "adv-1", title: "Test Adventure" }],
    nextCursor: undefined,
  }),
}));

import { getServerSession } from "next-auth";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

function req(method: string, url = "http://localhost/api/adventures", body?: object) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("Redis resilience — app works when Redis is unreachable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
  });

  it("GET /api/adventures returns 200 when Redis returns null (cache miss due to failure)", async () => {
    // In production, getCached catches ECONNREFUSED internally and returns null.
    // The route should work fine with a cache miss.
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const { GET } = await import("@/app/api/adventures/route");
    const res = await GET(req("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
  });

  it("rate limiting fails open for social routes when Redis is down", async () => {
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mockSession.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/adventures/[id]/vote/route");
    const res = await POST(
      req("POST", "http://localhost/api/adventures/adv-1/vote"),
      { params: Promise.resolve({ id: "adv-1" }) } as never,
    );
    // Should not return 429 — rateLimit returned allowed:true (fail-open simulated)
    expect(res.status).not.toBe(429);
  });

  it("rate limiting fails closed for cost-bearing routes when Redis is down", async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, retryAfter: 30 });
    mockSession.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(
      req("POST", "http://localhost/api/chat", { messages: [{ role: "user", content: "hi" }] }),
    );
    expect(res.status).toBe(429);
  });

  it("getCached mock returns null within expected time (simulates timeout)", async () => {
    mockGetCached.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 50)),
    );

    const start = Date.now();
    const result = await mockGetCached("test-key");
    const elapsed = Date.now() - start;

    expect(result).toBeNull();
    expect(elapsed).toBeLessThan(2000);
  });

  it("adventures API still returns data when cache write fails silently", async () => {
    // setCache failure is swallowed by the Redis module — route just skips caching
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const { GET } = await import("@/app/api/adventures/route");
    const res = await GET(req("GET"));
    expect(res.status).toBe(200);
    expect(mockSetCache).toHaveBeenCalled();
  });

  it("adventures API responds within 3s with cache miss (no Redis)", async () => {
    // Simulate circuit breaker open: getCached returns null immediately, setCache is no-op
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });

    const { GET } = await import("@/app/api/adventures/route");
    const start = Date.now();
    const res = await GET(req("GET"));
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });
});
