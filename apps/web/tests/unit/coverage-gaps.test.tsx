// @vitest-environment jsdom
// Tests to fill specific coverage gaps in hooks and components
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

// ---------------------------------------------------------------------------
// useVote — 429 rate limit path (lines 36-40)
// ---------------------------------------------------------------------------
import { useVote } from "@/hooks/useVote";

describe("useVote — rate limit handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets rateLimitError on 429 response with retryAfter", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ retryAfter: 45 }), { status: 429 }),
    );
    const { result } = renderHook(() =>
      useVote({ adventureId: "adv-1", initialVoted: false, initialCount: 10 }),
    );
    act(() => {
      result.current.toggleVote();
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.rateLimitError).toContain("45s");
    // count rolled back
    expect(result.current.count).toBe(10);
  });

  it("sets default 60s retryAfter when body is unparseable", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("not json", { status: 429 }),
    );
    const { result } = renderHook(() =>
      useVote({ adventureId: "adv-1", initialVoted: false, initialCount: 5 }),
    );
    act(() => {
      result.current.toggleVote();
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.rateLimitError).toContain("60s");
  });
});

// ---------------------------------------------------------------------------
// ManageAdventureActions — delete and duplicate handlers (lines 19-37)
// ---------------------------------------------------------------------------
import { ManageAdventureActions } from "@/components/profile/manage-adventure-actions";

describe("ManageAdventureActions — delete and duplicate", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls DELETE API on delete confirmation", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<ManageAdventureActions adventureId="adv-1" published={false} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does not call API when delete is not confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ManageAdventureActions adventureId="adv-1" published={false} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls duplicate API on Dupe click", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<ManageAdventureActions adventureId="adv-1" published={false} />);
    fireEvent.click(screen.getByRole("button", { name: /dupe/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1/duplicate",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
