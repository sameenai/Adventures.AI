export const APP_NAME = "Basecamper";
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
  adventureMutate: { limit: 60, windowSeconds: 3600 },
  commentCreate: { limit: 30, windowSeconds: 3600 },
  follow: { limit: 60, windowSeconds: 3600 },
  itineraryCreate: { limit: 20, windowSeconds: 3600 },
  itineraryMutate: { limit: 60, windowSeconds: 3600 },
  collectionCreate: { limit: 20, windowSeconds: 3600 },
  collectionItems: { limit: 120, windowSeconds: 3600 },
  bookmark: { limit: 120, windowSeconds: 3600 },
  profileUpdate: { limit: 30, windowSeconds: 3600 },
  apiKeyUpdate: { limit: 10, windowSeconds: 3600 },
  notificationsMutate: { limit: 60, windowSeconds: 3600 },
  stripeCheckout: { limit: 5, windowSeconds: 3600 },
  userSearch: { limit: 60, windowSeconds: 3600 },
  commentReact: { limit: 120, windowSeconds: 3600 },
  adventureView: { limit: 300, windowSeconds: 3600 },
  analyticsCollect: { limit: 600, windowSeconds: 3600 },
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

export const DURATION_RANGES = {
  weekend: { gte: 1, lte: 3 },
  week: { gte: 4, lte: 7 },
  fortnight: { gte: 8, lte: 14 },
  expedition: { gte: 15, lte: 30 },
  peregrination: { gte: 31, lte: 90 },
  lifestyle: { gte: 91 },
} as const;

export type DurationKey = keyof typeof DURATION_RANGES;

export const CHAT_HISTORY_MAX_MESSAGES = 100;

// Bump when /terms materially changes; first sign-in after a bump re-stamps
// User.termsVersion via the auth signIn event.
export const TERMS_VERSION = "2026-08-24";

export const UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const PLANS = {
  FREE: {
    name: "Free",
    // Metered per message (not per session): a session-based credit was
    // bypassable by resuming an itinerary, leaving platform GPT-4o spend
    // uncapped. 60 messages ≈ five full planning sessions.
    aiMessagesPerMonth: 60,
    bookmarkLimit: 20,
    priceGBP: 0,
  },
  PRO: {
    name: "Pro",
    aiMessagesPerMonth: Number.POSITIVE_INFINITY,
    bookmarkLimit: Number.POSITIVE_INFINITY,
    priceGBP: 9,
  },
} as const;
