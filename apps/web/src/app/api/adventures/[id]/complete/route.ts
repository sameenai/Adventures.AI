import { track } from "@/lib/analytics/track";
import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
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
export const POST = withApi(
  { rateLimit: { name: "vote", prefix: "adventure:complete" } },
  async ({ request, userId, params }) => {
    const adventureId = params.id;

    // A missing or malformed body means "completed today" — never a 400.
    const body = await request.json().catch(() => ({}));
    const parsed = completeSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const adventure = await prisma.adventure.findUnique({
      where: { id: adventureId },
      select: { id: true, country: true, published: true },
    });
    if (!adventure || !adventure.published) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const startedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : new Date();
    track("trip_logged", { userId, props: { adventureId } });
    const event = await prisma.tripEvent.upsert({
      where: {
        userId_adventureId_source: {
          userId,
          adventureId,
          source: "MARKED_DONE",
        },
      },
      update: { startedAt },
      create: {
        userId,
        adventureId,
        source: "MARKED_DONE",
        destinationCountry: adventure.country,
        startedAt,
      },
    });

    return NextResponse.json({ completed: true, tripEventId: event.id }, { status: 201 });
  },
);

export const DELETE = withApi({}, async ({ userId, params }) => {
  await prisma.tripEvent.deleteMany({
    where: { userId, adventureId: params.id, source: "MARKED_DONE" },
  });
  return NextResponse.json({ completed: false });
});
