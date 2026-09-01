import { describe, expect, it, vi } from "vitest";

// The query module imports the prisma singleton for its fetch helpers; the
// builders under test here are pure, so stub prisma out entirely.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import {
  buildAdventureCursorWhere,
  buildAdventureNextCursor,
  buildAdventureOrderBy,
  buildAdventureWhere,
  decodeTrendingCursor,
  encodeTrendingCursor,
} from "@/lib/adventures/query";
import type { AdventureFilterInput } from "@/lib/validators/adventure";

function makeFilters(overrides: Partial<AdventureFilterInput> = {}): AdventureFilterInput {
  return { limit: 20, sortBy: "votes", ...overrides };
}

describe("buildAdventureWhere", () => {
  it("always restricts to published adventures", () => {
    expect(buildAdventureWhere(makeFilters())).toEqual({ published: true });
  });

  it("keeps published: true when other filters are set", () => {
    const where = buildAdventureWhere(makeFilters({ category: ["TREKKING"], tag: "alpine" }));
    expect(where.published).toBe(true);
  });

  it("applies a single category as a plain equality", () => {
    const where = buildAdventureWhere(makeFilters({ category: ["TREKKING"] }));
    expect(where.category).toBe("TREKKING");
  });

  it("applies multiple categories as an in-list", () => {
    const where = buildAdventureWhere(makeFilters({ category: ["TREKKING", "CYCLING"] }));
    expect(where.category).toEqual({ in: ["TREKKING", "CYCLING"] });
  });

  it("applies a single continent as a plain equality", () => {
    const where = buildAdventureWhere(makeFilters({ continent: ["Asia"] }));
    expect(where.continent).toBe("Asia");
  });

  it("applies multiple continents as an in-list", () => {
    const where = buildAdventureWhere(makeFilters({ continent: ["Asia", "Europe"] }));
    expect(where.continent).toEqual({ in: ["Asia", "Europe"] });
  });

  it("applies a single difficulty as a plain equality", () => {
    const where = buildAdventureWhere(makeFilters({ difficulty: ["EASY"] }));
    expect(where.difficulty).toBe("EASY");
  });

  it("applies multiple difficulties as an in-list", () => {
    const where = buildAdventureWhere(makeFilters({ difficulty: ["EASY", "EXTREME"] }));
    expect(where.difficulty).toEqual({ in: ["EASY", "EXTREME"] });
  });

  it.each([
    ["weekend", { gte: 1, lte: 3 }],
    ["week", { gte: 4, lte: 7 }],
    ["fortnight", { gte: 8, lte: 14 }],
    ["expedition", { gte: 15, lte: 30 }],
    ["peregrination", { gte: 31, lte: 90 }],
    ["lifestyle", { gte: 91 }],
  ] as const)("maps duration bucket %s to its durationDays range", (bucket, range) => {
    const where = buildAdventureWhere(makeFilters({ duration: [bucket] }));
    expect(where.AND).toEqual([{ OR: [{ durationDays: range }] }]);
  });

  it("applies multiple duration buckets as OR inside AND", () => {
    const where = buildAdventureWhere(makeFilters({ duration: ["weekend", "week"] }));
    expect(where.AND).toEqual([
      { OR: [{ durationDays: { gte: 1, lte: 3 } }, { durationDays: { gte: 4, lte: 7 } }] },
    ]);
  });

  it("applies climate as OR over array-has inside AND", () => {
    const where = buildAdventureWhere(makeFilters({ climate: ["hot", "cold"] }));
    expect(where.AND).toEqual([
      { OR: [{ climate: { has: "hot" } }, { climate: { has: "cold" } }] },
    ]);
  });

  it("applies month as OR over bestMonths-has inside AND", () => {
    const where = buildAdventureWhere(makeFilters({ month: [9, 10] }));
    expect(where.AND).toEqual([{ OR: [{ bestMonths: { has: 9 } }, { bestMonths: { has: 10 } }] }]);
  });

  it("applies tag as a some-relation filter", () => {
    const where = buildAdventureWhere(makeFilters({ tag: "alpine" }));
    expect(where.tags).toEqual({ some: { name: "alpine" } });
  });

  it("applies search as OR over title, description, and location inside AND", () => {
    const where = buildAdventureWhere(makeFilters({ search: "nepal" }));
    expect(where.AND).toEqual([
      {
        OR: [
          { title: { contains: "nepal", mode: "insensitive" } },
          { description: { contains: "nepal", mode: "insensitive" } },
          { location: { contains: "nepal", mode: "insensitive" } },
        ],
      },
    ]);
  });

  it("wraps month + search as separate AND entries with no top-level OR", () => {
    const where = buildAdventureWhere(makeFilters({ month: [7], search: "nepal" }));
    expect(where.OR).toBeUndefined();
    expect(where.AND).toHaveLength(2);
    expect(where.AND).toContainEqual({ OR: [{ bestMonths: { has: 7 } }] });
  });
});

describe("buildAdventureOrderBy", () => {
  it("orders by voteCount desc for votes sort", () => {
    expect(buildAdventureOrderBy("votes")).toEqual([{ voteCount: "desc" }, { id: "asc" }]);
  });

  it("orders by createdAt desc for newest sort", () => {
    expect(buildAdventureOrderBy("newest")).toEqual([{ createdAt: "desc" }, { id: "asc" }]);
  });

  it("orders by durationDays asc for duration sort", () => {
    expect(buildAdventureOrderBy("duration")).toEqual([{ durationDays: "asc" }, { id: "asc" }]);
  });

  it("falls back to voteCount desc for trending sort", () => {
    expect(buildAdventureOrderBy("trending")).toEqual([{ voteCount: "desc" }, { id: "asc" }]);
  });
});

describe("buildAdventureCursorWhere / buildAdventureNextCursor", () => {
  const last = {
    id: "adv-9",
    createdAt: new Date("2024-06-01T12:00:00.000Z"),
    durationDays: 7,
    voteCount: 3,
  };

  it("round-trips a votes cursor into a keyset condition", () => {
    const cursor = buildAdventureNextCursor("votes", last);
    expect(buildAdventureCursorWhere("votes", cursor)).toEqual({
      OR: [{ voteCount: { lt: 3 } }, { voteCount: 3, id: { gt: "adv-9" } }],
    });
  });

  it("round-trips a newest cursor into a keyset condition", () => {
    const cursor = buildAdventureNextCursor("newest", last);
    expect(buildAdventureCursorWhere("newest", cursor)).toEqual({
      OR: [
        { createdAt: { lt: last.createdAt } },
        { createdAt: last.createdAt, id: { gt: "adv-9" } },
      ],
    });
  });

  it("round-trips a duration cursor into a keyset condition", () => {
    const cursor = buildAdventureNextCursor("duration", last);
    expect(buildAdventureCursorWhere("duration", cursor)).toEqual({
      OR: [{ durationDays: { gt: 7 } }, { durationDays: 7, id: { gt: "adv-9" } }],
    });
  });

  it("returns an empty condition for a malformed cursor", () => {
    expect(buildAdventureCursorWhere("votes", "not-valid-base64!!!")).toEqual({});
  });
});

describe("trending cursor helpers", () => {
  it("round-trips a rank offset", () => {
    expect(decodeTrendingCursor(encodeTrendingCursor(40))).toBe(40);
  });

  it("encodes as base64url of trending:<offset>", () => {
    const raw = Buffer.from(encodeTrendingCursor(20), "base64url").toString("utf8");
    expect(raw).toBe("trending:20");
  });

  it("rejects cursors without the trending prefix", () => {
    const keysetCursor = buildAdventureNextCursor("votes", {
      id: "adv-1",
      createdAt: new Date(),
      durationDays: 1,
      voteCount: 1,
    });
    expect(decodeTrendingCursor(keysetCursor)).toBeNull();
  });

  it("rejects non-integer and negative offsets", () => {
    expect(decodeTrendingCursor(Buffer.from("trending:abc").toString("base64url"))).toBeNull();
    expect(decodeTrendingCursor(Buffer.from("trending:-5").toString("base64url"))).toBeNull();
    expect(decodeTrendingCursor(Buffer.from("trending:1.5").toString("base64url"))).toBeNull();
  });
});
