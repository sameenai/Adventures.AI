import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { updateItinerarySchema } from "@/lib/validators/itinerary";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { id, userId: session.user.id },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      flightBookings: { orderBy: { departureAt: "asc" } },
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(itinerary);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const parsed = updateItinerarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, description, status, startDate, endDate, budget, travellers } = parsed.data;

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
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.itinerary.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
