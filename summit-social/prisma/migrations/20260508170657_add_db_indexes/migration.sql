-- DropIndex
DROP INDEX "Adventure_voteCount_idx";

-- CreateIndex
CREATE INDEX "Adventure_voteCount_id_idx" ON "Adventure"("voteCount" DESC, "id");

-- CreateIndex
CREATE INDEX "Adventure_createdAt_id_idx" ON "Adventure"("createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Adventure_durationDays_id_idx" ON "Adventure"("durationDays", "id");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt" DESC);
