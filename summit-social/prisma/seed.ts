import { Category, Difficulty, ItineraryStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  const user1 = await prisma.user.upsert({
    where: { email: "alex@summitsocial.dev" },
    update: {},
    create: {
      email: "alex@summitsocial.dev",
      name: "Alex Summit",
      bio: "Mountain enthusiast and adventure photographer. 50+ countries explored, 6 continents trekked.",
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
      bio: "Ultra-runner, trekking guide, and Patagonia specialist. Happiest above 3,000m.",
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
      bio: "Cycling the world one continent at a time. Currently: Central Asia.",
      avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=James",
      websiteUrl: "https://jamesexplorer.com",
    },
  });

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------
  const tagNames = [
    "bucket-list",
    "solo-travel",
    "photography",
    "wildlife",
    "alpine",
    "coastal",
    "desert",
    "high-altitude",
    "multi-day",
    "camping",
  ];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t]));

  // -------------------------------------------------------------------------
  // Adventure 1 — Torres del Paine W Trek
  // -------------------------------------------------------------------------
  const adventure1 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-1" },
    update: {},
    create: {
      id: "seed-adventure-1",
      title: "Torres del Paine W Trek",
      description: `The W Trek is Patagonia's signature route — five days of raw, elemental wilderness threading between the three granite towers of the Paine Massif, ancient glaciers, and jade-green lakes that look digitally enhanced but are entirely real.

You'll start from Laguna Amarga with a boat crossing to Refugio Paine Grande, then work east: first to the Grey Glacier and its calving icebergs, then through the French Valley amphitheatre where hanging glaciers shed ice walls with a crack that echoes for minutes. The route ends with the signature pre-dawn hike to the Mirador Las Torres — you'll suffer through the final boulder field in headlamp darkness before the sky turns amber and the towers ignite.

Wind is the variable nobody fully prepares for. It arrives without warning and can halt progress entirely. Build a buffer day into any itinerary. Refugios book out months in advance for November–February; the shoulder months of October and March offer better solitude and aggressive colour in the lenga beech forest.

Budget roughly USD 200–300 per person per day for refugio stays and meals, or significantly less if you're camping and resupplying at the park shops. Fly into Punta Arenas or Puerto Natales — the latter is the last major town before the park entrance.`,
      location: "Torres del Paine National Park, Magallanes Region",
      country: "Chile",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80",
      highlights: [
        "Pre-dawn hike to Mirador Las Torres — granite pillars turning gold at sunrise",
        "Grey Glacier viewpoint: 90m-tall ice walls calving into the lake below",
        "French Valley amphitheatre and Glaciar del Francés hanging above you",
        "Boat crossing on Lago Grey weaving between floating icebergs",
        "Lenga beech forest ablaze in red and orange during March shoulder season",
        "Condors riding thermals above the Valle del Francés",
        "Night sky untouched by light pollution — Milky Way visible with naked eye",
      ],
      gear: [
        "4-season tent (winds exceed 120 km/h)",
        "Sleeping bag rated to -10°C",
        "Trekking poles (mandatory on boulder fields)",
        "Waterproof jacket and trousers (Gore-Tex or equivalent)",
        "Gaiters and waterproof trail boots",
        "Camp stove and fuel canisters",
        "Headlamp with spare batteries (pre-dawn starts)",
        "Bear canister or rodent-proof food bag",
        "Buff and balaclava for wind protection",
        "Trekking permits (book at torresdelpaine.cl months ahead)",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3],
      estimatedCost: 150000,
      latitude: -50.9423,
      longitude: -73.4068,
      published: true,
      userId: user1.id,
      voteCount: 142,
      tags: {
        connect: [
          { id: tagMap["bucket-list"].id },
          { id: tagMap["photography"].id },
          { id: tagMap["alpine"].id },
          { id: tagMap["multi-day"].id },
          { id: tagMap["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 2 — Cycling the Karakoram Highway
  // -------------------------------------------------------------------------
  const adventure2 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-2" },
    update: {},
    create: {
      id: "seed-adventure-2",
      title: "Cycling the Karakoram Highway",
      description: `The Karakoram Highway is the highest paved international road on earth, climbing from the heat of Islamabad's plains to the Khunjerab Pass at 4,693m on the Pakistan–China border. Cycling it is an act of sustained commitment: three weeks of daily effort against altitude, gradient, and the relentless scale of the Karakoram and Hindu Kush ranges.

Leave Islamabad in the cool of early morning. The first four days cross Punjab's agricultural flatlands — deceptively easy, deceptively hot. The road kicks up at Besham, where the Indus Gorge narrows and the mountains close in. From here everything becomes spectacular and everything becomes hard. The Indus is a constant companion, pewter-grey and violent, as the road clings to cliff faces blasted out of the rock.

Karimabad in Hunza Valley is the trip's emotional midpoint. The fort of Baltit stands above the terraced apricot orchards, framed by the 7,788m pyramid of Rakaposhi. Rest two nights. Buy dried mulberries from roadside stalls. Let the altitude begin its acclimatisation work.

The final push to Khunjerab crosses the Attabad Lake tunnel system, built after a 2010 landslide created a 22km lake overnight. You'll pass the turquoise water and the otherworldly Passu Cones — a row of cathedral spires rising straight from the valley floor — before the road tilts up to the pass itself.

At Khunjerab, on a clear day, K2 is visible to the east. There is no better reward for three weeks of pedalling.`,
      location: "Islamabad to Khunjerab Pass",
      country: "Pakistan",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EXTREME,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80",
      highlights: [
        "Khunjerab Pass summit at 4,693m — the roof of the Karakoram Highway",
        "Hunza Valley: Baltit Fort above apricot orchards, Rakaposhi filling the skyline",
        "Attabad Lake turquoise waters formed by a 2010 landslide",
        "Passu Cathedral Cones rising vertically from the valley floor",
        "Rakaposhi Base Camp detour (optional): 7,788m at close quarters",
        "Indus Gorge between Besham and Chilas — one of the world's deepest canyons",
        "K2 visible from the pass on clear days",
        "Hospitality of Hunzakuts: chai and chapati in roadside shacks above 3,000m",
      ],
      gear: [
        "Touring or gravel bike (26\" wheels for tyre availability in Pakistan)",
        "4 panniers (front and rear) + handlebar bag",
        "Sleeping bag rated to -5°C (high-altitude nights drop hard)",
        "3-season tent or bivy",
        "Full tool kit: spare tubes (x6), chain tool, patch kit, spoke wrench",
        "Water filter and purification tablets",
        "High-SPF sunscreen (UV intensity extreme above 3,000m)",
        "Altitude medication (Diamox, prescription required)",
        "Pakistan SIM for maps (Jazz or Telenor work in Gilgit-Baltistan)",
        "NOC permit for restricted zones (arranged via PTDC)",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 200000,
      latitude: 36.8527,
      longitude: 74.8527,
      published: true,
      userId: user3.id,
      voteCount: 98,
      tags: {
        connect: [
          { id: tagMap["bucket-list"].id },
          { id: tagMap["solo-travel"].id },
          { id: tagMap["high-altitude"].id },
          { id: tagMap["photography"].id },
          { id: tagMap["multi-day"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 3 — Serengeti Great Migration & Kilimanjaro
  // -------------------------------------------------------------------------
  const adventure3 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-3" },
    update: {},
    create: {
      id: "seed-adventure-3",
      title: "Serengeti Great Migration & Kilimanjaro Summit",
      description: `This is a 14-day double-header that puts two of Africa's greatest natural events back to back: witnessing the Great Migration river crossings in the Serengeti and standing on the Roof of Africa at 5,895m.

The first five days are spent in the Serengeti and Ngorongoro. Between July and October, 1.5 million wildebeest and 300,000 zebra cycle clockwise around the ecosystem following the rains. The Mara River crossings are the drama pinnacle — crocodiles hold position, the herd mills for hours, then in a moment of collective nerve breaks, everything stampedes into the water. Ngorongoro Crater is the bonus: a 260 km² caldera sheltering the densest population of large mammals on earth, including the last viable black rhino populations in Tanzania.

After two nights in Arusha to rest and regroup, you join the Machame Route on Kilimanjaro — six days of altitude gain through five distinct ecosystems from equatorial rainforest to the arctic zone of the summit crater. The Machame Route has the best acclimatisation profile of any Kili route, with two high-high-sleep-low rest days built into the standard itinerary.

Summit night begins at midnight from Barafu Camp (4,673m). Six hours of headlamp progress up steep scree in -20°C wind chill brings you to Stella Point on the crater rim as the sun rises over Mawenzi Peak. The final 45 minutes to Uhuru Peak crosses the crater rim — and the view from the top is nothing less than the curve of the earth above the clouds.

Acclimatisation is everything. Arrive in Nairobi or Dar es Salaam at least two days early. Do not rush the ascent profile.`,
      location: "Serengeti, Ngorongoro & Kilimanjaro",
      country: "Tanzania",
      continent: "Africa",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80",
      highlights: [
        "Great Migration Mara River crossing: 1.5M wildebeest in coordinated chaos",
        "Kilimanjaro Uhuru Peak (5,895m) sunrise above the cloud layer",
        "Ngorongoro Crater: black rhino, lion prides, and 25,000+ animals in one caldera",
        "Stella Point crater rim at dawn — Mawenzi Peak lit by first light",
        "Machame Route rainforest to ice field in six days",
        "Big Five in a single game drive through the Serengeti central corridor",
        "Barafu glacier traverse on summit day",
        "Arusha cultural stopover at the base of Mount Meru",
      ],
      gear: [
        "Layering system: base, mid fleece, down jacket, hardshell",
        "Summit-rated sleeping bag (-20°C or better)",
        "Trekking poles with powder baskets",
        "Gaiters and waterproof mountaineering boots",
        "Headlamp with lithium batteries (cold performance critical)",
        "Altitude medication (Diamox 250mg, start day before ascent)",
        "Camera with telephoto zoom (400mm+ for migration action)",
        "Binoculars (8×42 minimum for game viewing)",
        "Safari neutrals: khaki, olive, tan — no white",
        "Yellow fever vaccination certificate (mandatory for Tanzania entry)",
      ],
      bestMonths: [7, 8, 9, 1, 2],
      estimatedCost: 450000,
      latitude: -3.0674,
      longitude: 37.3556,
      published: true,
      userId: user2.id,
      voteCount: 215,
      tags: {
        connect: [
          { id: tagMap["bucket-list"].id },
          { id: tagMap["wildlife"].id },
          { id: tagMap["photography"].id },
          { id: tagMap["high-altitude"].id },
          { id: tagMap["multi-day"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Votes
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Comments
  // -------------------------------------------------------------------------
  const comment1 = await prisma.comment.create({
    data: {
      body: "Completed this in October 2024 — the lenga beech forest was peak autumn colour, reds and oranges everywhere. Wind was brutal on day 3 between Paine Grande and Grey but manageable. Book the refugios at least 4 months out if you're going in season.",
      userId: user2.id,
      adventureId: adventure1.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "Agreed on the refugio booking — we missed out and ended up camping in the wind for 3 nights. Not ideal but honestly the star nights were worth it. The Torres sunrise hit different after earning it in the dark.",
      userId: user3.id,
      adventureId: adventure1.id,
      parentId: comment1.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "The boat crossing on Lago Grey was one of those unexpected highlights. Captain stops the engine mid-lake surrounded by icebergs. Total silence except the wind. Had 20 minutes just drifting. Worth timing your pace to catch the afternoon crossing.",
      userId: user3.id,
      adventureId: adventure1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      body: "Did this solo in August 2023. The KKH above Chilas is legitimately scary — road is one lane cut into a cliff with a 300m drop and trucks coming the other way. But Hunza Valley erases all memory of the bad bits. Karimabad is magic.",
      userId: user1.id,
      adventureId: adventure2.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "Altitude hit me hard at Khunjerab. Took two days to acclimatise in Sust before tackling the pass. Take the Diamox seriously, don't think you can skip it because you're fit.",
      userId: user2.id,
      adventureId: adventure2.id,
      parentId: comment2.id,
    },
  });

  await prisma.comment.create({
    data: {
      body: "The migration timing is genuinely luck — we were there for 10 days in August and saw four crossings, then met people who waited 12 days and saw none. Budget time. The Ngorongoro Crater was the more reliable wildlife experience and honestly I preferred it.",
      userId: user1.id,
      adventureId: adventure3.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "Summit night was -25°C with wind chill at Stella Point. Every piece of gear needs to be in your sleeping bag the night before — frozen boot laces at midnight are a disaster. The sunrise from Uhuru is unlike anything I've experienced. Do not turn back at Stella Point if you have any reserves left.",
      userId: user3.id,
      adventureId: adventure3.id,
    },
  });

  // -------------------------------------------------------------------------
  // AI-generated itineraries (one per adventure, showcasing the planner)
  // -------------------------------------------------------------------------

  // --- Itinerary: Torres del Paine W Trek ---
  const itinerary1 = await prisma.itinerary.create({
    data: {
      title: "Torres del Paine W Trek — October 2025",
      description: "AI-planned 5-day W Trek with refugio bookings, shuttle logistics, and buffer days for Patagonian weather.",
      travellers: 2,
      budget: 150000,
      status: ItineraryStatus.PLANNING,
      chatHistory: [],
      userId: user1.id,
    },
  });

  await prisma.itineraryDay.createMany({
    data: [
      {
        itineraryId: itinerary1.id,
        dayNumber: 1,
        title: "Arrival & Lago Grey",
        description: "Bus from Puerto Natales at 07:30, arrive park entrance 10:00. Boat crossing from Pudeto to Refugio Paine Grande. Afternoon hike to Grey Glacier viewpoint.",
        activities: [
          { time: "07:30", activity: "Turbus from Puerto Natales terminal", location: "Puerto Natales Bus Terminal", notes: "Book ticket day before, fills quickly" },
          { time: "10:00", activity: "Park entrance fee and permit check", location: "Laguna Amarga Entrance", notes: "CLP 21,000 per person, have cash" },
          { time: "11:30", activity: "Catamaran to Refugio Paine Grande", location: "Pudeto Pier", notes: "45-min crossing, $18 USD, book at puertonatalestour.cl" },
          { time: "14:00", activity: "Check in, cache heavy gear, light pack prep", location: "Refugio Paine Grande", notes: "Store non-essential weight here" },
          { time: "15:00", activity: "Hike to Mirador Glaciar Grey", location: "Grey Glacier Viewpoint", notes: "2h return, 90m ice wall, calving audible" },
          { time: "19:00", activity: "Dinner at refugio and briefing for Day 2", location: "Refugio Paine Grande", notes: "Meal included with refugio package" },
        ],
      },
      {
        itineraryId: itinerary1.id,
        dayNumber: 2,
        title: "Grey Glacier Full Day",
        description: "Full day to explore the Grey Glacier peninsula, beach with stranded icebergs, and optional kayak tour.",
        activities: [
          { time: "07:00", activity: "Breakfast and early start", location: "Refugio Paine Grande" },
          { time: "08:00", activity: "Hike north along Lago Grey shoreline", location: "Grey Glacier Peninsula Trail", notes: "Icebergs beach-stranded at low wind, surreal scale" },
          { time: "11:00", activity: "Optional: Grey Glacier kayak tour", location: "Grey Glacier Base", notes: "Book via Big Foot Patagonia, 4h, USD 120pp" },
          { time: "14:00", activity: "Return hike and lunch at refugio", location: "Refugio Paine Grande" },
          { time: "16:00", activity: "Prepare pack for morning departure to French Valley", location: "Refugio Paine Grande", notes: "Lay out kit, check weather forecast" },
        ],
      },
      {
        itineraryId: itinerary1.id,
        dayNumber: 3,
        title: "French Valley Amphitheatre",
        description: "The most dramatic day: 20km round trip into the Valle del Francés with hanging glaciers and the condor thermals above.",
        activities: [
          { time: "07:00", activity: "Depart Paine Grande heading east", location: "W Trek Trail", notes: "22km to Refugio Italiano, terrain varied" },
          { time: "09:30", activity: "Junction: Valle del Francés entrance", location: "Refugio Italiano", notes: "Drop heavy pack in storage shed, take day pack only" },
          { time: "10:00", activity: "Ascent into French Valley", location: "Valle del Francés", notes: "Hanging glacier Glaciar del Francés visible 30 min in" },
          { time: "12:00", activity: "Mirador Británico — panorama of massif", location: "Mirador Británico", notes: "Highest point on the W, 3h from refugio, worth every step" },
          { time: "14:00", activity: "Descend, collect packs, continue east", location: "Refugio Italiano to Refugio Los Cuernos" },
          { time: "17:30", activity: "Check in, dinner, rest legs for tomorrow", location: "Refugio Los Cuernos", notes: "Best sunset view of Los Cuernos from deck" },
        ],
      },
      {
        itineraryId: itinerary1.id,
        dayNumber: 4,
        title: "Chileno & Las Torres Base",
        description: "Final trekking day with the classic Chileno Valley approach. Stage at Refugio Chileno for the pre-dawn Torres summit hike.",
        activities: [
          { time: "07:30", activity: "Depart Los Cuernos heading east", location: "W Trek Trail" },
          { time: "10:30", activity: "Arrive Refugio Las Torres — lunch stop", location: "Refugio Las Torres", notes: "Hot food, coffee, check in packs" },
          { time: "12:00", activity: "Continue to Refugio Chileno — base camp", location: "Refugio El Chileno" },
          { time: "14:00", activity: "Rest and acclimatise — do NOT hike to towers today", location: "Refugio El Chileno", notes: "Save energy for 04:00 departure" },
          { time: "20:00", activity: "Dinner and early sleep — alarms set for 03:45", location: "Refugio El Chileno" },
        ],
      },
      {
        itineraryId: itinerary1.id,
        dayNumber: 5,
        title: "Mirador Las Torres — Sunrise",
        description: "The pilgrimage: pre-dawn boulder scramble to the base of the three towers. The payoff is the most photographed sunrise in South America.",
        activities: [
          { time: "04:00", activity: "Wake up, coffee, headlamps on", location: "Refugio El Chileno", notes: "Thermal layers essential, wind chill -5°C possible" },
          { time: "04:15", activity: "Depart for Mirador Las Torres in darkness", location: "Boulder Field Trail", notes: "2h ascent, final 45 min is steep boulder scramble" },
          { time: "06:15", activity: "Arrive mirador — stake your spot", location: "Mirador Las Torres", notes: "Lakeside edge gives reflection shots at full light" },
          { time: "06:45", activity: "Sunrise: towers turn amber-orange from the top down", location: "Mirador Las Torres", notes: "Allow 1h minimum, light shifts dramatically" },
          { time: "09:00", activity: "Descend to Refugio Las Torres for breakfast", location: "Refugio Las Torres" },
          { time: "11:00", activity: "Bus back to Puerto Natales via park entrance", location: "Park Entrance Bus Stop", notes: "Last bus 18:00 — confirm timetable with refugio staff" },
        ],
      },
    ],
  });

  // --- Itinerary: Karakoram Highway ---
  const itinerary2 = await prisma.itinerary.create({
    data: {
      title: "KKH Cycle — Islamabad to Khunjerab, July 2025",
      description: "Full AI-planned route with daily mileage targets, altitude profiles, guesthouse recommendations, and contingency rest days.",
      travellers: 1,
      budget: 200000,
      status: ItineraryStatus.DRAFT,
      chatHistory: [],
      userId: user3.id,
    },
  });

  await prisma.itineraryDay.createMany({
    data: [
      {
        itineraryId: itinerary2.id,
        dayNumber: 1,
        title: "Islamabad → Abbottabad",
        description: "First riding day. Leave the capital on the M1 motorway then the N-35 begins at Hassanabdal. 130km, minimal elevation.",
        activities: [
          { time: "05:30", activity: "Depart Islamabad before city traffic", location: "F-6, Islamabad", notes: "Head north on N-5 to Hassanabdal junction" },
          { time: "08:00", activity: "Hassanabdal — first chai stop", location: "Hassanabdal Tea Stall", notes: "KKH officially begins here — N-35 signpost" },
          { time: "13:00", activity: "Haripur bazaar lunch stop", location: "Haripur", notes: "Daal and chapati at main bazaar — PKR 200" },
          { time: "17:00", activity: "Arrive Abbottabad, check guesthouse", location: "Abbottabad City", notes: "Hotel Sarban recommended, PKR 2,500/night" },
        ],
      },
      {
        itineraryId: itinerary2.id,
        dayNumber: 7,
        title: "Besham → Dasu (Indus Gorge Entry)",
        description: "The mountains close in. The Indus Gorge begins and the road narrows to one lane in places blasted from cliff. 80km but mentally taxing.",
        activities: [
          { time: "06:00", activity: "Early depart — gorge gets hot by midday", location: "Besham", notes: "Carry 4L water minimum, no reliable sources for 40km" },
          { time: "09:00", activity: "Shatial historical site — rock petroglyphs", location: "Shatial", notes: "Short detour worth 30 min, 3,000-year-old carvings" },
          { time: "12:00", activity: "Rest in shade — midday sun in gorge is severe", location: "Any roadside shop", notes: "Wait out the 12:00-14:00 heat window" },
          { time: "16:00", activity: "Arrive Dasu, guesthouse and hot meal", location: "Dasu Town", notes: "PTDC Motel has secure bike storage" },
        ],
      },
      {
        itineraryId: itinerary2.id,
        dayNumber: 14,
        title: "Karimabad Rest Day — Hunza Valley",
        description: "Mandatory acclimatisation and recovery day. Altitude is 2,438m. Visit Baltit Fort and the Eagle's Nest viewpoint.",
        activities: [
          { time: "08:00", activity: "Baltit Fort opening, arrive early", location: "Baltit Fort, Karimabad", notes: "UNESCO heritage site, PKR 500 entry, guides available" },
          { time: "10:30", activity: "Duiker Inn terrace — Rakaposhi view with breakfast", location: "Duiker Inn Karimabad", notes: "Best cafe in the valley, serves proper coffee" },
          { time: "13:00", activity: "Eagle's Nest hike — 90 min up to panorama point", location: "Eagle's Nest, above Karimabad", notes: "360° view: Rakaposhi, Ultar Sar, Diran all visible" },
          { time: "16:00", activity: "Altit Fort and old Hunza village walk", location: "Altit", notes: "Older than Baltit, less visited, apricot orchards below" },
          { time: "19:00", activity: "Bike service and load check for high-altitude push", location: "Guesthouse", notes: "Check all bolts, cables, tyre pressure — cold affects everything" },
        ],
      },
      {
        itineraryId: itinerary2.id,
        dayNumber: 19,
        title: "Sust → Khunjerab Pass Summit",
        description: "Summit day. 75km, 1,500m elevation gain to 4,693m. The last full day of KKH cycling.",
        activities: [
          { time: "05:30", activity: "Depart Sust at first light", location: "Sust Border Town", notes: "Last fuelling stop — eat properly, altitude kills appetite" },
          { time: "07:00", activity: "Khunjerab National Park entry", location: "Park Checkpoint", notes: "Marco Polo sheep often visible roadside here" },
          { time: "10:00", activity: "Dih checkpoint — altitude 3,800m, assess condition", location: "Dih Checkpoint", notes: "Turn back here if headache or nausea — no shame in it" },
          { time: "12:30", activity: "Khunjerab Pass summit — 4,693m", location: "Khunjerab Pass, Pakistan–China Border", notes: "Sign, Chinese border gate visible. K2 visible east on clear day. Take your time." },
          { time: "14:00", activity: "Descent to Sust — 75km mostly downhill", location: "KKH descent", notes: "Watch for trucks on blind corners, cold on the way down" },
        ],
      },
    ],
  });

  // --- Itinerary: Serengeti & Kilimanjaro ---
  const itinerary3 = await prisma.itinerary.create({
    data: {
      title: "Serengeti Migration & Kili Summit — August 2025",
      description: "AI-planned 14-day Tanzania double: 5 days safari (Serengeti + Ngorongoro), 2 days Arusha rest, 7 days Machame Route to Uhuru Peak.",
      travellers: 2,
      budget: 450000,
      status: ItineraryStatus.BOOKED,
      chatHistory: [],
      userId: user2.id,
    },
  });

  await prisma.itineraryDay.createMany({
    data: [
      {
        itineraryId: itinerary3.id,
        dayNumber: 1,
        title: "Fly to Kilimanjaro Airport → Arusha",
        description: "Arrival day. Transfer to Arusha, gear check, briefing with Kilimanjaro operator.",
        activities: [
          { time: "14:00", activity: "Land JRO — Kilimanjaro International Airport", location: "Kilimanjaro International Airport", notes: "Yellow fever certificate checked at immigration" },
          { time: "15:30", activity: "Transfer to Arusha city — 45 min", location: "Arusha", notes: "Riverbend Hotel recommended, free gear storage" },
          { time: "17:00", activity: "Operator briefing: Machame Route, porter intro, kit check", location: "Climb operator office, Arusha", notes: "Weigh duffel bag — porters carry max 15kg" },
          { time: "19:30", activity: "Dinner at Arusha night market", location: "Arusha Night Market", notes: "Try nyama choma (grilled meat) and ugali" },
        ],
      },
      {
        itineraryId: itinerary3.id,
        dayNumber: 3,
        title: "Serengeti — Central Corridor Game Drive",
        description: "Full day in the Seronera Valley: Big Five territory, lion prides on termite mounds, hippo pools.",
        activities: [
          { time: "06:00", activity: "Pre-dawn game drive departure", location: "Serengeti Central, Seronera Valley", notes: "Best lion activity in first and last hour of light" },
          { time: "08:00", activity: "Hippo pool at Seronera River", location: "Seronera Hippo Pool", notes: "30+ hippos, crocs basking — stay in vehicle" },
          { time: "10:30", activity: "Cheetah platform sighting area", location: "Seronera Plains", notes: "Cheetahs use termite mounds as lookouts — scan the tops" },
          { time: "13:00", activity: "Picnic lunch in the bush under acacia", location: "Seronera Picnic Site", notes: "Raptors will mob any open food — keep lids on" },
          { time: "15:30", activity: "Mara River area drive — wildebeest crossing vigil", location: "Mara River Crossing Points", notes: "Herds mill for hours before committing. Wait them out." },
          { time: "18:30", activity: "Sundowner at lodge kopje", location: "Serengeti Under Canvas Camp", notes: "Full board included, G&T on the rocks watching the plains" },
        ],
      },
      {
        itineraryId: itinerary3.id,
        dayNumber: 8,
        title: "Machame Day 1 — Gate to Machame Camp (3,000m)",
        description: "Trek start: rainforest section, 18km, 1,200m elevation gain through dense Afromontane forest.",
        activities: [
          { time: "08:00", activity: "Machame Gate registration and porter weigh-in", location: "Machame Gate (1,800m)", notes: "Operator handles permits — carry your passport" },
          { time: "09:00", activity: "Enter rainforest — first 8km steady climb", location: "Machame Route Trail", notes: "Colobus monkeys overhead, dense canopy, often misty" },
          { time: "13:00", activity: "Lunch break at forest clearing", location: "Mid-forest Clearing (~2,400m)", notes: "Porters will have lunch prepped and waiting" },
          { time: "16:30", activity: "Arrive Machame Camp — tent setup, hot meal", location: "Machame Camp (3,000m)", notes: "First altitude night — headache normal, drink 3L water" },
        ],
      },
      {
        itineraryId: itinerary3.id,
        dayNumber: 13,
        title: "Summit Night — Barafu to Uhuru Peak (5,895m)",
        description: "Midnight departure. 6 hours ascent to Stella Point, 45 min crater rim traverse to Uhuru Peak. The summit.",
        activities: [
          { time: "00:00", activity: "Wake up, hot drink, layers on, headlamps on", location: "Barafu Camp (4,673m)", notes: "Pack minimum: water (insulate from cold), snacks, camera, spare gloves" },
          { time: "00:30", activity: "Depart for Stella Point", location: "Summit Trail from Barafu", notes: "Slow and steady — pole pole. The guide sets the pace, do not go faster." },
          { time: "05:30", activity: "Arrive Stella Point (5,739m) — crater rim", location: "Stella Point", notes: "First light on Mawenzi Peak to the east. Rest 10 min. Keep moving." },
          { time: "06:15", activity: "Uhuru Peak — 5,895m, Roof of Africa", location: "Uhuru Peak", notes: "Sign photo. Embrace your partner. Look at the curve of the earth. You made it." },
          { time: "07:00", activity: "Descent begins — 3h to Barafu for rest", location: "Summit trail descent", notes: "Knees take the punishment now — trekking poles essential" },
          { time: "10:00", activity: "Barafu rest, hot meal, then continue to Mweka Camp", location: "Barafu Camp", notes: "You will want to sleep but descend to lower altitude first" },
          { time: "15:00", activity: "Mweka Camp — celebration dinner with porters", location: "Mweka Camp (3,100m)", notes: "Tip your porters here — USD 10-15/day per porter is guideline" },
        ],
      },
    ],
  });

  console.log("Seed data created successfully");
  console.log(`  Users: ${user1.name}, ${user2.name}, ${user3.name}`);
  console.log(`  Adventures: ${adventure1.title}, ${adventure2.title}, ${adventure3.title}`);
  console.log(`  Itineraries: ${itinerary1.title}, ${itinerary2.title}, ${itinerary3.title}`);
  console.log(`  Tags: ${tags.map((t) => t.name).join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
