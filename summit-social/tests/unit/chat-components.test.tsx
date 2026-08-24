// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------
const { replaceMock, searchParamsState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsState: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/itinerary",
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ChatWindow } from "@/components/chat/chat-window";

beforeAll(() => {
  // jsdom has no scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  replaceMock.mockReset();
  searchParamsState.value = "";
});

function makeStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(readable, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

// ---------------------------------------------------------------------------
// ChatWindow — resume flow
// ---------------------------------------------------------------------------
describe("ChatWindow resume flow", () => {
  const initialMessages = [
    {
      id: "h-0",
      role: "user" as const,
      content: "Plan Nepal",
      createdAt: new Date().toISOString(),
    },
    {
      id: "h-1",
      role: "assistant" as const,
      content: "Here is your Nepal plan",
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders the reloaded history instead of the empty state", () => {
    render(<ChatWindow itineraryId="itin-77" initialMessages={initialMessages} />);
    expect(screen.getByText("Plan Nepal")).toBeInTheDocument();
    expect(screen.getByText("Here is your Nepal plan")).toBeInTheDocument();
    expect(screen.queryByText(/plan your expedition/i)).not.toBeInTheDocument();
  });

  it("shows the session header linking to the resumed itinerary", () => {
    render(<ChatWindow itineraryId="itin-77" initialMessages={initialMessages} />);
    const link = screen.getByText(/view itinerary/i).closest("a");
    expect(link?.getAttribute("href")).toBe("/itinerary/itin-77");
  });

  it("sends the resumed itineraryId with every POST", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(makeStreamResponse("More"));
    render(<ChatWindow itineraryId="itin-77" initialMessages={initialMessages} />);

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "add a rest day" } });
    fireEvent.submit(screen.getByLabelText("Message").closest("form")!);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.itineraryId).toBe("itin-77");
    expect(body.message).toBe("add a rest day");
  });
});

// ---------------------------------------------------------------------------
// ChatWindow — 402 upsell
// ---------------------------------------------------------------------------
describe("ChatWindow limit upsell", () => {
  it("renders a real Upgrade to Pro link when the server answers 402", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "Monthly AI message limit reached",
          code: "UPGRADE_REQUIRED",
          creditsLimit: 5,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<ChatWindow />);

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "one more plan" } });
    fireEvent.submit(screen.getByLabelText("Message").closest("form")!);

    const upgrade = await screen.findByText("Upgrade to Pro");
    expect(upgrade.closest("a")?.getAttribute("href")).toBe("/pro");
    expect(screen.getByText(/monthly limit reached/i)).toBeInTheDocument();
    expect(screen.getByText(/all 5 of/i)).toBeInTheDocument();
    // No markdown error bubble is injected
    expect(screen.queryByText(/\[Upgrade to Pro\]/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ChatWindow — auto-send prompt hygiene
// ---------------------------------------------------------------------------
describe("ChatWindow initial prompt", () => {
  it("auto-sends once and strips ?prompt= from the URL, keeping other params", async () => {
    searchParamsState.value = "prompt=Plan%20Nepal&resume=itin-3";
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(makeStreamResponse("ok"));

    render(<ChatWindow initialPrompt="Plan Nepal" />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.message).toBe("Plan Nepal");

    expect(replaceMock).toHaveBeenCalledWith("/itinerary?resume=itin-3", { scroll: false });
  });

  it("drops the query string entirely when prompt was the only param", async () => {
    searchParamsState.value = "prompt=Plan%20Nepal";
    vi.spyOn(global, "fetch").mockResolvedValue(makeStreamResponse("ok"));

    render(<ChatWindow initialPrompt="Plan Nepal" />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/itinerary", { scroll: false }));
  });

  it("does not touch the URL when there is no initial prompt", () => {
    render(<ChatWindow />);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
