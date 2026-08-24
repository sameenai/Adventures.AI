import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
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

export const GET = withApi({}, async ({ userId }) => {
  const [profile, user] = await Promise.all([
    prisma.travelerProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { marketingConsent: true },
    }),
  ]);
  return NextResponse.json({ profile, emailOptIn: user?.marketingConsent ?? false });
});

/** Stated preferences: the cadence engine's highest-quality input. */
export const PUT = withApi(
  {
    rateLimit: { name: "profileUpdate", prefix: "traveler-profile" },
    schema: travelerProfileSchema,
  },
  async ({ userId, body }) => {
    const { emailOptIn, ...data } = body;
    const profile = await prisma.travelerProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    if (emailOptIn !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          marketingConsent: emailOptIn,
          // The consent timestamp records when consent was GIVEN; withdrawal
          // keeps the historic grant date alongside consent=false.
          ...(emailOptIn ? { marketingConsentAt: new Date() } : {}),
        },
      });
    }

    return NextResponse.json({ profile, ...(emailOptIn !== undefined ? { emailOptIn } : {}) });
  },
);
