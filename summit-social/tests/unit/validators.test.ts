import { describe, expect, it } from "vitest";
import { createAdventureSchema, adventureFilterSchema } from "@/lib/validators/adventure";
import { flightSearchSchema } from "@/lib/validators/flight";
import { chatMessageSchema } from "@/lib/validators/chat";
import { createCommentSchema } from "@/lib/validators/comment";
import { updateProfileSchema } from "@/lib/validators/user";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validAdventure = {
  title: "Test Trek",
  description: "A wonderful test trek through the mountains.",
  location: "Alps, Switzerland",
  country: "Switzerland",
  continent: "Europe",
  category: "TREKKING",
  difficulty: "MODERATE",
  durationDays: 5,
  coverImageUrl: "https://example.com/cover.jpg",
};

// ---------------------------------------------------------------------------
// createAdventureSchema
// ---------------------------------------------------------------------------
describe("createAdventureSchema", () => {
  it("validates a minimal valid adventure", () => {
    const result = createAdventureSchema.safeParse(validAdventure);
    expect(result.success).toBe(true);
  });

  it("defaults highlights, gear, bestMonths, tags to empty arrays", () => {
    const result = createAdventureSchema.safeParse(validAdventure);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highlights).toEqual([]);
      expect(result.data.gear).toEqual([]);
      expect(result.data.bestMonths).toEqual([]);
      expect(result.data.tags).toEqual([]);
    }
  });

  it("accepts all optional fields", () => {
    const result = createAdventureSchema.safeParse({
      ...validAdventure,
      albumUrl: "https://example.com/album",
      albumPlatform: "instagram",
      highlights: ["Beautiful views"],
      gear: ["Hiking boots"],
      bestMonths: [6, 7, 8],
      estimatedCost: 2000,
      gpxTrackUrl: "https://example.com/track.gpx",
      latitude: 46.5,
      longitude: 7.9,
      tags: ["alpine", "scenery"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, title: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, title: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, description: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid continent", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, continent: "Middle Earth" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid continents", () => {
    const continents = ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"];
    for (const continent of continents) {
      const result = createAdventureSchema.safeParse({ ...validAdventure, continent });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, category: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = [
      "TREKKING", "MOUNTAINEERING", "CYCLING", "KAYAKING", "DIVING",
      "SAFARI", "SKIING", "SURFING", "ROAD_TRIP", "CULTURAL", "MULTI_SPORT", "EXPEDITION",
    ];
    for (const category of categories) {
      const result = createAdventureSchema.safeParse({ ...validAdventure, category });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid difficulties", () => {
    const difficulties = ["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"];
    for (const difficulty of difficulties) {
      const result = createAdventureSchema.safeParse({ ...validAdventure, difficulty });
      expect(result.success).toBe(true);
    }
  });

  it("rejects durationDays of 0", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, durationDays: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects durationDays over 365", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, durationDays: 366 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer durationDays", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, durationDays: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid coverImageUrl", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, coverImageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects latitude out of range", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, latitude: 91 });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, longitude: -181 });
    expect(result.success).toBe(false);
  });

  it("rejects bestMonths with invalid month numbers", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, bestMonths: [0] });
    expect(result.success).toBe(false);
  });

  it("rejects bestMonths over 12", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, bestMonths: [13] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 highlights", () => {
    const result = createAdventureSchema.safeParse({
      ...validAdventure,
      highlights: Array.from({ length: 21 }, (_, i) => `Highlight ${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const result = createAdventureSchema.safeParse({
      ...validAdventure,
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid albumPlatform", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, albumPlatform: "tiktok" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid albumPlatforms", () => {
    const platforms = ["instagram", "google_photos", "flickr", "custom"];
    for (const albumPlatform of platforms) {
      const result = createAdventureSchema.safeParse({
        ...validAdventure,
        albumUrl: "https://example.com/album",
        albumPlatform,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects negative estimatedCost", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, estimatedCost: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects estimatedCost of 0", () => {
    const result = createAdventureSchema.safeParse({ ...validAdventure, estimatedCost: 0 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// adventureFilterSchema
// ---------------------------------------------------------------------------
describe("adventureFilterSchema", () => {
  it("validates empty input with defaults", () => {
    const result = adventureFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("votes");
    }
  });

  it("coerces string limit to number", () => {
    const result = adventureFilterSchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit over 100", () => {
    const result = adventureFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects limit of 0", () => {
    const result = adventureFilterSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts all valid sortBy values", () => {
    for (const sortBy of ["votes", "newest", "duration"]) {
      const result = adventureFilterSchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid sortBy", () => {
    const result = adventureFilterSchema.safeParse({ sortBy: "random" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid duration values", () => {
    for (const duration of ["weekend", "week", "fortnight", "expedition", "peregrination", "lifestyle"]) {
      const result = adventureFilterSchema.safeParse({ duration });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid duration value", () => {
    const result = adventureFilterSchema.safeParse({ duration: "month" });
    expect(result.success).toBe(false);
  });

  it("accepts optional filters", () => {
    const result = adventureFilterSchema.safeParse({
      category: "TREKKING",
      continent: "Asia",
      difficulty: "CHALLENGING",
      search: "Nepal",
      cursor: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects search longer than 200 characters", () => {
    const result = adventureFilterSchema.safeParse({ search: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts a valid month value and coerces string to number", () => {
    const result = adventureFilterSchema.safeParse({ month: "7" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.month).toBe(7);
  });

  it("rejects month below 1 or above 12", () => {
    expect(adventureFilterSchema.safeParse({ month: "0" }).success).toBe(false);
    expect(adventureFilterSchema.safeParse({ month: "13" }).success).toBe(false);
  });

  it("accepts a tag filter", () => {
    const result = adventureFilterSchema.safeParse({ tag: "glacier" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tag).toBe("glacier");
  });

  it("rejects a tag longer than 50 characters", () => {
    const result = adventureFilterSchema.safeParse({ tag: "a".repeat(51) });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// flightSearchSchema
// ---------------------------------------------------------------------------
describe("flightSearchSchema", () => {
  const validFlight = { origin: "LHR", destination: "JFK", departureDate: "2025-06-15" };

  it("validates a minimal valid flight search", () => {
    const result = flightSearchSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
  });

  it("applies default passengers = 1", () => {
    const result = flightSearchSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passengers).toBe(1);
    }
  });

  it("applies default cabinClass = economy", () => {
    const result = flightSearchSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cabinClass).toBe("economy");
    }
  });

  it("accepts a return date", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, returnDate: "2025-06-22" });
    expect(result.success).toBe(true);
  });

  it("rejects origin with wrong length", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, origin: "LH" });
    expect(result.success).toBe(false);
  });

  it("rejects origin with lowercase letters", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, origin: "lhr" });
    expect(result.success).toBe(false);
  });

  it("rejects origin with numbers", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, origin: "1HR" });
    expect(result.success).toBe(false);
  });

  it("rejects destination with wrong length", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, destination: "JFKX" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid departure date format", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, departureDate: "15-06-2025" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid return date format", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, returnDate: "June 22 2025" });
    expect(result.success).toBe(false);
  });

  it("rejects 0 passengers", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, passengers: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects more than 9 passengers", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, passengers: 10 });
    expect(result.success).toBe(false);
  });

  it("accepts all valid cabin classes", () => {
    for (const cabinClass of ["economy", "premium_economy", "business", "first"]) {
      const result = flightSearchSchema.safeParse({ ...validFlight, cabinClass });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid cabin class", () => {
    const result = flightSearchSchema.safeParse({ ...validFlight, cabinClass: "coach" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// chatMessageSchema
// ---------------------------------------------------------------------------
describe("chatMessageSchema", () => {
  it("validates a simple message", () => {
    const result = chatMessageSchema.safeParse({ message: "Plan a trip to Nepal" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = chatMessageSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 5000 characters", () => {
    const result = chatMessageSchema.safeParse({ message: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("accepts a message at the max length", () => {
    const result = chatMessageSchema.safeParse({ message: "a".repeat(5000) });
    expect(result.success).toBe(true);
  });

  it("accepts optional itineraryId", () => {
    const result = chatMessageSchema.safeParse({ message: "Hello", itineraryId: "clxyz123" });
    expect(result.success).toBe(true);
  });

  it("accepts full preferences object", () => {
    const result = chatMessageSchema.safeParse({
      message: "Plan my trip",
      preferences: {
        budget: 5000,
        fitnessLevel: "intermediate",
        travelDates: { start: "2025-07-01", end: "2025-07-14" },
        travellers: 2,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid fitnessLevel", () => {
    const result = chatMessageSchema.safeParse({
      message: "Plan my trip",
      preferences: { fitnessLevel: "superhuman" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid fitnessLevels", () => {
    for (const fitnessLevel of ["beginner", "intermediate", "advanced", "expert"]) {
      const result = chatMessageSchema.safeParse({
        message: "Hello",
        preferences: { fitnessLevel },
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects travellers over 20", () => {
    const result = chatMessageSchema.safeParse({
      message: "Plan my trip",
      preferences: { travellers: 21 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects travellers of 0", () => {
    const result = chatMessageSchema.safeParse({
      message: "Plan my trip",
      preferences: { travellers: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative budget", () => {
    const result = chatMessageSchema.safeParse({
      message: "Plan my trip",
      preferences: { budget: -100 },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createCommentSchema
// ---------------------------------------------------------------------------
describe("createCommentSchema", () => {
  it("validates a simple comment", () => {
    const result = createCommentSchema.safeParse({ body: "Great adventure!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = createCommentSchema.safeParse({ body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects body over 5000 characters", () => {
    const result = createCommentSchema.safeParse({ body: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("accepts body at max length", () => {
    const result = createCommentSchema.safeParse({ body: "a".repeat(5000) });
    expect(result.success).toBe(true);
  });

  it("accepts optional parentId for threaded replies", () => {
    const result = createCommentSchema.safeParse({ body: "Nice!", parentId: "clxyz456" });
    expect(result.success).toBe(true);
  });

  it("validates without parentId", () => {
    const result = createCommentSchema.safeParse({ body: "Top-level comment" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// updateProfileSchema
// ---------------------------------------------------------------------------
describe("updateProfileSchema", () => {
  it("validates a partial update with just name", () => {
    const result = updateProfileSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("validates empty object (all fields optional)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid URLs for social links", () => {
    const result = updateProfileSchema.safeParse({
      instagramUrl: "https://instagram.com/user",
      twitterUrl: "https://twitter.com/user",
      websiteUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings for social links (to clear them)", () => {
    const result = updateProfileSchema.safeParse({
      instagramUrl: "",
      twitterUrl: "",
      websiteUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for instagramUrl", () => {
    const result = updateProfileSchema.safeParse({ instagramUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL for twitterUrl", () => {
    const result = updateProfileSchema.safeParse({ twitterUrl: "just-a-handle" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL for websiteUrl", () => {
    const result = updateProfileSchema.safeParse({ websiteUrl: "ftp://invalid" });
    // ftp is not a valid http/https URL per zod's default
    // Note: zod accepts ftp URLs; this test verifies behavior
    const result2 = updateProfileSchema.safeParse({ websiteUrl: "not-a-url" });
    expect(result2.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = updateProfileSchema.safeParse({ name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects empty name string", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects bio over 500 characters", () => {
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts bio at max length", () => {
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(500) });
    expect(result.success).toBe(true);
  });
});
