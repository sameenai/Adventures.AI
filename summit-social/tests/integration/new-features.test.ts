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
    ttl: vi.fn().mockResolvedValue(30),
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
    adventure: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    comment: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    commentReaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    adventureView: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
    vote: {
      groupBy: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    follow: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/ai/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Enhanced description text." } }],
        }),
      },
    },
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import {
  PATCH as editComment,
  DELETE as deleteComment,
} from "@/app/api/adventures/[id]/comments/[commentId]/route";
import { POST as reactToComment } from "@/app/api/adventures/[id]/comments/[commentId]/react/route";
import { POST as recordView, GET as getViewCount } from "@/app/api/adventures/[id]/view/route";
import { GET as searchUsers } from "@/app/api/users/search/route";
import { POST as togglePublish } from "@/app/api/adventures/[id]/publish/route";
import { POST as enhanceDescription } from "@/app/api/adventures/enhance-description/route";
import { GET as getAdventures } from "@/app/api/adventures/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockPrisma = prisma as typeof prisma & Record<string, ReturnType<typeof vi.fn>>;
const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId, email: "u@test.com" } });
}
function noSession() {
  mockGetSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// PATCH /api/adventures/[id]/comments/[commentId]
// ---------------------------------------------------------------------------
describe("PATCH /api/adventures/[id]/comments/[commentId]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const res = await editComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "updated text" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockSession();
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await editComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "updated text" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the comment owner", async () => {
    mockSession("user-2");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    const res = await editComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "updated text" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("updates the comment and returns 200", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (mockPrisma.comment.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c-1",
      body: "updated text",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });
    const res = await editComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "updated text" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.body).toBe("updated text");
  });

  it("returns 400 when body is empty", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    const res = await editComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "   " }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/adventures/[id]/comments/[commentId]
// ---------------------------------------------------------------------------
describe("DELETE /api/adventures/[id]/comments/[commentId]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const res = await deleteComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1"),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockSession();
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await deleteComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1"),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the comment owner", async () => {
    mockSession("user-2");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    const res = await deleteComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1"),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("deletes the comment and returns 204", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (mockPrisma.comment.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const res = await deleteComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1"),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/comments/[commentId]/react
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/comments/[commentId]/react", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const res = await reactToComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1/react", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockSession();
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await reactToComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1/react", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("creates a reaction and returns 201", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c-1" });
    (mockPrisma.commentReaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockPrisma.commentReaction.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.commentReaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const res = await reactToComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1/react", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.reacted).toBe(true);
    expect(data.count).toBe(1);
  });

  it("removes an existing reaction and returns 200", async () => {
    mockSession("user-1");
    (mockPrisma.comment.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c-1" });
    (mockPrisma.commentReaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "r-1" });
    (mockPrisma.commentReaction.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.commentReaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const res = await reactToComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments/c-1/react", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1", commentId: "c-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reacted).toBe(false);
    expect(data.count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/view
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/view", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 429 when rate limited", async () => {
    noSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const res = await recordView(
      new NextRequest("http://localhost/api/adventures/adv-1/view", {
        method: "POST",
        body: JSON.stringify({ fingerprint: "fp-abc" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(429);
  });

  it("returns 400 when fingerprint is missing", async () => {
    noSession();
    const res = await recordView(
      new NextRequest("http://localhost/api/adventures/adv-1/view", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("records a view and returns the count", async () => {
    noSession();
    (mockPrisma.adventureView.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.adventureView.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    const res = await recordView(
      new NextRequest("http://localhost/api/adventures/adv-1/view", {
        method: "POST",
        body: JSON.stringify({ fingerprint: "fp-abc:adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(5);
  });

  it("upserts by fingerprint so duplicate views are deduplicated", async () => {
    noSession();
    (mockPrisma.adventureView.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockPrisma.adventureView.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    await recordView(
      new NextRequest("http://localhost/api/adventures/adv-1/view", {
        method: "POST",
        body: JSON.stringify({ fingerprint: "fp-abc:adv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(mockPrisma.adventureView.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { adventureId_fingerprint: { adventureId: "adv-1", fingerprint: "fp-abc:adv-1" } },
        update: {},
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// GET /api/adventures/[id]/view
// ---------------------------------------------------------------------------
describe("GET /api/adventures/[id]/view", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns the view count", async () => {
    (mockPrisma.adventureView.count as ReturnType<typeof vi.fn>).mockResolvedValue(42);
    const res = await getViewCount(
      new NextRequest("http://localhost/api/adventures/adv-1/view"),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/search
// ---------------------------------------------------------------------------
describe("GET /api/users/search", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns empty array when query is too short", async () => {
    const res = await searchUsers(
      new NextRequest("http://localhost/api/users/search?q=a"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns matching users", async () => {
    (mockPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "u-1", name: "Alice Smith", avatarUrl: null, _count: { adventures: 3 } },
    ]);
    const res = await searchUsers(
      new NextRequest("http://localhost/api/users/search?q=alice"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Alice Smith");
  });

  it("returns empty array when query is missing", async () => {
    const res = await searchUsers(
      new NextRequest("http://localhost/api/users/search"),
    );
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/publish
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/publish", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const res = await togglePublish(
      new NextRequest("http://localhost/api/adventures/adv-1/publish", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await togglePublish(
      new NextRequest("http://localhost/api/adventures/adv-1/publish", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the owner", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
      published: false,
    });
    const res = await togglePublish(
      new NextRequest("http://localhost/api/adventures/adv-1/publish", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("toggles published from false to true", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
      published: false,
    });
    (mockPrisma.adventure.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      published: true,
    });
    const res = await togglePublish(
      new NextRequest("http://localhost/api/adventures/adv-1/publish", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.published).toBe(true);
    expect(mockPrisma.adventure.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { published: true } }),
    );
  });

  it("toggles published from true to false", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
      published: true,
    });
    (mockPrisma.adventure.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      published: false,
    });
    const res = await togglePublish(
      new NextRequest("http://localhost/api/adventures/adv-1/publish", { method: "POST" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.published).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/enhance-description
// ---------------------------------------------------------------------------
describe("POST /api/adventures/enhance-description", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const res = await enhanceDescription(
      new NextRequest("http://localhost/api/adventures/enhance-description", {
        method: "POST",
        body: JSON.stringify({
          title: "Test",
          description: "A test description",
          location: "Nepal",
          category: "TREKKING",
          difficulty: "MODERATE",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid input", async () => {
    mockSession();
    const res = await enhanceDescription(
      new NextRequest("http://localhost/api/adventures/enhance-description", {
        method: "POST",
        body: JSON.stringify({ title: "" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns enhanced description from openai", async () => {
    mockSession();
    const res = await enhanceDescription(
      new NextRequest("http://localhost/api/adventures/enhance-description", {
        method: "POST",
        body: JSON.stringify({
          title: "Nepal Trek",
          description: "A great hike in Nepal.",
          location: "Himalaya",
          category: "TREKKING",
          difficulty: "CHALLENGING",
          highlights: ["Summit views"],
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enhanced).toBe("Enhanced description text.");
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });
    const res = await enhanceDescription(
      new NextRequest("http://localhost/api/adventures/enhance-description", {
        method: "POST",
        body: JSON.stringify({
          title: "Nepal Trek",
          description: "A great hike.",
          location: "Himalaya",
          category: "TREKKING",
          difficulty: "MODERATE",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// GET /api/adventures?sortBy=trending
// ---------------------------------------------------------------------------
describe("GET /api/adventures with sortBy=trending", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns empty items when no recent votes exist", async () => {
    (mockPrisma.vote.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await getAdventures(
      new NextRequest("http://localhost/api/adventures?sortBy=trending"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
  });

  it("returns adventures ordered by recent vote count", async () => {
    (mockPrisma.vote.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { adventureId: "adv-2", _count: { adventureId: 10 } },
      { adventureId: "adv-1", _count: { adventureId: 5 } },
    ]);
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "adv-1",
        title: "Adv 1",
        published: true,
        voteCount: 5,
        user: { id: "u-1", name: "A", avatarUrl: null },
        tags: [],
        _count: { comments: 0 },
      },
      {
        id: "adv-2",
        title: "Adv 2",
        published: true,
        voteCount: 10,
        user: { id: "u-2", name: "B", avatarUrl: null },
        tags: [],
        _count: { comments: 0 },
      },
    ]);
    const res = await getAdventures(
      new NextRequest("http://localhost/api/adventures?sortBy=trending"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    // adv-2 should appear first (more recent votes)
    expect(data.items[0].id).toBe("adv-2");
    expect(data.items[1].id).toBe("adv-1");
  });
});
