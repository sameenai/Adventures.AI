import { track } from "@/lib/analytics/track";
import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
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
export const POST = withApi(
  { rateLimit: { name: "itineraryMutate", prefix: "itinerary:mutate" } },
  async ({ request, userId, params }) => {
    const itineraryId = params.id;

    // Ownership before any write.
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId, userId },
      select: { id: true, status: true },
    });
    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found", code: "NOT_FOUND" },
        { status: 404 },
      );
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

    track("flight_saved", {
      userId,
      props: { via: "ui", route: `${offer.origin}-${offer.destination}` },
    });
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
        userId,
        itineraryId,
      },
    });

    // A trip with a selected flight is no longer a draft. Event-driven status:
    // DRAFT → PLANNING here; PLANNING → BOOKED when payment lands (phase 2).
    if (itinerary.status === "DRAFT") {
      await prisma.itinerary.update({
        where: { id: itineraryId, userId },
        data: { status: "PLANNING" },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  },
);
