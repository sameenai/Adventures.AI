import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any route imports
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

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    vote: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { GET as getAdventures, POST as createAdventure } from "@/app/api/adventures/route";
import {
  GET as getAdventure,
  DELETE as deleteAdventure,
} from "@/app/api/adventures/[id]/route";
import { POST as voteOnAdventure } from "@/app/api/adventures/[id]/vote/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockPrisma = prisma as ReturnType<typeof vi.fn> & typeof prisma;
const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(url = "http://localhost/api/adventures", init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId, email: "test@example.com" } });
}

function noSession() {
  mockGetSession.mockResolvedValue(null);
}

const sampleAdventure = {
  id: "adv-1",
  title: "Nepal Trek",
  description: "A great trek",
  location: "Nepal",
  country: "Nepal",
  continent: "Asia",
  category: "TREKKING",
  difficulty: "MODERATE",
  durationDays: 10,
  voteCount: 5,
  userId: "user-1",
  published: true,
  coverImageUrl: "https://example.com/img.jpg",
  user: { id: "user-1", name: "Alice", avatarUrl: null },
  tags: [],
  _count: { comments: 0 },
};

// ---------------------------------------------------------------------------
// GET /api/adventures
// ---------------------------------------------------------------------------
describe("GET /api/adventures", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 200 with adventure list", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([sampleAdventure]);

    const response = await getAdventures(makeRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe("adv-1");
    expect(data.nextCursor).toBeUndefined();
  });

  it("returns pagination cursor when there are more items", async () => {
    const adventures = Array.from({ length: 21 }, (_, i) => ({ ...sampleAdventure, id: `adv-${i}` }));
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(adventures);

    const response = await getAdventures(
      makeRequest("http://localhost/api/adventures?limit=20"),
    );
    const data = await response.json();

    expect(data.items).toHaveLength(20);
    expect(data.nextCursor).toBe("adv-19");
  });

  it("returns 400 for invalid filter params", async () => {
    const response = await getAdventures(
      makeRequest("http://localhost/api/adventures?sortBy=invalid"),
    );
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("applies category filter", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const response = await getAdventures(
      makeRequest("http://localhost/api/adventures?category=TREKKING"),
    );
    expect(response.status).toBe(200);

    const findManyCall = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(findManyCall.where.category).toBe("TREKKING");
  });

  it("orders by createdAt desc when sortBy=newest", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?sortBy=newest"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.orderBy).toEqual({ createdAt: "desc" });
  });

  it("orders by durationDays asc when sortBy=duration", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?sortBy=duration"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.orderBy).toEqual({ durationDays: "asc" });
  });

  it("applies OR search clause across title, description, and location", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?search=nepal"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.OR).toHaveLength(3);
    expect(call.where.OR[0]).toMatchObject({ title: { contains: "nepal", mode: "insensitive" } });
    expect(call.where.OR[1]).toMatchObject({ description: { contains: "nepal", mode: "insensitive" } });
    expect(call.where.OR[2]).toMatchObject({ location: { contains: "nepal", mode: "insensitive" } });
  });

  it("passes cursor and skip to prisma when ?cursor= is provided", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?cursor=adv-5"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.cursor).toEqual({ id: "adv-5" });
    expect(call.skip).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures
// ---------------------------------------------------------------------------
describe("POST /api/adventures", () => {
  const validBody = {
    title: "Patagonia Trek",
    description: "An epic journey through Patagonia with incredible scenery and challenges.",
    location: "Patagonia",
    country: "Chile",
    continent: "South America",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    durationDays: 14,
    coverImageUrl: "https://example.com/patagonia.jpg",
  };

  beforeEach(() => mockSession());
  afterEach(() => vi.clearAllMocks());

  it("creates adventure and returns 201", async () => {
    (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...sampleAdventure,
      ...validBody,
    });

    const response = await createAdventure(
      new NextRequest("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(201);
  });

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await createAdventure(
      new NextRequest("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockResolvedValueOnce(false);

    const response = await createAdventure(
      new NextRequest("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify(validBody),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for invalid body", async () => {
    const response = await createAdventure(
      new NextRequest("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify({ title: "X" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("creates adventure with tags via connectOrCreate", async () => {
    (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...sampleAdventure,
      tags: [
        { id: "tag-1", name: "trekking" },
        { id: "tag-2", name: "alpine" },
      ],
    });

    const response = await createAdventure(
      new NextRequest("http://localhost/api/adventures", {
        method: "POST",
        body: JSON.stringify({ ...validBody, tags: ["trekking", "alpine"] }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    const createCall = (mockPrisma.adventure.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.tags.connectOrCreate).toHaveLength(2);
    expect(createCall.data.tags.connectOrCreate[0]).toMatchObject({
      where: { name: "trekking" },
      create: { name: "trekking" },
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/adventures/[id]
// ---------------------------------------------------------------------------
describe("GET /api/adventures/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 200 with adventure data", async () => {
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...sampleAdventure,
      comments: [],
      votes: [],
    });

    const response = await getAdventure(new Request("http://localhost/api/adventures/adv-1"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("adv-1");
  });

  it("returns 404 when adventure not found", async () => {
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await getAdventure(new Request("http://localhost/api/adventures/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/adventures/[id]
// ---------------------------------------------------------------------------
describe("DELETE /api/adventures/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("deletes adventure and returns 204", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });
    (mockPrisma.adventure.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await deleteAdventure(new Request("http://localhost/api/adventures/adv-1"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(204);
  });

  it("returns 401 when not authenticated", async () => {
    noSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });

    const response = await deleteAdventure(new Request("http://localhost/api/adventures/adv-1"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await deleteAdventure(new Request("http://localhost/api/adventures/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when user doesn't own the adventure", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: "user-1" });

    const response = await deleteAdventure(new Request("http://localhost/api/adventures/adv-1"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/vote
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/vote", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates a vote and returns { voted: true }", async () => {
    mockSession("user-1");
    (mockPrisma.vote.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([
      {},
      { userId: "owner-1", title: "Nepal Trek", voteCount: 5 },
    ]);

    const response = await voteOnAdventure(new Request("http://localhost/api/adventures/adv-1/vote"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(true);
  });

  it("removes an existing vote and returns { voted: false }", async () => {
    mockSession("user-1");
    (mockPrisma.vote.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "vote-1" });
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const response = await voteOnAdventure(new Request("http://localhost/api/adventures/adv-1/vote"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    noSession();

    const response = await voteOnAdventure(new Request("http://localhost/api/adventures/adv-1/vote"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockSession("user-1");
    mockRateLimit.mockResolvedValueOnce(false);

    const response = await voteOnAdventure(new Request("http://localhost/api/adventures/adv-1/vote"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(429);
  });
});
