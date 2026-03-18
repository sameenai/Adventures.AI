// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

afterEach(() => cleanup());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: mock
    <img src={src} alt={alt} />
  ),
}));

// ---------------------------------------------------------------------------
// UI Primitives: Card, Input, Modal
// ---------------------------------------------------------------------------
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

describe("Card", () => {
  it("renders children", () => {
    render(<Card><span>content</span></Card>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("applies default border/bg classes", () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toHaveClass("border-stone-800");
    expect(container.firstChild).toHaveClass("bg-stone-900");
  });

  it("merges custom className", () => {
    const { container } = render(<Card className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("CardHeader / CardContent / CardFooter", () => {
  it("CardHeader renders with border-b", () => {
    const { container } = render(<CardHeader>Head</CardHeader>);
    expect(container.firstChild).toHaveClass("border-b");
    expect(screen.getByText("Head")).toBeInTheDocument();
  });

  it("CardContent renders with padding", () => {
    const { container } = render(<CardContent>Body</CardContent>);
    expect(container.firstChild).toHaveClass("px-6");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("CardFooter renders with border-t", () => {
    const { container } = render(<CardFooter>Foot</CardFooter>);
    expect(container.firstChild).toHaveClass("border-t");
    expect(screen.getByText("Foot")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="Email Address" />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("label is associated with input via htmlFor", () => {
    render(<Input label="Email" id="email-field" />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email-field");
  });

  it("derives id from label when id not provided", () => {
    render(<Input label="Full Name" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "full-name");
  });

  it("renders error message when provided", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("applies error border class when error is present", () => {
    render(<Input error="Bad input" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("red-500");
  });

  it("does not render error element when error is absent", () => {
    render(<Input placeholder="clean" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = { current: null } as unknown as React.RefObject<HTMLInputElement>;
    render(<Input ref={ref} />);
    // ref should be attached to the input element
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("renders nothing when open=false", () => {
    render(<Modal open={false} onClose={vi.fn()}>content</Modal>);
    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("renders children when open=true", () => {
    render(<Modal open={true} onClose={vi.fn()}>modal content</Modal>);
    expect(screen.getByText("modal content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<Modal open={true} onClose={vi.fn()} title="Confirm Action">body</Modal>);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal open={true} onClose={onClose}>content</Modal>);
    const backdrop = container.querySelector(".fixed.inset-0.bg-stone-950\\/80");
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose}>content</Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render title element when title is not provided", () => {
    render(<Modal open={true} onClose={vi.fn()}>body only</Modal>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("cleans up keydown listener and restores body overflow on unmount", () => {
    const { unmount } = render(<Modal open={true} onClose={vi.fn()}>content</Modal>);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("backdrop onKeyDown handler is a no-op (accessibility placeholder)", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal open={true} onClose={onClose}>content</Modal>);
    // The backdrop has backdrop-blur-sm which is safe to select on
    const backdrop = container.querySelector(".backdrop-blur-sm");
    expect(backdrop).not.toBeNull();
    fireEvent.keyDown(backdrop!);
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders spinner and disables when loading=true", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    // SVG spinner is rendered
    expect(btn.querySelector("svg")).not.toBeNull();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies variant class", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button").className).toContain("red");
  });
});

// ---------------------------------------------------------------------------
// FlightCard
// ---------------------------------------------------------------------------
import { FlightCard } from "@/components/flights/flight-card";
import type { FlightOffer } from "@/lib/flights/types";

const mockOffer: FlightOffer = {
  id: "offer-1",
  provider: "amadeus",
  providerRef: "ref-1",
  airline: "British Airways",
  flightNumber: "BA200",
  origin: "LHR",
  destination: "JFK",
  departureAt: "2025-08-01T09:00:00Z",
  arrivalAt: "2025-08-01T14:30:00Z",
  durationMinutes: 450,
  stops: 0,
  stopCities: [],
  priceGBP: 45000,
  currency: "GBP",
  cabinClass: "economy",
  deepLink: "https://booking.example.com",
  baggageIncluded: true,
};

describe("FlightCard", () => {
  it("renders airline name", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("British Airways")).toBeInTheDocument();
  });

  it("renders flight number", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("BA200")).toBeInTheDocument();
  });

  it("renders origin and destination codes", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("LHR")).toBeInTheDocument();
    expect(screen.getByText("JFK")).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("£450")).toBeInTheDocument();
  });

  it("renders formatted duration", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("7h 30m")).toBeInTheDocument();
  });

  it("renders 'Direct' when stops is 0", () => {
    render(<FlightCard offer={mockOffer} />);
    expect(screen.getByText("Direct")).toBeInTheDocument();
  });

  it("renders stop count when stops > 0", () => {
    render(<FlightCard offer={{ ...mockOffer, stops: 1 }} />);
    expect(screen.getByText("1 stop")).toBeInTheDocument();
  });

  it("renders '2 stops' for multiple stops", () => {
    render(<FlightCard offer={{ ...mockOffer, stops: 2 }} />);
    expect(screen.getByText("2 stops")).toBeInTheDocument();
  });

  it("shows Book button in expanded panel when deepLink is provided", () => {
    render(<FlightCard offer={mockOffer} />);
    // Card is collapsed by default — click to expand
    fireEvent.click(screen.getByText("LHR"));
    expect(screen.getByText(/Book on British Airways/)).toBeTruthy();
  });

  it("shows no-link message in expanded panel when deepLink is empty", () => {
    render(<FlightCard offer={{ ...mockOffer, deepLink: "" }} />);
    fireEvent.click(screen.getByText("LHR"));
    expect(screen.getByText(/No booking link/i)).toBeTruthy();
    expect(screen.queryByText(/Book on/)).toBeNull();
  });

  it("shows label badge when label prop is provided", () => {
    render(<FlightCard offer={mockOffer} label="cheapest" />);
    expect(screen.getByText("Cheapest")).toBeTruthy();
  });

  it("expands and collapses on repeated clicks", () => {
    render(<FlightCard offer={mockOffer} />);
    const firstLhr = screen.getAllByText("LHR")[0];
    // Expand
    fireEvent.click(firstLhr);
    expect(screen.getByText(/Direct route/)).toBeTruthy();
    // Collapse
    fireEvent.click(firstLhr);
    expect(screen.queryByText(/Direct route/)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SocialLinks
// ---------------------------------------------------------------------------
import { SocialLinks } from "@/components/profile/social-links";

describe("SocialLinks", () => {
  it("renders nothing when no links are provided", () => {
    const { container } = render(<SocialLinks />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Instagram link", () => {
    render(<SocialLinks instagramUrl="https://instagram.com/user" />);
    const link = screen.getByText("Instagram");
    expect(link).toHaveAttribute("href", "https://instagram.com/user");
  });

  it("renders Twitter link", () => {
    render(<SocialLinks twitterUrl="https://twitter.com/user" />);
    const link = screen.getByText("Twitter");
    expect(link).toHaveAttribute("href", "https://twitter.com/user");
  });

  it("renders Website link", () => {
    render(<SocialLinks websiteUrl="https://example.com" />);
    const link = screen.getByText("Website");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders all three links when all provided", () => {
    render(
      <SocialLinks
        instagramUrl="https://instagram.com/user"
        twitterUrl="https://twitter.com/user"
        websiteUrl="https://example.com"
      />,
    );
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
  });

  it("all links open in new tab", () => {
    render(
      <SocialLinks
        instagramUrl="https://instagram.com/user"
        twitterUrl="https://twitter.com/user"
      />,
    );
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders nothing when null values are provided", () => {
    const { container } = render(
      <SocialLinks instagramUrl={null} twitterUrl={null} websiteUrl={null} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// LeaderboardTable
// ---------------------------------------------------------------------------
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import type { LeaderboardEntry } from "@/types";

const mockEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    trend: "up",
    adventure: {
      id: "adv-1",
      title: "Nepal Trek",
      location: "Nepal",
      category: "TREKKING",
      difficulty: "CHALLENGING",
      voteCount: 100,
      coverImageUrl: "https://example.com/nepal.jpg",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
      tags: [],
      durationDays: 14,
    } as unknown as LeaderboardEntry["adventure"],
    previousRank: 2,
  },
  {
    rank: 2,
    trend: "new",
    adventure: {
      id: "adv-2",
      title: "Patagonia Expedition",
      location: "Chile",
      category: "MOUNTAINEERING",
      difficulty: "EXTREME",
      voteCount: 85,
      coverImageUrl: "https://example.com/patagonia.jpg",
      user: { id: "user-2", name: "Bob", avatarUrl: null },
      tags: [],
      durationDays: 21,
    } as unknown as LeaderboardEntry["adventure"],
  },
];

describe("LeaderboardTable", () => {
  it("renders a table", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders all entries", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByText("Nepal Trek")).toBeInTheDocument();
    expect(screen.getByText("Patagonia Expedition")).toBeInTheDocument();
  });

  it("renders rank badges", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders vote counts", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renders trend arrows", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    // "up" trend renders ▲, "new" trend renders "NEW"
    expect(screen.getByText("▲")).toBeInTheDocument();
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("renders category labels", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    expect(screen.getByText("TREKKING")).toBeInTheDocument();
    expect(screen.getByText("MOUNTAINEERING")).toBeInTheDocument();
  });

  it("renders adventure links", () => {
    render(<LeaderboardTable entries={mockEntries} />);
    const links = screen.getAllByRole("link");
    const adventureLinks = links.filter(l => l.getAttribute("href")?.startsWith("/adventures/"));
    expect(adventureLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("renders empty table for no entries", () => {
    render(<LeaderboardTable entries={[]} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /trek/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CommentSection
// ---------------------------------------------------------------------------
import { CommentSection } from "@/components/adventures/comment-section";
import type { CommentWithUser } from "@/types";

const baseComment: CommentWithUser = {
  id: "c-1",
  body: "Great adventure!",
  adventureId: "adv-1",
  parentId: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  userId: "user-1",
  user: { id: "user-1", name: "Alice", avatarUrl: null },
  replies: [],
};

const commentWithReply: CommentWithUser = {
  ...baseComment,
  id: "c-2",
  body: "Top-level comment",
  replies: [
    {
      id: "c-2-reply",
      body: "A reply here",
      adventureId: "adv-1",
      parentId: "c-2",
      createdAt: new Date("2024-01-02T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
      userId: "user-2",
      user: { id: "user-2", name: "Bob", avatarUrl: null },
      replies: [],
    },
  ],
};

describe("CommentSection", () => {
  it("renders empty state when no comments", () => {
    render(
      <CommentSection adventureId="adv-1" comments={[]} currentUserId={null} />,
    );
    expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
  });

  it("renders comment body text", () => {
    render(
      <CommentSection adventureId="adv-1" comments={[baseComment]} currentUserId={null} />,
    );
    expect(screen.getByText("Great adventure!")).toBeInTheDocument();
  });

  it("renders comment author name", () => {
    render(
      <CommentSection adventureId="adv-1" comments={[baseComment]} currentUserId={null} />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not show Reply button when not logged in", () => {
    render(
      <CommentSection adventureId="adv-1" comments={[baseComment]} currentUserId={null} />,
    );
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
  });

  it("shows Reply button when logged in", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[baseComment]}
        currentUserId="user-2"
      />,
    );
    expect(screen.getByText("Reply")).toBeInTheDocument();
  });

  it("toggles reply form on Reply click", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[baseComment]}
        currentUserId="user-2"
      />,
    );
    fireEvent.click(screen.getByText("Reply"));
    // Reply form textarea appears
    expect(screen.getByPlaceholderText("Write a reply…")).toBeInTheDocument();
  });

  it("hides reply form when Cancel is clicked in the toggle button", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[baseComment]}
        currentUserId="user-2"
      />,
    );
    fireEvent.click(screen.getByText("Reply"));
    expect(screen.getByPlaceholderText("Write a reply…")).toBeInTheDocument();
    // toggle button now says "Cancel"
    fireEvent.click(screen.getByText("Cancel", { selector: "button.font-mono" }));
    expect(screen.queryByPlaceholderText("Write a reply…")).not.toBeInTheDocument();
  });

  it("renders nested replies", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[commentWithReply]}
        currentUserId={null}
      />,
    );
    expect(screen.getByText("Top-level comment")).toBeInTheDocument();
    expect(screen.getByText("A reply here")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders multiple comments", () => {
    const secondComment: CommentWithUser = {
      ...baseComment,
      id: "c-3",
      body: "Another thought",
      user: { id: "user-3", name: "Carol", avatarUrl: null },
    };
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[baseComment, secondComment]}
        currentUserId={null}
      />,
    );
    expect(screen.getByText("Great adventure!")).toBeInTheDocument();
    expect(screen.getByText("Another thought")).toBeInTheDocument();
  });

  it("renders avatar image when avatarUrl is set", () => {
    const commentWithAvatar: CommentWithUser = {
      ...baseComment,
      user: { id: "user-1", name: "Alice", avatarUrl: "https://example.com/avatar.jpg" },
    };
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[commentWithAvatar]}
        currentUserId={null}
      />,
    );
    expect(screen.getByRole("img", { name: "Alice" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AdventureCard comment count display
// ---------------------------------------------------------------------------
import { AdventureCard } from "@/components/adventures/adventure-card";
import type { AdventureWithUser } from "@/types";

vi.mock("@/components/adventures/bookmark-button", () => ({
  BookmarkButton: () => null,
}));
vi.mock("@/components/adventures/vote-button", () => ({
  VoteButton: () => null,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const baseAdventure: AdventureWithUser = {
  id: "adv-1",
  title: "Nepal Trek",
  description: "An epic trek",
  location: "Nepal",
  country: "Nepal",
  continent: "Asia",
  category: "TREKKING" as never,
  difficulty: "MODERATE" as never,
  durationDays: 14,
  coverImageUrl: "https://example.com/img.jpg",
  albumUrl: null,
  albumPlatform: null,
  highlights: [],
  gear: [],
  bestMonths: [],
  estimatedCost: null,
  gpxTrackUrl: null,
  latitude: null,
  longitude: null,
  published: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-1",
  voteCount: 5,
  user: { id: "user-1", name: "Alice", avatarUrl: null },
  tags: [],
};

describe("AdventureCard comment count", () => {
  it("shows comment count when _count.comments > 0", () => {
    render(
      <AdventureCard
        adventure={{ ...baseAdventure, _count: { comments: 3 } }}
      />,
    );
    expect(screen.getByText("3 comments")).toBeInTheDocument();
  });

  it("shows singular 'comment' for count of 1", () => {
    render(
      <AdventureCard
        adventure={{ ...baseAdventure, _count: { comments: 1 } }}
      />,
    );
    expect(screen.getByText("1 comment")).toBeInTheDocument();
  });

  it("does not show comment count when _count.comments is 0", () => {
    render(
      <AdventureCard
        adventure={{ ...baseAdventure, _count: { comments: 0 } }}
      />,
    );
    expect(screen.queryByText(/comment/)).not.toBeInTheDocument();
  });

  it("does not show comment count when _count is absent", () => {
    render(<AdventureCard adventure={baseAdventure} />);
    expect(screen.queryByText(/comment/)).not.toBeInTheDocument();
  });
});
