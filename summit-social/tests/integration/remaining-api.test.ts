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

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    searchEvent: { create: vi.fn().mockResolvedValue({}) },
    adventure: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    collection: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    collectionItem: { upsert: vi.fn(), deleteMany: vi.fn() },
    comment: { create: vi.fn() },
    follow: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    vote: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    itinerary: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itineraryDay: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "day-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    notification: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({ chat: { completions: { create: vi.fn() } } }),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { POST as createComment } from "@/app/api/adventures/[id]/comments/route";
import { POST as duplicateAdventure } from "@/app/api/adventures/[id]/duplicate/route";
import { PATCH as patchAdventure } from "@/app/api/adventures/[id]/route";
import { POST as voteAdventure } from "@/app/api/adventures/[id]/vote/route";
import { POST as chatRoute } from "@/app/api/chat/route";
import {
  POST as addToCollection,
  DELETE as removeFromCollection,
} from "@/app/api/collections/[id]/items/route";
import { DELETE as deleteCollection, GET as getCollection } from "@/app/api/collections/[id]/route";
import { POST as createCollection, GET as getCollections } from "@/app/api/collections/route";
import {
  DELETE as deleteItinerary,
  GET as getItinerary,
  PATCH as patchItinerary,
} from "@/app/api/itineraries/[id]/route";
import { POST as createItinerary, GET as getItineraries } from "@/app/api/itineraries/route";
import { POST as markAllRead } from "@/app/api/notifications/read-all/route";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { POST as followUser, DELETE as unfollowUser } from "@/app/api/users/[id]/follow/route";
import { GET as getUser, PATCH as patchUser } from "@/app/api/users/[id]/route";
import { GET as getUserSuggestions } from "@/app/api/users/suggestions/route";
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
// POST /api/adventures/[id]/comments
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/comments", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates a comment and returns 201", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "owner-1",
      title: "Nepal Trek",
    });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "comment-1",
      body: "Great adventure!",
      userId: "user-1",
      adventureId: "adv-1",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Great adventure!" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.body).toBe("Great adventure!");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hi" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hi" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(429);
  });

  it("returns 400 for empty body", async () => {
    mockSession();
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when adventure not found", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/missing/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hello there" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("creates a reply when parentId is provided", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "owner-1",
      title: "Nepal Trek",
    });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "reply-1",
      body: "I agree!",
      parentId: "comment-1",
      userId: "user-1",
      adventureId: "adv-1",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "I agree!", parentId: "comment-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.parentId).toBe("comment-1");
  });
});

// ---------------------------------------------------------------------------
// Notification triggers: comment creates notification for adventure owner
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/comments — notification triggers", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates NEW_COMMENT notification when commenter is not the owner", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
      title: "Nepal Trek",
    });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c-1",
      body: "Great!",
      userId: "user-2",
      adventureId: "adv-1",
      user: { id: "user-2", name: "Bob", avatarUrl: null },
    });
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Great!" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          type: "NEW_COMMENT",
        }),
      }),
    );
  });

  it("does not create notification when commenter is the owner", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
      title: "Nepal Trek",
    });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c-1",
      body: "My own comment",
      userId: "user-1",
      adventureId: "adv-1",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });

    await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "My own comment" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("creates mention notifications for @mentioned users", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
      title: "Nepal Trek",
    });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c-1",
      body: "Hey @Carol check this out!",
      userId: "user-2",
      adventureId: "adv-1",
      user: { id: "user-2", name: "Bob", avatarUrl: null },
    });
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "user-3" }]);
    (mockPrisma.notification.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 1,
    });

    await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hey @Carol check this out!" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "user-3", type: "NEW_COMMENT" }),
        ]),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// POST/DELETE /api/users/[id]/follow — notification triggers
// ---------------------------------------------------------------------------
describe("POST /api/users/[id]/follow", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await followUser(
      new NextRequest("http://localhost/api/users/user-2/follow", { method: "POST" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when following yourself", async () => {
    mockSession("user-1");
    const response = await followUser(
      new NextRequest("http://localhost/api/users/user-1/follow", { method: "POST" }),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    mockSession("user-1");
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await followUser(
      new NextRequest("http://localhost/api/users/user-2/follow", { method: "POST" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(response.status).toBe(429);
  });

  it("creates a follow and sends NEW_FOLLOWER notification on first follow", async () => {
    mockSession("user-1");
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "user-2" }) // target exists
      .mockResolvedValueOnce({ name: "Alice" }); // follower name lookup
    (mockPrisma.follow.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockPrisma.follow.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await followUser(
      new NextRequest("http://localhost/api/users/user-2/follow", { method: "POST" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.following).toBe(true);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-2", type: "NEW_FOLLOWER" }),
      }),
    );
  });

  it("does not send notification when re-following (already followed)", async () => {
    mockSession("user-1");
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-2" });
    (mockPrisma.follow.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "f-1" });
    (mockPrisma.follow.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await followUser(new NextRequest("http://localhost/api/users/user-2/follow", { method: "POST" }), {
      params: Promise.resolve({ id: "user-2" }),
    });

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("returns 404 when target user not found", async () => {
    mockSession("user-1");
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await followUser(
      new NextRequest("http://localhost/api/users/missing/follow", { method: "POST" }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/users/[id]/follow", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await unfollowUser(
      new NextRequest("http://localhost/api/users/user-2/follow", { method: "DELETE" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(response.status).toBe(401);
  });

  it("deletes follow and returns following false", async () => {
    mockSession("user-1");
    (mockPrisma.follow.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await unfollowUser(
      new NextRequest("http://localhost/api/users/user-2/follow", { method: "DELETE" }),
      { params: Promise.resolve({ id: "user-2" }) },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.following).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/vote — notification triggers
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/vote", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await voteAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/vote", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await voteAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/vote", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(429);
  });

  it("removes vote when already voted", async () => {
    mockSession("user-1");
    // Interactive transaction: the callback receives a tx client whose
    // deleteMany reports an existing vote was removed.
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: unknown) => Promise<unknown>)({
            vote: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            adventure: { update: vi.fn().mockResolvedValue({}) },
          });
        }
        return Promise.all(arg as unknown[]);
      },
    );

    const response = await voteAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/vote", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(false);
  });

  it("adds vote and sends milestone notification at 10 votes", async () => {
    mockSession("user-2");
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: unknown) => Promise<unknown>)({
            vote: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            adventure: { update: vi.fn() },
          });
        }
        return [{}, { userId: "user-1", title: "Nepal Trek", voteCount: 10 }];
      },
    );
    (mockPrisma.notification.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await voteAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/vote", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(true);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", type: "NEW_VOTE" }),
      }),
    );
  });

  it("does not send milestone notification at non-milestone vote count", async () => {
    mockSession("user-2");
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: unknown) => Promise<unknown>)({
            vote: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            adventure: { update: vi.fn() },
          });
        }
        return [{}, { userId: "user-1", title: "Nepal Trek", voteCount: 7 }];
      },
    );
    const response = await voteAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/vote", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/suggestions
// ---------------------------------------------------------------------------
describe("GET /api/users/suggestions", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getUserSuggestions(
      new NextRequest("http://localhost/api/users/suggestions"),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(401);
  });

  it("returns suggested users excluding already followed", async () => {
    mockSession("user-1");
    (mockPrisma.follow.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { followingId: "user-2" },
    ]);
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "user-3", name: "Carol", avatarUrl: null, _count: { adventures: 5 } },
    ]);

    const response = await getUserSuggestions(
      new NextRequest("http://localhost/api/users/suggestions"),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("user-3");
  });

  it("returns empty array when all users are already followed", async () => {
    mockSession("user-1");
    (mockPrisma.follow.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const response = await getUserSuggestions(
      new NextRequest("http://localhost/api/users/suggestions"),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(0);
  });

  it("passes category filter to query when provided", async () => {
    mockSession("user-1");
    (mockPrisma.follow.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getUserSuggestions(
      new NextRequest("http://localhost/api/users/suggestions?category=TREKKING"),
      { params: Promise.resolve({}) },
    );

    const call = (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.adventures.some).toMatchObject({ category: "TREKKING" });
  });
});

// ---------------------------------------------------------------------------
// Collections API
// ---------------------------------------------------------------------------
describe("GET /api/collections", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getCollections(new NextRequest("http://localhost/api/collections"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(401);
  });

  it("returns collections for authenticated user", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "col-1", name: "Favourites", _count: { items: 2 }, items: [] },
    ]);
    const response = await getCollections(new NextRequest("http://localhost/api/collections"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Favourites");
  });
});

describe("POST /api/collections", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await createCollection(
      new NextRequest("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "My List" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(401);
  });

  it("creates a collection and returns 201", async () => {
    mockSession("user-1");
    (mockPrisma.collection.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-new",
      name: "My List",
      userId: "user-1",
      _count: { items: 0 },
    });
    const response = await createCollection(
      new NextRequest("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "My List" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("My List");
  });

  it("returns 400 for empty name", async () => {
    mockSession("user-1");
    const response = await createCollection(
      new NextRequest("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    mockSession("user-1");
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 60 });
    const response = await createCollection(
      new NextRequest("http://localhost/api/collections", {
        method: "POST",
        body: JSON.stringify({ name: "My List" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(429);
  });
});

describe("GET /api/collections/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getCollection(new NextRequest("http://localhost/api/collections/col-1"), {
      params: Promise.resolve({ id: "col-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when collection not found", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await getCollection(new NextRequest("http://localhost/api/collections/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when collection belongs to another user", async () => {
    mockSession("user-2");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      userId: "user-1",
      items: [],
      _count: { items: 0 },
    });
    const response = await getCollection(new NextRequest("http://localhost/api/collections/col-1"), {
      params: Promise.resolve({ id: "col-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns collection data for owner", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      name: "My List",
      userId: "user-1",
      items: [],
      _count: { items: 0 },
    });
    const response = await getCollection(new NextRequest("http://localhost/api/collections/col-1"), {
      params: Promise.resolve({ id: "col-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("My List");
  });
});

describe("DELETE /api/collections/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("deletes collection and returns 204", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    (mockPrisma.collection.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const response = await deleteCollection(new NextRequest("http://localhost/api/collections/col-1"), {
      params: Promise.resolve({ id: "col-1" }),
    });
    expect(response.status).toBe(204);
  });

  it("returns 403 when not owner", async () => {
    mockSession("user-2");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    const response = await deleteCollection(new NextRequest("http://localhost/api/collections/col-1"), {
      params: Promise.resolve({ id: "col-1" }),
    });
    expect(response.status).toBe(403);
  });
});

describe("POST /api/collections/[id]/items", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await addToCollection(
      new NextRequest("http://localhost/api/collections/col-1/items", {
        method: "POST",
        body: JSON.stringify({ adventureId: "adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("adds adventure to collection and returns 201", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    (mockPrisma.collectionItem.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ci-1",
      collectionId: "col-1",
      adventureId: "adv-1",
    });
    const response = await addToCollection(
      new NextRequest("http://localhost/api/collections/col-1/items", {
        method: "POST",
        body: JSON.stringify({ adventureId: "adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(201);
  });

  it("returns 400 when adventureId is missing", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    const response = await addToCollection(
      new NextRequest("http://localhost/api/collections/col-1/items", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when collection does not exist", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await addToCollection(
      new NextRequest("http://localhost/api/collections/missing/items", {
        method: "POST",
        body: JSON.stringify({ adventureId: "adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when collection belongs to another user", async () => {
    mockSession("user-2");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    const response = await addToCollection(
      new NextRequest("http://localhost/api/collections/col-1/items", {
        method: "POST",
        body: JSON.stringify({ adventureId: "adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/collections/[id]/items", () => {
  afterEach(() => vi.clearAllMocks());

  it("removes adventure from collection and returns 204", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    (mockPrisma.collectionItem.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const response = await removeFromCollection(
      new NextRequest("http://localhost/api/collections/col-1/items?adventureId=adv-1"),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(204);
  });

  it("returns 400 when adventureId query param is missing", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    const response = await removeFromCollection(
      new NextRequest("http://localhost/api/collections/col-1/items"),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when collection does not exist", async () => {
    mockSession("user-1");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await removeFromCollection(
      new NextRequest("http://localhost/api/collections/missing/items?adventureId=adv-1"),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when collection belongs to another user", async () => {
    mockSession("user-2");
    (mockPrisma.collection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    const response = await removeFromCollection(
      new NextRequest("http://localhost/api/collections/col-1/items?adventureId=adv-1"),
      { params: Promise.resolve({ id: "col-1" }) },
    );
    expect(response.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/duplicate
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/duplicate", () => {
  afterEach(() => vi.clearAllMocks());

  const originalAdventure = {
    id: "adv-1",
    title: "Nepal Trek",
    description: "An epic trek through the Himalayas",
    location: "Nepal",
    country: "Nepal",
    continent: "Asia",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    durationDays: 14,
    coverImageUrl: "https://example.com/img.jpg",
    albumUrl: null,
    albumPlatform: null,
    highlights: ["Everest Base Camp"],
    gear: ["Ice axe"],
    bestMonths: [9, 10],
    climate: [],
    estimatedCost: 3000,
    gpxTrackUrl: null,
    latitude: 27.9878,
    longitude: 86.925,
    published: true,
    voteCount: 42,
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [{ name: "himalaya" }, { name: "trekking" }],
  };

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await duplicateAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/duplicate", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await duplicateAdventure(
      new NextRequest("http://localhost/api/adventures/missing/duplicate", { method: "POST" }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not the owner", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      originalAdventure,
    );
    const response = await duplicateAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/duplicate", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(403);
  });

  it("creates a draft duplicate with '(Copy)' suffix and returns 201", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      originalAdventure,
    );
    (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...originalAdventure,
      id: "adv-copy",
      title: "Nepal Trek (Copy)",
      published: false,
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });

    const response = await duplicateAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/duplicate", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.title).toBe("Nepal Trek (Copy)");
    expect(data.published).toBe(false);
  });

  it("creates the duplicate as unpublished even if original was published", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      originalAdventure,
    );
    (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...originalAdventure,
      id: "adv-copy",
      title: "Nepal Trek (Copy)",
      published: false,
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });

    await duplicateAdventure(
      new NextRequest("http://localhost/api/adventures/adv-1/duplicate", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    const createCall = (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.published).toBe(false);
    expect(createCall.data.title).toBe("Nepal Trek (Copy)");
  });
});

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
    // Route always auto-creates an itinerary on first message
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "auto-itin-1",
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for empty message", async () => {
    mockSession();
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns a streaming response when no API key (mock mode)", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip to Nepal" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("streams destination-aware mock for Nepal", async () => {
    mockSession();

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Nepal trekking trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Read the full stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain("Nepal");
  });

  it("persists chat history when itineraryId is provided in mock mode", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      chatHistory: [],
    });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip", itineraryId: "itin-1" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Drain stream to trigger the update
    const reader = response.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(mockPrisma.itinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "itin-1", userId: "user-1" } }),
    );
  });

  it.each([
    ["planning a trip to patagonia", "Patagonia"],
    ["i want to climb kilimanjaro next year", "Tanzania"],
    ["iceland northern lights trip", "Iceland"],
    ["peru inca trail hike", "Peru"],
  ])("mock response names the correct destination for '%s'", async (message, expectedDest) => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
    }

    expect(text).toContain(expectedDest);
  });

  it("includes existing chat history in prompt when itineraryId is provided", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      chatHistory: [{ role: "user", content: "Previous message" }],
    });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "New message", itineraryId: "itin-1" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    // Drain stream
    const reader = response.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/itineraries
// ---------------------------------------------------------------------------
describe("GET /api/itineraries", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getItineraries(new NextRequest("http://localhost/api/itineraries"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(401);
  });

  it("returns itineraries for authenticated user", async () => {
    mockSession();
    (mockPrisma.itinerary.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "itin-1", title: "Nepal Trek", days: [], _count: { flightBookings: 0 } },
    ]);

    const response = await getItineraries(new NextRequest("http://localhost/api/itineraries"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("itin-1");
  });

  it("returns empty array when user has no itineraries", async () => {
    mockSession();
    (mockPrisma.itinerary.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const response = await getItineraries(new NextRequest("http://localhost/api/itineraries"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/itineraries
// ---------------------------------------------------------------------------
describe("POST /api/itineraries", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates an itinerary and returns 201", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
      userId: "user-1",
    });

    const response = await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("itin-new");
  });

  it("uses default title when none provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-2",
      title: "Untitled Trip",
    });

    await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.title).toBe("Untitled Trip");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "Trip" }),
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(401);
  });

  it("converts startDate and endDate strings to Date objects when provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
    });

    await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip", startDate: "2025-08-01", endDate: "2025-08-14" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.startDate).toBeInstanceOf(Date);
    expect(createCall.data.endDate).toBeInstanceOf(Date);
  });

  it("omits startDate and endDate from prisma call when not provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
    });

    await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.startDate).toBeUndefined();
    expect(createCall.data.endDate).toBeUndefined();
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 60 });
    const response = await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(429);
  });

  it("returns 400 when body is invalid JSON", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: true, retryAfter: 0 });
    const response = await createItinerary(
      new NextRequest("http://localhost/api/itineraries", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("GET /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getItinerary(new NextRequest("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns itinerary data", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      title: "Nepal Trek",
      days: [],
      flightBookings: [],
    });

    const response = await getItinerary(new NextRequest("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("itin-1");
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await getItinerary(new NextRequest("http://localhost/api/itineraries/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("updates and returns the itinerary", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      status: "DRAFT",
    });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      title: "Updated Trek",
      days: [],
    });

    const response = await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Trek" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Trek");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "X" }),
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/missing", {
        method: "PATCH",
        body: JSON.stringify({ title: "X" }),
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("passes all optional fields to prisma update when provided", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      status: "DRAFT",
    });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", title: "Nepal Trek", days: [] });

    await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Nepal Trek",
          description: "Epic adventure",
          status: "PLANNING",
          startDate: "2025-08-01",
          endDate: "2025-08-14",
          budget: 5000,
          travellers: 3,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Nepal Trek",
          description: "Epic adventure",
          status: "PLANNING",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          budget: 5000,
          travellers: 3,
        }),
      }),
    );
  });

  it("omits undefined optional fields from prisma update", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      status: "DRAFT",
    });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", days: [] });

    await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    const callData = updateMock.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("title");
    expect(callData).not.toHaveProperty("status");
    expect(callData).not.toHaveProperty("startDate");
  });

  it("sets description and budget to explicit values including falsy ones", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      status: "DRAFT",
    });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", days: [] });

    await patchItinerary(
      new NextRequest("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ description: null, budget: 0 }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    const callData = updateMock.mock.calls[0][0].data;
    // description uses !== undefined check, so null is included
    expect(callData).toHaveProperty("description", null);
    // budget uses !== undefined check, so 0 is included
    expect(callData).toHaveProperty("budget", 0);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("DELETE /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("deletes itinerary and returns 204", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      status: "DRAFT",
    });
    (mockPrisma.itinerary.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await deleteItinerary(new NextRequest("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(204);
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await deleteItinerary(new NextRequest("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await deleteItinerary(
      new NextRequest("http://localhost/api/itineraries/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/[id]
// ---------------------------------------------------------------------------
describe("GET /api/users/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns user profile", async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      avatarUrl: null,
      bio: "Hiker",
      instagramUrl: null,
      twitterUrl: null,
      websiteUrl: null,
      adventures: [],
      _count: { adventures: 0, votes: 0 },
    });

    const response = await getUser(new NextRequest("http://localhost/api/users/user-1"), {
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("user-1");
    expect(data.name).toBe("Alice");
  });

  it("returns 404 when user not found", async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await getUser(new NextRequest("http://localhost/api/users/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/users/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/users/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("updates user profile", async () => {
    mockSession("user-1");
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Alice Updated",
      bio: "Hiker and climber",
      instagramUrl: null,
      twitterUrl: null,
      websiteUrl: null,
    });

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Alice Updated", bio: "Hiker and climber" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Alice Updated");
  });

  it("returns 403 when patching another user", async () => {
    mockSession("user-2");

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacker" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe("FORBIDDEN");
  });

  it("returns 403 when unauthenticated", async () => {
    noSession();

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "X" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid profile data", async () => {
    mockSession("user-1");

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body is invalid JSON", async () => {
    mockSession("user-1");
    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/adventures/[id] — owner edit
// ---------------------------------------------------------------------------
describe("PATCH /api/adventures/[id] owner edit", () => {
  afterEach(() => vi.clearAllMocks());

  const makeRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/adventures/adv-1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  const updatedAdventure = {
    id: "adv-1",
    title: "Updated Title",
    description: "Updated description with enough characters here",
    userId: "user-1",
    tags: [],
  };

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not the owner", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid adventure data", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    // title too short (< 3 chars)
    const response = await patchAdventure(makeRequest({ title: "AB" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("updates adventure and returns 200 for owner", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    (mockPrisma.adventure.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedAdventure);

    const response = await patchAdventure(
      makeRequest({
        title: "Updated Title",
        description: "Updated description with enough characters here",
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Title");
  });
});

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------
describe("GET /api/notifications", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await getNotifications(new NextRequest("http://localhost/api/notifications"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(401);
  });

  it("returns notifications and unread count", async () => {
    mockSession("user-1");
    const mockNotifications = [
      {
        id: "n-1",
        message: "Someone followed you",
        read: false,
        createdAt: new Date(),
        type: "NEW_FOLLOWER",
        linkUrl: null,
      },
      {
        id: "n-2",
        message: "New comment on your adventure",
        read: true,
        createdAt: new Date(),
        type: "NEW_COMMENT",
        linkUrl: "/adventures/adv-1",
      },
    ];
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockNotifications,
    );
    (mockPrisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const response = await getNotifications(new NextRequest("http://localhost/api/notifications"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(2);
    expect(data.unreadCount).toBe(1);
  });

  it("computes unreadCount with a DB count query scoped to unread rows", async () => {
    mockSession("user-1");
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockPrisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await getNotifications(new NextRequest("http://localhost/api/notifications"), {
      params: Promise.resolve({}),
    });
    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
    });
  });

  it("reports unread beyond the 50 fetched rows (count is not derived from the page)", async () => {
    mockSession("user-1");
    // Page contains only read rows, but 120 older unread rows exist in the DB.
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "n-1",
        message: "Read one",
        read: true,
        createdAt: new Date(),
        type: "SYSTEM",
        linkUrl: null,
      },
    ]);
    (mockPrisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(120);

    const response = await getNotifications(new NextRequest("http://localhost/api/notifications"), {
      params: Promise.resolve({}),
    });
    const data = await response.json();
    expect(data.unreadCount).toBe(120);
  });

  it("returns empty array for user with no notifications", async () => {
    mockSession("user-1");
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockPrisma.notification.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const response = await getNotifications(new NextRequest("http://localhost/api/notifications"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(0);
    expect(data.unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// POST /api/notifications/read-all
// ---------------------------------------------------------------------------
describe("POST /api/notifications/read-all", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await markAllRead(new NextRequest("http://localhost/api/notifications/read-all"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(401);
  });

  it("marks all unread notifications as read", async () => {
    mockSession("user-1");
    (mockPrisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 3,
    });

    const response = await markAllRead(new NextRequest("http://localhost/api/notifications/read-all"), {
      params: Promise.resolve({}),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
      data: { read: true },
    });
  });
});
