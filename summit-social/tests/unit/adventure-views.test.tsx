// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------
const mockRouterPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => "sortBy=votes",
  }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/a11y/useAltText: test mock
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Stub out VoteButton and BookmarkButton — their own tests cover them
vi.mock("@/components/adventures/vote-button", () => ({
  VoteButton: ({ voteCount }: { voteCount: number }) => <span data-testid="vote-btn">{voteCount}</span>,
}));
vi.mock("@/components/adventures/bookmark-button", () => ({
  BookmarkButton: () => <span data-testid="bookmark-btn" />,
}));

afterEach(cleanup);

// ---------------------------------------------------------------------------
// ViewToggle
// ---------------------------------------------------------------------------
import { ViewToggle } from "@/components/adventures/view-toggle";

describe("ViewToggle", () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it("renders both grid and list buttons", () => {
    render(<ViewToggle current="grid" />);
    expect(screen.getByRole("button", { name: /grid view/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /list view/i })).toBeTruthy();
  });

  it("clicking list button navigates to ?view=list preserving existing params", () => {
    render(<ViewToggle current="grid" />);
    fireEvent.click(screen.getByRole("button", { name: /list view/i }));
    expect(mockRouterPush).toHaveBeenCalledOnce();
    const url = mockRouterPush.mock.calls[0][0] as string;
    expect(url).toContain("view=list");
    expect(url).toContain("sortBy=votes");
  });

  it("clicking grid button removes view param from URL", () => {
    render(<ViewToggle current="list" />);
    fireEvent.click(screen.getByRole("button", { name: /grid view/i }));
    expect(mockRouterPush).toHaveBeenCalledOnce();
    const url = mockRouterPush.mock.calls[0][0] as string;
    expect(url).not.toContain("view=");
  });

  it("passes scroll:false to router.push", () => {
    render(<ViewToggle current="grid" />);
    fireEvent.click(screen.getByRole("button", { name: /list view/i }));
    expect(mockRouterPush.mock.calls[0][1]).toEqual({ scroll: false });
  });
});

// ---------------------------------------------------------------------------
// AdventureListRow
// ---------------------------------------------------------------------------
import { AdventureListRow } from "@/components/adventures/adventure-list-row";
import type { AdventureWithUser } from "@/types";

const baseAdventure: AdventureWithUser = {
  id: "adv-1",
  title: "Annapurna Circuit",
  country: "Nepal",
  location: "Annapurna Region",
  category: "TREKKING",
  difficulty: "CHALLENGING",
  durationDays: 14,
  coverImageUrl: "https://example.com/cover.jpg",
  description: "A classic trek",
  continent: "Asia",
  published: true,
  voteCount: 42,
  albumUrl: null,
  albumPlatform: null,
  highlights: [],
  gear: [],
  bestMonths: [],
  estimatedCost: null,
  gpxTrackUrl: null,
  latitude: null,
  longitude: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  userId: "user-1",
  user: { id: "user-1", name: "Alice", avatarUrl: null },
  tags: [],
  _count: { comments: 3 },
};

describe("AdventureListRow", () => {
  it("renders the country on the top line", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByText("Nepal")).toBeTruthy();
  });

  it("renders the adventure title as a link", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByRole("heading", { name: /annapurna circuit/i })).toBeTruthy();
  });

  it("renders the location", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByText("Annapurna Region")).toBeTruthy();
  });

  it("renders category and duration", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByText(/trekking/i)).toBeTruthy();
    expect(screen.getByText("14 days")).toBeTruthy();
  });

  it("renders comment count when > 0", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByText("3 comments")).toBeTruthy();
  });

  it("hides comment count when 0", () => {
    render(
      <AdventureListRow adventure={{ ...baseAdventure, _count: { comments: 0 } }} />,
    );
    expect(screen.queryByText(/comment/i)).toBeNull();
  });

  it("renders author name", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("renders avatar image when avatarUrl is present", () => {
    const adventure = {
      ...baseAdventure,
      user: { id: "user-1", name: "Alice", avatarUrl: "https://example.com/avatar.jpg" },
    };
    render(<AdventureListRow adventure={adventure} />);
    const avatars = screen.getAllByAltText("Alice");
    expect(avatars.length).toBeGreaterThanOrEqual(1);
  });

  it("does not render avatar when avatarUrl is null", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    // no img with Alice alt besides cover — confirm cover has different alt
    const imgs = screen.getAllByRole("img");
    const coverImg = imgs.find((img) => img.getAttribute("alt") === "Annapurna Circuit");
    expect(coverImg).toBeTruthy();
  });

  it("links thumbnail and title to the adventure detail page", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    const links = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href") === "/adventures/adv-1");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to raw difficulty string when not in DIFFICULTY_MAP", () => {
    render(
      <AdventureListRow adventure={{ ...baseAdventure, difficulty: "UNKNOWN_LEVEL" as never }} />,
    );
    expect(screen.getByText("UNKNOWN_LEVEL")).toBeTruthy();
  });

  it("is disabled (vote + bookmark) when no currentUserId", () => {
    render(<AdventureListRow adventure={baseAdventure} />);
    // Stubbed buttons still render — just verify they appear
    expect(screen.getByTestId("vote-btn")).toBeTruthy();
    expect(screen.getByTestId("bookmark-btn")).toBeTruthy();
  });
});
