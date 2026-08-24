import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Category, Difficulty, ItineraryStatus, PrismaClient } from "@prisma/client";

/**
 * Data-driven seed.
 *
 * The adventure catalog lives in prisma/data/adventures.json — a single
 * canonical, deduplicated dataset. This script:
 *   1. Upserts the three demo users and all tags referenced by the catalog.
 *   2. Deletes retired duplicate adventures (prisma/data/retired-adventures.json)
 *      so existing databases converge on the deduplicated catalog.
 *   3. Upserts every adventure — updating content fields in place so data-quality
 *      fixes reach existing databases, while never touching vote counts or any
 *      user-generated rows (user adventures have cuid ids, not seed-adventure-*).
 *   4. Seeds demo votes and three showcase itineraries (idempotently).
 */

const prisma = new PrismaClient();

interface SeedAdventure {
  id: string;
  num: number;
  title: string;
  description: string;
  location: string;
  country: string;
  continent: string;
  category: string;
  difficulty: string;
  durationDays: number;
  coverImageUrl: string;
  highlights: string[];
  gear: string[];
  bestMonths: number[];
  climate: string[];
  estimatedCost: number | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  user: number;
  voteCount: number;
}

interface RetiredAdventure {
  id: string;
  duplicateOf: string;
  reason: string;
}

const DATA_DIR = join(__dirname, "data");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as T;
}

const CATEGORIES = new Set<string>(Object.values(Category));
const DIFFICULTIES = new Set<string>(Object.values(Difficulty));

function validateAdventure(a: SeedAdventure): void {
  const fail = (msg: string): never => {
    throw new Error(`Invalid seed adventure ${a.id} ("${a.title}"): ${msg}`);
  };
  if (!CATEGORIES.has(a.category)) fail(`unknown category ${a.category}`);
  if (!DIFFICULTIES.has(a.difficulty)) fail(`unknown difficulty ${a.difficulty}`);
  if (!a.title.trim()) fail("empty title");
  if (!a.description.trim()) fail("empty description");
  if (a.durationDays < 1) fail(`bad duration ${a.durationDays}`);
  if (a.bestMonths.some((m) => m < 1 || m > 12)) fail("bestMonths out of range");
  if (a.latitude !== null && Math.abs(a.latitude) > 90) fail("latitude out of range");
  if (a.longitude !== null && Math.abs(a.longitude) > 180) fail("longitude out of range");
}

async function main() {
  const { adventures } = loadJson<{ adventures: SeedAdventure[] }>("adventures.json");
  const { retired } = loadJson<{ retired: RetiredAdventure[] }>("retired-adventures.json");

  for (const a of adventures) validateAdventure(a);

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  const user1 = await prisma.user.upsert({
    where: { email: "alex@basecamper.ai" },
    update: {},
    create: {
      email: "alex@basecamper.ai",
      name: "Alex Summit",
      bio: "Mountain enthusiast and adventure photographer. 50+ countries explored, 6 continents trekked.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Alex",
      instagramUrl: "https://instagram.com/alexsummit",
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: "maya@basecamper.ai" },
    update: {},
    create: {
      email: "maya@basecamper.ai",
      name: "Maya Trails",
      bio: "Ultra-runner, trekking guide, and Patagonia specialist. Happiest above 3,000m.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Maya",
      twitterUrl: "https://twitter.com/mayatrails",
    },
  });
  const user3 = await prisma.user.upsert({
    where: { email: "james@basecamper.ai" },
    update: {},
    create: {
      email: "james@basecamper.ai",
      name: "James Explorer",
      bio: "Cycling the world one continent at a time. Currently: Central Asia.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=James",
      websiteUrl: "https://jamesexplorer.com",
    },
  });
  const users = [user1, user2, user3];

  // ---------------------------------------------------------------------------
  // Tags — derived from the catalog itself, so the tag set never drifts
  // ---------------------------------------------------------------------------
  const tagNames = [...new Set(adventures.flatMap((a) => a.tags))].sort();
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })),
  );
  const tagIdByName = new Map(tags.map((t) => [t.name, t.id]));

  // ---------------------------------------------------------------------------
  // Retire duplicates — converge existing databases on the deduplicated catalog
  // ---------------------------------------------------------------------------
  const retiredIds = retired.map((r) => r.id);
  if (retiredIds.length > 0) {
    const { count } = await prisma.adventure.deleteMany({ where: { id: { in: retiredIds } } });
    if (count > 0) console.log(`  Retired ${count} duplicate adventures`);
  }

  // ---------------------------------------------------------------------------
  // Adventures — upsert; content fields update in place, votes are respected
  // ---------------------------------------------------------------------------
  const CHUNK = 25;
  for (let i = 0; i < adventures.length; i += CHUNK) {
    const chunk = adventures.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(async (a) => {
        const owner = users[(a.user - 1 + users.length) % users.length];
        const tagConnect = a.tags
          .map((name) => tagIdByName.get(name))
          .filter((id): id is string => Boolean(id))
          .map((id) => ({ id }));
        const content = {
          title: a.title,
          description: a.description,
          location: a.location,
          country: a.country,
          continent: a.continent,
          category: a.category as Category,
          difficulty: a.difficulty as Difficulty,
          durationDays: a.durationDays,
          coverImageUrl: a.coverImageUrl,
          highlights: a.highlights,
          gear: a.gear,
          bestMonths: a.bestMonths,
          climate: a.climate,
          estimatedCost: a.estimatedCost,
          latitude: a.latitude,
          longitude: a.longitude,
          published: true,
        };
        await prisma.adventure.upsert({
          where: { id: a.id },
          update: { ...content, tags: { set: [], connect: tagConnect } },
          create: {
            ...content,
            id: a.id,
            userId: owner.id,
            // Curated popularity figure — drives the default voteCount sort.
            // Actual Vote rows are capped at the three demo users below.
            voteCount: a.voteCount,
            tags: { connect: tagConnect },
          },
        });
        const votes = Math.min(a.voteCount, users.length);
        if (votes > 0) {
          await prisma.vote.createMany({
            data: users.slice(0, votes).map((u) => ({ userId: u.id, adventureId: a.id })),
            skipDuplicates: true,
          });
        }
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Showcase itineraries — fixed ids so re-seeding never duplicates them
  // ---------------------------------------------------------------------------
  const itineraries = [
    {
      id: "seed-itinerary-1",
      title: "Torres del Paine W Trek — October 2025",
      description:
        "AI-planned 5-day W Trek with refugio bookings, shuttle logistics, and buffer days for Patagonian weather.",
      travellers: 2,
      budget: 150000,
      status: ItineraryStatus.PLANNING,
      userId: user1.id,
      days: [
        {
          dayNumber: 1,
          title: "Arrival & Lago Grey",
          description:
            "Bus from Puerto Natales at 07:30, arrive park entrance 10:00. Boat crossing from Pudeto to Refugio Paine Grande. Afternoon hike to Grey Glacier viewpoint.",
          activities: [
            { time: "07:30", activity: "Turbus from Puerto Natales terminal", location: "Puerto Natales Bus Terminal", notes: "Book ticket day before, fills quickly" },
            { time: "10:00", activity: "Park entrance fee and permit check", location: "Laguna Amarga Entrance", notes: "CLP 21,000 per person, have cash" },
            { time: "11:30", activity: "Catamaran to Refugio Paine Grande", location: "Pudeto Pier", notes: "45-min crossing, $18 USD, book at puertonatalestour.cl" },
            { time: "15:00", activity: "Hike to Mirador Glaciar Grey", location: "Grey Glacier Viewpoint", notes: "2h return, 90m ice wall, calving audible" },
            { time: "19:00", activity: "Dinner at refugio and briefing for Day 2", location: "Refugio Paine Grande", notes: "Meal included with refugio package" },
          ],
        },
        {
          dayNumber: 2,
          title: "Grey Glacier Full Day",
          description:
            "Full day to explore the Grey Glacier peninsula, beach with stranded icebergs, and optional kayak tour.",
          activities: [
            { time: "08:00", activity: "Hike north along Lago Grey shoreline", location: "Grey Glacier Peninsula Trail", notes: "Icebergs beach-stranded at low wind, surreal scale" },
            { time: "11:00", activity: "Optional: Grey Glacier kayak tour", location: "Grey Glacier Base", notes: "Book via Big Foot Patagonia, 4h, USD 120pp" },
            { time: "16:00", activity: "Prepare pack for morning departure to French Valley", location: "Refugio Paine Grande", notes: "Lay out kit, check weather forecast" },
          ],
        },
        {
          dayNumber: 3,
          title: "French Valley Amphitheatre",
          description:
            "The most dramatic day: 20km round trip into the Valle del Francés with hanging glaciers and the condor thermals above.",
          activities: [
            { time: "07:00", activity: "Depart Paine Grande heading east", location: "W Trek Trail", notes: "22km to Refugio Italiano, terrain varied" },
            { time: "10:00", activity: "Ascent into French Valley", location: "Valle del Francés", notes: "Hanging glacier Glaciar del Francés visible 30 min in" },
            { time: "12:00", activity: "Mirador Británico — panorama of massif", location: "Mirador Británico", notes: "Highest point on the W, 3h from refugio, worth every step" },
            { time: "17:30", activity: "Check in, dinner, rest legs for tomorrow", location: "Refugio Los Cuernos", notes: "Best sunset view of Los Cuernos from deck" },
          ],
        },
        {
          dayNumber: 4,
          title: "Chileno & Las Torres Base",
          description:
            "Final trekking day with the classic Chileno Valley approach. Stage at Refugio Chileno for the pre-dawn Torres summit hike.",
          activities: [
            { time: "07:30", activity: "Depart Los Cuernos heading east", location: "W Trek Trail" },
            { time: "12:00", activity: "Continue to Refugio Chileno — base camp", location: "Refugio El Chileno" },
            { time: "14:00", activity: "Rest and acclimatise — do NOT hike to towers today", location: "Refugio El Chileno", notes: "Save energy for 04:00 departure" },
          ],
        },
        {
          dayNumber: 5,
          title: "Mirador Las Torres — Sunrise",
          description:
            "The pilgrimage: pre-dawn boulder scramble to the base of the three towers. The payoff is the most photographed sunrise in South America.",
          activities: [
            { time: "04:15", activity: "Depart for Mirador Las Torres in darkness", location: "Boulder Field Trail", notes: "2h ascent, final 45 min is steep boulder scramble" },
            { time: "06:45", activity: "Sunrise: towers turn amber-orange from the top down", location: "Mirador Las Torres", notes: "Allow 1h minimum, light shifts dramatically" },
            { time: "11:00", activity: "Bus back to Puerto Natales via park entrance", location: "Park Entrance Bus Stop", notes: "Last bus 18:00 — confirm timetable with refugio staff" },
          ],
        },
      ],
    },
    {
      id: "seed-itinerary-2",
      title: "KKH Cycle — Islamabad to Khunjerab, July 2025",
      description:
        "Full AI-planned route with daily mileage targets, altitude profiles, guesthouse recommendations, and contingency rest days.",
      travellers: 1,
      budget: 200000,
      status: ItineraryStatus.DRAFT,
      userId: user3.id,
      days: [
        {
          dayNumber: 1,
          title: "Islamabad → Abbottabad",
          description:
            "First riding day. Leave the capital on the M1 motorway then the N-35 begins at Hassanabdal. 130km, minimal elevation.",
          activities: [
            { time: "05:30", activity: "Depart Islamabad before city traffic", location: "F-6, Islamabad", notes: "Head north on N-5 to Hassanabdal junction" },
            { time: "08:00", activity: "Hassanabdal — first chai stop", location: "Hassanabdal Tea Stall", notes: "KKH officially begins here — N-35 signpost" },
            { time: "17:00", activity: "Arrive Abbottabad, check guesthouse", location: "Abbottabad City", notes: "Hotel Sarban recommended, PKR 2,500/night" },
          ],
        },
        {
          dayNumber: 7,
          title: "Besham → Dasu (Indus Gorge Entry)",
          description:
            "The mountains close in. The Indus Gorge begins and the road narrows to one lane in places blasted from cliff. 80km but mentally taxing.",
          activities: [
            { time: "06:00", activity: "Early depart — gorge gets hot by midday", location: "Besham", notes: "Carry 4L water minimum, no reliable sources for 40km" },
            { time: "09:00", activity: "Shatial historical site — rock petroglyphs", location: "Shatial", notes: "Short detour worth 30 min, 3,000-year-old carvings" },
            { time: "16:00", activity: "Arrive Dasu, guesthouse and hot meal", location: "Dasu Town", notes: "PTDC Motel has secure bike storage" },
          ],
        },
        {
          dayNumber: 14,
          title: "Karimabad Rest Day — Hunza Valley",
          description:
            "Mandatory acclimatisation and recovery day. Altitude is 2,438m. Visit Baltit Fort and the Eagle's Nest viewpoint.",
          activities: [
            { time: "08:00", activity: "Baltit Fort opening, arrive early", location: "Baltit Fort, Karimabad", notes: "UNESCO heritage site, PKR 500 entry, guides available" },
            { time: "13:00", activity: "Eagle's Nest hike — 90 min up to panorama point", location: "Eagle's Nest, above Karimabad", notes: "360° view: Rakaposhi, Ultar Sar, Diran all visible" },
            { time: "19:00", activity: "Bike service and load check for high-altitude push", location: "Guesthouse", notes: "Check all bolts, cables, tyre pressure — cold affects everything" },
          ],
        },
        {
          dayNumber: 19,
          title: "Sust → Khunjerab Pass Summit",
          description:
            "Summit day. 75km, 1,500m elevation gain to 4,693m. The last full day of KKH cycling.",
          activities: [
            { time: "05:30", activity: "Depart Sust at first light", location: "Sust Border Town", notes: "Last fuelling stop — eat properly, altitude kills appetite" },
            { time: "10:00", activity: "Dih checkpoint — altitude 3,800m, assess condition", location: "Dih Checkpoint", notes: "Turn back here if headache or nausea — no shame in it" },
            { time: "12:30", activity: "Khunjerab Pass summit — 4,693m", location: "Khunjerab Pass, Pakistan–China Border", notes: "K2 visible east on clear day. Take your time." },
          ],
        },
      ],
    },
    {
      id: "seed-itinerary-3",
      title: "Serengeti Migration & Kili Summit — August 2025",
      description:
        "AI-planned 14-day Tanzania double: 5 days safari (Serengeti + Ngorongoro), 2 days Arusha rest, 7 days Machame Route to Uhuru Peak.",
      travellers: 2,
      budget: 450000,
      status: ItineraryStatus.BOOKED,
      userId: user2.id,
      days: [
        {
          dayNumber: 1,
          title: "Fly to Kilimanjaro Airport → Arusha",
          description:
            "Arrival day. Transfer to Arusha, gear check, briefing with Kilimanjaro operator.",
          activities: [
            { time: "14:00", activity: "Land JRO — Kilimanjaro International Airport", location: "Kilimanjaro International Airport", notes: "Yellow fever certificate checked at immigration" },
            { time: "17:00", activity: "Operator briefing: Machame Route, porter intro, kit check", location: "Climb operator office, Arusha", notes: "Weigh duffel bag — porters carry max 15kg" },
          ],
        },
        {
          dayNumber: 3,
          title: "Serengeti — Central Corridor Game Drive",
          description:
            "Full day in the Seronera Valley: Big Five territory, lion prides on termite mounds, hippo pools.",
          activities: [
            { time: "06:00", activity: "Pre-dawn game drive departure", location: "Serengeti Central, Seronera Valley", notes: "Best lion activity in first and last hour of light" },
            { time: "08:00", activity: "Hippo pool at Seronera River", location: "Seronera Hippo Pool", notes: "30+ hippos, crocs basking — stay in vehicle" },
            { time: "15:30", activity: "Mara River area drive — wildebeest crossing vigil", location: "Mara River Crossing Points", notes: "Herds mill for hours before committing. Wait them out." },
          ],
        },
        {
          dayNumber: 8,
          title: "Machame Day 1 — Gate to Machame Camp (3,000m)",
          description:
            "Trek start: rainforest section, 18km, 1,200m elevation gain through dense Afromontane forest.",
          activities: [
            { time: "08:00", activity: "Machame Gate registration and porter weigh-in", location: "Machame Gate (1,800m)", notes: "Operator handles permits — carry your passport" },
            { time: "16:30", activity: "Arrive Machame Camp — tent setup, hot meal", location: "Machame Camp (3,000m)", notes: "First altitude night — headache normal, drink 3L water" },
          ],
        },
        {
          dayNumber: 13,
          title: "Summit Night — Barafu to Uhuru Peak (5,895m)",
          description:
            "Midnight departure. 6 hours ascent to Stella Point, 45 min crater rim traverse to Uhuru Peak. The summit.",
          activities: [
            { time: "00:30", activity: "Depart for Stella Point", location: "Summit Trail from Barafu", notes: "Slow and steady — pole pole. The guide sets the pace, do not go faster." },
            { time: "06:15", activity: "Uhuru Peak — 5,895m, Roof of Africa", location: "Uhuru Peak", notes: "Sign photo. Look at the curve of the earth. You made it." },
            { time: "15:00", activity: "Mweka Camp — celebration dinner with porters", location: "Mweka Camp (3,100m)", notes: "Tip your porters here — USD 10-15/day per porter is guideline" },
          ],
        },
      ],
    },
  ];

  for (const it of itineraries) {
    const { days, ...data } = it;
    await prisma.itinerary.upsert({
      where: { id: it.id },
      update: {},
      create: { ...data, chatHistory: [] },
    });
    const existingDays = await prisma.itineraryDay.count({ where: { itineraryId: it.id } });
    if (existingDays === 0) {
      await prisma.itineraryDay.createMany({
        data: days.map((d) => ({ ...d, itineraryId: it.id })),
      });
    }
  }

  const adventureCount = await prisma.adventure.count();
  console.log("Seed data created successfully");
  console.log(`  Users: ${users.map((u) => u.name).join(", ")}`);
  console.log(`  Adventures: ${adventureCount} total (${adventures.length} canonical seeds)`);
  console.log(`  Tags: ${tagNames.length}`);
  console.log(`  Itineraries: ${itineraries.map((i) => i.title).join(" | ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
