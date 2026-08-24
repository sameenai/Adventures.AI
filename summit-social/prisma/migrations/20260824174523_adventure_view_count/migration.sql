-- AlterTable
ALTER TABLE "Adventure" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill the denormalized counter from existing view rows so counts do not
-- reset when the per-request COUNT(*) is removed.
UPDATE "Adventure" a
SET "viewCount" = sub.cnt
FROM (
  SELECT "adventureId", COUNT(*)::int AS cnt
  FROM "AdventureView"
  GROUP BY "adventureId"
) sub
WHERE a.id = sub."adventureId";
