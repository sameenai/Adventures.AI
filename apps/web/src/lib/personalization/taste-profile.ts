import { prisma } from "@/lib/db/prisma";

/**
 * Aggregated implicit-preference profile built from signals the platform was
 * already capturing but never reading: bookmarks (strongest intent), votes,
 * and views. Powers cadence recommendations, and later "For you" ranking.
 */
export interface TasteProfile {
  categories: Record<string, number>;
  continents: Record<string, number>;
  difficulties: Record<string, number>;
  medianDurationDays: number | null;
  signalCount: number;
}

const BOOKMARK_WEIGHT = 3;
const VOTE_WEIGHT = 2;
const VIEW_WEIGHT = 1;

type Signal = {
  category: string;
  continent: string;
  difficulty: string;
  durationDays: number;
  weight: number;
};

function accumulate(profile: TasteProfile, signals: Signal[], durations: number[]): void {
  for (const s of signals) {
    profile.categories[s.category] = (profile.categories[s.category] ?? 0) + s.weight;
    profile.continents[s.continent] = (profile.continents[s.continent] ?? 0) + s.weight;
    profile.difficulties[s.difficulty] = (profile.difficulties[s.difficulty] ?? 0) + s.weight;
    durations.push(s.durationDays);
    profile.signalCount += 1;
  }
}

const ADVENTURE_FACETS = {
  category: true,
  continent: true,
  difficulty: true,
  durationDays: true,
} as const;

export async function getTasteProfile(userId: string): Promise<TasteProfile> {
  const [bookmarks, votes, views] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      select: { adventure: { select: ADVENTURE_FACETS } },
      take: 200,
    }),
    prisma.vote.findMany({
      where: { userId },
      select: { adventure: { select: ADVENTURE_FACETS } },
      take: 200,
    }),
    prisma.adventureView.findMany({
      where: { userId },
      select: { adventure: { select: ADVENTURE_FACETS } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const profile: TasteProfile = {
    categories: {},
    continents: {},
    difficulties: {},
    medianDurationDays: null,
    signalCount: 0,
  };
  const durations: number[] = [];

  accumulate(
    profile,
    bookmarks.map((b) => ({ ...b.adventure, weight: BOOKMARK_WEIGHT })),
    durations,
  );
  accumulate(
    profile,
    votes.map((v) => ({ ...v.adventure, weight: VOTE_WEIGHT })),
    durations,
  );
  accumulate(
    profile,
    views.map((v) => ({ ...v.adventure, weight: VIEW_WEIGHT })),
    durations,
  );

  if (durations.length > 0) {
    durations.sort((a, b) => a - b);
    profile.medianDurationDays = durations[Math.floor(durations.length / 2)];
  }

  return profile;
}

export function topEntries(record: Record<string, number>, n: number): string[] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}
