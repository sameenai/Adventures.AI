// @vitest-environment jsdom
// Leaderboard page — windowed rankings must rank by votes CAST in the window
// (vote.groupBy), while "all time" keeps the denormalised voteCount ordering.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { count: vi.fn(), findMany: vi.fn() },
    vote: { groupBy: vi.fn() },
  },
}));
vi.mock("@/lib/db/redis", () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

import LeaderboardPage from "@/app/(dashboard)/leaderboard/page";
import { prisma } from "@/lib/db/prisma";
import { getCached, setCache } from "@/lib/db/redis";

const mockGetCached = getCached as ReturnType<typeof vi.fn>;
const mockSetCache = setCache as ReturnType<typeof vi.fn>;
const mockGroupBy = prisma.vote.groupBy as ReturnType<typeof vi.fn>;
const mockAdventureCount = prisma.adventure.count as ReturnType<typeof vi.fn>;
const mockAdventureFindMany = prisma.adventure.findMany as ReturnType<typeof vi.fn>;

function makeAdventure(id: string, voteCount: number) {
  return {
    id,
    title: `Adventure ${id}`,
    location: "Somewhere",
    category: "TREKKING",
    difficulty: "MODERATE",
    coverImageUrl: "https://example.com/img.jpg",
    voteCount,
    user: { id: "u-1", name: "Alice", avatarUrl: null },
    tags: [],
  };
}

async function renderPage(params: Record<string, string | undefined>) {
  const jsx = await LeaderboardPage({ searchParams: Promise.resolve(params) });
  return render(jsx);
}

afterEach(cleanup);

describe("LeaderboardPage windowed rankings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
  });

  it("ranks a windowed view by votes cast in the window via vote.groupBy", async () => {
    mockGroupBy.mockResolvedValue([
      { adventureId: "a2", _count: { adventureId: 9 } },
      { adventureId: "a1", _count: { adventureId: 5 } },
    ]);
    mockAdventureFindMany.mockImplementation(
      (args: { select?: unknown; where?: { id?: { in: string[] } } }) => {
        if (args.select) {
          // All-time baseline (top ids by voteCount)
          return Promise.resolve([{ id: "a1" }, { id: "a2" }]);
        }
        // Page fetch — deliberately out of ranking order
        return Promise.resolve([makeAdventure("a1", 100), makeAdventure("a2", 10)]);
      },
    );

    await renderPage({ window: "week" });

    expect(mockGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["adventureId"],
        where: expect.objectContaining({
          createdAt: { gte: expect.any(Date) },
          adventure: { is: { published: true } },
        }),
        orderBy: { _count: { adventureId: "desc" } },
      }),
    );
    // Windowed path never counts/paginates adventures by createdAt
    expect(mockAdventureCount).not.toHaveBeenCalled();

    // a2 (9 window votes) must rank above a1 (5 window votes) despite a1's
    // higher all-time voteCount.
    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("Adventure a2");
    expect(rows[2].textContent).toContain("Adventure a1");
  });

  it("uses a ~7 day window start for 'week'", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockAdventureFindMany.mockResolvedValue([]);

    await renderPage({ window: "week" });

    const gte = mockGroupBy.mock.calls[0][0].where.createdAt.gte as Date;
    const expected = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(gte.getTime() - expected)).toBeLessThan(60_000);
  });

  it("computes trend against all-time rank in windowed views", async () => {
    mockGroupBy.mockResolvedValue([
      { adventureId: "a2", _count: { adventureId: 9 } },
      { adventureId: "a1", _count: { adventureId: 5 } },
      { adventureId: "a9", _count: { adventureId: 1 } },
    ]);
    mockAdventureFindMany.mockImplementation((args: { select?: unknown }) =>
      args.select
        ? Promise.resolve([{ id: "a1" }, { id: "a2" }])
        : Promise.resolve([
            makeAdventure("a1", 100),
            makeAdventure("a2", 10),
            makeAdventure("a9", 1),
          ]),
    );

    const { container } = await renderPage({ window: "month" });

    // a2: window rank 1 vs all-time rank 2 → up; a1: 2 vs 1 → down;
    // a9: not in the all-time top → NEW.
    expect(container.textContent).toContain("▲");
    expect(container.textContent).toContain("▼");
    expect(container.textContent).toContain("NEW");
  });

  it("shows an empty windowed leaderboard when no votes were cast in the window", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockAdventureFindMany.mockResolvedValue([]);

    await renderPage({ window: "year" });

    // Only the all-time baseline fetch — no page fetch for an empty pool.
    expect(mockAdventureFindMany).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/0 adventures ranked/)).toBeTruthy();
  });

  it("keeps all-time ordering by voteCount without touching vote.groupBy", async () => {
    mockAdventureCount.mockResolvedValue(2);
    mockAdventureFindMany.mockResolvedValue([makeAdventure("a1", 100), makeAdventure("a2", 10)]);

    await renderPage({});

    expect(mockGroupBy).not.toHaveBeenCalled();
    expect(mockAdventureFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: { voteCount: "desc" },
        skip: 0,
        take: 25,
      }),
    );
    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("Adventure a1");
  });

  it("serves from cache and skips all queries on a cache hit", async () => {
    mockGetCached.mockResolvedValue({
      total: 1,
      entries: [{ rank: 1, adventure: makeAdventure("a1", 42), trend: "stable" }],
    });

    await renderPage({ window: "week" });

    expect(mockGroupBy).not.toHaveBeenCalled();
    expect(mockAdventureFindMany).not.toHaveBeenCalled();
    expect(mockSetCache).not.toHaveBeenCalled();
    expect(screen.getByText("Adventure a1")).toBeTruthy();
  });

  it("caches computed windowed data under leaderboard:<window>:<page>", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockAdventureFindMany.mockResolvedValue([]);

    await renderPage({ window: "week" });

    expect(mockSetCache).toHaveBeenCalledWith(
      "leaderboard:week:1",
      { total: 0, entries: [] },
      expect.any(Number),
    );
  });
});
