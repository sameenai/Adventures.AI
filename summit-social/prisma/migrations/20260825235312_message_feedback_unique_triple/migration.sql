/*
  Warnings:

  - A unique constraint covering the columns `[userId,itineraryId,messageIndex]` on the table `MessageFeedback` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_userId_itineraryId_messageIndex_key" ON "MessageFeedback"("userId", "itineraryId", "messageIndex");
