import { useChat } from "@/hooks/useChat";
// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
// Tests
// ---------------------------------------------------------------------------
describe("useChat", () => {
  it("initialises with empty messages", () => {
    const { result } = renderHook(() => useChat({}));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.input).toBe("");
  });

  it("initialises with provided messages", () => {
    const initial = [
      { id: "m1", role: "user" as const, content: "Hello", createdAt: new Date().toISOString() },
    ];
    const { result } = renderHook(() => useChat({ initialMessages: initial }));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe("Hello");
  });

  it("setInput updates input state", () => {
    const { result } = renderHook(() => useChat({}));
    act(() => {
      result.current.setInput("hello world");
    });
    expect(result.current.input).toBe("hello world");
  });

  it("adds user message when sendMessage is called", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(makeStreamResponse("Hi there"));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("Plan my trip");
    });

    const userMsg = result.current.messages.find((m) => m.role === "user");
    expect(userMsg?.content).toBe("Plan my trip");
  });

  it("appends streaming assistant message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(makeStreamResponse("Hello! "));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    const assistantMsg = result.current.messages.find((m) => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toContain("Hello!");
  });

  it("sets isStreaming=true during streaming", async () => {
    let streamResolve: (v: Response) => void;
    const streamPromise = new Promise<Response>((res) => {
      streamResolve = res;
    });

    vi.spyOn(global, "fetch").mockReturnValueOnce(streamPromise);

    const { result } = renderHook(() => useChat({}));

    act(() => {
      result.current.sendMessage("hi");
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => {
      streamResolve!(makeStreamResponse("done"));
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
  });

  it("adds error message when fetch fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    const errorMsg = result.current.messages.at(-1);
    expect(errorMsg?.role).toBe("assistant");
    expect(errorMsg?.content).toContain("Network error");
    expect(errorMsg?.isError).toBe(true);
  });

  it("adds error message when response is not ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(null, { status: 500 }));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    const errorMsg = result.current.messages.at(-1);
    expect(errorMsg?.role).toBe("assistant");
    expect(errorMsg?.content).toContain("failed (500)");
    expect(errorMsg?.isError).toBe(true);
  });

  it("includes api error message in error bubble when response body has error field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    const errorMsg = result.current.messages.at(-1);
    expect(errorMsg?.role).toBe("assistant");
    expect(errorMsg?.content).toBe("Unauthorized");
    expect(errorMsg?.isError).toBe(true);
  });

  it("sets limitReached on 402 UPGRADE_REQUIRED instead of adding an error bubble", async () => {
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

    const { result } = renderHook(() => useChat({}));
    expect(result.current.limitReached).toBe(false);

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.limitReached).toBe(true);
    expect(result.current.creditsLimit).toBe(5);
    expect(result.current.isStreaming).toBe(false);
    // The user's message stays, but no error/upsell text is injected into the transcript
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages.some((m) => m.isError)).toBe(false);
    expect(result.current.messages.some((m) => m.content.includes("/pro"))).toBe(false);
  });

  it("treats a 402 without UPGRADE_REQUIRED code as a normal error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.limitReached).toBe(false);
    const errorMsg = result.current.messages.at(-1);
    expect(errorMsg?.isError).toBe(true);
    expect(errorMsg?.content).toBe("Payment required");
  });

  it("posts to /api/chat with message content", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(makeStreamResponse("ok"));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("Plan Nepal trek");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Plan Nepal trek"),
      }),
    );
  });

  it("includes itineraryId in request when provided", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(makeStreamResponse("ok"));

    const { result } = renderHook(() => useChat({ itineraryId: "itin-123" }));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.itineraryId).toBe("itin-123");
  });

  it("sets isStreaming=false after completion regardless of error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("fail"));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it("adds error message when response body has no reader", async () => {
    // Simulate a response with a null body (no readable stream)
    const nullBodyResponse = new Response(null, { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(nullBodyResponse);

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    const errorMsg = result.current.messages.at(-1);
    expect(errorMsg?.role).toBe("assistant");
    expect(errorMsg?.content).toContain("No response body");
    expect(errorMsg?.isError).toBe(true);
  });

  it("accumulates multiple chunks from stream", async () => {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("Hello "));
        controller.enqueue(encoder.encode("World"));
        controller.close();
      },
    });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(readable, { status: 200 }));

    const { result } = renderHook(() => useChat({}));

    await act(async () => {
      await result.current.sendMessage("hi");
    });

    const assistantMsg = result.current.messages.find((m) => m.role === "assistant");
    expect(assistantMsg?.content).toContain("Hello");
    expect(assistantMsg?.content).toContain("World");
  });
});
