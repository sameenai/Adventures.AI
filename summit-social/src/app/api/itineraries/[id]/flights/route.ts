import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid datetime");

const saveFlightSchema = z.object({
  provider: z.string().min(1).max(50),
  providerRef: z.string().min(1).max(200),
  origin: z.string().regex(/^[A-Z]{3}$/),
  destination: z.string().regex(/^[A-Z]{3}$/),
  departureAt: isoDateTime,
  arrivalAt: isoDateTime,
  airline: z.string().min(1).max(100),
  flightNumber: z.string().max(20).default(""),
  priceGBP: z.number().int().positive(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  deepLink: z.string().url().optional(),
  returnDepartureAt: isoDateTime.optional(),
  returnArrivalAt: isoDateTime.optional(),
});

/**
 * The first real booking write path: persists a selected flight offer
 * against the caller's itinerary as a FlightBooking (status SELECTED) and
 * advances the itinerary DRAFT → PLANNING. Later phases move the booking
 * through PRICE_CONFIRMED → PAID → TICKETED.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: itineraryId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `itinerary:mutate:${session.user.id}`,
    RATE_LIMITS.itineraryMutate.limit,
    RATE_LIMITS.itineraryMutate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Ownership before any write.
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId, userId: session.user.id },
    select: { id: true, status: true },
  });
  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveFlightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const offer = parsed.data;

  const booking = await prisma.flightBooking.create({
    data: {
      status: "SELECTED",
      provider: offer.provider,
      providerRef: offer.providerRef,
      origin: offer.origin,
      destination: offer.destination,
      departureAt: new Date(offer.departureAt),
      arrivalAt: new Date(offer.arrivalAt),
      airline: offer.airline,
      flightNumber: offer.flightNumber,
      priceGBP: offer.priceGBP,
      cabinClass: offer.cabinClass,
      deepLink: offer.deepLink ?? null,
      returnDepartureAt: offer.returnDepartureAt ? new Date(offer.returnDepartureAt) : null,
      returnArrivalAt: offer.returnArrivalAt ? new Date(offer.returnArrivalAt) : null,
      userId: session.user.id,
      itineraryId,
    },
  });

  // A trip with a selected flight is no longer a draft. Event-driven status:
  // DRAFT → PLANNING here; PLANNING → BOOKED when payment lands (phase 2).
  if (itinerary.status === "DRAFT") {
    await prisma.itinerary.update({
      where: { id: itineraryId, userId: session.user.id },
      data: { status: "PLANNING" },
    });
  }

  return NextResponse.json(booking, { status: 201 });
}
