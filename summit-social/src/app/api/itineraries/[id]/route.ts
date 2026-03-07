import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
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

  const body = await request.json();

  const updated = await prisma.itinerary.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
      ...(body.budget !== undefined && { budget: body.budget }),
      ...(body.travellers && { travellers: body.travellers }),
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
