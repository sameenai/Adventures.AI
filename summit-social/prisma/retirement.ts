/**
 * Duplicate retirement — moving people's data off a retired adventure before it
 * is deleted.
 *
 * `prisma/data/retired-adventures.json` records, for every duplicate we retired,
 * which record it duplicates (`duplicateOf`). On a fresh database that mapping is
 * decorative: the retired rows never existed. On a database that has been live —
 * production, above all — those rows DO exist and real people have voted on them,
 * bookmarked them, commented on them, added them to collections and logged trips
 * against them.
 *
 * Every one of those relations is `onDelete: Cascade` (TripEvent is SetNull), so
 * deleting a retired adventure silently destroys that history. The duplicate and
 * its keeper describe the SAME trip, so the honest thing is to move the rows to
 * the keeper rather than drop them: a bookmark on "Spitsbergen Polar Bear Safari"
 * should become a bookmark on "Svalbard Polar Wilderness Expedition", not vanish.
 *
 * Rows that would collide with one the person already has on the keeper (they
 * bookmarked both) cannot be moved — a unique constraint forbids it — so they are
 * left to the cascade. That is correct: the surviving row already represents them.
 *
 * `voteCount` is deliberately NOT adjusted here. It is a curated popularity figure
 * on the catalog record, and the keeper's figure already absorbed the duplicate's
 * when the two were merged; incrementing it again would double-count.
 */

export interface RetirementEntry {
  id: string;
  duplicateOf?: string | null;
  reason?: string;
}

/**
 * Follow `duplicateOf` until it lands on a record that is not itself retired.
 *
 * Chains happen: a record retired in one round can be the keeper for a record
 * retired in an earlier one. Returns null when the chain dead-ends or loops, so a
 * broken chain degrades to "leave it to the cascade" rather than throwing mid-deploy.
 */
export function resolveKeeper(entries: RetirementEntry[], id: string): string | null {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const seen = new Set<string>([id]);
  let current = byId.get(id)?.duplicateOf ?? null;

  while (current && byId.has(current)) {
    if (seen.has(current)) return null; // cycle — refuse to loop forever
    seen.add(current);
    current = byId.get(current)?.duplicateOf ?? null;
  }
  return current ?? null;
}

/**
 * retiredId → keeperId, for every retirement whose chain ends at a live record.
 * Entries whose keeper is missing from `liveIds` are dropped: pointing user data
 * at a record that does not exist would fail the foreign key.
 */
export function buildKeeperMap(
  entries: RetirementEntry[],
  liveIds: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    const keeper = resolveKeeper(entries, entry.id);
    if (keeper && liveIds.has(keeper)) map.set(entry.id, keeper);
  }
  return map;
}

/**
 * The subset of PrismaClient this needs. Deliberately loose — the real delegates
 * are generated with per-model row types, and a narrower signature here would not
 * accept them. Keeps the function mockable in tests.
 */
// biome-ignore lint/suspicious/noExplicitAny: structural match for generated Prisma delegates
type OwnedDelegate = {
  findMany(args: any): Promise<any[]>;
  updateMany(args: any): Promise<{ count: number }>;
};
export interface SalvageClient {
  vote: OwnedDelegate;
  bookmark: OwnedDelegate;
  comment: OwnedDelegate;
  collectionItem: OwnedDelegate;
  tripEvent: OwnedDelegate;
}

/**
 * Tables carrying user-generated rows that reference an adventure, and the column
 * whose uniqueness (together with adventureId) decides whether a row can move.
 * `null` means no unique constraint involves adventureId — every row can move.
 */
const SALVAGED = [
  { model: "vote", owner: "userId" },
  { model: "bookmark", owner: "userId" },
  { model: "collectionItem", owner: "collectionId" },
  { model: "tripEvent", owner: "userId" },
  { model: "comment", owner: null },
] as const;

export interface SalvageResult {
  moved: Record<string, number>;
  total: number;
}

/**
 * Re-point user-generated rows from each retired adventure onto its keeper.
 * Safe to run repeatedly: once the retired rows are gone there is nothing to move.
 *
 * AdventureView and CadenceRecommendation are intentionally left to the cascade —
 * both are derived analytics that regenerate, not history someone would miss.
 */
export async function salvageUserData(
  prisma: SalvageClient,
  keeperMap: Map<string, string>,
  chunkSize = 25,
): Promise<SalvageResult> {
  const moved: Record<string, number> = {};
  const pairs = [...keeperMap.entries()];

  for (const { model, owner } of SALVAGED) {
    const delegate = prisma[model as keyof SalvageClient];
    let count = 0;

    for (let i = 0; i < pairs.length; i += chunkSize) {
      const results = await Promise.all(
        pairs.slice(i, i + chunkSize).map(async ([retiredId, keeperId]) => {
          if (!owner) {
            // No unique constraint on adventureId — nothing can collide.
            const { count: n } = await delegate.updateMany({
              where: { adventureId: retiredId },
              data: { adventureId: keeperId },
            });
            return n;
          }
          // Skip rows whose owner already holds the equivalent row on the keeper;
          // moving them would violate the unique constraint. The cascade takes them.
          const existing = await delegate.findMany({
            where: { adventureId: keeperId },
            select: { [owner]: true },
          });
          // tripEvent.adventureId is nullable, so an owner value can come back
          // null/undefined; only real ids constrain the move.
          const taken = existing
            .map((row) => row[owner])
            .filter((v): v is string => typeof v === "string");
          const { count: n } = await delegate.updateMany({
            where: {
              adventureId: retiredId,
              ...(taken.length > 0 ? { [owner]: { notIn: taken } } : {}),
            },
            data: { adventureId: keeperId },
          });
          return n;
        }),
      );
      count += results.reduce((a, b) => a + b, 0);
    }
    moved[model] = count;
  }

  return { moved, total: Object.values(moved).reduce((a, b) => a + b, 0) };
}
