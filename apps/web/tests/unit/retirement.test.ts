import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  type RetirementEntry,
  type SalvageClient,
  buildKeeperMap,
  resolveKeeper,
  salvageUserData,
} from "../../prisma/retirement";

/**
 * Retiring a duplicate deletes a row that, on a live database, real people have
 * voted on, bookmarked, commented on and logged trips against — and every one of
 * those relations cascades. These tests cover the salvage that moves that history
 * onto the keeper first, because getting it wrong loses user data silently.
 */

const MODELS = ["vote", "bookmark", "comment", "collectionItem", "tripEvent"] as const;

/** Prisma stand-in that records calls and returns a fixed set of "already taken" owners. */
function mockClient(existingOwners: Record<string, string[]> = {}) {
  const calls: Array<{ model: string; where: Record<string, unknown>; to: string }> = [];
  const client = {} as SalvageClient;
  for (const model of MODELS) {
    // biome-ignore lint/suspicious/noExplicitAny: test double for a generated delegate
    (client as any)[model] = {
      findMany: vi.fn(async ({ select }: { select: Record<string, true> }) => {
        const owner = Object.keys(select)[0];
        return (existingOwners[model] ?? []).map((v) => ({ [owner]: v }));
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: { adventureId: string };
        }) => {
          calls.push({ model, where, to: data.adventureId });
          return { count: 1 };
        },
      ),
    };
  }
  return { client, calls };
}

describe("resolveKeeper", () => {
  it("returns the keeper for a direct retirement", () => {
    const entries: RetirementEntry[] = [{ id: "a", duplicateOf: "live" }];
    expect(resolveKeeper(entries, "a")).toBe("live");
  });

  it("follows a chain when a keeper was itself retired later", () => {
    // This happens for real: a record retired in round 1 can be the keeper for a
    // record retired in round 2, so the chain has to be walked to a live record.
    const entries: RetirementEntry[] = [
      { id: "a", duplicateOf: "b" },
      { id: "b", duplicateOf: "c" },
      { id: "c", duplicateOf: "live" },
    ];
    expect(resolveKeeper(entries, "a")).toBe("live");
  });

  it("returns null on a cycle instead of looping forever", () => {
    const entries: RetirementEntry[] = [
      { id: "a", duplicateOf: "b" },
      { id: "b", duplicateOf: "a" },
    ];
    expect(resolveKeeper(entries, "a")).toBeNull();
  });

  it("returns null when the chain dead-ends with no keeper", () => {
    expect(resolveKeeper([{ id: "a", duplicateOf: null }], "a")).toBeNull();
    expect(resolveKeeper([{ id: "a" }], "a")).toBeNull();
  });
});

describe("buildKeeperMap", () => {
  it("drops retirements whose keeper is not a live record", () => {
    // Pointing a foreign key at a record that does not exist would fail the
    // constraint mid-deploy; better to leave those rows to the cascade.
    const entries: RetirementEntry[] = [
      { id: "a", duplicateOf: "live" },
      { id: "b", duplicateOf: "ghost" },
    ];
    const map = buildKeeperMap(entries, new Set(["live"]));
    expect(map.get("a")).toBe("live");
    expect(map.has("b")).toBe(false);
  });

  it("maps every retirement in the real catalog to a live keeper", () => {
    const dir = join(__dirname, "..", "..", "prisma", "data");
    const { retired } = JSON.parse(
      readFileSync(join(dir, "retired-adventures.json"), "utf8"),
    ) as { retired: RetirementEntry[] };
    const { adventures } = JSON.parse(readFileSync(join(dir, "adventures.json"), "utf8")) as {
      adventures: Array<{ id: string }>;
    };

    const map = buildKeeperMap(retired, new Set(adventures.map((a) => a.id)));
    expect(map.size).toBe(retired.length);
    const unmapped = retired.filter((r) => !map.has(r.id)).map((r) => r.id);
    expect(unmapped, `retirements with no live keeper: ${unmapped.join(", ")}`).toHaveLength(0);
  });
});

describe("salvageUserData", () => {
  it("moves rows from each retired adventure to its keeper", async () => {
    const { client, calls } = mockClient();
    const result = await salvageUserData(client, new Map([["retired-1", "keeper-1"]]));

    for (const model of MODELS) {
      const call = calls.find((c) => c.model === model);
      expect(call, `${model} was not salvaged`).toBeDefined();
      expect(call?.where.adventureId).toBe("retired-1");
      expect(call?.to).toBe("keeper-1");
    }
    expect(result.total).toBe(MODELS.length);
  });

  it("skips owners who already hold the equivalent row on the keeper", async () => {
    // Someone who bookmarked BOTH the duplicate and the keeper cannot have their
    // row moved — the unique constraint forbids it — so it must be excluded.
    const { client, calls } = mockClient({ bookmark: ["user-dupe"] });
    await salvageUserData(client, new Map([["retired-1", "keeper-1"]]));

    const bookmark = calls.find((c) => c.model === "bookmark");
    expect(bookmark?.where.userId).toEqual({ notIn: ["user-dupe"] });
  });

  it("does not filter by owner when no unique constraint involves the adventure", async () => {
    // Comments have no unique constraint on adventureId, so every one can move.
    const { client, calls } = mockClient({ comment: ["user-a"] });
    await salvageUserData(client, new Map([["retired-1", "keeper-1"]]));

    const comment = calls.find((c) => c.model === "comment");
    expect(comment?.where).toEqual({ adventureId: "retired-1" });
    // biome-ignore lint/suspicious/noExplicitAny: reaching into the test double
    expect((client as any).comment.findMany).not.toHaveBeenCalled();
  });

  it("omits the notIn filter entirely when the keeper has no rows yet", async () => {
    // `notIn: []` is a filter that matches nothing in some engines — the empty
    // case must drop the clause, not pass an empty list.
    const { client, calls } = mockClient();
    await salvageUserData(client, new Map([["retired-1", "keeper-1"]]));

    const vote = calls.find((c) => c.model === "vote");
    expect(vote?.where).toEqual({ adventureId: "retired-1" });
  });

  it("handles every retirement across chunk boundaries", async () => {
    const pairs = new Map(
      Array.from({ length: 60 }, (_, i) => [`retired-${i}`, `keeper-${i}`] as const),
    );
    const { client, calls } = mockClient();
    const result = await salvageUserData(client, pairs, 25);

    const votes = calls.filter((c) => c.model === "vote");
    expect(votes).toHaveLength(60);
    expect(new Set(votes.map((c) => c.where.adventureId)).size).toBe(60);
    expect(result.moved.vote).toBe(60);
  });

  it("is a no-op when there is nothing to retire", async () => {
    const { client, calls } = mockClient();
    const result = await salvageUserData(client, new Map());
    expect(calls).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
