import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const CATEGORY_VALUES = [
  "TREKKING",
  "MOUNTAINEERING",
  "CYCLING",
  "KAYAKING",
  "DIVING",
  "SAFARI",
  "SKIING",
  "SURFING",
  "ROAD_TRIP",
  "CULTURAL",
  "MULTI_SPORT",
  "EXPEDITION",
] as const;
const DIFFICULTY_VALUES = [
  "EASY",
  "MODERATE",
  "CHALLENGING",
  "EXTREME",
  "EXPEDITION_GRADE",
] as const;

const travelerProfileSchema = z.object({
  homeAirport: z
    .string()
    .regex(/^[A-Z]{3}$/, "IATA code (e.g. LHR)")
    .nullable()
    .optional(),
  homeCountry: z.string().max(80).nullable().optional(),
  preferredCategories: z.array(z.enum(CATEGORY_VALUES)).max(12).optional(),
  maxDifficulty: z.enum(DIFFICULTY_VALUES).nullable().optional(),
  typicalDurationDays: z.number().int().min(1).max(120).nullable().optional(),
  budgetBandPence: z.number().int().min(0).nullable().optional(),
  cadenceMonths: z.number().int().min(1).max(24).optional(),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).nullable().optional(),
  // Marketing-email consent lives on User, not the profile — carried here so
  // one form saves the whole cadence setup in a single request.
  emailOptIn: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  const [profile, user] = await Promise.all([
    prisma.travelerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { marketingConsent: true },
    }),
  ]);
  return NextResponse.json({ profile, emailOptIn: user?.marketingConsent ?? false });
}

/** Stated preferences: the cadence engine's highest-quality input. */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `traveler-profile:${session.user.id}`,
    RATE_LIMITS.profileUpdate.limit,
    RATE_LIMITS.profileUpdate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = travelerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { emailOptIn, ...data } = parsed.data;
  const profile = await prisma.travelerProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  if (emailOptIn !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        marketingConsent: emailOptIn,
        // The consent timestamp records when consent was GIVEN; withdrawal
        // keeps the historic grant date alongside consent=false.
        ...(emailOptIn ? { marketingConsentAt: new Date() } : {}),
      },
    });
  }

  return NextResponse.json({ profile, ...(emailOptIn !== undefined ? { emailOptIn } : {}) });
}
