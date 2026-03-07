import type { Category, Difficulty } from "@prisma/client";

export function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    email: `test-${Date.now()}@summitsocial.dev`,
    name: "Test User",
    ...overrides,
  };
}

export function buildAdventure(userId: string, overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Adventure",
    description: "A test adventure for unit testing purposes.",
    location: "Test Location",
    country: "United Kingdom",
    continent: "Europe",
    category: "TREKKING" as Category,
    difficulty: "MODERATE" as Difficulty,
    durationDays: 5,
    coverImageUrl: "https://example.com/image.jpg",
    highlights: ["Highlight 1"],
    gear: ["Boots"],
    bestMonths: [6, 7, 8],
    userId,
    published: true,
    ...overrides,
  };
}

export function buildFlightSearch(overrides: Record<string, unknown> = {}) {
  return {
    origin: "LHR",
    destination: "KTM",
    departureDate: "2025-06-15",
    passengers: 1,
    cabinClass: "economy" as const,
    ...overrides,
  };
}
