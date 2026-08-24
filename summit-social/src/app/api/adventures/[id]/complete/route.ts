import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const completeSchema = z.object({
  // When the trip happened; defaults to today. The cadence clock ticks from it.
  completedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
    .optional(),
});

/**
 * "I did this" — the logbook write that anchors the cadence clock and,
 * aggregated, becomes the adventurer's expedition record.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `adventure:complete:${session.user.id}`,
    RATE_LIMITS.vote.limit,
    RATE_LIMITS.vote.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = completeSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true, country: true, published: true },
  });
  if (!adventure || !adventure.published) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const startedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date();
  const event = await prisma.tripEvent.upsert({
    where: {
      userId_adventureId_source: {
        userId: session.user.id,
        adventureId,
        source: "MARKED_DONE",
      },
    },
    update: { startedAt },
    create: {
      userId: session.user.id,
      adventureId,
      source: "MARKED_DONE",
      destinationCountry: adventure.country,
      startedAt,
    },
  });

  return NextResponse.json({ completed: true, tripEventId: event.id }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  await prisma.tripEvent.deleteMany({
    where: { userId: session.user.id, adventureId, source: "MARKED_DONE" },
  });
  return NextResponse.json({ completed: false });
}
