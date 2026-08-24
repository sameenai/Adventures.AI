import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Data regression suite for the canonical adventure catalog.
 * These tests are the quality gate that keeps prisma/data/adventures.json
 * honest: schema-valid, deduplicated, plausibly priced, and complete.
 */

const DATA_DIR = join(__dirname, "..", "..", "prisma", "data");

const CATEGORIES = [
  "TREKKING",
  "MOUNTAINEERING",
  "CYCLING",
  "KAYAKING",
  "DIVING",
  "SAFARI",
  "SKIING",
  "SURFING",
  "ROAD_TRIP",
  "CULTURAL",
  "MULTI_SPORT",
  "EXPEDITION",
] as const;

const DIFFICULTIES = ["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"] as const;

const CONTINENTS = [
  "Africa",
  "Antarctica",
  "Arctic",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

const AdventureSchema = z.object({
  id: z.string().regex(/^seed-adventure-\d+$/),
  num: z.number().int().positive(),
  title: z.string().min(3).max(120),
  description: z.string().min(120),
  location: z.string().min(2),
  country: z.string().min(2),
  continent: z.enum(CONTINENTS),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  // matches createAdventureSchema's bound; thru-hikes and grand tours run past 90 days
  durationDays: z.number().int().min(1).max(365),
  coverImageUrl: z.string().url(),
  highlights: z.array(z.string().min(3)).min(1).max(8),
  gear: z.array(z.string().min(2)).min(1).max(10),
  bestMonths: z.array(z.number().int().min(1).max(12)),
  climate: z.array(z.enum(["hot", "cold", "mixed"])).min(1),
  estimatedCost: z.number().int().min(5000).max(10000000).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  tags: z.array(z.string().min(2)).min(1).max(8),
  user: z.number().int().min(1).max(3),
  // Curated popularity figure used for default ranking (vote rows are capped at 3 demo users).
  voteCount: z.number().int().min(0).max(500),
});

const RetiredSchema = z.object({
  id: z.string().regex(/^seed-adventure-\d+$/),
  duplicateOf: z.string().regex(/^seed-adventure-\d+$/),
  reason: z.string().min(10),
});

const catalog = JSON.parse(readFileSync(join(DATA_DIR, "adventures.json"), "utf8")) as {
  adventures: Array<z.infer<typeof AdventureSchema>>;
};
const retiredFile = JSON.parse(readFileSync(join(DATA_DIR, "retired-adventures.json"), "utf8")) as {
  retired: Array<z.infer<typeof RetiredSchema>>;
};

const { adventures } = catalog;
const { retired } = retiredFile;

function normaliseTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("canonical adventure catalog", () => {
  it("has a substantial catalog", () => {
    expect(adventures.length).toBeGreaterThan(700);
  });

  it("every adventure validates against the schema", () => {
    const failures: string[] = [];
    for (const a of adventures) {
      const result = AdventureSchema.safeParse(a);
      if (!result.success) {
        failures.push(`${a.id ?? "?"}: ${result.error.issues[0]?.path.join(".")} ${result.error.issues[0]?.message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("ids and nums are unique and consistent", () => {
    const ids = new Set(adventures.map((a) => a.id));
    expect(ids.size).toBe(adventures.length);
    for (const a of adventures) {
      expect(a.id).toBe(`seed-adventure-${a.num}`);
    }
  });

  it("has no duplicate title within the same country", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const a of adventures) {
      const key = `${normaliseTitle(a.title)}|${a.country}`;
      const prior = seen.get(key);
      if (prior) dupes.push(`${a.id} duplicates ${prior} ("${a.title}")`);
      else seen.set(key, a.id);
    }
    expect(dupes).toEqual([]);
  });

  it("costs are stored in pence and plausible for trip length", () => {
    const suspicious: string[] = [];
    for (const a of adventures) {
      if (a.estimatedCost === null) continue;
      // A multi-day trip under £100 or any trip over £100k signals a units error.
      if (a.durationDays >= 5 && a.estimatedCost < 10000) {
        suspicious.push(`${a.id}: £${a.estimatedCost / 100} for ${a.durationDays} days`);
      }
    }
    expect(suspicious).toEqual([]);
  });

  it("no sentinel or placeholder costs remain", () => {
    // £1,000 exactly was the bulk-import fallback; a residual spike would show regression.
    const sentinelCount = adventures.filter((a) => a.estimatedCost === 100000).length;
    expect(sentinelCount).toBeLessThan(adventures.length * 0.05);
  });

  it("every adventure is geocoded", () => {
    const missing = adventures.filter((a) => a.latitude === null || a.longitude === null);
    expect(missing.map((a) => a.id)).toEqual([]);
  });

  it("every adventure has best months", () => {
    const missing = adventures.filter((a) => a.bestMonths.length === 0);
    expect(missing.map((a) => a.id)).toEqual([]);
  });
});

describe("retired duplicates", () => {
  it("every retirement validates and points at a live adventure", () => {
    const liveIds = new Set(adventures.map((a) => a.id));
    for (const r of retired) {
      expect(RetiredSchema.safeParse(r).success).toBe(true);
      expect(liveIds.has(r.duplicateOf), `${r.id} -> ${r.duplicateOf} not live`).toBe(true);
      expect(liveIds.has(r.id), `${r.id} both retired and live`).toBe(false);
    }
  });

  it("retired ids are unique", () => {
    const ids = new Set(retired.map((r) => r.id));
    expect(ids.size).toBe(retired.length);
  });
});
