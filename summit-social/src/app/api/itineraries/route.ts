import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { createItinerarySchema } from "@/lib/validators/itinerary";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ userId }) => {
  const itineraries = await prisma.itinerary.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      _count: { select: { flightBookings: true } },
    },
  });

  return NextResponse.json(itineraries);
});

export const POST = withApi(
  { rateLimit: { name: "itineraryCreate", prefix: "itinerary-create" } },
  async ({ request, userId }) => {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const parsed = createItinerarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, description, startDate, endDate, budget, travellers } = parsed.data;

    const itinerary = await prisma.itinerary.create({
      data: {
        title: title ?? "Untitled Trip",
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget,
        travellers: travellers ?? 1,
        chatHistory: [],
        userId,
      },
    });

    return NextResponse.json(itinerary, { status: 201 });
  },
);
