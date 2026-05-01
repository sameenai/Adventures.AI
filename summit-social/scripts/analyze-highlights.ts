import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adventures = await prisma.adventure.findMany({
    select: { id: true, title: true, highlights: true, durationDays: true, location: true, country: true },
    orderBy: { id: "asc" },
  });

  // Within-adventure duplicates
  let withInternalDups = 0;
  for (const a of adventures) {
    const unique = new Set(a.highlights);
    if (unique.size < a.highlights.length) withInternalDups++;
  }

  // Adventures with 0 highlights
  const noHighlights = adventures.filter((a) => a.highlights.length === 0);

  // Adventures with very few highlights relative to duration
  const tooFew = adventures.filter(
    (a) => a.highlights.length > 0 && a.highlights.length < Math.min(a.durationDays, 4),
  );

  // Cross-adventure exact highlight string duplication
  const allHighlights = adventures.flatMap((a) => a.highlights);
  const highlightCounts = new Map<string, number>();
  for (const h of allHighlights) highlightCounts.set(h, (highlightCounts.get(h) ?? 0) + 1);
  const crossDups = [...highlightCounts.entries()].filter(([, c]) => c > 1);

  console.log("Total adventures:", adventures.length);
  console.log("With within-adventure duplicate highlights:", withInternalDups);
  console.log("With 0 highlights:", noHighlights.length);
  console.log("With too few highlights for duration:", tooFew.length);
  console.log("Cross-adventure duplicate highlight strings:", crossDups.length);
  console.log("");

  if (noHighlights.length > 0) {
    console.log("Adventures with NO highlights (first 10):");
    noHighlights.slice(0, 10).forEach((a) => console.log(` - [${a.id}] ${a.title}`));
    console.log("");
  }

  if (crossDups.length > 0) {
    console.log("Top 15 most-duplicated highlight strings:");
    crossDups
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([h, c]) => console.log(`  [${c}x] ${h.slice(0, 90)}`));
    console.log("");
  }

  // Adventures where highlights don't mention any location/country keyword
  const locationless = adventures
    .filter((a) => {
      if (a.highlights.length === 0) return false;
      const locationWords = `${a.location} ${a.country}`
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length > 3);
      const text = a.highlights.join(" ").toLowerCase();
      return !locationWords.some((w) => text.includes(w));
    })
    .slice(0, 5);

  if (locationless.length > 0) {
    console.log("Sample adventures where highlights don't mention their location:");
    locationless.forEach((a) =>
      console.log(` - [${a.id}] ${a.title}\n   Highlights[0]: ${a.highlights[0]?.slice(0, 80)}`),
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
