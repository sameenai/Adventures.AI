-- CreateTable
CREATE TABLE "CoverImage" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoverImage_adventureId_key" ON "CoverImage"("adventureId");

-- AddForeignKey
ALTER TABLE "CoverImage" ADD CONSTRAINT "CoverImage_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
