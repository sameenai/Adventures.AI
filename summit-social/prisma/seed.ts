import { Category, Difficulty, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: "alex@summitsocial.dev" },
    update: {},
    create: {
      email: "alex@summitsocial.dev",
      name: "Alex Summit",
      bio: "Mountain enthusiast and adventure photographer. 50+ countries explored.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Alex",
      instagramUrl: "https://instagram.com/alexsummit",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "maya@summitsocial.dev" },
    update: {},
    create: {
      email: "maya@summitsocial.dev",
      name: "Maya Trails",
      bio: "Ultra-runner and trekking guide. Patagonia specialist.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Maya",
      twitterUrl: "https://twitter.com/mayatrails",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "james@summitsocial.dev" },
    update: {},
    create: {
      email: "james@summitsocial.dev",
      name: "James Explorer",
      bio: "Cycling the world one continent at a time.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=James",
      websiteUrl: "https://jamesexplorer.com",
    },
  });

  const tags = await Promise.all(
    ["bucket-list", "solo-travel", "photography", "wildlife", "alpine", "coastal", "desert"].map(
      (name) =>
        prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
    ),
  );

  const adventure1 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-1" },
    update: {},
    create: {
      id: "seed-adventure-1",
      title: "Torres del Paine W Trek",
      description:
        "A 5-day trek through Patagonia's most iconic national park. Experience glaciers, granite towers, and pristine lakes on this unforgettable journey through southern Chile.",
      location: "Torres del Paine, Patagonia",
      country: "Chile",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306",
      highlights: [
        "Base of the Towers sunrise",
        "Grey Glacier viewpoint",
        "French Valley amphitheatre",
      ],
      gear: [
        "4-season tent",
        "Sleeping bag (-10C)",
        "Trekking poles",
        "Waterproof layers",
        "Camp stove",
      ],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 150000,
      latitude: -50.9423,
      longitude: -73.4068,
      published: true,
      userId: user1.id,
      voteCount: 142,
      tags: { connect: [{ id: tags[0].id }, { id: tags[2].id }, { id: tags[4].id }] },
    },
  });

  const adventure2 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-2" },
    update: {},
    create: {
      id: "seed-adventure-2",
      title: "Cycling the Karakoram Highway",
      description:
        "The highest paved international road in the world. Cycle from Islamabad to the Khunjerab Pass at 4,693m, through stunning mountain passes and ancient Silk Road towns.",
      location: "Karakoram Highway",
      country: "Pakistan",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EXTREME,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      highlights: [
        "Khunjerab Pass (4,693m)",
        "Hunza Valley views",
        "Attabad Lake turquoise waters",
        "Passu Cones",
      ],
      gear: [
        "Touring bicycle",
        "Panniers",
        "High-altitude camping gear",
        "Repair kit",
        "Water purification",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 200000,
      latitude: 36.3167,
      longitude: 75.5833,
      published: true,
      userId: user3.id,
      voteCount: 98,
      tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }] },
    },
  });

  const adventure3 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-3" },
    update: {},
    create: {
      id: "seed-adventure-3",
      title: "Serengeti Safari & Kilimanjaro",
      description:
        "Combine a world-class safari experience with summiting Africa's highest peak. Witness the Great Migration before tackling the Machame Route up Kilimanjaro.",
      location: "Serengeti & Kilimanjaro",
      country: "Tanzania",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801",
      highlights: [
        "Great Migration river crossing",
        "Kilimanjaro summit sunrise",
        "Ngorongoro Crater",
        "Big Five sightings",
      ],
      gear: [
        "Binoculars",
        "Camera with telephoto lens",
        "High-altitude trekking boots",
        "Altitude medication",
      ],
      bestMonths: [1, 2, 6, 7, 8, 9],
      estimatedCost: 450000,
      latitude: -2.3333,
      longitude: 34.8333,
      published: true,
      userId: user2.id,
      voteCount: 215,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[3].id }, { id: tags[2].id }],
      },
    },
  });

  // Add some votes
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure1.id },
      { userId: user3.id, adventureId: adventure1.id },
      { userId: user1.id, adventureId: adventure2.id },
      { userId: user1.id, adventureId: adventure3.id },
      { userId: user3.id, adventureId: adventure3.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed data created successfully");
  console.log(`  Users: ${user1.name}, ${user2.name}, ${user3.name}`);
  console.log(`  Adventures: ${adventure1.title}, ${adventure2.title}, ${adventure3.title}`);
  console.log(`  Tags: ${tags.map((t) => t.name).join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
