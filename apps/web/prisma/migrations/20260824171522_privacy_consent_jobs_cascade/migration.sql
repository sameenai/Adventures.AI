-- DropForeignKey
ALTER TABLE "Adventure" DROP CONSTRAINT "Adventure_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Itinerary" DROP CONSTRAINT "Itinerary_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingConsentAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "stats" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRun_jobName_startedAt_idx" ON "JobRun"("jobName", "startedAt" DESC);

-- AddForeignKey
ALTER TABLE "Adventure" ADD CONSTRAINT "Adventure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
