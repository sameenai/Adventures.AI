// Aggregation of implicit signals into a taste profile
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    bookmark: { findMany: vi.fn() },
    vote: { findMany: vi.fn() },
    adventureView: { findMany: vi.fn() },
  },
}));

import { getTasteProfile, topEntries } from "@/lib/personalization/taste-profile";
import { prisma } from "@/lib/db/prisma";

const p = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

const adventure = (category: string, continent = "Asia", durationDays = 10) => ({
  adventure: { category, continent, difficulty: "MODERATE", durationDays },
});

beforeEach(() => vi.clearAllMocks());

describe("getTasteProfile", () => {
  it("weights bookmarks over votes over views", async () => {
    p.bookmark.findMany.mockResolvedValue([adventure("TREKKING")]);
    p.vote.findMany.mockResolvedValue([adventure("CYCLING")]);
    p.adventureView.findMany.mockResolvedValue([adventure("DIVING")]);

    const profile = await getTasteProfile("u1");
    expect(profile.categories.TREKKING).toBe(3);
    expect(profile.categories.CYCLING).toBe(2);
    expect(profile.categories.DIVING).toBe(1);
    expect(profile.signalCount).toBe(3);
  });

  it("computes a median duration", async () => {
    p.bookmark.findMany.mockResolvedValue([
      adventure("TREKKING", "Asia", 5),
      adventure("TREKKING", "Asia", 12),
      adventure("TREKKING", "Asia", 30),
    ]);
    p.vote.findMany.mockResolvedValue([]);
    p.adventureView.findMany.mockResolvedValue([]);

    const profile = await getTasteProfile("u1");
    expect(profile.medianDurationDays).toBe(12);
  });

  it("returns an empty profile without signals", async () => {
    p.bookmark.findMany.mockResolvedValue([]);
    p.vote.findMany.mockResolvedValue([]);
    p.adventureView.findMany.mockResolvedValue([]);

    const profile = await getTasteProfile("u1");
    expect(profile.signalCount).toBe(0);
    expect(profile.medianDurationDays).toBeNull();
  });
});

describe("topEntries", () => {
  it("returns the highest-weighted keys in order", () => {
    expect(topEntries({ a: 1, b: 5, c: 3 }, 2)).toEqual(["b", "c"]);
  });
});
