// Tests for robots.ts and sitemap.ts (no DOM needed)
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: {
      findMany: vi.fn().mockResolvedValue([
        { id: "adv-1", updatedAt: new Date("2025-01-01") },
        { id: "adv-2", updatedAt: new Date("2025-06-15") },
      ]),
    },
  },
}));

// ---------------------------------------------------------------------------
// robots
// ---------------------------------------------------------------------------
import robots from "@/app/robots";

describe("robots", () => {
  it("returns a rules array", () => {
    const result = robots();
    expect(Array.isArray(result.rules)).toBe(true);
  });

  it("allows public routes", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).toContain("/");
    expect(rule.allow).toContain("/adventures/");
    expect(rule.allow).toContain("/leaderboard");
  });

  it("allows the now-public /itinerary planner and /flights", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).toContain("/itinerary");
    expect(rule.allow).toContain("/flights");
    expect(rule.disallow).not.toContain("/itinerary");
  });

  it("disallows private routes", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.disallow).toContain("/api/");
    expect(rule.disallow).toContain("/profile/edit");
  });

  it("disallows /feed (redirects unauthenticated visitors) and itinerary detail pages", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).not.toContain("/feed");
    expect(rule.disallow).toContain("/feed");
    expect(rule.disallow).toContain("/itinerary/");
    expect(rule.disallow).toContain("/itineraries/");
  });

  it("includes a sitemap url", () => {
    const result = robots();
    expect(result.sitemap).toContain("sitemap.xml");
  });
});

// ---------------------------------------------------------------------------
// sitemap
// ---------------------------------------------------------------------------
import sitemap from "@/app/sitemap";
import { APP_URL } from "@/lib/constants";

describe("sitemap", () => {
  it("includes the home static route", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === APP_URL)).toBe(true);
  });

  it("includes the /adventures static route", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === `${APP_URL}/adventures`)).toBe(true);
  });

  it("includes the public /flights and /itinerary routes", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === `${APP_URL}/flights`)).toBe(true);
    expect(entries.some((e) => e.url === `${APP_URL}/itinerary`)).toBe(true);
  });

  it("does not list gated routes like /feed or /bookmarks", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === `${APP_URL}/feed`)).toBe(false);
    expect(entries.some((e) => e.url === `${APP_URL}/bookmarks`)).toBe(false);
  });

  it("includes dynamic adventure routes from the DB", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url.includes("adv-1"))).toBe(true);
    expect(entries.some((e) => e.url.includes("adv-2"))).toBe(true);
  });

  it("dynamic routes use weekly changeFrequency", async () => {
    const entries = await sitemap();
    const adventureEntries = entries.filter((e) => e.url.includes("/adventures/"));
    expect(adventureEntries.every((e) => e.changeFrequency === "weekly")).toBe(true);
  });

  it("adventure entries have priority 0.8", async () => {
    const entries = await sitemap();
    const adventureEntries = entries.filter((e) => e.url.includes("/adventures/adv-"));
    expect(adventureEntries.every((e) => e.priority === 0.8)).toBe(true);
  });
});
