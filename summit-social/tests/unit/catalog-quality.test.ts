import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Catalog quality gate — the canonical dataset is a product surface, and
 * these invariants are what "1,000 curated adventures, no duplicates, real
 * photos" actually means. Every record: complete, internally consistent,
 * uniquely titled, uniquely photographed, and properly credited.
 * (Runtime URL liveness is checked at content time, not in CI — network.)
 */

const DATA_DIR = join(__dirname, "..", "..", "prisma", "data");
const { adventures } = JSON.parse(readFileSync(join(DATA_DIR, "adventures.json"), "utf8")) as {
  adventures: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    country: string;
    continent: string;
    category: string;
    difficulty: string;
    durationDays: number;
    coverImageUrl: string;
    imageAttribution?: { artist?: string; license?: string; sourceUrl?: string } | null;
    highlights: string[];
    gear: string[];
    bestMonths: number[];
    climate: string[];
    estimatedCost: number | null;
    latitude: number | null;
    longitude: number | null;
    tags: string[];
    user: number;
    voteCount: number;
  }>;
};

const CATEGORIES = new Set([
  "TREKKING", "CYCLING", "MULTI_SPORT", "KAYAKING", "SAFARI", "MOUNTAINEERING",
  "ROAD_TRIP", "DIVING", "CULTURAL", "EXPEDITION", "SKIING", "SURFING",
]);
const DIFFICULTIES = new Set(["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"]);
const CONTINENTS = new Set([
  "Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Antarctica", "Arctic",
]);

describe("catalog quality — 1,000 adventures, no duplicates, aligned data", () => {
  it("holds exactly 1,000 adventures", () => {
    expect(adventures).toHaveLength(1000);
  });

  it("every id is unique", () => {
    expect(new Set(adventures.map((a) => a.id)).size).toBe(adventures.length);
  });

  it("every title is unique after normalisation", () => {
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const seen = new Map<string, string>();
    for (const a of adventures) {
      const key = norm(a.title);
      expect(seen.has(key), `duplicate title "${a.title}" (${a.id} vs ${seen.get(key)})`).toBe(
        false,
      );
      seen.set(key, a.id);
    }
  });

  it("every cover photo is unique — no two adventures share an image", () => {
    const seen = new Map<string, string>();
    for (const a of adventures) {
      expect(
        seen.has(a.coverImageUrl),
        `shared photo between ${a.id} and ${seen.get(a.coverImageUrl)}`,
      ).toBe(false);
      seen.set(a.coverImageUrl, a.id);
    }
  });

  it("every CC-licensed (wikimedia) photo carries full attribution", () => {
    for (const a of adventures) {
      if (!a.coverImageUrl.startsWith("https://upload.wikimedia.org/")) continue;
      const att = a.imageAttribution;
      expect(att?.artist, `${a.id}: missing artist`).toBeTruthy();
      expect(att?.license, `${a.id}: missing license`).toBeTruthy();
      expect(
        att?.sourceUrl?.startsWith("https://commons.wikimedia.org/"),
        `${a.id}: missing commons source`,
      ).toBe(true);
    }
  });

  it("every record is complete and internally consistent", () => {
    for (const a of adventures) {
      expect(CATEGORIES.has(a.category), `${a.id}: category ${a.category}`).toBe(true);
      expect(DIFFICULTIES.has(a.difficulty), `${a.id}: difficulty ${a.difficulty}`).toBe(true);
      expect(CONTINENTS.has(a.continent), `${a.id}: continent ${a.continent}`).toBe(true);
      expect(a.description.length, `${a.id}: thin description`).toBeGreaterThanOrEqual(400);
      expect(a.bestMonths.length, `${a.id}: no bestMonths`).toBeGreaterThan(0);
      expect(
        a.bestMonths.every((m) => m >= 1 && m <= 12),
        `${a.id}: bestMonths out of range`,
      ).toBe(true);
      expect(a.highlights.length, `${a.id}: highlights`).toBeGreaterThanOrEqual(2);
      expect(a.gear.length, `${a.id}: gear`).toBeGreaterThanOrEqual(3);
      expect(a.tags.length, `${a.id}: tags`).toBeGreaterThanOrEqual(3);
      expect(a.durationDays, `${a.id}: durationDays`).toBeGreaterThanOrEqual(1);
      expect(a.durationDays, `${a.id}: durationDays`).toBeLessThanOrEqual(200);
      if (a.estimatedCost != null) {
        // Pence: £50 weekend floor, £200k expedition ceiling.
        expect(a.estimatedCost, `${a.id}: cost ${a.estimatedCost}`).toBeGreaterThanOrEqual(5000);
        expect(a.estimatedCost, `${a.id}: cost ${a.estimatedCost}`).toBeLessThanOrEqual(20000000);
      }
      expect(a.latitude, `${a.id}: latitude`).not.toBeNull();
      expect(a.longitude, `${a.id}: longitude`).not.toBeNull();
      expect(Math.abs(a.latitude as number), `${a.id}: latitude range`).toBeLessThanOrEqual(90);
      expect(Math.abs(a.longitude as number), `${a.id}: longitude range`).toBeLessThanOrEqual(180);
      expect([1, 2, 3].includes(a.user), `${a.id}: user ${a.user}`).toBe(true);
    }
  });

  it("southern-hemisphere summer activities do not claim northern-summer-only windows", () => {
    // Structural sanity: a deep-southern (lat < -30) SKIING record must not be
    // exclusively northern-winter (Dec-Mar), and vice versa for lat > 30.
    for (const a of adventures.filter((x) => x.category === "SKIING")) {
      const lat = a.latitude as number;
      const months = new Set(a.bestMonths);
      const northernWinterOnly = [...months].every((m) => [11, 12, 1, 2, 3, 4].includes(m));
      const southernWinterOnly = [...months].every((m) => [5, 6, 7, 8, 9, 10].includes(m));
      if (lat < -30) expect(northernWinterOnly, `${a.id}: southern skiing with northern window`).toBe(false);
      if (lat > 30) expect(southernWinterOnly, `${a.id}: northern skiing with southern window`).toBe(false);
    }
  });
});
