// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

// Ensure DOM is cleaned up between every test
afterEach(() => cleanup());
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { RankBadge } from "@/components/leaderboard/rank-badge";
import { TrendArrow } from "@/components/leaderboard/trend-arrow";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { VoteButton } from "@/components/adventures/vote-button";

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------
describe("MessageBubble", () => {
  const userMessage = {
    id: "msg-1",
    role: "user" as const,
    content: "Plan a trip to Nepal",
    createdAt: new Date().toISOString(),
  };

  const assistantMessage = {
    id: "msg-2",
    role: "assistant" as const,
    content: "I'll help you plan a trip to Nepal!",
    createdAt: new Date().toISOString(),
  };

  it("renders user message content", () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText("Plan a trip to Nepal")).toBeInTheDocument();
  });

  it("renders assistant message content", () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText("I'll help you plan a trip to Nepal!")).toBeInTheDocument();
  });

  it("user message is right-aligned (justify-end)", () => {
    const { container } = render(<MessageBubble message={userMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("assistant message is left-aligned (justify-start)", () => {
    const { container } = render(<MessageBubble message={assistantMessage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });

  it("renders tool calls when present", () => {
    const msgWithTools = {
      ...assistantMessage,
      toolCalls: [
      { name: "search_flights", args: {}, result: null },
      { name: "get_weather", args: {}, result: null },
    ],
    };
    render(<MessageBubble message={msgWithTools} />);
    expect(screen.getByText("↳ search_flights")).toBeInTheDocument();
    expect(screen.getByText("↳ get_weather")).toBeInTheDocument();
  });

  it("does not render tool calls section when toolCalls is empty", () => {
    const msgNoTools = { ...assistantMessage, toolCalls: [] };
    render(<MessageBubble message={msgNoTools} />);
    expect(screen.queryByText(/↳/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------
describe("TypingIndicator", () => {
  it("renders 3 animated dots", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("is left-aligned", () => {
    const { container } = render(<TypingIndicator />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });
});

// ---------------------------------------------------------------------------
// RankBadge
// ---------------------------------------------------------------------------
describe("RankBadge", () => {
  it("renders the rank number", () => {
    render(<RankBadge rank={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("applies gold styling for rank 1", () => {
    const { container } = render(<RankBadge rank={1} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("amber-500");
  });

  it("applies silver styling for rank 2", () => {
    const { container } = render(<RankBadge rank={2} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("stone-500");
  });

  it("applies bronze styling for rank 3", () => {
    const { container } = render(<RankBadge rank={3} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("amber-800");
  });

  it("applies muted styling for rank > 3", () => {
    const { container } = render(<RankBadge rank={10} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("stone-700");
  });

  it("renders correct number for various ranks", () => {
    const { rerender } = render(<RankBadge rank={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();

    rerender(<RankBadge rank={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TrendArrow
// ---------------------------------------------------------------------------
describe("TrendArrow", () => {
  it("renders NEW label for 'new' trend", () => {
    render(<TrendArrow trend="new" />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("renders dash for 'stable' trend", () => {
    const { container } = render(<TrendArrow trend="stable" />);
    // &mdash; renders as em dash character
    expect(container.textContent).toContain("—");
  });

  it("renders up arrow for 'up' trend", () => {
    const { container } = render(<TrendArrow trend="up" />);
    expect(container.textContent).toContain("▲");
  });

  it("renders down arrow for 'down' trend", () => {
    const { container } = render(<TrendArrow trend="down" />);
    expect(container.textContent).toContain("▼");
  });

  it("applies green color for 'up' trend", () => {
    const { container } = render(<TrendArrow trend="up" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("green-500");
  });

  it("applies red color for 'down' trend", () => {
    const { container } = render(<TrendArrow trend="down" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("red-500");
  });
});

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------
describe("ErrorBoundary", () => {
  // Suppress console.error from React's error boundary
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) throw new Error("Test error");
    return <div>Safe content</div>;
  };

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders default error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("shows Try again button in default error UI", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("shows fallback message when thrown value has no message", () => {
    // Throwing a plain object (not an Error) results in error?.message === undefined,
    // which triggers the ?? "An unexpected error occurred." fallback (line 38).
    const ThrowingObject = () => {
      throw { name: "CustomError" }; // eslint-disable-line @typescript-eslint/only-throw-error
      // biome-ignore lint/correctness/noUnreachable: intentional for test
      return null;
    };
    render(
      <ErrorBoundary>
        <ThrowingObject />
      </ErrorBoundary>,
    );
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VoteButton
// ---------------------------------------------------------------------------
describe("VoteButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the vote count", () => {
    render(
      <VoteButton adventureId="adv-1" voteCount={42} hasVoted={false} />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows different aria-label when not voted", () => {
    render(<VoteButton adventureId="adv-1" voteCount={10} hasVoted={false} />);
    expect(screen.getByRole("button", { name: "Vote" })).toBeInTheDocument();
  });

  it("shows remove vote aria-label when already voted", () => {
    render(<VoteButton adventureId="adv-1" voteCount={10} hasVoted={true} />);
    expect(screen.getByRole("button", { name: "Remove vote" })).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <VoteButton adventureId="adv-1" voteCount={10} hasVoted={false} disabled={true} />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("shows sign in aria-label when disabled", () => {
    render(
      <VoteButton adventureId="adv-1" voteCount={10} hasVoted={false} disabled={true} />,
    );
    expect(screen.getByRole("button", { name: "Sign in to vote" })).toBeInTheDocument();
  });

  it("calls fetch when clicked", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ voted: true }), { status: 200 }),
    );

    render(<VoteButton adventureId="adv-1" voteCount={10} hasVoted={false} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/adventures/adv-1/vote", { method: "POST" });
    });
  });

  it("optimistically updates count on click", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ voted: true }), { status: 200 }),
    );

    render(<VoteButton adventureId="adv-1" voteCount={10} hasVoted={false} />);

    fireEvent.click(screen.getByRole("button"));

    // Count should be optimistically updated to 11
    expect(screen.getByText("11")).toBeInTheDocument();
  });
});
