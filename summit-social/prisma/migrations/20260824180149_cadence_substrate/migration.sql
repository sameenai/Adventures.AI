-- CreateEnum
CREATE TYPE "TripEventSource" AS ENUM ('MARKED_DONE', 'ITINERARY_COMPLETED', 'FLIGHT_BOOKED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "SearchEventSource" AS ENUM ('ADVENTURE_LIST', 'CHAT', 'FLIGHTS');

-- CreateEnum
CREATE TYPE "CadenceRecStatus" AS ENUM ('PENDING', 'SENT', 'CLICKED', 'PLANNED', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRIP_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'SEASON_ALERT';

-- CreateTable
CREATE TABLE "TravelerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeAirport" TEXT,
    "homeCountry" TEXT,
    "preferredCategories" "Category"[] DEFAULT ARRAY[]::"Category"[],
    "maxDifficulty" "Difficulty",
    "typicalDurationDays" INTEGER,
    "budgetBandPence" INTEGER,
    "cadenceMonths" INTEGER NOT NULL DEFAULT 6,
    "fitnessLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "TripEventSource" NOT NULL,
    "adventureId" TEXT,
    "itineraryId" TEXT,
    "destinationCountry" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "source" "SearchEventSource" NOT NULL,
    "query" TEXT,
    "filters" JSONB,
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CadenceRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "status" "CadenceRecStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CadenceRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelerProfile_userId_key" ON "TravelerProfile"("userId");

-- CreateIndex
CREATE INDEX "TripEvent_userId_startedAt_idx" ON "TripEvent"("userId", "startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TripEvent_userId_adventureId_source_key" ON "TripEvent"("userId", "adventureId", "source");

-- CreateIndex
CREATE INDEX "SearchEvent_userId_createdAt_idx" ON "SearchEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SearchEvent_createdAt_idx" ON "SearchEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "CadenceRecommendation_userId_windowStart_idx" ON "CadenceRecommendation"("userId", "windowStart" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CadenceRecommendation_userId_adventureId_windowStart_key" ON "CadenceRecommendation"("userId", "adventureId", "windowStart");

-- AddForeignKey
ALTER TABLE "TravelerProfile" ADD CONSTRAINT "TravelerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchEvent" ADD CONSTRAINT "SearchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadenceRecommendation" ADD CONSTRAINT "CadenceRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CadenceRecommendation" ADD CONSTRAINT "CadenceRecommendation_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
