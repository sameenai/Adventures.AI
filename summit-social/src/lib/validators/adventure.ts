import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { httpUrlSchema } from "@/lib/validators/user";
import { z } from "zod";

export const createAdventureSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  location: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  continent: z.enum([
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
  ]),
  category: z.enum([
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
  ]),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"]),
  durationDays: z.number().int().min(1).max(365),
  coverImageUrl: httpUrlSchema,
  albumUrl: httpUrlSchema.optional(),
  albumPlatform: z.enum(["instagram", "google_photos", "flickr", "custom"]).optional(),
  highlights: z.array(z.string().max(500)).max(20).default([]),
  gear: z.array(z.string().max(200)).max(50).default([]),
  bestMonths: z.array(z.number().int().min(1).max(12)).max(12).default([]),
  estimatedCost: z.number().int().positive().optional(),
  gpxTrackUrl: httpUrlSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateAdventureSchema = createAdventureSchema
  .partial()
  .omit({ tags: true })
  .extend({
    tags: z.array(z.string().max(50)).max(10).optional(),
  });

export type UpdateAdventureInput = z.infer<typeof updateAdventureSchema>;

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as unknown as [string, ...string[]];
const DIFFICULTY_VALUES = DIFFICULTIES.map((d) => d.value) as unknown as [string, ...string[]];
const CONTINENT_VALUES = [...CONTINENTS] as unknown as [string, ...string[]];

// Parses a comma-separated string into an array of validated enum values.
// Single values work without a comma. Invalid tokens cause a parse failure.
function multiEnum(values: [string, ...string[]]) {
  const single = z.enum(values);
  return z
    .string()
    .transform((s) => s.split(",").map((v) => v.trim()))
    .pipe(z.array(single).min(1))
    .optional();
}

export const adventureFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: multiEnum(CATEGORY_VALUES),
  continent: multiEnum(CONTINENT_VALUES),
  difficulty: multiEnum(DIFFICULTY_VALUES),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["votes", "newest", "duration", "trending"]).default("votes"),
  duration: multiEnum(["weekend", "week", "fortnight", "expedition", "peregrination", "lifestyle"]),
  month: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => n >= 1 && n <= 12),
    )
    .pipe(z.array(z.number().int().min(1).max(12)).min(1))
    .optional(),
  climate: multiEnum(["hot", "tropical", "arid", "temperate", "cold", "alpine", "polar"]),
  tag: z.string().max(50).optional(),
});

// Viewport query for the explore map. Longitudes are deliberately unbounded:
// Leaflet reports wrapped values (e.g. west=-200) when the map crosses the
// antimeridian or spans more than one world copy — the route normalises them.
export const adventureGeoSchema = z
  .object({
    west: z.coerce.number().finite(),
    south: z.coerce.number().finite().min(-90).max(90),
    east: z.coerce.number().finite(),
    north: z.coerce.number().finite().min(-90).max(90),
    zoom: z.coerce.number().int().min(1).max(18),
  })
  .refine((bounds) => bounds.south < bounds.north, {
    message: "south must be less than north",
  });

export type CreateAdventureInput = z.infer<typeof createAdventureSchema>;
export type AdventureFilterInput = z.infer<typeof adventureFilterSchema>;
export type AdventureGeoInput = z.infer<typeof adventureGeoSchema>;
