// The bug classes an all-mock suite is structurally blind to:
// unique-constraint races and denormalized-counter drift under concurrency.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

import { POST as vote } from "@/app/api/adventures/[id]/vote/route";
import { getServerSession } from "next-auth";
import { createAdventure, createUser, db, truncateAll } from "./helpers";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;

let userId: string;
let adventureId: string;

describe("vote toggle under real concurrency", () => {
  beforeAll(async () => {
    await truncateAll();
    const user = await createUser("racer@example.com");
    userId = user.id;
    const adventure = await createAdventure(user.id);
    adventureId = adventure.id;
  });

  beforeEach(async () => {
    mockSession.mockResolvedValue({ user: { id: userId } });
    await db.vote.deleteMany({});
    await db.adventure.update({ where: { id: adventureId }, data: { voteCount: 0 } });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("five concurrent votes leave a consistent vote row + counter", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        vote(new Request("http://localhost/api/adventures/x/vote", { method: "POST" }), {
          params: Promise.resolve({ id: adventureId }),
        }),
      ),
    );

    for (const res of responses) {
      expect([200].includes(res.status)).toBe(true); // never a raw 500
    }

    const votes = await db.vote.count({ where: { adventureId } });
    const adventure = await db.adventure.findUnique({ where: { id: adventureId } });
    // Concurrent toggles may legitimately land on 0 or 1 — but the row count
    // and the denormalized counter must AGREE and be within toggle bounds.
    expect([0, 1]).toContain(votes);
    expect(adventure?.voteCount).toBe(votes);
  });

  it("sequential toggle: vote then unvote returns to zero, in sync", async () => {
    const first = await vote(
      new Request("http://localhost/api/adventures/x/vote", { method: "POST" }),
      { params: Promise.resolve({ id: adventureId }) },
    );
    expect((await first.json()).voted).toBe(true);

    const second = await vote(
      new Request("http://localhost/api/adventures/x/vote", { method: "POST" }),
      { params: Promise.resolve({ id: adventureId }) },
    );
    expect((await second.json()).voted).toBe(false);

    expect(await db.vote.count({ where: { adventureId } })).toBe(0);
    const adventure = await db.adventure.findUnique({ where: { id: adventureId } });
    expect(adventure?.voteCount).toBe(0);
  });
});
