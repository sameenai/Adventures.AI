import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }));
  return { default: Redis };
});

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));

const mockStripeCheckoutCreate = vi.fn();
const mockStripeCustomerCreate = vi.fn();
const mockStripeWebhooksConstruct = vi.fn();

vi.mock("stripe", () => {
  const Stripe = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockStripeCheckoutCreate } },
    customers: { create: mockStripeCustomerCreate },
    webhooks: { constructEvent: mockStripeWebhooksConstruct },
  }));
  return { default: Stripe };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
    comment: { findUnique: vi.fn() },
    commentReaction: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { POST as stripeCheckout } from "@/app/api/stripe/checkout/route";
import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/route";
import { POST as commentReact } from "@/app/api/adventures/[id]/comments/[commentId]/react/route";
import { GET as healthCheck } from "@/app/api/health/route";
import { GET as userSearch } from "@/app/api/users/search/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockPrisma = prisma as typeof prisma & Record<string, ReturnType<typeof vi.fn>>;
const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}
function noSession() {
  mockGetSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout
// ---------------------------------------------------------------------------
describe("POST /api/stripe/checkout", () => {
  beforeEach(() => vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc"));
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await stripeCheckout();
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 60 });
    const response = await stripeCheckout();
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 503 when Stripe key is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    mockSession();
    const response = await stripeCheckout();
    expect(response.status).toBe(503);
  });

  it("returns 503 when Stripe price ID is missing", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "");
    mockSession();
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "alice@example.com",
      stripeCustomerId: null,
      plan: "FREE",
    });
    const response = await stripeCheckout();
    expect(response.status).toBe(503);
  });

  it("returns 404 when user not found in DB", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_abc");
    mockSession();
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await stripeCheckout();
    expect(response.status).toBe(404);
  });

  it("returns 400 when user is already on Pro plan", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_abc");
    mockSession();
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "alice@example.com",
      stripeCustomerId: "cus_123",
      plan: "PRO",
    });
    const response = await stripeCheckout();
    expect(response.status).toBe(400);
  });

  it("creates a new Stripe customer when none exists, then returns checkout URL", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_abc");
    mockSession();
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "alice@example.com",
      stripeCustomerId: null,
      plan: "FREE",
    });
    mockStripeCustomerCreate.mockResolvedValue({ id: "cus_new" });
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    mockStripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session_abc" });

    const response = await stripeCheckout();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBe("https://checkout.stripe.com/session_abc");
    expect(mockStripeCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "alice@example.com" }),
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stripeCustomerId: "cus_new" } }),
    );
  });

  it("reuses existing Stripe customer ID without creating a new one", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_abc");
    mockSession();
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "alice@example.com",
      stripeCustomerId: "cus_existing",
      plan: "FREE",
    });
    mockStripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/sess_xyz" });

    const response = await stripeCheckout();
    expect(response.status).toBe(200);
    expect(mockStripeCustomerCreate).not.toHaveBeenCalled();
    const data = await response.json();
    expect(data.url).toBe("https://checkout.stripe.com/sess_xyz");
  });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------
describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_abc");
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockStripeWebhooksConstruct.mockImplementation(() => {
      throw new Error("Signature mismatch");
    });

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "bad_sig" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("upgrades user to PRO on checkout.session.completed", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-1" },
          subscription: "sub_123",
        },
      },
    };
    mockStripeWebhooksConstruct.mockReturnValue(event);
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { plan: "PRO", stripeSubId: "sub_123" },
      }),
    );
  });

  it("downgrades user to FREE on customer.subscription.deleted with userId metadata", async () => {
    const event = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          metadata: { userId: "user-1" },
        },
      },
    };
    mockStripeWebhooksConstruct.mockReturnValue(event);
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { plan: "FREE", stripeSubId: null },
      }),
    );
  });

  it("falls back to stripeSubId lookup when userId metadata is absent on deletion", async () => {
    const event = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_xyz",
          metadata: {},
        },
      },
    };
    mockStripeWebhooksConstruct.mockReturnValue(event);
    (mockPrisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubId: "sub_xyz" },
        data: { plan: "FREE", stripeSubId: null },
      }),
    );
  });

  it("updates plan on customer.subscription.updated when active", async () => {
    const event = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          metadata: { userId: "user-1" },
        },
      },
    };
    mockStripeWebhooksConstruct.mockReturnValue(event);
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { plan: "PRO" },
      }),
    );
  });

  it("downgrades plan on customer.subscription.updated when past_due", async () => {
    const event = {
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "past_due",
          metadata: { userId: "user-1" },
        },
      },
    };
    mockStripeWebhooksConstruct.mockReturnValue(event);
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { plan: "FREE" },
      }),
    );
  });

  it("returns 200 and received:true for unknown event types (no-op)", async () => {
    const event = { type: "payment_intent.created", data: { object: {} } };
    mockStripeWebhooksConstruct.mockReturnValue(event);

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify(event),
        headers: { "stripe-signature": "valid_sig" },
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it("returns 503 when webhook secrets are not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc");
    // No STRIPE_WEBHOOK_SECRET set

    const response = await stripeWebhook(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "any_sig" },
      }),
    );

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe("Billing not configured");
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/comments/[commentId]/react
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/comments/[commentId]/react", () => {
  afterEach(() => vi.clearAllMocks());

  const makeReactRequest = () =>
    new NextRequest("http://localhost/api/adventures/adv-1/comments/comment-1/react", {
      method: "POST",
    });

  const routeParams = { params: Promise.resolve({ id: "adv-1", commentId: "comment-1" }) };

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await commentReact(makeReactRequest(), routeParams);
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await commentReact(makeReactRequest(), routeParams);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 404 when comment not found", async () => {
    mockSession();
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await commentReact(makeReactRequest(), routeParams);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });

  it("removes reaction and returns reacted:false when already reacted", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "comment-1" });
    (mockPrisma.commentReaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "reaction-1",
    });
    (mockPrisma.commentReaction.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.commentReaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const response = await commentReact(makeReactRequest(), routeParams);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reacted).toBe(false);
    expect(data.count).toBe(2);
    expect(mockPrisma.commentReaction.delete).toHaveBeenCalledWith({
      where: { id: "reaction-1" },
    });
  });

  it("adds reaction and returns reacted:true with 201 when not yet reacted", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "comment-1" });
    (mockPrisma.commentReaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockPrisma.commentReaction.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.commentReaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const response = await commentReact(makeReactRequest(), routeParams);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.reacted).toBe(true);
    expect(data.count).toBe(5);
    expect(mockPrisma.commentReaction.create).toHaveBeenCalledWith({
      data: { userId: "user-1", commentId: "comment-1" },
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
describe("GET /api/health", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns status:ok when DB is reachable", async () => {
    (mockPrisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ "?column?": 1 }]);
    const response = await healthCheck();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  it("returns 503 when DB is unreachable", async () => {
    (mockPrisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Connection refused"),
    );
    const response = await healthCheck();
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.status).toBe("error");
    expect(data.detail).toBe("db_unreachable");
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/search
// ---------------------------------------------------------------------------
describe("GET /api/users/search", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await userSearch(
      new NextRequest("http://localhost/api/users/search?q=alice"),
    );
    expect(response.status).toBe(429);
  });

  it("returns empty array for query shorter than 2 chars", async () => {
    const response = await userSearch(
      new NextRequest("http://localhost/api/users/search?q=a"),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("returns empty array when q is missing", async () => {
    const response = await userSearch(
      new NextRequest("http://localhost/api/users/search"),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("returns matching users for valid query", async () => {
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "user-1", name: "Alice", avatarUrl: null, _count: { adventures: 3 } },
    ]);

    const response = await userSearch(
      new NextRequest("http://localhost/api/users/search?q=alice"),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Alice");
  });

  it("returns 500 when DB throws", async () => {
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await userSearch(
      new NextRequest("http://localhost/api/users/search?q=alice"),
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
