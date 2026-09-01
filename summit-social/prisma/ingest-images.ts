import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ImageData = Prisma.CoverImageCreateInput["data"];

async function downloadImage(url: string): Promise<{ data: ImageData; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const data: ImageData = Buffer.from(await res.arrayBuffer());
    return { data, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const adventures = await prisma.adventure.findMany({
    where: { coverImageUrl: { startsWith: "http" } },
    select: { id: true, title: true, coverImageUrl: true },
  });

  const existing = new Set(
    (await prisma.coverImage.findMany({ select: { adventureId: true, sourceUrl: true } }))
      .map((ci) => `${ci.adventureId}::${ci.sourceUrl}`),
  );

  const needed = adventures.filter(
    (a) => !existing.has(`${a.id}::${a.coverImageUrl}`),
  );

  console.log(`Found ${needed.length} images to download (${adventures.length} total with external URLs)`);

  let downloaded = 0;
  let failed = 0;
  const BATCH = 5;

  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (a) => {
        try {
          const { data, contentType } = await downloadImage(a.coverImageUrl);
          await prisma.coverImage.upsert({
            where: { adventureId: a.id },
            update: { data, contentType, sourceUrl: a.coverImageUrl },
            create: { adventureId: a.id, data, contentType, sourceUrl: a.coverImageUrl },
          });
          downloaded++;
          console.log(`  Downloaded [${downloaded + failed}/${needed.length}]: ${a.title}`);
        } catch (e) {
          failed++;
          console.error(`  Failed [${downloaded + failed}/${needed.length}]: ${a.title} — ${e instanceof Error ? e.message : e}`);
        }
      }),
    );
    if (i + BATCH < needed.length) {
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }

  const updated = await prisma.$executeRaw`
    UPDATE "Adventure"
    SET "coverImageUrl" = '/api/images/' || "id"
    WHERE "id" IN (SELECT "adventureId" FROM "CoverImage")
  `;

  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed, ${updated} URLs updated`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
