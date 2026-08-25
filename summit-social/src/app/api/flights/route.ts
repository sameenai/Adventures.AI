import { track } from "@/lib/analytics/track";
import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/db/redis";
import { searchFlights } from "@/lib/flights/aggregator";
import { flightSearchSchema } from "@/lib/validators/flight";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { allowed, retryAfter } = await rateLimit(
    `flights:${session.user.id}`,
    RATE_LIMITS.flightSearch.limit,
    RATE_LIMITS.flightSearch.windowSeconds,
    { failClosed: true },
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const parsed = flightSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  track("flight_searched", {
    userId: session?.user?.id ?? undefined,
    props: { route: `${parsed.data.origin}-${parsed.data.destination}` },
  });
  const result = await searchFlights(parsed.data);
  return NextResponse.json(result);
}
