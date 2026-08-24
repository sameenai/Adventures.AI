import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { searchFlights } from "@/lib/flights/aggregator";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Fare re-validation before money moves. Airline fares expire in minutes;
 * charging a stale price is how a travel product loses trust (and money).
 *
 * With flight providers configured, the stored offer is re-searched and must
 * still exist: found → PRICE_CONFIRMED at the current price (the response
 * says if it moved); gone → 409, the booking stays SELECTED. Demo mode
 * confirms at the stored price with verified:false so the flow is walkable
 * end-to-end; production without providers refuses (503) rather than
 * pretending a fabricated fare was checked.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `booking-reprice:${session.user.id}`,
    RATE_LIMITS.flightSearch.limit,
    RATE_LIMITS.flightSearch.windowSeconds,
    { failClosed: true },
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const booking = await prisma.flightBooking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }
  if (booking.status !== "SELECTED" && booking.status !== "PRICE_CONFIRMED") {
    return NextResponse.json(
      { error: `Cannot re-price a booking in status ${booking.status}`, code: "INVALID_STATE" },
      { status: 409 },
    );
  }

  const result = await searchFlights({
    origin: booking.origin,
    destination: booking.destination,
    departureDate: booking.departureAt.toISOString().slice(0, 10),
    passengers: 1,
    cabinClass: booking.cabinClass as "economy" | "premium_economy" | "business" | "first",
  });

  if ("providersUnavailable" in result && result.providersUnavailable) {
    return NextResponse.json(
      { error: "Fare verification is unavailable right now", code: "PROVIDERS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  // Mock offers (dev/demo) can never match a stored real offer by ref, so a
  // mock result set confirms at the stored price, explicitly unverified.
  const verified = !result.offers.some((o) => o.id.startsWith("mock-"));
  const match = verified
    ? result.offers.find(
        (o) =>
          o.flightNumber === booking.flightNumber &&
          o.departureAt === booking.departureAt.toISOString(),
      )
    : null;

  if (verified && !match) {
    return NextResponse.json(
      {
        error: "This fare is no longer available — search again for current prices",
        code: "FARE_GONE",
      },
      { status: 409 },
    );
  }

  const currentPrice = match?.priceGBP ?? booking.priceGBP;
  const updated = await prisma.flightBooking.update({
    where: { id: booking.id },
    data: { status: "PRICE_CONFIRMED", priceGBP: currentPrice },
  });

  return NextResponse.json({
    booking: updated,
    verified,
    priceChanged: currentPrice !== booking.priceGBP,
    previousPriceGBP: booking.priceGBP,
  });
}
