"use client";

import { useCallback, useRef, useState } from "react";

/** Default user-safe message when a mutation fails for an unrecognised reason. */
const GENERIC_MUTATION_ERROR = "Something went wrong — try again";

/** An error whose message was written for end users and is safe to render as-is. */
export class MutationError extends Error {}

export interface UseMutationOptions {
  /** User-safe message used when a failure carries no renderable message of its own. */
  fallbackError?: string;
}

export interface UseMutationResult<T, Args extends unknown[]> {
  /** Runs the mutation; resolves to its result, or undefined when it failed or was gated. */
  run: (...args: Args) => Promise<T | undefined>;
  /** True while a call is in flight. */
  busy: boolean;
  /** User-safe error string from the last run, or null. */
  error: string | null;
  /** Clears the error without running anything. */
  reset: () => void;
}

async function toUserSafeMessage(err: unknown, fallback: string): Promise<string> {
  if (err instanceof MutationError) return err.message;
  if (typeof Response !== "undefined" && err instanceof Response) {
    const body = (await err.json().catch(() => null)) as { error?: unknown } | null;
    if (body && typeof body.error === "string" && body.error) return body.error;
  }
  return fallback;
}

/**
 * Small client-side mutation wrapper: one in-flight call at a time, a `busy`
 * flag, and errors surfaced as a user-safe string — never thrown back into
 * the component.
 *
 * Error mapping: a thrown `MutationError` renders its own message; a thrown
 * `Response` renders its JSON `{error}` body when present; anything else
 * (network failures included) renders the generic fallback.
 */
export function useMutation<T, Args extends unknown[] = []>(
  fn: (...args: Args) => Promise<T>,
  options: UseMutationOptions = {},
): UseMutationResult<T, Args> {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latest-ref pattern: `run` keeps a stable identity while always invoking
  // the closure from the most recent render.
  const busyRef = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const fallbackRef = useRef(GENERIC_MUTATION_ERROR);
  fallbackRef.current = options.fallbackError ?? GENERIC_MUTATION_ERROR;

  const run = useCallback(async (...args: Args): Promise<T | undefined> => {
    if (busyRef.current) return undefined;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(await toUserSafeMessage(err, fallbackRef.current));
      return undefined;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { run, busy, error, reset };
}
