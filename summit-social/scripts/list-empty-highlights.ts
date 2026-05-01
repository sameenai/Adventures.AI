import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adventures = await prisma.adventure.findMany({
    where: { highlights: { equals: [] } },
    select: {
      id: true,
      title: true,
      location: true,
      country: true,
      category: true,
      durationDays: true,
      description: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`Adventures with no highlights: ${adventures.length}`);
  adventures.forEach((a) => {
    console.log(`${a.id}|${a.title}|${a.location}|${a.country}|${a.category}|${a.durationDays}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
