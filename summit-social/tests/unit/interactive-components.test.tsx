// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/adventures/adv-1",
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => "",
  }),
  useTransition: () => [false, (fn: () => void) => fn()],
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("renders a login link with callbackUrl when logged out (disabled prop)", () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} disabled={true} />);
    expect(screen.queryByRole("button")).toBeNull();
    const link = screen.getByRole("link", { name: /log in to save/i });
    expect(link).toHaveAttribute("href", "/login?callbackUrl=%2Fadventures%2Fadv-1");
  });

  it("does not call fetch when logged out", async () => {
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} disabled={true} />);
    fireEvent.click(screen.getByRole("link", { name: /log in to save/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows an upgrade prompt with a /pro link on 402 UPGRADE_REQUIRED", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 402 });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Bucket list full");
    expect(screen.getByRole("link", { name: /basecamper pro/i })).toHaveAttribute("href", "/pro");
    // Still not bookmarked
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("dismisses the upgrade prompt via its close button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 402 });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button", { name: /add to bucket list/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the add-to-collection affordance after a successful save", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("Saved to bucket list")).toBeTruthy());
    expect(screen.getByRole("button", { name: /add to collection\?/i })).toBeTruthy();
  });

  it("hides the add-to-collection affordance when dismissed", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("Saved to bucket list")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Saved to bucket list")).toBeNull();
  });

  it("does not show the add-to-collection affordance after unsaving", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<BookmarkButton adventureId="adv-1" isBookmarked={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("Save")).toBeTruthy());
    expect(screen.queryByText("Saved to bucket list")).toBeNull();
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
  usePathname: () => "/adventures/adv-1",
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
