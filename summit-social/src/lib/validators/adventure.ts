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
  coverImageUrl: z.string().url(),
  albumUrl: z.string().url().optional(),
  albumPlatform: z.enum(["instagram", "google_photos", "flickr", "custom"]).optional(),
  highlights: z.array(z.string().max(500)).max(20).default([]),
  gear: z.array(z.string().max(200)).max(50).default([]),
  bestMonths: z.array(z.number().int().min(1).max(12)).max(12).default([]),
  estimatedCost: z.number().int().positive().optional(),
  gpxTrackUrl: z.string().url().optional(),
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

export const adventureFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z
    .enum([
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
    ])
    .optional(),
  continent: z.string().optional(),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"]).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["votes", "newest", "duration", "trending"]).default("votes"),
  duration: z
    .enum(["weekend", "week", "fortnight", "expedition", "peregrination", "lifestyle"])
    .optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  tag: z.string().max(50).optional(),
});

export type CreateAdventureInput = z.infer<typeof createAdventureSchema>;
export type AdventureFilterInput = z.infer<typeof adventureFilterSchema>;
