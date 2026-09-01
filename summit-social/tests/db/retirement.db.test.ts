import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildKeeperMap, salvageUserData } from "../../prisma/retirement";
import { createUser, db, truncateAll } from "./helpers";

/**
 * Retirement salvage against a REAL database.
 *
 * The unit tests prove the logic with mocks; this proves the behaviour Postgres
 * actually delivers — that the moves land, that a row colliding with one the
 * person already holds on the keeper does not blow up the unique constraint, and
 * that the delete which follows takes nothing that should have survived.
 *
 * It matters because the first production seed retires 250 records that real
 * users have voted on, bookmarked, commented on and logged trips against, and
 * every one of those relations cascades. A fresh CI database has no such rows,
 * so seeding there proves the queries are well-formed and nothing more.
 */

const DUPE = "seed-adventure-dupe";
const KEEPER = "seed-adventure-keeper";

async function makeAdventure(id: string, userId: string, title: string) {
  return db.adventure.create({
    data: {
      id,
      title,
      description: "A test adventure with a sufficiently long description body.",
      location: "Testville",
      country: "Testland",
      continent: "Asia",
      category: "TREKKING",
      difficulty: "MODERATE",
      durationDays: 7,
      coverImageUrl: "https://images.example.com/cover.jpg",
      highlights: ["h1"],
      gear: ["g1"],
      bestMonths: [6, 7],
      estimatedCost: 100000,
      published: true,
      voteCount: 5,
      userId,
    },
  });
}

describe("retirement salvage (real database)", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("moves a person's history onto the keeper and survives the delete", async () => {
    const owner = await createUser("owner@example.com");
    const traveller = await createUser("traveller@example.com");
    await makeAdventure(KEEPER, owner.id, "Svalbard Polar Wilderness Expedition");
    await makeAdventure(DUPE, owner.id, "Spitsbergen Polar Bear Safari");

    const collection = await db.collection.create({
      data: { name: "Bucket list", userId: traveller.id },
    });
    await db.vote.create({ data: { userId: traveller.id, adventureId: DUPE } });
    await db.bookmark.create({ data: { userId: traveller.id, adventureId: DUPE } });
    await db.comment.create({
      data: { userId: traveller.id, adventureId: DUPE, body: "Did this in March." },
    });
    await db.collectionItem.create({ data: { collectionId: collection.id, adventureId: DUPE } });
    await db.tripEvent.create({
      data: {
        userId: traveller.id,
        adventureId: DUPE,
        source: "MARKED_DONE",
        startedAt: new Date("2026-03-01T00:00:00Z"),
      },
    });

    const keeperMap = buildKeeperMap(
      [{ id: DUPE, duplicateOf: KEEPER }],
      new Set([KEEPER]),
    );
    const result = await salvageUserData(db, keeperMap);
    expect(result.total).toBe(5);

    // The seed deletes right after salvaging — the cascade must find nothing left.
    await db.adventure.deleteMany({ where: { id: DUPE } });

    expect(await db.vote.count({ where: { adventureId: KEEPER } })).toBe(1);
    expect(await db.bookmark.count({ where: { adventureId: KEEPER } })).toBe(1);
    expect(await db.comment.count({ where: { adventureId: KEEPER } })).toBe(1);
    expect(await db.collectionItem.count({ where: { adventureId: KEEPER } })).toBe(1);
    expect(await db.tripEvent.count({ where: { adventureId: KEEPER } })).toBe(1);

    // Nothing orphaned: the trip log kept its adventure rather than going SetNull.
    expect(await db.tripEvent.count({ where: { adventureId: null } })).toBe(0);
  });

  it("leaves a colliding row behind instead of violating the unique constraint", async () => {
    const owner = await createUser("owner2@example.com");
    const both = await createUser("both@example.com");
    await makeAdventure(KEEPER, owner.id, "Keeper");
    await makeAdventure(DUPE, owner.id, "Duplicate");

    // This person bookmarked and voted on BOTH — those rows cannot move.
    await db.bookmark.create({ data: { userId: both.id, adventureId: KEEPER } });
    await db.bookmark.create({ data: { userId: both.id, adventureId: DUPE } });
    await db.vote.create({ data: { userId: both.id, adventureId: KEEPER } });
    await db.vote.create({ data: { userId: both.id, adventureId: DUPE } });

    const keeperMap = new Map([[DUPE, KEEPER]]);
    await expect(salvageUserData(db, keeperMap)).resolves.toBeDefined();

    await db.adventure.deleteMany({ where: { id: DUPE } });

    // Exactly one of each survives — the one they already had on the keeper.
    expect(await db.bookmark.count({ where: { userId: both.id } })).toBe(1);
    expect(await db.vote.count({ where: { userId: both.id } })).toBe(1);
  });

  it("moves only the non-colliding rows when a duplicate has both kinds", async () => {
    const owner = await createUser("owner3@example.com");
    const both = await createUser("both3@example.com");
    const onlyDupe = await createUser("onlydupe@example.com");
    await makeAdventure(KEEPER, owner.id, "Keeper");
    await makeAdventure(DUPE, owner.id, "Duplicate");

    await db.bookmark.create({ data: { userId: both.id, adventureId: KEEPER } });
    await db.bookmark.create({ data: { userId: both.id, adventureId: DUPE } });
    await db.bookmark.create({ data: { userId: onlyDupe.id, adventureId: DUPE } });

    const result = await salvageUserData(db, new Map([[DUPE, KEEPER]]));
    expect(result.moved.bookmark).toBe(1);

    await db.adventure.deleteMany({ where: { id: DUPE } });

    const keeperBookmarks = await db.bookmark.findMany({ where: { adventureId: KEEPER } });
    expect(keeperBookmarks).toHaveLength(2);
    expect(new Set(keeperBookmarks.map((b) => b.userId))).toEqual(
      new Set([both.id, onlyDupe.id]),
    );
  });

  it("is idempotent — a second run has nothing left to move", async () => {
    const owner = await createUser("owner4@example.com");
    const traveller = await createUser("traveller4@example.com");
    await makeAdventure(KEEPER, owner.id, "Keeper");
    await makeAdventure(DUPE, owner.id, "Duplicate");
    await db.bookmark.create({ data: { userId: traveller.id, adventureId: DUPE } });

    const keeperMap = new Map([[DUPE, KEEPER]]);
    expect((await salvageUserData(db, keeperMap)).total).toBe(1);
    expect((await salvageUserData(db, keeperMap)).total).toBe(0);
    expect(await db.bookmark.count({ where: { adventureId: KEEPER } })).toBe(1);
  });

  it("does not touch rows on adventures that are not being retired", async () => {
    const owner = await createUser("owner5@example.com");
    const traveller = await createUser("traveller5@example.com");
    await makeAdventure(KEEPER, owner.id, "Keeper");
    await makeAdventure(DUPE, owner.id, "Duplicate");
    const bystander = await makeAdventure("seed-adventure-bystander", owner.id, "Bystander");
    await db.bookmark.create({ data: { userId: traveller.id, adventureId: bystander.id } });

    await salvageUserData(db, new Map([[DUPE, KEEPER]]));

    expect(await db.bookmark.count({ where: { adventureId: bystander.id } })).toBe(1);
    expect(await db.bookmark.count({ where: { adventureId: KEEPER } })).toBe(0);
  });
});
