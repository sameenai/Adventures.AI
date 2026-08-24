import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any route imports
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

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    searchEvent: { create: vi.fn().mockResolvedValue({}) },
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
      groupBy: vi.fn(),
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
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

import { DELETE as deleteAdventure, GET as getAdventure } from "@/app/api/adventures/[id]/route";
import { POST as voteOnAdventure } from "@/app/api/adventures/[id]/vote/route";
// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { POST as createAdventure, GET as getAdventures } from "@/app/api/adventures/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockPrisma = prisma as ReturnType<typeof vi.fn> & typeof prisma;
const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(
  url = "http://localhost/api/adventures",
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
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
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
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
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      sampleAdventure,
    ]);

    const response = await getAdventures(makeRequest());
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe("adv-1");
    expect(data.nextCursor).toBeUndefined();
  });

  it("returns pagination cursor when there are more items", async () => {
    const adventures = Array.from({ length: 21 }, (_, i) => ({
      ...sampleAdventure,
      id: `adv-${i}`,
    }));
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(adventures);

    const response = await getAdventures(makeRequest("http://localhost/api/adventures?limit=20"));
    const data = await response.json();

    expect(data.items).toHaveLength(20);
    // cursor is now a compound keyset cursor (base64url-encoded JSON)
    const decoded = JSON.parse(Buffer.from(data.nextCursor, "base64url").toString("utf8"));
    expect(decoded.id).toBe("adv-19");
    expect(typeof decoded.v).toBe("number");
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

    const findManyCall = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(findManyCall.where.category).toBe("TREKKING");
  });

  it("orders by createdAt desc when sortBy=newest", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?sortBy=newest"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.orderBy).toEqual([{ createdAt: "desc" }, { id: "asc" }]);
  });

  it("orders by durationDays asc when sortBy=duration", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?sortBy=duration"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.orderBy).toEqual([{ durationDays: "asc" }, { id: "asc" }]);
  });

  it.each([
    ["weekend", { gte: 1, lte: 3 }],
    ["week", { gte: 4, lte: 7 }],
    ["fortnight", { gte: 8, lte: 14 }],
    ["expedition", { gte: 15, lte: 30 }],
    ["peregrination", { gte: 31, lte: 90 }],
    ["lifestyle", { gte: 91 }],
  ] as const)("applies correct durationDays range for duration=%s", async (duration, expected) => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest(`http://localhost/api/adventures?duration=${duration}`));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const durationCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "durationDays" in (c.OR[0] as object),
    );
    expect(durationCondition).toBeDefined();
    expect(durationCondition.OR).toEqual([{ durationDays: expected }]);
  });

  it("applies multi-select duration as OR inside AND", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?duration=weekend,week"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const durationCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "durationDays" in (c.OR[0] as object),
    );
    expect(durationCondition).toBeDefined();
    expect(durationCondition.OR).toHaveLength(2);
    expect(durationCondition.OR[0]).toEqual({ durationDays: { gte: 1, lte: 3 } });
    expect(durationCondition.OR[1]).toEqual({ durationDays: { gte: 4, lte: 7 } });
  });

  it("applies OR search clause across title, description, and location inside AND", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?search=nepal"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const searchCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "title" in (c.OR[0] as object),
    );
    expect(searchCondition).toBeDefined();
    expect(searchCondition.OR).toHaveLength(3);
    expect(searchCondition.OR[0]).toMatchObject({
      title: { contains: "nepal", mode: "insensitive" },
    });
    expect(searchCondition.OR[1]).toMatchObject({
      description: { contains: "nepal", mode: "insensitive" },
    });
    expect(searchCondition.OR[2]).toMatchObject({
      location: { contains: "nepal", mode: "insensitive" },
    });
  });

  it("applies month filter as OR over bestMonths array inside AND", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?month=9,10"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const monthCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "bestMonths" in (c.OR[0] as object),
    );
    expect(monthCondition).toBeDefined();
    expect(monthCondition.OR).toEqual([{ bestMonths: { has: 9 } }, { bestMonths: { has: 10 } }]);
  });

  it("wraps month + search into AND to avoid OR key collision", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?month=7&search=nepal"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
    expect(call.where.AND).toHaveLength(2);
    const monthCond = call.where.AND.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "bestMonths" in (c.OR[0] as object),
    );
    const searchCond = call.where.AND.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "title" in (c.OR[0] as object),
    );
    expect(monthCond).toEqual({ OR: [{ bestMonths: { has: 7 } }] });
    expect(searchCond?.OR).toHaveLength(3);
    expect(searchCond?.OR[0]).toMatchObject({ title: { contains: "nepal" } });
  });

  it("applies climate filter as OR over climate array inside AND", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?climate=hot"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const climateCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "climate" in (c.OR[0] as object),
    );
    expect(climateCondition).toBeDefined();
    expect(climateCondition.OR).toEqual([{ climate: { has: "hot" } }]);
  });

  it("applies multi-select climate as OR inside AND", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?climate=hot,cold"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const climateCondition = call.where.AND?.find(
      (c: { OR?: unknown[] }) => c.OR?.[0] && "climate" in (c.OR[0] as object),
    );
    expect(climateCondition).toBeDefined();
    expect(climateCondition.OR).toEqual([
      { climate: { has: "hot" } },
      { climate: { has: "cold" } },
    ]);
  });

  it("applies keyset where condition for votes sort when ?cursor= is provided", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const cursorToken = Buffer.from(JSON.stringify({ v: 3, id: "adv-5" })).toString("base64url");
    await getAdventures(makeRequest(`http://localhost/api/adventures?cursor=${cursorToken}`));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.cursor).toBeUndefined();
    expect(call.skip).toBeUndefined();
    expect(call.where.OR).toEqual([
      { voteCount: { lt: 3 } },
      { voteCount: 3, id: { gt: "adv-5" } },
    ]);
  });

  it("applies keyset where condition for newest sort when ?cursor= is provided", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const isoDate = "2024-06-01T12:00:00.000Z";
    const cursorToken = Buffer.from(JSON.stringify({ c: isoDate, id: "adv-10" })).toString(
      "base64url",
    );
    await getAdventures(
      makeRequest(`http://localhost/api/adventures?sortBy=newest&cursor=${cursorToken}`),
    );

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.cursor).toBeUndefined();
    expect(call.skip).toBeUndefined();
    expect(call.where.OR).toEqual([
      { createdAt: { lt: new Date(isoDate) } },
      { createdAt: new Date(isoDate), id: { gt: "adv-10" } },
    ]);
  });

  it("applies keyset where condition for duration sort when ?cursor= is provided", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const cursorToken = Buffer.from(JSON.stringify({ d: 7, id: "adv-20" })).toString("base64url");
    await getAdventures(
      makeRequest(`http://localhost/api/adventures?sortBy=duration&cursor=${cursorToken}`),
    );

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.cursor).toBeUndefined();
    expect(call.skip).toBeUndefined();
    expect(call.where.OR).toEqual([
      { durationDays: { gt: 7 } },
      { durationDays: 7, id: { gt: "adv-20" } },
    ]);
  });

  it("ignores malformed cursor and returns results without cursor where clause", async () => {
    (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getAdventures(makeRequest("http://localhost/api/adventures?cursor=not-valid-base64!!!"));

    const call = (mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/adventures?sortBy=trending
// ---------------------------------------------------------------------------
describe("GET /api/adventures?sortBy=trending", () => {
  afterEach(() => vi.clearAllMocks());

  const mockGroupBy = () => mockPrisma.vote.groupBy as ReturnType<typeof vi.fn>;
  const mockFindMany = () => mockPrisma.adventure.findMany as ReturnType<typeof vi.fn>;

  it("returns adventures ordered by the 7-day vote ranking", async () => {
    mockGroupBy().mockResolvedValue([
      { adventureId: "adv-b", _count: { adventureId: 9 } },
      { adventureId: "adv-a", _count: { adventureId: 5 } },
      { adventureId: "adv-c", _count: { adventureId: 2 } },
    ]);
    // findMany deliberately returns the rows out of ranking order
    mockFindMany().mockResolvedValue([
      { ...sampleAdventure, id: "adv-a" },
      { ...sampleAdventure, id: "adv-c" },
      { ...sampleAdventure, id: "adv-b" },
    ]);

    const response = await getAdventures(
      makeRequest("http://localhost/api/adventures?sortBy=trending"),
    );
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items.map((i: { id: string }) => i.id)).toEqual(["adv-b", "adv-a", "adv-c"]);
    expect(data.nextCursor).toBeUndefined();
  });

  it("restricts the vote groupBy to published adventures matching the active filters", async () => {
    mockGroupBy().mockResolvedValue([]);

    await getAdventures(
      makeRequest("http://localhost/api/adventures?sortBy=trending&category=TREKKING"),
    );

    const groupByCall = mockGroupBy().mock.calls[0][0];
    expect(groupByCall.by).toEqual(["adventureId"]);
    expect(groupByCall.where.createdAt.gte).toBeInstanceOf(Date);
    expect(groupByCall.where.adventure).toEqual({
      is: expect.objectContaining({ published: true, category: "TREKKING" }),
    });
    expect(groupByCall.orderBy).toEqual({ _count: { adventureId: "desc" } });
    // findMany is skipped entirely when nothing ranked
    expect(mockFindMany()).not.toHaveBeenCalled();
  });

  it("paginates by rank offset: nextCursor fetches the next slice", async () => {
    const ranked = Array.from({ length: 25 }, (_, i) => ({
      adventureId: `adv-${i}`,
      _count: { adventureId: 25 - i },
    }));
    mockGroupBy().mockResolvedValue(ranked);
    mockFindMany().mockImplementation((args: { where: { id: { in: string[] } } }) =>
      Promise.resolve(args.where.id.in.map((id) => ({ ...sampleAdventure, id }))),
    );

    const res1 = await getAdventures(
      makeRequest("http://localhost/api/adventures?sortBy=trending&limit=20"),
    );
    const page1 = await res1.json();
    expect(page1.items).toHaveLength(20);
    expect(page1.items[0].id).toBe("adv-0");
    expect(page1.items[19].id).toBe("adv-19");
    // Cursor uses the shared base64url encoding of a rank offset
    expect(Buffer.from(page1.nextCursor, "base64url").toString("utf8")).toBe("trending:20");

    const res2 = await getAdventures(
      makeRequest(
        `http://localhost/api/adventures?sortBy=trending&limit=20&cursor=${page1.nextCursor}`,
      ),
    );
    const page2 = await res2.json();
    expect(page2.items.map((i: { id: string }) => i.id)).toEqual([
      "adv-20",
      "adv-21",
      "adv-22",
      "adv-23",
      "adv-24",
    ]);
    expect(page2.nextCursor).toBeUndefined();

    // The offset moved: page 2 only fetched the second slice of ranked ids
    const secondFetch = mockFindMany().mock.calls[1][0];
    expect(secondFetch.where.id.in).toEqual(["adv-20", "adv-21", "adv-22", "adv-23", "adv-24"]);
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
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });

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
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });
    (mockPrisma.adventure.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await deleteAdventure(new Request("http://localhost/api/adventures/adv-1"), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(204);
  });

  it("returns 401 when not authenticated", async () => {
    noSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });

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
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "user-1",
    });

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
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: unknown) => Promise<unknown>)({
            vote: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            adventure: { update: vi.fn().mockResolvedValue({}) },
          });
        }
        return [{}, { userId: "owner-1", title: "Nepal Trek", voteCount: 5 }];
      },
    );

    const response = await voteOnAdventure(
      new Request("http://localhost/api/adventures/adv-1/vote"),
      {
        params: Promise.resolve({ id: "adv-1" }),
      },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(true);
  });

  it("removes an existing vote and returns { voted: false }", async () => {
    mockSession("user-1");
    (mockPrisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: unknown) => Promise<unknown>)({
            vote: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            adventure: { update: vi.fn().mockResolvedValue({}) },
          });
        }
        return [];
      },
    );

    const response = await voteOnAdventure(
      new Request("http://localhost/api/adventures/adv-1/vote"),
      {
        params: Promise.resolve({ id: "adv-1" }),
      },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.voted).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    noSession();

    const response = await voteOnAdventure(
      new Request("http://localhost/api/adventures/adv-1/vote"),
      {
        params: Promise.resolve({ id: "adv-1" }),
      },
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockSession("user-1");
    mockRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 30 });

    const response = await voteOnAdventure(
      new Request("http://localhost/api/adventures/adv-1/vote"),
      {
        params: Promise.resolve({ id: "adv-1" }),
      },
    );
    expect(response.status).toBe(429);
  });
});
