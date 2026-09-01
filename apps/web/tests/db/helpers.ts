import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

/** Order matters: children before parents (FKs without cascades on some). */
export async function truncateAll(): Promise<void> {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "CadenceRecommendation", "SearchEvent", "TripEvent", "TravelerProfile",
      "JobRun", "StripeEvent", "AdventureView", "CollectionItem", "Collection",
      "Notification", "FlightBooking", "ItineraryDay", "Itinerary",
      "Bookmark", "Follow", "CommentReaction", "Comment", "Vote",
      "_AdventureToTag", "Tag", "Adventure", "User"
    CASCADE
  `);
}

export async function createUser(email = "tester@example.com") {
  return db.user.create({ data: { email, name: email.split("@")[0] } });
}

let adventureCounter = 0;
export async function createAdventure(
  userId: string,
  overrides: Partial<{
    title: string;
    voteCount: number;
    durationDays: number;
    category: "TREKKING" | "CYCLING";
    published: boolean;
    bestMonths: number[];
    createdAt: Date;
  }> = {},
) {
  adventureCounter += 1;
  return db.adventure.create({
    data: {
      title: overrides.title ?? `Adventure ${adventureCounter}`,
      description: "A test adventure with a sufficiently long description body.",
      location: "Testville",
      country: "Testland",
      continent: "Asia",
      category: overrides.category ?? "TREKKING",
      difficulty: "MODERATE",
      durationDays: overrides.durationDays ?? 7,
      coverImageUrl: "https://images.example.com/cover.jpg",
      highlights: ["h1"],
      gear: ["g1"],
      bestMonths: overrides.bestMonths ?? [6, 7],
      estimatedCost: 100000,
      published: overrides.published ?? true,
      voteCount: overrides.voteCount ?? 0,
      userId,
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    },
  });
}
