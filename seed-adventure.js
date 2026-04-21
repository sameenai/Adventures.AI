#!/usr/bin/env node
// Usage: node seed-adventure.js <num> <json-file>
// Appends adventure <num> from <json-file> to seed.ts, runs seed, commits.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const num = parseInt(process.argv[2], 10);
const dataFile = process.argv[3];
const SEED = path.join(__dirname, "summit-social/prisma/seed.ts");
const MARKER = "  const adventureCount = await prisma.adventure.count();";

const adventures = JSON.parse(fs.readFileSync(dataFile, "utf8"));
const a = adventures.find((x) => x.num === num);
if (!a) { console.error(`Adventure ${num} not found`); process.exit(1); }

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const voteCount = Math.min(a.votes, 3);
const votes = Array.from({ length: voteCount }, (_, i) => `{ userId: user${i + 1}.id, adventureId: adventure${num}.id }`).join(", ");
const highlightsArr = a.highlights || [];
const highlights = highlightsArr.map((h) => `"${h}"`).join(", ");
const gearArr = a.gear || [];
const gear = gearArr.map((g) => `"${g}"`).join(", ");

// bestMonths can be array of month name strings or integers
const bestMonthsRaw = a.bestMonths || [];
const bestMonthsInts = bestMonthsRaw.map((m) => typeof m === "string" ? MONTH_NAMES.indexOf(m) + 1 : m);
const bestMonths = bestMonthsInts.join(", ");

const tags = a.tags.map((t) => `{ id: allTags["${t}"].id }`).join(", ");

// Derive duration from bestMonths count or default; coverImageUrl from Unsplash keyword
const durationDays = a.durationDays || (bestMonthsInts.length >= 4 ? 7 : 5);
const coverImageUrl = a.coverImageUrl || `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80`;

// Support both old format (country/continent/latitude/longitude) and new (coordinates + location)
const country = a.country || a.location.split(",").pop().trim();
const continent = a.continent || "Unknown";
const latitude = a.latitude !== undefined ? a.latitude : (a.coordinates ? a.coordinates[0] : 0);
const longitude = a.longitude !== undefined ? a.longitude : (a.coordinates ? a.coordinates[1] : 0);
const estimatedCost = a.estimatedCost || 1000;
const userId = a.user ? `user${a.user}` : `user${(num % 3) + 1}`;

const block = `
  // Adventure ${num}
  const adventure${num} = await prisma.adventure.upsert({
    where: { id: "seed-adventure-${num}" },
    update: {},
    create: {
      id: "seed-adventure-${num}",
      title: "${a.title}",
      description: \`${a.description}\`,
      location: "${a.location}",
      country: "${country}",
      continent: "${continent}",
      category: Category.${a.category},
      difficulty: Difficulty.${a.difficulty},
      durationDays: ${durationDays},
      coverImageUrl: "${coverImageUrl}",
      highlights: [${highlights}],
      gear: [${gear}],
      bestMonths: [${bestMonths}],
      estimatedCost: ${estimatedCost},
      latitude: ${latitude},
      longitude: ${longitude},
      published: true,
      userId: ${userId}.id,
      voteCount: ${voteCount},
      tags: { connect: [${tags}] },
    },
  });
  await prisma.vote.createMany({ data: [${votes}], skipDuplicates: true });
`;

const content = fs.readFileSync(SEED, "utf8");
if (content.includes(`"seed-adventure-${num}"`)) {
  console.log(`Adventure ${num} already in seed.ts, skipping insert`);
} else {
  const updated = content.replace(MARKER, block + "\n" + MARKER);
  fs.writeFileSync(SEED, updated);
}

// Run seed
console.log(`Seeding adventure ${num}: ${a.title}`);
execSync("npm run db:seed", { cwd: path.join(__dirname, "summit-social"), stdio: "inherit" });

// Commit
const msg = `feat(seed): add adventure ${num} — ${a.title.toLowerCase()}`;
execSync(`git add summit-social/prisma/seed.ts && git commit -m "${msg}"`, {
  cwd: __dirname,
  stdio: "inherit",
});
console.log(`Committed adventure ${num}`);
