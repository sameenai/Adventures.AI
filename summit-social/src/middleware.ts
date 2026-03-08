import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.next();
  }

  const start = Date.now();
  const { method, nextUrl } = request;
  const path = nextUrl.pathname + (nextUrl.search ? nextUrl.search : "");

  const response = NextResponse.next();

  response.headers.set("x-request-start", String(start));

  // Log after response — Next.js middleware runs synchronously so we log on the way in.
  // Timing is best-effort (measures middleware overhead, not full handler duration).
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${method} ${path} +${ms}ms`);

  return response;
}

export const config = {
  // Run on all API routes only — avoids noise from static assets
  matcher: "/api/:path*",
};
