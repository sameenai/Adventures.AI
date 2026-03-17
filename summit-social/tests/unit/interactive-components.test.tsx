// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => "",
  }),
  useTransition: () => [false, (fn: () => void) => fn()],
}));

afterEach(cleanup);

// ---------------------------------------------------------------------------
// BookmarkButton
// ---------------------------------------------------------------------------
import { BookmarkButton } from "@/components/adventures/bookmark-button";

describe("BookmarkButton", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders as unsaved when isBookmarked=false", () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    expect(screen.getByRole("button", { name: /add to bucket list/i })).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("renders as saved when isBookmarked=true", () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={true} />);
    expect(screen.getByRole("button", { name: /remove from bucket list/i })).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("toggles to saved after a successful POST", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1/bookmark",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("toggles to unsaved after a successful DELETE", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("Save")).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1/bookmark",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does not change state when fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("is disabled when disabled prop is true", () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call fetch when disabled", async () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} disabled={true} />);
    fireEvent.click(screen.getByRole("button"));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ShareButtons
// ---------------------------------------------------------------------------
import { ShareButtons } from "@/components/adventures/share-buttons";

describe("ShareButtons", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders X share link and copy button", () => {
    render(<ShareButtons title="Nepal Trek" url="https://example.com/adv-1" />);
    expect(screen.getByRole("link", { name: /share on x/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeTruthy();
  });

  it("X link href contains encoded title and url", () => {
    render(<ShareButtons title="Nepal Trek" url="https://example.com/adv-1" />);
    const link = screen.getByRole("link", { name: /share on x/i }) as HTMLAnchorElement;
    expect(link.href).toContain("Nepal");
    expect(link.href).toContain("example.com");
  });

  it("calls clipboard.writeText with the url on copy click", async () => {
    render(<ShareButtons title="Nepal Trek" url="https://example.com/adv-1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com/adv-1");
  });

  it("shows 'Copied' text after clicking copy", async () => {
    render(<ShareButtons title="Nepal Trek" url="https://example.com/adv-1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });
    expect(screen.getByText("Copied")).toBeTruthy();
  });

  it("reverts to 'Copy link' after 2 seconds", async () => {
    render(<ShareButtons title="Nepal Trek" url="https://example.com/adv-1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });
    expect(screen.getByText("Copied")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2001);
    });
    expect(screen.getByText("Copy link")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// FollowButton
// ---------------------------------------------------------------------------
import { FollowButton } from "@/components/profile/follow-button";

describe("FollowButton", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 'Follow' button when not following", () => {
    render(<FollowButton userId="user-2" isFollowing={false} />);
    expect(screen.getByRole("button", { name: /^follow$/i })).toBeTruthy();
  });

  it("renders 'Following' button when following", () => {
    render(<FollowButton userId="user-2" isFollowing={true} />);
    expect(screen.getByRole("button", { name: /^following$/i })).toBeTruthy();
  });

  it("renders a link to /login when disabled", () => {
    render(<FollowButton userId="user-2" isFollowing={false} disabled={true} />);
    const link = screen.getByRole("link", { name: /follow/i }) as HTMLAnchorElement;
    expect(link.href).toContain("/login");
  });

  it("toggles to 'Following' after successful POST", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<FollowButton userId="user-2" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button", { name: /following/i })).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/user-2/follow",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("toggles to 'Follow' after successful DELETE", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<FollowButton userId="user-2" isFollowing={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button", { name: /^follow$/i })).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/user-2/follow",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does not change state when fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    render(<FollowButton userId="user-2" isFollowing={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /^follow$/i })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SearchFilter
// ---------------------------------------------------------------------------
import { SearchFilter } from "@/components/adventures/search-filter";

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "sortBy" ? "votes" : null),
    toString: () => "",
  }),
  useTransition: () => [false, (fn: () => void) => fn()],
}));

describe("SearchFilter", () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders search input and sort select", () => {
    render(<SearchFilter />);
    expect(screen.getByPlaceholderText(/search adventures/i)).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("debounces search and navigates after 300ms", () => {
    render(<SearchFilter />);
    fireEvent.change(screen.getByPlaceholderText(/search adventures/i), {
      target: { value: "nepal" },
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockRouterPush).toHaveBeenCalled();
    const call = mockRouterPush.mock.calls[0][0] as string;
    expect(call).toContain("search=nepal");
  });

  it("navigates immediately when sort changes", () => {
    render(<SearchFilter />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "newest" } });
    expect(mockRouterPush).toHaveBeenCalled();
    const call = mockRouterPush.mock.calls[0][0] as string;
    expect(call).toContain("sortBy=newest");
  });

  it("shows all sort options", () => {
    render(<SearchFilter />);
    const select = screen.getByRole("combobox");
    expect(select).toBeTruthy();
    expect(screen.getByText("Most Voted")).toBeTruthy();
    expect(screen.getByText("Trending")).toBeTruthy();
    expect(screen.getByText("Newest")).toBeTruthy();
    expect(screen.getByText("Shortest First")).toBeTruthy();
  });
});
