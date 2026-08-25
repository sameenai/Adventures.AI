// @vitest-environment jsdom
import { MutationError, useMutation } from "@/lib/client/use-mutation";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useMutation — busy gating", () => {
  it("starts idle with no error", () => {
    const { result } = renderHook(() => useMutation(async () => "ok"));
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets busy while a call is in flight and clears it after", async () => {
    const gate = deferred<string>();
    const { result } = renderHook(() => useMutation(() => gate.promise));

    let outcome: Promise<string | undefined> | undefined;
    act(() => {
      outcome = result.current.run();
    });
    expect(result.current.busy).toBe(true);

    gate.resolve("done");
    await act(async () => {
      await expect(outcome).resolves.toBe("done");
    });
    expect(result.current.busy).toBe(false);
  });

  it("allows only one in-flight call at a time", async () => {
    const gate = deferred<void>();
    const fn = vi.fn(() => gate.promise);
    const { result } = renderHook(() => useMutation(fn));

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    act(() => {
      first = result.current.run();
      second = result.current.run();
    });

    expect(fn).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBeUndefined();

    gate.resolve();
    await act(async () => {
      await first;
    });

    // A follow-up call runs again once the first has settled.
    await act(async () => {
      await result.current.run();
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("passes arguments through and resolves with the result", async () => {
    const fn = vi.fn(async (a: number, b: number) => a + b);
    const { result } = renderHook(() => useMutation(fn));

    let sum: number | undefined;
    await act(async () => {
      sum = await result.current.run(2, 3);
    });
    expect(sum).toBe(5);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});

describe("useMutation — error mapping", () => {
  it("never rejects: a throwing mutation resolves to undefined", async () => {
    const { result } = renderHook(() =>
      useMutation(async () => {
        throw new Error("internal stack trace stuff");
      }),
    );

    await act(async () => {
      await expect(result.current.run()).resolves.toBeUndefined();
    });
  });

  it("maps unknown errors to the generic user-safe message", async () => {
    const { result } = renderHook(() =>
      useMutation(async () => {
        throw new Error("ECONNRESET at TCPSocket.emit");
      }),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("Something went wrong — try again");
    expect(result.current.busy).toBe(false);
  });

  it("uses the configured fallbackError for unknown errors", async () => {
    const { result } = renderHook(() =>
      useMutation(
        async () => {
          throw new TypeError("Failed to fetch");
        },
        { fallbackError: "Network error — try again" },
      ),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("Network error — try again");
  });

  it("surfaces a MutationError message as-is", async () => {
    const { result } = renderHook(() =>
      useMutation(async () => {
        throw new MutationError("Bucket list full — upgrade to save more");
      }),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("Bucket list full — upgrade to save more");
  });

  it("reads the JSON {error} body from a thrown Response", async () => {
    const { result } = renderHook(() =>
      useMutation(async () => {
        throw new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
      }),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("Rate limit exceeded");
  });

  it("falls back to the generic message when a thrown Response has no {error} body", async () => {
    const { result } = renderHook(() =>
      useMutation(async () => {
        throw new Response("<html>upstream 502</html>", { status: 502 });
      }),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("Something went wrong — try again");
  });

  it("clears the previous error when a new run starts", async () => {
    let shouldFail = true;
    const gate = deferred<void>();
    const { result } = renderHook(() =>
      useMutation(async () => {
        if (shouldFail) throw new MutationError("first failure");
        await gate.promise;
      }),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("first failure");

    shouldFail = false;
    let second: Promise<unknown> | undefined;
    act(() => {
      second = result.current.run();
    });
    expect(result.current.error).toBeNull();

    gate.resolve();
    await act(async () => {
      await second;
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.error).toBeNull();
  });
});

describe("useMutation — reset", () => {
  it("clears the error without running the mutation", async () => {
    const fn = vi.fn(async () => {
      throw new MutationError("boom");
    });
    const { result } = renderHook(() => useMutation(fn));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe("boom");

    act(() => {
      result.current.reset();
    });
    expect(result.current.error).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
