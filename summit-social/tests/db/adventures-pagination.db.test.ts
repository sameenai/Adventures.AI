// Real-Postgres semantics of the shared adventures query builder:
// keyset cursors must produce no duplicates and no gaps across pages.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchAdventuresPage } from "@/lib/adventures/query";
import { adventureFilterSchema } from "@/lib/validators/adventure";
import { createAdventure, createUser, db, truncateAll } from "./helpers";

function filters(params: Record<string, string>) {
  const parsed = adventureFilterSchema.safeParse(params);
  if (!parsed.success) throw new Error("invalid test filters");
  return parsed.data;
}

describe("adventures keyset pagination (real Postgres)", () => {
  beforeAll(async () => {
    await truncateAll();
    const user = await createUser();
    // Deliberately create vote-count TIES to prove the id tiebreaker works.
    for (let i = 0; i < 25; i++) {
      await createAdventure(user.id, { voteCount: i % 5, durationDays: (i % 10) + 3 });
    }
    await createAdventure(user.id, { published: false, title: "Hidden Draft" });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("walks the full catalog by votes without duplicates or gaps", async () => {
    const seen = new Set<string>();
    let cursor: string | undefined;
    let pages = 0;

    do {
      const page = await fetchAdventuresPage(
        filters({ limit: "7", sortBy: "votes", ...(cursor ? { cursor } : {}) }),
      );
      for (const item of page.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = page.nextCursor ?? undefined;
      pages += 1;
      expect(pages).toBeLessThan(10);
    } while (cursor);

    expect(seen.size).toBe(25); // the unpublished draft never appears
  });

  it("orders duration sort stably across pages", async () => {
    const first = await fetchAdventuresPage(filters({ limit: "10", sortBy: "duration" }));
    const second = await fetchAdventuresPage(
      filters({ limit: "10", sortBy: "duration", cursor: first.nextCursor ?? "" }),
    );
    const durations = [...first.items, ...second.items].map((i) => i.durationDays);
    const sorted = [...durations].sort((a, b) => a - b);
    expect(durations).toEqual(sorted);
  });

  it("trending ranks by votes cast in the window, filters applied", async () => {
    const voter = await createUser("voter@example.com");
    const hot = await createAdventure(voter.id, { title: "Hot Right Now", category: "CYCLING" });
    await db.vote.create({ data: { userId: voter.id, adventureId: hot.id } });

    const page = await fetchAdventuresPage(filters({ limit: "5", sortBy: "trending" }));
    expect(page.items[0]?.id).toBe(hot.id);

    // Filtered trending only surfaces matching categories.
    const trekkingOnly = await fetchAdventuresPage(
      filters({ limit: "5", sortBy: "trending", category: "TREKKING" }),
    );
    expect(trekkingOnly.items.every((i) => i.category === "TREKKING")).toBe(true);
  });
});
