// @vitest-environment jsdom
// Adventures page — "In season now" rail: rendered only on the unfiltered
// view, queried by current month against bestMonths, cached in Redis.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/components/adventures/search-filter", () => ({ SearchFilter: () => null }));
vi.mock("@/components/adventures/view-toggle", () => ({ ViewToggle: () => null }));
vi.mock("@/components/adventures/paginated-adventure-grid", () => ({
  PaginatedAdventureGrid: () => <div data-testid="grid" />,
}));
vi.mock("@/components/adventures/adventure-card", () => ({
  AdventureCard: ({ adventure }: { adventure: { title: string } }) => (
    <div data-testid="in-season-card">{adventure.title}</div>
  ),
}));
vi.mock("@/lib/adventures/query", () => ({
  ADVENTURE_LIST_INCLUDE: {},
  fetchAdventuresOffset: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, perPage: 20, totalPages: 0 }),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    vote: { findMany: vi.fn() },
    bookmark: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/db/redis", () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

import AdventuresPage from "@/app/(dashboard)/adventures/page";
import { prisma } from "@/lib/db/prisma";
import { getCached, setCache } from "@/lib/db/redis";

const mockGetCached = getCached as ReturnType<typeof vi.fn>;
const mockSetCache = setCache as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.adventure.findMany as ReturnType<typeof vi.fn>;
const mockFindFirst = prisma.adventure.findFirst as ReturnType<typeof vi.fn>;
const mockCount = prisma.adventure.count as ReturnType<typeof vi.fn>;

const inSeasonAdventure = { id: "adv-1", title: "Alpine Crossing" };

const currentMonth = new Date().getMonth() + 1;
const currentMonthName = new Date().toLocaleString("en-GB", { month: "long" });

async function renderPage(params: Record<string, string | undefined>) {
  const jsx = await AdventuresPage({ searchParams: Promise.resolve(params) });
  return render(jsx);
}

afterEach(cleanup);

describe("AdventuresPage in-season rail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCached.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockFindFirst.mockResolvedValue(null);
    mockCount.mockResolvedValue(1);
    mockFindMany.mockResolvedValue([inSeasonAdventure]);
  });

  it("renders the rail with a month heading when no filters are active", async () => {
    await renderPage({});

    expect(screen.getByText(`In season in ${currentMonthName}`)).toBeTruthy();
    expect(screen.getByTestId("in-season-card").textContent).toBe("Alpine Crossing");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true, bestMonths: { has: currentMonth } },
        orderBy: { voteCount: "desc" },
        take: 6,
      }),
    );
  });

  it("caches the rail under in-season:<month> with a 600s TTL", async () => {
    await renderPage({});

    expect(mockGetCached).toHaveBeenCalledWith(`in-season:${currentMonth}`);
    expect(mockSetCache).toHaveBeenCalledWith(
      `in-season:${currentMonth}`,
      [inSeasonAdventure],
      600,
    );
  });

  it("serves the rail from cache without querying when cached", async () => {
    mockGetCached.mockResolvedValue([inSeasonAdventure]);

    await renderPage({});

    expect(screen.getByTestId("in-season-card")).toBeTruthy();
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockSetCache).not.toHaveBeenCalled();
  });

  it("does not render or query the rail when a filter is active", async () => {
    await renderPage({ category: "TREKKING" });

    expect(screen.queryByText(/in season in/i)).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockGetCached).not.toHaveBeenCalled();
  });

  it("does not render or query the rail when a search is active", async () => {
    await renderPage({ search: "volcano" });

    expect(screen.queryByText(/in season in/i)).toBeNull();
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("hides the rail when nothing is in season this month", async () => {
    mockFindMany.mockResolvedValue([]);

    await renderPage({});

    expect(screen.queryByText(/in season in/i)).toBeNull();
    expect(screen.queryByTestId("in-season-card")).toBeNull();
  });
});
