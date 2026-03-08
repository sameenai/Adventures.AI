// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useVote } from "@/hooks/useVote";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

// ---------------------------------------------------------------------------
// useFlightSearch
// ---------------------------------------------------------------------------
describe("useFlightSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const searchParams = {
    origin: "LHR",
    destination: "JFK",
    departureDate: "2025-08-01",
  };

  const mockOffers = [
    {
      id: "mock-0",
      provider: "amadeus",
      airline: "British Airways",
      flightNumber: "BA200",
      origin: "LHR",
      destination: "JFK",
      departureAt: "2025-08-01T08:30:00Z",
      arrivalAt: "2025-08-01T11:30:00Z",
      durationMinutes: 180,
      stops: 0,
      stopCities: [],
      priceGBP: 32000,
      currency: "GBP",
      cabinClass: "economy",
      deepLink: "",
      baggageIncluded: true,
    },
  ];

  it("initialises with empty offers, not loading, no error", () => {
    const { result } = renderHook(() => useFlightSearch());
    expect(result.current.offers).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading=true during search", async () => {
    let resolveSearch: (value: unknown) => void;
    const searchPromise = new Promise((res) => {
      resolveSearch = res;
    });

    vi.spyOn(global, "fetch").mockReturnValueOnce(searchPromise as Promise<Response>);

    const { result } = renderHook(() => useFlightSearch());

    act(() => {
      result.current.search(searchParams);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve to avoid hanging
    act(() => {
      resolveSearch!(new Response(JSON.stringify({ offers: [] }), { status: 200 }));
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("sets offers on successful search", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ offers: mockOffers }), { status: 200 }),
    );

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.search(searchParams);
    });

    expect(result.current.offers).toHaveLength(1);
    expect(result.current.offers[0].airline).toBe("British Airways");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failed search", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.search(searchParams);
    });

    expect(result.current.error).toBe("Unauthorized");
    expect(result.current.offers).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("sets generic error message on network failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.search(searchParams);
    });

    expect(result.current.error).toBe("Network failure");
    expect(result.current.offers).toEqual([]);
  });

  it("clears previous error on new search", async () => {
    vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ offers: mockOffers }), { status: 200 }),
      );

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => {
      await result.current.search(searchParams);
    });
    expect(result.current.error).toBe("fail");

    await act(async () => {
      await result.current.search(searchParams);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.offers).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// useVote
// ---------------------------------------------------------------------------
describe("useVote", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultOptions = {
    adventureId: "adv-1",
    initialVoted: false,
    initialCount: 10,
  };

  it("initialises with the provided voted state and count", () => {
    const { result } = renderHook(() => useVote(defaultOptions));
    expect(result.current.voted).toBe(false);
    expect(result.current.count).toBe(10);
  });

  it("initialises with voted=true when already voted", () => {
    const { result } = renderHook(() =>
      useVote({ ...defaultOptions, initialVoted: true }),
    );
    expect(result.current.voted).toBe(true);
  });

  it("optimistically increments count on toggle", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ voted: true }), { status: 200 }),
    );

    const { result } = renderHook(() => useVote(defaultOptions));

    act(() => {
      result.current.toggleVote();
    });

    // Optimistic update is synchronous
    expect(result.current.voted).toBe(true);
    expect(result.current.count).toBe(11);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("optimistically decrements count when un-voting", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ voted: false }), { status: 200 }),
    );

    const { result } = renderHook(() =>
      useVote({ ...defaultOptions, initialVoted: true, initialCount: 10 }),
    );

    act(() => {
      result.current.toggleVote();
    });

    expect(result.current.voted).toBe(false);
    expect(result.current.count).toBe(9);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("rolls back on API failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );

    const { result } = renderHook(() => useVote(defaultOptions));

    act(() => {
      result.current.toggleVote();
    });

    // Optimistic
    expect(result.current.voted).toBe(true);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Rolled back
    expect(result.current.voted).toBe(false);
    expect(result.current.count).toBe(10);
  });

  it("rolls back on network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useVote(defaultOptions));

    act(() => {
      result.current.toggleVote();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.voted).toBe(false);
    expect(result.current.count).toBe(10);
  });

  it("calls the correct API endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ voted: true }), { status: 200 }),
    );

    const { result } = renderHook(() => useVote(defaultOptions));

    act(() => {
      result.current.toggleVote();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/adventures/adv-1/vote", {
      method: "POST",
    });
  });
});

// ---------------------------------------------------------------------------
// useInfiniteScroll
// ---------------------------------------------------------------------------
describe("useInfiniteScroll", () => {
  it("initialises with provided items", () => {
    const fetchFn = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({ fetchFn, initialItems: [{ id: 1 }, { id: 2 }] }),
    );
    expect(result.current.items).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it("initialises with empty items when not provided", () => {
    const fetchFn = vi.fn();
    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));
    expect(result.current.items).toEqual([]);
  });

  it("loads more items on loadMore call", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ items: [{ id: 3 }, { id: 4 }], nextCursor: "cursor-2" });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchFn,
        initialItems: [{ id: 1 }, { id: 2 }],
        initialCursor: "cursor-1",
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.items).toHaveLength(4);
    expect(result.current.hasMore).toBe(true);
  });

  it("sets hasMore=false when no nextCursor returned", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce({ items: [{ id: 5 }], nextCursor: undefined });

    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
  });

  it("does not call fetchFn when loading is already true", async () => {
    let resolveFirst: (value: unknown) => void;
    const firstCall = new Promise((res) => { resolveFirst = res; });

    const fetchFn = vi.fn().mockReturnValueOnce(firstCall);

    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    // Start first load
    act(() => { result.current.loadMore(); });

    await waitFor(() => expect(result.current.loading).toBe(true));

    // Try second load while first is in progress
    await act(async () => { await result.current.loadMore(); });

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Cleanup
    act(() => { resolveFirst!({ items: [], nextCursor: undefined }); });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("does not call fetchFn when hasMore is false", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce({ items: [], nextCursor: undefined });

    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    // First call sets hasMore=false
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.hasMore).toBe(false);

    // Second call should be ignored
    await act(async () => { await result.current.loadMore(); });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("passes cursor to fetchFn", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce({ items: [], nextCursor: undefined });

    const { result } = renderHook(() =>
      useInfiniteScroll({ fetchFn, initialCursor: "page-2" }),
    );

    await act(async () => { await result.current.loadMore(); });

    expect(fetchFn).toHaveBeenCalledWith("page-2");
  });

  it("catches error and resets loading when fetchFn throws", async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error("Network failure"));
    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    await act(async () => { await result.current.loadMore(); });

    expect(result.current.loading).toBe(false);
    // items unchanged
    expect(result.current.items).toEqual([]);
  });

  it("sentinelRef observes a node and triggers loadMore on intersection", async () => {
    type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;
    let capturedCallback: IntersectionCallback | null = null;
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: IntersectionCallback) {
        capturedCallback = callback;
      }
      observe = mockObserve;
      unobserve = vi.fn();
      disconnect = mockDisconnect;
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const fetchFn = vi.fn().mockResolvedValue({ items: [{ id: 99 }], nextCursor: undefined });
    const { result, unmount } = renderHook(() => useInfiniteScroll({ fetchFn }));

    const node = document.createElement("div");
    act(() => { result.current.sentinelRef(node); });
    expect(mockObserve).toHaveBeenCalledWith(node);

    // Trigger intersection
    await act(async () => {
      capturedCallback!([{ isIntersecting: true } as IntersectionObserverEntry]);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Disconnect on unmount
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("sentinelRef disconnects previous observer when called with new node", () => {
    const mockDisconnect = vi.fn();
    const mockObserve = vi.fn();
    class MockIntersectionObserver {
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const fetchFn = vi.fn();
    const { result } = renderHook(() => useInfiniteScroll({ fetchFn }));

    const node1 = document.createElement("div");
    const node2 = document.createElement("div");
    act(() => { result.current.sentinelRef(node1); });
    act(() => { result.current.sentinelRef(node2); });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
