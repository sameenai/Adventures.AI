// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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

afterEach(cleanup);

// ---------------------------------------------------------------------------
// NotificationBell
// ---------------------------------------------------------------------------
import { NotificationBell } from "@/components/shared/notification-bell";

describe("NotificationBell", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders bell button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });
    render(<NotificationBell />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeTruthy();
  });

  it("shows unread badge when there are unread notifications", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 3 }),
    });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });

  it("shows 9+ when unread count exceeds 9", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 15 }),
    });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("9+")).toBeTruthy());
  });

  it("opens dropdown and shows notifications on click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [
          {
            id: "n-1",
            type: "COMMENT",
            message: "Someone commented",
            linkUrl: "/adventures/1",
            read: false,
            createdAt: "2025-01-01T00:00:00Z",
          },
        ],
        unreadCount: 1,
      }),
    });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText("Someone commented")).toBeTruthy();
  });

  it("shows empty state when no notifications", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => expect(screen.getByText(/no notifications yet/i)).toBeTruthy());
  });

  it("calls mark-all-read API when opened with unread notifications", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              id: "n-1",
              type: "VOTE",
              message: "Someone voted",
              linkUrl: null,
              read: false,
              createdAt: "2025-01-01T00:00:00Z",
            },
          ],
          unreadCount: 1,
        }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notifications/read-all",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// CollectionsPanel
// ---------------------------------------------------------------------------
import { CollectionsPanel } from "@/components/profile/collections-panel";

describe("CollectionsPanel", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows empty state when no collections", () => {
    render(<CollectionsPanel initialCollections={[]} />);
    expect(screen.getByText(/no collections yet/i)).toBeTruthy();
  });

  it("renders existing collections", () => {
    const collections = [
      {
        id: "col-1",
        name: "Himalayan Expeditions",
        _count: { items: 3 },
        items: [],
      },
    ];
    render(<CollectionsPanel initialCollections={collections} />);
    expect(screen.getByText("Himalayan Expeditions")).toBeTruthy();
    expect(screen.getByText("3 adventures")).toBeTruthy();
  });

  it("shows singular 'adventure' for a single item", () => {
    const collections = [
      {
        id: "col-1",
        name: "Solo",
        _count: { items: 1 },
        items: [],
      },
    ];
    render(<CollectionsPanel initialCollections={collections} />);
    expect(screen.getByText("1 adventure")).toBeTruthy();
  });

  it("creates a new collection on form submit", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "col-new", name: "New Trek", _count: { items: 0 }, items: [] }),
    });
    render(<CollectionsPanel initialCollections={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/new collection name/i), {
      target: { value: "New Trek" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(screen.getByText("New Trek")).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/collections",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows error when creation fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Name too long" }),
    });
    render(<CollectionsPanel initialCollections={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/new collection name/i), {
      target: { value: "Bad Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));
    await waitFor(() => expect(screen.getByText("Name too long")).toBeTruthy());
  });

  it("deletes a collection when confirmed", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const collections = [{ id: "col-1", name: "To Delete", _count: { items: 0 }, items: [] }];
    render(<CollectionsPanel initialCollections={collections} />);
    fireEvent.click(screen.getByRole("button", { name: /delete to delete/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText("To Delete")).toBeNull();
  });

  it("does not delete when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const collections = [{ id: "col-1", name: "Keep Me", _count: { items: 0 }, items: [] }];
    render(<CollectionsPanel initialCollections={collections} />);
    fireEvent.click(screen.getByRole("button", { name: /delete keep me/i }));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Keep Me")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// FollowSuggestions
// ---------------------------------------------------------------------------
import { FollowSuggestions } from "@/components/profile/follow-suggestions";

describe("FollowSuggestions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing while loading or with no suggestions", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    const { container } = render(<FollowSuggestions />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("renders suggestions when data is returned", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "u-1", name: "Alice", avatarUrl: null, _count: { adventures: 5 } },
        { id: "u-2", name: "Bob", avatarUrl: null, _count: { adventures: 1 } },
      ],
    });
    render(<FollowSuggestions />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeTruthy());
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("shows adventure count with correct plural", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "u-1", name: "Alice", avatarUrl: null, _count: { adventures: 1 } }],
    });
    render(<FollowSuggestions />);
    await waitFor(() => expect(screen.getByText("1 adventure")).toBeTruthy());
  });

  it("fetches with category param when provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<FollowSuggestions category="TREKKING" />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("TREKKING");
  });

  it("marks user as Following after clicking Follow", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "u-1", name: "Alice", avatarUrl: null, _count: { adventures: 3 } },
        ],
      })
      .mockResolvedValue({ ok: true });

    render(<FollowSuggestions />);
    await waitFor(() => expect(screen.getByRole("button", { name: /^follow$/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /^follow$/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /following/i })).toBeDisabled());
  });
});

// ---------------------------------------------------------------------------
// PublishButton (admin)
// ---------------------------------------------------------------------------
import { PublishButton } from "@/components/admin/publish-button";

describe("PublishButton (admin)", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows 'Publish' when not published", () => {
    render(<PublishButton adventureId="adv-1" published={false} />);
    expect(screen.getByText("Publish")).toBeTruthy();
  });

  it("shows 'Unpublish' when published", () => {
    render(<PublishButton adventureId="adv-1" published={true} />);
    expect(screen.getByText("Unpublish")).toBeTruthy();
  });

  it("calls PATCH API on click", async () => {
    render(<PublishButton adventureId="adv-1" published={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

// ---------------------------------------------------------------------------
// DeleteItineraryButton
// ---------------------------------------------------------------------------
import { DeleteItineraryButton } from "@/app/(dashboard)/itineraries/delete-button";

describe("DeleteItineraryButton", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a Delete button", () => {
    render(<DeleteItineraryButton itineraryId="itin-1" />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("calls DELETE API when confirmed", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<DeleteItineraryButton itineraryId="itin-1" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/itineraries/itin-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does not call API when confirm is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteItineraryButton itineraryId="itin-1" />);
    fireEvent.click(screen.getByRole("button"));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// InfiniteAdventureGrid
// ---------------------------------------------------------------------------
import { InfiniteAdventureGrid } from "@/components/adventures/infinite-adventure-grid";
import type { AdventureWithUser } from "@/types";

vi.mock("@/components/adventures/adventure-card", () => ({
  AdventureCard: ({ adventure }: { adventure: AdventureWithUser }) => (
    <div data-testid="adventure-card">{adventure.id}</div>
  ),
}));

const makeAdventure = (id: string): AdventureWithUser =>
  ({
    id,
    title: `Adventure ${id}`,
    slug: id,
    description: "",
    country: "Nepal",
    published: true,
    voteCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: "u-1", name: "Alice", image: null },
    _count: { comments: 0 },
  }) as unknown as AdventureWithUser;

describe("InfiniteAdventureGrid", () => {
  it("renders adventure cards for initial items", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[makeAdventure("adv-1"), makeAdventure("adv-2")]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
      />,
    );
    expect(screen.getAllByTestId("adventure-card")).toHaveLength(2);
  });

  it("shows empty state when no adventures", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
      />,
    );
    expect(screen.getByText(/no adventures found/i)).toBeTruthy();
  });

  it("empty state links to unfiltered /adventures via Clear filters", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
        category="TREKKING"
      />,
    );
    const clear = screen.getByRole("link", { name: /clear filters/i });
    expect(clear.getAttribute("href")).toBe("/adventures");
  });

  it("empty state links to the AI planner with the current search as prompt", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
        search="volcano trek iceland"
      />,
    );
    const plan = screen.getByRole("link", { name: /plan it with ai instead/i });
    expect(plan.getAttribute("href")).toBe("/itinerary?prompt=volcano%20trek%20iceland");
  });

  it("empty state uses a generic planning prompt when there is no search text", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
      />,
    );
    const plan = screen.getByRole("link", { name: /plan it with ai instead/i });
    expect(plan.getAttribute("href")).toBe(
      `/itinerary?prompt=${encodeURIComponent("Help me plan my next adventure")}`,
    );
  });

  it("shows 'All adventures loaded' when no more cursor", () => {
    render(
      <InfiniteAdventureGrid
        initialAdventures={[makeAdventure("adv-1")]}
        votedAdventureIds={[]}
        bookmarkedAdventureIds={[]}
      />,
    );
    expect(screen.getByText(/all adventures loaded/i)).toBeTruthy();
  });
});
