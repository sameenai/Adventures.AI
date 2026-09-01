// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Shared mocks for the server-component page tests below
// ---------------------------------------------------------------------------
const { getServerSessionMock, prismaMock, chatWindowProps } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  prismaMock: {
    user: { findUnique: vi.fn() },
    itinerary: { findUnique: vi.fn() },
  },
  chatWindowProps: { current: null as Record<string, unknown> | null },
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
vi.mock("@/components/chat/chat-window", () => ({
  ChatWindow: (props: Record<string, unknown>) => {
    chatWindowProps.current = props;
    return <div data-testid="chat-window" />;
  },
}));
vi.mock("@/components/itinerary/map-view", () => ({
  MapView: ({ markers }: { markers: Array<{ lat: number; lng: number; label: string }> }) => (
    <div data-testid="map-view" data-markers={JSON.stringify(markers)} />
  ),
}));
vi.mock("@/components/itinerary/export-button", () => ({
  ExportButton: () => <button type="button">Export</button>,
}));

// ---------------------------------------------------------------------------
// DashboardError (src/app/(dashboard)/error.tsx)
// ---------------------------------------------------------------------------
import DashboardError from "@/app/(dashboard)/error";

describe("DashboardError", () => {
  it("renders the error message", () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("Database connection failed")} reset={reset} />);
    expect(screen.getByText("Database connection failed")).toBeTruthy();
  });

  it("calls reset when Try Again is clicked", () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("oops")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows fallback text when error has no message", () => {
    const reset = vi.fn();
    const err = new Error("");
    render(<DashboardError error={err} reset={reset} />);
    expect(screen.getByText(/unexpected error occurred/i)).toBeTruthy();
  });

  it("logs the error to console on mount", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("log me");
    render(<DashboardError error={err} reset={vi.fn()} />);
    expect(spy).toHaveBeenCalledWith(err);
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// GlobalError (src/app/global-error.tsx)
// ---------------------------------------------------------------------------
import GlobalError from "@/app/global-error";

describe("GlobalError", () => {
  it("renders 'Basecamper is unavailable' heading", () => {
    render(<GlobalError error={new Error("fatal")} reset={vi.fn()} />);
    expect(screen.getByText(/basecamper is unavailable/i)).toBeTruthy();
  });

  it("renders Try Again button and calls reset on click", () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error("fatal")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows digest reference when error has a digest", () => {
    const err = Object.assign(new Error("fatal"), { digest: "abc123" });
    render(<GlobalError error={err} reset={vi.fn()} />);
    expect(screen.getByText(/abc123/)).toBeTruthy();
  });

  it("does not show reference block when no digest", () => {
    render(<GlobalError error={new Error("fatal")} reset={vi.fn()} />);
    expect(screen.queryByText(/reference:/i)).toBeNull();
  });

  it("logs the error to console on mount", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    render(<GlobalError error={err} reset={vi.fn()} />);
    expect(spy).toHaveBeenCalledWith(err);
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// ItineraryPage (src/app/(dashboard)/itinerary/page.tsx) — resume flow
// ---------------------------------------------------------------------------
import ItineraryPage from "@/app/(dashboard)/itinerary/page";

describe("ItineraryPage resume flow", () => {
  const freeUser = {
    plan: "FREE",
    aiCreditsUsed: 0,
    aiCreditsResetAt: new Date(),
    openAiApiKey: null,
  };

  afterEach(() => {
    getServerSessionMock.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.itinerary.findUnique.mockReset();
    chatWindowProps.current = null;
  });

  it("loads the resumed itinerary ownership-scoped and passes displayable history to ChatWindow", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.user.findUnique.mockResolvedValue(freeUser);
    prismaMock.itinerary.findUnique.mockResolvedValue({
      id: "itin-1",
      updatedAt: new Date("2026-08-01T00:00:00Z"),
      chatHistory: [
        { role: "user", content: "Plan Nepal" },
        {
          role: "assistant",
          content: null,
          tool_calls: [{ id: "c1", type: "function", function: { name: "f", arguments: "{}" } }],
        },
        { role: "tool", content: '{"ok":true}', tool_call_id: "c1" },
        { role: "assistant", content: "Here is the plan" },
      ],
    });

    render(await ItineraryPage({ searchParams: Promise.resolve({ resume: "itin-1" }) }));

    expect(prismaMock.itinerary.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "itin-1", userId: "u1" } }),
    );
    const props = chatWindowProps.current!;
    expect(props.itineraryId).toBe("itin-1");
    const messages = props.initialMessages as Array<{ id: string; role: string; content: string }>;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: "user", content: "Plan Nepal" });
    expect(messages[1]).toMatchObject({ role: "assistant", content: "Here is the plan" });
    // Tool-call plumbing must never surface in the transcript
    expect(messages.some((m) => m.content.includes('"ok"'))).toBe(false);
  });

  it("starts fresh when the resume id does not belong to the caller", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "attacker" } });
    prismaMock.user.findUnique.mockResolvedValue(freeUser);
    prismaMock.itinerary.findUnique.mockResolvedValue(null);

    render(await ItineraryPage({ searchParams: Promise.resolve({ resume: "victims-itin" }) }));

    const props = chatWindowProps.current!;
    expect(props.itineraryId).toBeUndefined();
    expect(props.initialMessages).toEqual([]);
  });

  it("does not query itineraries when no resume param is present", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.user.findUnique.mockResolvedValue(freeUser);

    render(await ItineraryPage({ searchParams: Promise.resolve({}) }));

    expect(prismaMock.itinerary.findUnique).not.toHaveBeenCalled();
    expect(chatWindowProps.current!.itineraryId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ItineraryDetailPage (src/app/(dashboard)/itinerary/[id]/page.tsx)
// ---------------------------------------------------------------------------
import ItineraryDetailPage from "@/app/(dashboard)/itinerary/[id]/page";

describe("ItineraryDetailPage", () => {
  const baseItinerary = {
    id: "itin-9",
    title: "Nepal Trek",
    description: null,
    travellers: 1,
    budget: null,
    status: "DRAFT",
    flightBookings: [],
  };

  afterEach(() => {
    getServerSessionMock.mockReset();
    prismaMock.itinerary.findUnique.mockReset();
  });

  it("links the empty state to the planner with resume=<id> labeled Continue planning", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.itinerary.findUnique.mockResolvedValue({ ...baseItinerary, days: [] });

    render(await ItineraryDetailPage({ params: Promise.resolve({ id: "itin-9" }) }));

    const cta = screen.getByText("Continue planning").closest("a");
    expect(cta?.getAttribute("href")).toBe("/itinerary?resume=itin-9");
  });

  it("renders days through the timeline and mounts the map when activities carry coordinates", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.itinerary.findUnique.mockResolvedValue({
      ...baseItinerary,
      days: [
        {
          id: "d1",
          dayNumber: 1,
          title: "Arrival",
          description: "Land in Kathmandu",
          activities: [
            { time: "09:00", activity: "Landing", location: "KTM", lat: 27.7, lng: 85.3 },
          ],
        },
        {
          id: "d2",
          dayNumber: 2,
          title: "Hike Out",
          description: null,
          activities: [{ time: "08:00", activity: "Walk", location: "Hills" }],
        },
      ],
    });

    render(await ItineraryDetailPage({ params: Promise.resolve({ id: "itin-9" }) }));

    // Day cards via the shared timeline component
    expect(screen.getByText("Arrival")).toBeInTheDocument();
    expect(screen.getByText("Hike Out")).toBeInTheDocument();
    expect(screen.getByText("Landing")).toBeInTheDocument();

    // Map mounted with markers extracted from activity coordinates
    const map = screen.getByTestId("map-view");
    const markers = JSON.parse(map.getAttribute("data-markers")!);
    expect(markers).toEqual([{ lat: 27.7, lng: 85.3, label: "Day 1: Landing" }]);
  });

  it("omits the map when no activity has coordinates", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "u1" } });
    prismaMock.itinerary.findUnique.mockResolvedValue({
      ...baseItinerary,
      days: [
        {
          id: "d1",
          dayNumber: 1,
          title: "Arrival",
          description: null,
          activities: [{ time: "09:00", activity: "Landing", location: "KTM" }],
        },
      ],
    });

    render(await ItineraryDetailPage({ params: Promise.resolve({ id: "itin-9" }) }));

    expect(screen.queryByTestId("map-view")).toBeNull();
    expect(screen.getByText("Arrival")).toBeInTheDocument();
  });
});
