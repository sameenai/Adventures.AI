import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { isLegalStatusTransition, updateItinerarySchema } from "@/lib/validators/itinerary";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ userId, params }) => {
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: params.id, userId },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      flightBookings: { orderBy: { departureAt: "asc" } },
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(itinerary);
});

export const PATCH = withApi(
  { rateLimit: { name: "itineraryMutate", prefix: "itinerary:mutate" } },
  async ({ request, userId, params }) => {
    const { id } = params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id, userId },
      select: { id: true, status: true },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const parsed = updateItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, description, status, startDate, endDate, budget, travellers } = parsed.data;

    if (status !== undefined && !isLegalStatusTransition(itinerary.status, status)) {
      return NextResponse.json(
        {
          error: `Cannot move itinerary from ${itinerary.status} to ${status}`,
          code: "ILLEGAL_TRANSITION",
        },
        { status: 409 },
      );
    }

    const updated = await prisma.itinerary.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(budget !== undefined && { budget }),
        ...(travellers !== undefined && { travellers }),
      },
      include: {
        days: { orderBy: { dayNumber: "asc" } },
      },
    });

    return NextResponse.json(updated);
  },
);

export const DELETE = withApi(
  { rateLimit: { name: "itineraryMutate", prefix: "itinerary:mutate" } },
  async ({ userId, params }) => {
    const { id } = params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id, userId },
      select: { id: true },
    });

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    await prisma.itinerary.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  },
);
