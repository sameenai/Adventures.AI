export const APP_NAME = "Basecamp";
export const APP_DESCRIPTION =
  "The expedition platform for serious adventurers. Discover world-class routes, plan trips with AI, and share your journeys.";
export const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const RATE_LIMITS = {
  chat: { limit: 30, windowSeconds: 3600 },
  vote: { limit: 60, windowSeconds: 3600 },
  flightSearch: { limit: 20, windowSeconds: 3600 },
  adventureCreate: { limit: 10, windowSeconds: 3600 },
  commentCreate: { limit: 30, windowSeconds: 3600 },
} as const;

export const CACHE_TTL = {
  flightResults: 900,
  leaderboardTop: 300,
  adventureCounts: 600,
} as const;

export const CATEGORIES = [
  { value: "TREKKING", label: "Trekking" },
  { value: "MOUNTAINEERING", label: "Mountaineering" },
  { value: "CYCLING", label: "Cycling" },
  { value: "KAYAKING", label: "Kayaking" },
  { value: "DIVING", label: "Diving" },
  { value: "SAFARI", label: "Safari" },
  { value: "SKIING", label: "Skiing" },
  { value: "SURFING", label: "Surfing" },
  { value: "ROAD_TRIP", label: "Road Trip" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "MULTI_SPORT", label: "Multi-Sport" },
  { value: "EXPEDITION", label: "Expedition" },
] as const;

export const CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

export const DIFFICULTIES = [
  { value: "EASY", label: "Easy", color: "text-emerald-400" },
  { value: "MODERATE", label: "Moderate", color: "text-amber-400" },
  { value: "CHALLENGING", label: "Challenging", color: "text-orange-400" },
  { value: "EXTREME", label: "Extreme", color: "text-red-400" },
  { value: "EXPEDITION_GRADE", label: "Expedition Grade", color: "text-purple-400" },
] as const;

export const UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const PLANS = {
  FREE: {
    name: "Free",
    aiCreditsPerMonth: 5,
    bookmarkLimit: 20,
    priceGBP: 0,
  },
  PRO: {
    name: "Pro",
    aiCreditsPerMonth: Number.POSITIVE_INFINITY,
    bookmarkLimit: Number.POSITIVE_INFINITY,
    priceGBP: 9,
  },
} as const;
