/*
  Warnings:

  - Added the required column `updatedAt` to the `FlightBooking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FlightBookingStatus" AS ENUM ('SELECTED', 'PRICE_CONFIRMED', 'PAID', 'TICKETED', 'CANCELLED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_itineraryId_fkey";

-- AlterTable
ALTER TABLE "FlightBooking" ADD COLUMN     "orderRef" TEXT,
ADD COLUMN     "passengers" JSONB,
ADD COLUMN     "returnArrivalAt" TIMESTAMP(3),
ADD COLUMN     "returnDepartureAt" TIMESTAMP(3),
ADD COLUMN     "segments" JSONB,
ADD COLUMN     "status" "FlightBookingStatus" NOT NULL DEFAULT 'SELECTED',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "deepLink" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FlightBooking_userId_createdAt_idx" ON "FlightBooking"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
