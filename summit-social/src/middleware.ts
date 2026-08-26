import { buildCsp } from "@/lib/security/csp";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

/**
 * Edge middleware with two jobs:
 *
 * 1. Per-request CSP script nonce on every document route. The nonce is set
 *    on the REQUEST headers so Next.js applies it to its own inline
 *    bootstrap scripts during SSR, and the same policy is set on the
 *    response so the browser enforces it.
 *
 * 2. Auth gating for member-only routes (redirect to /login), unchanged
 *    from the previous withAuth matcher.
 */

const PROTECTED = [
  /^\/itineraries(?:\/|$)/,
  /^\/bookmarks$/,
  /^\/adventures\/new$/,
  /^\/adventures\/[^/]+\/edit$/,
  /^\/profile\/edit$/,
];

const authGate = withAuth({ pages: { signIn: "/login" } });

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  if (PROTECTED.some((re) => re.test(request.nextUrl.pathname))) {
    // withAuth returns a redirect for unauthenticated visitors; authorized
    // requests fall through so the nonce still reaches SSR below.
    const gate = await (
      authGate as unknown as (req: NextRequest, ev: NextFetchEvent) => Promise<Response | undefined>
    )(request, event);
    if (gate && gate.status >= 300 && gate.status < 400) {
      gate.headers.set("content-security-policy", csp);
      return gate;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Document routes only: API responses and static assets carry no scripts.
  // The extension exclusion is anchored ($) so only paths ENDING in a static
  // extension skip the middleware — /itineraries/notes.txt must still hit the
  // auth gate and carry CSP.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)$).*)",
  ],
};
