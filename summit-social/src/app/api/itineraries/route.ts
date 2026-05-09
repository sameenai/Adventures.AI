import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { createItinerarySchema } from "@/lib/validators/itinerary";
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

  const rl = await rateLimit(
    `itinerary-create:${session.user.id}`,
    RATE_LIMITS.itineraryCreate.limit,
    RATE_LIMITS.itineraryCreate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
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
      userId: session.user.id,
    },
  });

  return NextResponse.json(itinerary, { status: 201 });
}
