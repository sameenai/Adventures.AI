import type { ToolExecutionContext, ToolExecutor } from "@/lib/ai/chat-service";
import { CHAT_MODEL } from "@/lib/ai/model";
import { ItineraryDaySchema, SearchAdventuresArgsSchema } from "@/lib/ai/parser";
import { GEAR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { track } from "@/lib/analytics/track";
import { prisma } from "@/lib/db/prisma";
import { searchFlights } from "@/lib/flights/aggregator";
import { logger } from "@/lib/logger";
import { flightSearchSchema } from "@/lib/validators/flight";
import { z } from "zod";

/**
 * Real implementations for every tool declared in chatTools. The system
 * prompt promises these capabilities; a declared tool without an executor is
 * a lie the model turns into hallucinated flights, gear, and weather.
 */

const searchAdventures: ToolExecutor = async (rawArgs) => {
  const parsed = SearchAdventuresArgsSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({ success: false, results: [], error: "Invalid arguments" });
  }
  const a = parsed.data;

  const results = await prisma.adventure.findMany({
    where: {
      published: true,
      ...(a.category && { category: a.category as never }),
      ...(a.continent && { continent: a.continent }),
      ...(a.difficulty && { difficulty: a.difficulty as never }),
      ...(a.maxDuration && { durationDays: { lte: a.maxDuration } }),
      ...(a.query && {
        OR: [
          { title: { contains: a.query, mode: "insensitive" as const } },
          { description: { contains: a.query, mode: "insensitive" as const } },
          { location: { contains: a.query, mode: "insensitive" as const } },
          { country: { contains: a.query, mode: "insensitive" as const } },
        ],
      }),
    },
    take: 5,
    orderBy: { voteCount: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      country: true,
      category: true,
      difficulty: true,
      durationDays: true,
      description: true,
    },
  });

  return JSON.stringify({ success: true, results });
};

const searchAdventuresWithCapture: ToolExecutor = async (rawArgs, ctx) => {
  const result = await searchAdventures(rawArgs, ctx);
  // Demand capture: what people ask the AI for is the richest search signal.
  const parsed = SearchAdventuresArgsSchema.safeParse(rawArgs);
  if (parsed.success) {
    let resultCount: number | null = null;
    try {
      resultCount = (JSON.parse(result) as { results?: unknown[] }).results?.length ?? null;
    } catch {
      resultCount = null;
    }
    try {
      void prisma.searchEvent
        .create({
          data: {
            userId: ctx.userId,
            source: "CHAT",
            query: parsed.data.query ?? null,
            filters: {
              category: parsed.data.category,
              continent: parsed.data.continent,
              difficulty: parsed.data.difficulty,
              maxDuration: parsed.data.maxDuration,
            },
            resultCount,
          },
        })
        .catch(() => undefined);
    } catch {
      // Demand capture must never break the tool result.
    }
  }
  return result;
};

const createItineraryDay: ToolExecutor = async (rawArgs, ctx) => {
  const parsed = ItineraryDaySchema.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({ success: false, error: "Day does not match the required schema" });
  }
  const { dayNumber, title, description, activities } = parsed.data;

  const existing = await prisma.itineraryDay.findFirst({
    where: { itineraryId: ctx.itineraryId, dayNumber },
    select: { id: true },
  });

  if (existing) {
    await prisma.itineraryDay.update({
      where: { id: existing.id },
      data: { title, description, activities },
    });
  } else {
    await prisma.itineraryDay.create({
      data: { itineraryId: ctx.itineraryId, dayNumber, title, description, activities },
    });
  }
  return JSON.stringify({ success: true, dayNumber });
};

const searchFlightsTool: ToolExecutor = async (rawArgs) => {
  const parsed = flightSearchSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({
      success: false,
      error:
        "Invalid flight search arguments — origin/destination must be IATA codes and departureDate YYYY-MM-DD",
    });
  }

  const result = await searchFlights(parsed.data);
  if ("providersUnavailable" in result && result.providersUnavailable) {
    return JSON.stringify({
      success: false,
      error:
        "Flight search is currently unavailable. Tell the user you could not retrieve live fares — do not invent prices.",
    });
  }

  const offers = result.offers.slice(0, 5).map((offer) => ({
    airline: offer.airline,
    flightNumber: offer.flightNumber,
    departureAt: offer.departureAt,
    arrivalAt: offer.arrivalAt,
    durationMinutes: offer.durationMinutes,
    stops: offer.stops,
    priceGBP: offer.priceGBP,
    cabinClass: offer.cabinClass,
    bookingLink: offer.deepLink || null,
  }));

  return JSON.stringify({
    success: true,
    offers,
    note:
      offers.length === 0
        ? "No flights found for this route and dates."
        : "Real fares — quote them exactly; never adjust prices.",
  });
};

const isoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid datetime");

const saveFlightArgs = z.object({
  airline: z.string().min(1).max(100),
  flightNumber: z.string().min(1).max(20),
  origin: z.string().regex(/^[A-Z]{3}$/),
  destination: z.string().regex(/^[A-Z]{3}$/),
  departureAt: isoDateTime,
  arrivalAt: isoDateTime,
  priceGBP: z.number().int().positive(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
});

/**
 * The agentic booking step: persist a flight the user chose in chat against
 * their itinerary (status SELECTED) and advance DRAFT → PLANNING. Payment is
 * deliberately NOT agentic — the user confirms the fare and pays through
 * Stripe Checkout themselves; the agent only stages the booking.
 */
const saveFlight: ToolExecutor = async (rawArgs, ctx) => {
  const parsed = saveFlightArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({
      success: false,
      error: "Invalid flight details — only save offers exactly as returned by search_flights",
    });
  }
  const offer = parsed.data;

  const itinerary = await prisma.itinerary.findFirst({
    where: { id: ctx.itineraryId, userId: ctx.userId },
    select: { id: true, status: true },
  });
  if (!itinerary) {
    return JSON.stringify({ success: false, error: "Itinerary not found" });
  }

  track("flight_saved", {
    userId: ctx.userId,
    props: { via: "agent", route: `${offer.origin}-${offer.destination}` },
  });
  const booking = await prisma.flightBooking.create({
    data: {
      status: "SELECTED",
      provider: "chat",
      providerRef: `chat-${offer.flightNumber}-${offer.departureAt}`,
      origin: offer.origin,
      destination: offer.destination,
      departureAt: new Date(offer.departureAt),
      arrivalAt: new Date(offer.arrivalAt),
      airline: offer.airline,
      flightNumber: offer.flightNumber,
      priceGBP: offer.priceGBP,
      cabinClass: offer.cabinClass,
      userId: ctx.userId,
      itineraryId: itinerary.id,
    },
  });

  if (itinerary.status === "DRAFT") {
    await prisma.itinerary.update({
      where: { id: itinerary.id, userId: ctx.userId },
      data: { status: "PLANNING" },
    });
  }

  return JSON.stringify({
    success: true,
    bookingId: booking.id,
    note: "Flight saved to the trip. Tell the user to confirm the fare and pay from their itinerary page — do not claim it is booked or paid.",
  });
};

const suggestGearArgs = z.object({
  activity: z.string().min(1),
  conditions: z.string().min(1),
  duration: z.number().optional(),
});

const suggestGear: ToolExecutor = async (rawArgs, ctx: ToolExecutionContext) => {
  const parsed = suggestGearArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({ success: false, error: "Invalid gear arguments" });
  }
  const { activity, conditions, duration } = parsed.data;

  const completion = await ctx.client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: GEAR_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Recommend gear for: ${activity}. Conditions: ${conditions}.${
          duration ? ` Duration: ${duration} days.` : ""
        } Reply as a concise categorised list (safety first), max 20 items.`,
      },
    ],
    max_tokens: 500,
  });

  const recommendations = completion.choices[0]?.message?.content ?? "";
  return JSON.stringify({ success: true, recommendations });
};

const weatherArgs = z.object({
  destination: z.string().min(1),
  month: z.number().int().min(1).max(12),
});

interface GeocodeResult {
  results?: Array<{ latitude: number; longitude: number; name: string; country?: string }>;
}

interface ArchiveResult {
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

function mean(values: number[] | undefined): number | null {
  if (!values || values.length === 0) return null;
  const usable = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (usable.length === 0) return null;
  return Math.round((usable.reduce((a, b) => a + b, 0) / usable.length) * 10) / 10;
}

/** Historical weather normals from Open-Meteo (no API key required). */
const getWeatherForecast: ToolExecutor = async (rawArgs) => {
  const parsed = weatherArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return JSON.stringify({ success: false, error: "Invalid weather arguments" });
  }
  const { destination, month } = parsed.data;

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    const geo = (await geoRes.json()) as GeocodeResult;
    const place = geo.results?.[0];
    if (!place) {
      return JSON.stringify({ success: false, error: `Could not locate "${destination}"` });
    }

    const year = new Date().getUTCFullYear() - 1;
    const monthStr = String(month).padStart(2, "0");
    const archiveRes = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${place.latitude}&longitude=${place.longitude}&start_date=${year}-${monthStr}-01&end_date=${year}-${monthStr}-28&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=UTC`,
      { signal: AbortSignal.timeout(5000) },
    );
    const archive = (await archiveRes.json()) as ArchiveResult;

    const avgHighC = mean(archive.daily?.temperature_2m_max);
    const avgLowC = mean(archive.daily?.temperature_2m_min);
    const precip = archive.daily?.precipitation_sum ?? [];
    const totalPrecipitationMm =
      mean(precip) !== null ? Math.round(precip.reduce((a, b) => a + (b || 0), 0)) : null;

    if (avgHighC === null && avgLowC === null) {
      return JSON.stringify({ success: false, error: "No weather data available" });
    }

    return JSON.stringify({
      success: true,
      destination: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      month,
      avgHighC,
      avgLowC,
      totalPrecipitationMm,
      note: `Historical data for month ${month} of ${year} — treat as typical conditions, not a forecast.`,
    });
  } catch (err) {
    logger.warn("get_weather_forecast failed", err);
    return JSON.stringify({ success: false, error: "Weather lookup failed" });
  }
};

export const chatToolExecutors: Record<string, ToolExecutor> = {
  search_adventures: searchAdventuresWithCapture,
  create_itinerary_day: createItineraryDay,
  search_flights: searchFlightsTool,
  save_flight: saveFlight,
  suggest_gear: suggestGear,
  get_weather_forecast: getWeatherForecast,
};
