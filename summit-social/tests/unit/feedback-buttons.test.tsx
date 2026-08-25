// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedbackButtons } from "@/components/chat/feedback-buttons";
import type { ChatMessage } from "@/types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function makeMessage(id: string, content = "Here is your itinerary."): ChatMessage {
  return { id, role: "assistant", content } as ChatMessage;
}

function stubFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("FeedbackButtons", () => {
  it("posts UP with the history index parsed from a resumed message id", async () => {
    const fetchMock = stubFetch(async () => new Response("{}", { status: 200 }));
    render(<FeedbackButtons itineraryId="itin-1" message={makeMessage("itin-1-4")} />);

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat/feedback");
    expect(JSON.parse(init?.body as string)).toEqual({
      itineraryId: "itin-1",
      messageIndex: 4,
      rating: "UP",
    });
    expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("resolves the index from persisted chatHistory for live-streamed ids", async () => {
    const content = "Day one: acclimatise in Kathmandu.";
    const fetchMock = stubFetch(async (url) => {
      if (url === "/api/itineraries/itin-2") {
        return new Response(
          JSON.stringify({
            chatHistory: [
              { role: "user", content: "plan nepal" },
              { role: "assistant", content },
              { role: "assistant", content: null },
              { role: "user", content: "thanks" },
              { role: "assistant", content: `  ${content}  ` },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    });
    render(<FeedbackButtons itineraryId="itin-2" message={makeMessage("random-uuid", content)} />);

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    // Searches from the end: the freshest occurrence (index 4) wins, and the
    // null-content assistant entry is skipped without crashing.
    const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(body.messageIndex).toBe(4);
  });

  it("posts nothing when the reply cannot be found in the history", async () => {
    const fetchMock = stubFetch(async (url) => {
      if (url.startsWith("/api/itineraries/")) {
        return new Response(JSON.stringify({ chatHistory: [{ role: "user", content: "hi" }] }), {
          status: 200,
        });
      }
      return new Response("{}", { status: 200 });
    });
    render(<FeedbackButtons itineraryId="itin-3" message={makeMessage("live-id", "unseen")} />);

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls.every(([url]) => url !== "/api/chat/feedback")).toBe(true);
  });

  it("reveals the comment form on DOWN and posts the trimmed comment", async () => {
    const fetchMock = stubFetch(async () => new Response("{}", { status: 200 }));
    render(<FeedbackButtons itineraryId="itin-4" message={makeMessage("itin-4-2")} />);

    fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
    const input = await screen.findByLabelText("Feedback comment");
    fireEvent.change(input, { target: { value: "  wrong month for trekking  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(body).toEqual({
      itineraryId: "itin-4",
      messageIndex: 2,
      rating: "DOWN",
      comment: "wrong month for trekking",
    });
    expect(screen.getByText("Thanks — noted.")).toBeTruthy();
    expect(screen.queryByLabelText("Feedback comment")).toBeNull();
  });

  it("does not submit an empty comment", async () => {
    const fetchMock = stubFetch(async () => new Response("{}", { status: 200 }));
    render(<FeedbackButtons itineraryId="itin-5" message={makeMessage("itin-5-1")} />);

    fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
    const input = await screen.findByLabelText("Feedback comment");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    // Only the DOWN rating itself was posted; the blank comment never was.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Feedback comment")).toBeTruthy();
    expect(screen.queryByText("Thanks — noted.")).toBeNull();
  });

  it("stays silent when the feedback POST fails", async () => {
    const fetchMock = stubFetch(async () => {
      throw new Error("network down");
    });
    render(<FeedbackButtons itineraryId="itin-6" message={makeMessage("itin-6-0")} />);

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Selection is optimistic and no error surfaces anywhere in the DOM.
    expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
