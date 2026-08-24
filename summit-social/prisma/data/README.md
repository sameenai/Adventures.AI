# Canonical Adventure Catalog

`adventures.json` is the single source of truth for the seeded adventure
catalog. It replaced a 33,000-line generated `seed.ts` and twenty
`adventures-*.json` batch files at the repo root (see git history).

## Files

- **`adventures.json`** — every seed adventure, deduplicated and enriched.
  Stable ids (`seed-adventure-<num>`) mean re-seeding updates content in place
  without ever duplicating rows. `estimatedCost` is stored in **pence**, the
  unit `formatPrice()` renders (the original bulk import mixed pounds and
  pence; this catalog is normalized).
- **`retired-adventures.json`** — seed ids removed as duplicates, each with the
  id it duplicates and the editorial reason. `seed.ts` deletes these rows so
  existing databases (including production) converge on the deduplicated
  catalog. Never reuse a retired id.

## Rules for editing

1. Edit `adventures.json` directly — there is no generator to re-run.
2. Never change an `id`/`num`; never reuse a retired one. New adventures take
   the next unused number.
3. Keep `estimatedCost` in pence (`£1,500` → `150000`).
4. Run the gate before committing: `npx vitest run tests/unit/seed-data.test.ts`
   validates schema, uniqueness (no duplicate title+country), cost plausibility,
   geocoding and completeness.
5. `npm run db:seed` is idempotent and safe to run repeatedly; it updates
   content fields of seed rows but never touches votes, comments, or
   user-created adventures (those have cuid ids).

The AI eval harness's live mode (`evals/live.ts`) also reads this catalog to
serve `search_adventures` results, so catalog quality directly affects
measured AI answer quality.
