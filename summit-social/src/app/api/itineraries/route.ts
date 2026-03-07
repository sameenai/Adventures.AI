import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const itineraries = await prisma.itinerary.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      _count: { select: { flightBookings: true } },
    },
  });

  return NextResponse.json(itineraries);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();

  const itinerary = await prisma.itinerary.create({
    data: {
      title: body.title ?? "Untitled Trip",
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budget: body.budget,
      travellers: body.travellers ?? 1,
      chatHistory: [],
      userId: session.user.id,
    },
  });

  return NextResponse.json(itinerary, { status: 201 });
}
