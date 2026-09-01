import { track } from "@/lib/analytics/track";
import { withApi } from "@/lib/api/handler";
import { searchFlights } from "@/lib/flights/aggregator";
import { flightSearchSchema } from "@/lib/validators/flight";
import { NextResponse } from "next/server";

export const POST = withApi(
  { rateLimit: { name: "flightSearch", prefix: "flights", failClosed: true } },
  async ({ request, userId }) => {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const parsed = flightSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    track("flight_searched", {
      userId,
      props: { route: `${parsed.data.origin}-${parsed.data.destination}` },
    });
    const result = await searchFlights(parsed.data);
    return NextResponse.json(result);
  },
);
