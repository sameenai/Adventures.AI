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

  const allowed = await rateLimit(
    `flights:${session.user.id}`,
    RATE_LIMITS.flightSearch.limit,
    RATE_LIMITS.flightSearch.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMITED" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = flightSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await searchFlights(parsed.data);
  return NextResponse.json(result);
}
