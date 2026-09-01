import type { NextRequest } from "next/server";

/**
 * Client IP for anonymous rate limiting.
 *
 * X-Forwarded-For is client-forgeable except for the entry appended by the
 * trusted proxy in front of the app. Behind Cloud Run / Google Front Ends the
 * trustworthy client IP is the LAST entry, so spoofed leading hops cannot
 * mint fresh rate-limit identities. Locally there is no proxy and the header
 * is absent.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const hops = forwarded
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.at(-1) ?? "unknown";
}
