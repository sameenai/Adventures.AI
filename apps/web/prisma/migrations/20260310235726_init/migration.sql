-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TREKKING', 'MOUNTAINEERING', 'CYCLING', 'KAYAKING', 'DIVING', 'SAFARI', 'SKIING', 'SURFING', 'ROAD_TRIP', 'CULTURAL', 'MULTI_SPORT', 'EXPEDITION');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING', 'EXTREME', 'EXPEDITION_GRADE');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('DRAFT', 'PLANNING', 'BOOKED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Adventure" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "albumUrl" TEXT,
    "albumPlatform" TEXT,
    "highlights" TEXT[],
    "gear" TEXT[],
    "bestMonths" INTEGER[],
    "estimatedCost" INTEGER,
    "gpxTrackUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Adventure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" INTEGER,
    "travellers" INTEGER NOT NULL DEFAULT 1,
    "status" "ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "chatHistory" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activities" JSONB NOT NULL,
    "itineraryId" TEXT NOT NULL,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightBooking" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "priceGBP" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "cabinClass" TEXT NOT NULL DEFAULT 'economy',
    "deepLink" TEXT NOT NULL,
    "itineraryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdventureToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AdventureToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Adventure_voteCount_idx" ON "Adventure"("voteCount" DESC);

-- CreateIndex
CREATE INDEX "Adventure_category_idx" ON "Adventure"("category");

-- CreateIndex
CREATE INDEX "Adventure_continent_idx" ON "Adventure"("continent");

-- CreateIndex
CREATE INDEX "Adventure_difficulty_idx" ON "Adventure"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_adventureId_key" ON "Vote"("userId", "adventureId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_AdventureToTag_B_index" ON "_AdventureToTag"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adventure" ADD CONSTRAINT "Adventure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdventureToTag" ADD CONSTRAINT "_AdventureToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdventureToTag" ADD CONSTRAINT "_AdventureToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
