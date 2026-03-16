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
  // Additional tags
  // -------------------------------------------------------------------------
  const extraTagNames = [
    "glacier",
    "midnight-sun",
    "horse-trekking",
    "volcanic",
    "cultural-immersion",
    "remote",
    "island",
    "safari",
  ];
  const extraTags = await Promise.all(
    extraTagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const allTags = { ...tagMap, ...Object.fromEntries(extraTags.map((t) => [t.name, t])) };

  // -------------------------------------------------------------------------
  // Adventure 4 — Haute Route: Chamonix to Zermatt
  // -------------------------------------------------------------------------
  const adventure4 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-4" },
    update: {},
    create: {
      id: "seed-adventure-4",
      title: "Haute Route: Chamonix to Zermatt",
      description: `The classic high-level alpine traverse connects two of the world's most iconic mountain towns across 180 kilometres of glacier, moraine, and high pass — entirely above 2,000m for most of its length. It is not a technical route, but it is a serious one. The weather, the altitude, and the cumulative daily elevation gain of 12,000m across fifteen days demand respect.

The route starts in the shadow of Mont Blanc and ends with the Matterhorn filling the valley ahead of you on the descent into Zermatt. In between: the chaotic crevassed Glacier du Trient, the hanging valley of Arolla where chamois appear at dusk on the lateral moraines, the brutal ascent to the Col de Riedmatten (2,919m) with hands on rock, and the surreal flat expanse of the Grand Désert glacier where you can walk for an hour and feel no closer to anything.

Huts are comfortable and sociable — the Swiss Alpine Club system is the best in the world for multi-day mountain travel. Book the entire chain in March for a July departure; rooms go fast. The traditional route runs hut-to-hut in roughly 15 stages. Most walkers carry just a 10–12kg day pack, leaving heavier gear for a single duffel sent ahead by taxi on rest days.

The Chamonix to Zermatt direction is the classic for good reason: the weather typically deteriorates from west to east, so you start in worse conditions and finish in the best. The final descent into Zermatt with the Matterhorn appearing around every corner is one of the great finishes in alpine trekking.`,
      location: "Chamonix to Zermatt, Pennine Alps",
      country: "France / Switzerland",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 15,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: [
        "Final descent into Zermatt with the Matterhorn materialising around each bend",
        "Glacier du Trient crossing at dawn — crevassed ice glowing blue-white",
        "Arolla valley: classic Swiss alp scenery, chamois on the moraines at dusk",
        "Col de Riedmatten (2,919m) — hands-on scramble to the roof of the traverse",
        "Grand Désert glacier: a flat, silent expanse of ice above the valley noise",
        "SAC mountain hut dinners — three-course meals at 2,500m with other alpinists",
        "Mont Blanc visible for the first three days behind you",
      ],
      gear: [
        "Trail runners or light trekking boots (well broken in)",
        "Microspikes (early season — July crossings may have hard snow)",
        "10–12kg pack — leave the rest in storage at Chamonix or Zermatt",
        "Trekking poles (crucial on knee-punishing descents)",
        "Down jacket and hardshell for passes and afternoon storms",
        "SAC hut sheet sleeping bag liner (required in all Swiss Alpine Club huts)",
        "Sunglasses rated for glacier UV (Category 4)",
        "1:25,000 Swisstopo maps or offline Swisstopo app",
        "Emergency bivouac bag",
        "Hut reservation printouts — no signal in several valleys",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 350000,
      latitude: 46.0207,
      longitude: 7.7491,
      published: true,
      userId: user1.id,
      voteCount: 187,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["alpine"].id },
          { id: allTags["glacier"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 5 — Lofoten Islands Sea Kayaking
  // -------------------------------------------------------------------------
  const adventure5 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-5" },
    update: {},
    create: {
      id: "seed-adventure-5",
      title: "Lofoten Islands Sea Kayaking",
      description: `The Lofoten Islands rise from the Norwegian Sea like a fever dream: vertical walls of granite and gneiss dropping directly into arctic water so clear you can watch cod move ten metres below the hull of your kayak. The archipelago sits above the Arctic Circle, and in July and August the sun circles the horizon without setting — you paddle at midnight in amber light, set camp on a beach at 2am, and wake to find the same light still pouring through the tent door.

Eight days of paddling covers the outer archipelago from Å in the south to Svolvær in the north, with a route that weaves between sea stacks, through tidal narrows, and around headlands that funnel wind into powerful chop on exposed crossings. The fjords are genuinely sheltered — 20-minute crossings between islands rather than open-water marathon days — but weather changes fast and paddlers must read conditions conservatively. Three of eight days will have enough wind to consider a rest day.

Camping is the way to experience Lofoten properly. Friluftsliv — the Norwegian concept of outdoor life — means public access to virtually all land and beaches. You'll camp on white sand beaches backed by wildflowers, with fishing villages accessible by kayak but invisible from any road. The fishing huts (rorbuer) offer a warm meal and a shower on rest days for roughly 600 NOK.

Cod fishing has defined Lofoten for a thousand years. In spring, the air is heavy with drying fish. In summer the mountains mirror in the flat water and the light never stops.`,
      location: "Lofoten Archipelago, Nordland",
      country: "Norway",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: [
        "Midnight sun paddling — amber light at 1am on mirror-flat arctic water",
        "Sea stack labyrinth at Moskenesøya's outer coast",
        "Camping on white sand beaches inaccessible except by kayak",
        "Seeing the granite walls reflected perfectly in the morning fjord",
        "Reine village harbour approach by kayak at sunset — the Lofoten postcard",
        "Tide race surfing the tidal narrows at Nappstraumen",
        "Eagle overhead almost guaranteed — white-tailed eagles nest throughout",
      ],
      gear: [
        "Sea kayak with bulkhead hatches and deck lines (rental available Svolvær)",
        "Drysuit or wetsuit — water temperature 12–15°C even in August",
        "PFD, towline, bilge pump, paddle float",
        "VHF marine radio (Channel 16 for Norwegian Coast Guard)",
        "Dry bags for all camping gear (pack as if your hatch will flood)",
        "3-season sleeping bag and lightweight tent for beach camping",
        "Waterproof chart case with Statens Kartverk charts",
        "Wind meter — 15 knots is your limit for exposed crossings",
        "Midges cream (July swarms can be intense on land)",
        "Cash in NOK (some fishing villages are card-only, not internet)",
      ],
      bestMonths: [6, 7, 8],
      estimatedCost: 250000,
      latitude: 68.1085,
      longitude: 13.5956,
      published: true,
      userId: user3.id,
      voteCount: 134,
      tags: {
        connect: [
          { id: allTags["midnight-sun"].id },
          { id: allTags["island"].id },
          { id: allTags["camping"].id },
          { id: allTags["photography"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 6 — Trans-Bhutan Trail
  // -------------------------------------------------------------------------
  const adventure6 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-6" },
    update: {},
    create: {
      id: "seed-adventure-6",
      title: "Trans-Bhutan Trail",
      description: `Bhutan only reopened its ancient pilgrimage route as a long-distance trail in 2022, and so far relatively few outsiders have walked it end to end. The Trans-Bhutan Trail runs 400km across the kingdom from the Haa Valley in the west to Trashigang in the east, traversing the full width of the last intact Himalayan Buddhist kingdom along a network of paths that monks, traders, and armies have used for centuries.

The trail is divided into 25 stages but is rarely completed in one push — most intrepid walkers tackle a 21-day western section from Haa to Bumthang, which crosses the highest passes (some above 4,200m) and the densest concentration of dzong fortresses, lhakhang temples, and remote yak herder settlements. This is not a wilderness trail in the Torres del Paine sense: it moves through living communities, and you will eat in farmhouses, sleep in monastery guesthouses, and be invited to share butter tea by strangers.

Bhutan's government-mandated sustainable development fee (USD 200 per day until recently reduced to USD 100) was long a barrier. At current rates, a 21-day trail cost runs to roughly USD 2,100 in fees alone, plus accommodation. This keeps volumes low. On the entire first week of walking you may encounter no other foreign trekkers.

The eastern stages through Trongsa and Bumthang pass through valleys of buckwheat and red rice fields framed by 7,000m peaks. The views from the Pele La pass are arguably the finest mountain panorama accessible without technical climbing in the Himalaya.`,
      location: "Haa Valley to Bumthang, Himalayan Bhutan",
      country: "Bhutan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80",
      highlights: [
        "Pele La pass panorama: 4,390m with 7,000m Himalayan giants ahead",
        "Punakha Dzong — whitewashed fortress at the confluence of two rivers",
        "Farmhouse overnights with local families — real Bhutanese kitchen fire dinners",
        "Taktshang (Tiger's Nest) monastery perched on a 3,120m cliff face",
        "Ancient mani stone walls and prayer wheels on unmarked yak trails",
        "Bumthang valley's red-painted temples and ancient religious site",
        "Walking stretches with zero other trekkers for days at a time",
      ],
      gear: [
        "Trekking poles (mandatory — passes are steep and often muddy)",
        "Layering system rated to -10°C for high passes",
        "Waterproof gaiters (monsoon-season trails can be deep mud)",
        "Altitude medication (Diamox) — passes above 4,000m without acclimatisation time",
        "Cash in Ngultrum (BTN) — few ATMs outside Thimphu and Paro",
        "Offline maps: Maps.me or Gaia GPS loaded before arrival",
        "Trekking permit via Bhutan Tourism Council (required, arranged with licensed operator)",
        "Sleeping bag rated to -5°C (monastery guesthouses are cold)",
        "Camera with wide-angle for dzong architecture",
        "Buffer days: Bhutan's trails become rivers in monsoon rain",
      ],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 600000,
      latitude: 27.4712,
      longitude: 89.6339,
      published: true,
      userId: user2.id,
      voteCount: 76,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 7 — Okavango Delta Mokoro Expedition
  // -------------------------------------------------------------------------
  const adventure7 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-7" },
    update: {},
    create: {
      id: "seed-adventure-7",
      title: "Okavango Delta Mokoro Expedition",
      description: `The Okavango is the world's largest inland delta, an improbable ecosystem that flows from Angola's highlands into the Kalahari sand and simply stops — spreading across 15,000 km² of papyrus channels, hippo-grazed floodplains, and palm islands without ever reaching the sea. In July, the flood is at its peak, and the delta transforms into a maze of waterways navigated in mokoro — the traditional dugout canoes of the Bayei and Hambukushu people, poled standing from the stern.

Seven days gives you enough time to leave the motorboat safaris behind and move into the deep delta where only mokoro can go. Your poler navigates by memory — there are no maps that capture the detail of these waterways — through channels so narrow that papyrus brushes both sides simultaneously and the smell of crushed reed fills the air. You hear the hippo in the darkness and the poler reads the water surface for crocodile signs.

Wild camping is the rule, not the exception. You sleep under canvas metres from active game trails. A bull elephant can walk through camp at 3am; your poler will click softly with his tongue and the elephant will move on. The delta is genuinely remote and genuinely wild.

The wildlife density rivals any game reserve in Africa. Elephant herds of 50+ wade through the shallows. Red lechwe scatter in explosions of spray. Fish eagles call from every dead tree. This is safari at its most elemental — no vehicle, no road, nothing between you and the ecosystem except reed and water.`,
      location: "Okavango Delta, Ngamiland",
      country: "Botswana",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80",
      highlights: [
        "Silent mokoro gliding through papyrus channels at dawn — no engine noise",
        "Elephant herds wading through the shallows around your camp island",
        "African fish eagle calling from dead tree above the tent at sunrise",
        "Walking safari with your poler through the palm islands",
        "Night sounds: hippo, lion distant, reed frogs in their thousands",
        "Red lechwe herds scattering in slow-motion spray across the floodplain",
        "Stars undimmed by any human light source — Milky Way from camp every clear night",
      ],
      gear: [
        "Neutral colours only: khaki, sand, olive — no bright colours in game areas",
        "Lightweight long sleeves (malaria mosquitoes and delta sun)",
        "Dry bags for all camera gear and valuables in the mokoro",
        "Head torch with red mode (for night camp without disturbing animals)",
        "Malaria prophylaxis — start before departure, continue after",
        "Water purification tablets (drinking directly from delta not advised)",
        "Wide-angle and telephoto lens combination (wildlife approach distance varies hugely)",
        "Light camp shoes — no heavy boots needed except walking safari days",
        "Yellow fever vaccination (required for Botswana entry from some countries)",
        "Binoculars: 8×42 minimum for bird watching (800+ species recorded in delta)",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 400000,
      latitude: -19.2931,
      longitude: 22.8603,
      published: true,
      userId: user1.id,
      voteCount: 102,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["safari"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 8 — Villarrica Volcano Summit, Chile
  // -------------------------------------------------------------------------
  const adventure8 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-8" },
    update: {},
    create: {
      id: "seed-adventure-8",
      title: "Villarrica Volcano Summit",
      description: `Villarrica is one of South America's most active volcanoes and one of its most accessible. At 2,847m it is not an altitude challenge — it is an ice challenge. The flanks are permanently glaciated, the summit is a snow and ice climb requiring crampons and ice axe from the hut at 1,400m, and the caldera at the top contains an active lava lake that glows red and spits molten rock on good days.

The standard ascent route starts at 5am from the Villarrica ski resort base. Guides — mandatory in Pucón — lead groups of 8–10 up the snow slopes in the dark, moving by headlamp on a gradient that steepens sharply in the final 400 vertical metres. You arrive at the crater rim at dawn, lean over the edge on a fixed rope, and watch the lava below circulate in slow orange convections while sulphur gases tear at your eyes.

The descent is the highlight for many: you self-arrest brake on your ice axe down the steep snow, then pull out the plastic sledge provided by your guide company and toboggan the lower snowfield at speed back to the ski resort. It is chaotic and completely undignified and utterly satisfying.

The window for summiting is weather-dependent. Villarrica has a 60–70% success rate on any given day — summit if the weather gives you the chance, because the volcano is perpetually active and closes without notice when eruption risk rises. In 2015 it erupted and evacuated Pucón in the middle of the night.`,
      location: "Pucón, Los Ríos Region",
      country: "Chile",
      continent: "South America",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: [
        "Active lava lake at the crater rim — visible lava convection on clear days",
        "Ice axe crampon ascent up the glaciated south face at dawn",
        "Sulphur gas clouds rolling out of the caldera — gas mask on the rim",
        "Toboggan descent on plastic sledge — uncontrolled speed down the snowfield",
        "Panoramic sunrise from the summit: Lanín, Llaima, and the Chilean lake district",
        "Pre-dawn approach through the ski resort by headlamp in crampons",
      ],
      gear: [
        "Crampons and ice axe (provided by guide, check harness and pick condition)",
        "Gas mask or P100 respirator (mandatory, rentable in Pucón if not owned)",
        "Gaiters and waterproof mountaineering boots (crampon-compatible essential)",
        "Ski goggles (sulphur gas and ice wind on summit)",
        "Thermal base and mid layer — the crater rim is violently cold and windy",
        "Hardshell jacket and trousers (ice and wind)",
        "Glacier glasses (Category 4 UV) under goggles",
        "Toboggan under-trousers or padded waterproof trousers for descent",
        "Camera with weather sealing — moisture and sulphur corrode unprotected gear",
        "Pucón guide company booking (CONAF requires licensed guide)",
      ],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 50000,
      latitude: -39.4220,
      longitude: -71.9383,
      published: true,
      userId: user2.id,
      voteCount: 89,
      tags: {
        connect: [
          { id: allTags["volcanic"].id },
          { id: allTags["glacier"].id },
          { id: allTags["alpine"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 9 — Rwenzori Mountains: Mountains of the Moon
  // -------------------------------------------------------------------------
  const adventure9 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-9" },
    update: {},
    create: {
      id: "seed-adventure-9",
      title: "Rwenzori Mountains: Mountains of the Moon",
      description: `The Rwenzori range on the Uganda–DRC border is Africa's most mysterious mountain massif — equatorial glaciers draped over peaks above 5,000m, permanently wrapped in cloud, with flora that has evolved in total isolation into alien giant forms: 10-metre groundsel trees, heather forests the size of oaks, giant lobelia with flower spikes taller than a person. It is the most otherworldly landscape in Africa and, outside specialist mountaineering circles, almost completely unknown.

The standard Kilembe Route takes eight days to traverse the range from the Ugandan side. The elevation gain is relentless — you climb from 1,600m at the trailhead to the main ridge above 4,700m in four days, crossing from the tropical forest zone through giant heather, through the bizarre Afroalpine moorland, into the glaciated summit zone of Mount Stanley (5,109m, the third highest peak in Africa).

The technical summit via Margherita Peak on Mount Stanley requires basic crampon and rope skills. The range averages 270 rain days a year — this is not an exaggeration. Every day will involve some rain. The trails are mud, the huts are basic, and everything below 4,000m is relentlessly wet and leechy. Above 4,000m the cold replaces the wet. The payoff is landscapes that have no parallel anywhere else on earth and glacier views that almost no one has ever photographed.

The Rwenzori glaciers are retreating rapidly — at current melt rates, the ice fields will be gone by 2040. If equatorial glaciers are on your list, go now.`,
      location: "Rwenzori Mountains National Park, Western Uganda",
      country: "Uganda",
      continent: "Africa",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1600&q=80",
      highlights: [
        "Giant groundsel trees at 4,000m — prehistoric giants found nowhere else on earth",
        "Margherita Peak glacier (5,109m) — Africa's highest ice field, disappearing by 2040",
        "Giant lobelia forest: alien flower spikes in every direction through the mist",
        "Equatorial glacier crossing with crampons — one of the world's rarest experiences",
        "View from Margherita: DRC jungle canopy below, glaciers above the clouds",
        "Bigo Bog at 3,400m: peat bog traversed on log bridges under hanging heather",
        "Complete solitude — fewer than 5,000 people climb the Rwenzori annually",
      ],
      gear: [
        "Crampons and ice axe (Margherita summit route — full alpine kit required)",
        "Trekking boots with aggressive mud grip — lower trail is severe bog",
        "Gaiters up to the knee (mud sections are thigh-deep in places)",
        "Waterproof everything: pack liner, dry bags, taped jacket seams",
        "Leech socks — tube socks worn over trekking socks below 3,500m",
        "Sleeping bag rated to -10°C (huts are unheated at altitude)",
        "Trekking poles with large mud baskets",
        "Water purification (streams are clean above 3,000m, filter below)",
        "Rwenzori Mountaineering Services guide and porters (mandatory)",
        "Uganda visa — obtain e-visa before departure",
      ],
      bestMonths: [1, 2, 6, 7, 8],
      estimatedCost: 300000,
      latitude: 0.3993,
      longitude: 29.9278,
      published: true,
      userId: user1.id,
      voteCount: 58,
      tags: {
        connect: [
          { id: allTags["glacier"].id },
          { id: allTags["remote"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 10 — Kyrgyzstan Tian Shan Horse Trek
  // -------------------------------------------------------------------------
  const adventure10 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-10" },
    update: {},
    create: {
      id: "seed-adventure-10",
      title: "Kyrgyzstan Tian Shan Horse Trek",
      description: `Kyrgyzstan is the last place in Central Asia where nomadic summer migration — moving livestock from winter valley to alpine jailoo pasture — still happens at scale. A horse trek across the central Tian Shan in July follows the same routes that Kyrgyz families have ridden for centuries, climbing from 1,600m river valleys to 4,000m passes with a string of horses carrying camp, a local guide who navigates by landscape memory, and views of the glaciated peaks that give the range its name: Tian Shan — Mountains of Heaven.

The classic 12-day route runs from the Kochkor Valley south to Son-Kol Lake, then west through the Suusamyr Valley and over the Köl-Tor pass to the Jumgal basin. You spend 8–10 hours in the saddle on peak days, with no marked trails on much of the route — just the faint tracks of previous riders and herds. At Son-Kol the lake sits at 3,016m with 360° views of the Tian Shan, and the shore is lined with summer yurt camps where you can eat fresh kurt (dried yogurt balls) and fermented mare's milk and watch the horses graze at the water's edge.

The riding itself is not a gentle pony trek. Kyrgyz horses are small, strong, and unpredictable — they have been bred for mountain terrain and respond to leg pressure rather than rein control in the style most Western riders are accustomed to. Two days is enough to adapt. The hardest days are the pass crossings, where the trail becomes scree and the horse picks its own line with or without your input.

This is Central Asia at its most pristine. No one sells anything, no one has a booking system, and the welcome from nomadic families at their summer jailoos is completely genuine.`,
      location: "Kochkor to Jumgal, Naryn Region",
      country: "Kyrgyzstan",
      continent: "Asia",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1600&q=80",
      highlights: [
        "Son-Kol Lake at 3,016m — horses grazing at the edge, yurts on the shore",
        "Tian Shan passes at 4,000m with unmarked routes through glacial moraine",
        "Overnight in nomadic family yurts — fermented mare's milk at every meal",
        "Eagle hunter demonstration near Kochkor — centuries-old hunting tradition",
        "Completely unmarked backcountry navigation by landscape memory",
        "Suusamyr Valley panorama: 200km of mountain grassland with no roads",
        "Galloping on Kyrgyz horses across open alpine plateau — nothing like it",
      ],
      gear: [
        "Riding trousers (padded cycling shorts underneath for long days)",
        "Riding gloves and helmet (guides provide helmets, inspect condition)",
        "Waterproof jacket — mountain weather changes in minutes",
        "Warm sleeping bag (-5°C minimum for Son-Kol)",
        "Trekking poles (useful on off-horse sections through boulder fields)",
        "Water purification — mountain streams clean but carry iodine tablets",
        "Cash in Kyrgyz som — no ATMs outside Bishkek and Osh",
        "Saddle sore cream (honest advice: it will be needed by day 3)",
        "Satellite communicator (SPOT or Garmin InReach — no mobile signal for days)",
        "Offline maps: Gaia GPS loaded before departure in Bishkek",
      ],
      bestMonths: [6, 7, 8],
      estimatedCost: 180000,
      latitude: 42.1834,
      longitude: 75.0148,
      published: true,
      userId: user3.id,
      voteCount: 71,
      tags: {
        connect: [
          { id: allTags["horse-trekking"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["remote"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 11 — Mongolia Eagle Hunter Expedition
  // -------------------------------------------------------------------------
  const adventure11 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-11" },
    update: {},
    create: {
      id: "seed-adventure-11",
      title: "Mongolia Eagle Hunter Expedition",
      description: `In the Altai Mountains of far western Mongolia, a handful of Kazakh families still practice berkutchi — the art of hunting with trained golden eagles. The eagles, taken as fledglings and trained over years, are used to hunt foxes and sometimes wolves across the winter steppe. Spending ten days following these families into the Altai backcountry is an encounter with one of the last truly pre-modern hunting cultures still practiced at any scale on earth.

The expedition runs from Ulgii, Mongolia's westernmost city, into the Altai range with a small group of berkutchi families during the October-November hunting season. You travel by Russian 4WD UAZ van to the winter camps, then on horseback through the river valleys and across the high ridges where the hunters release their eagles from horseback at altitude, watching them stoop in 300 km/h dives onto prey below.

This is not a performance for tourists. The families hunt to supplement their income and feed their animals. The eagles weigh 5–7kg, stand 90cm tall, and have a wingspan of over two metres. You will be close enough to see the yellow eye. On hunting days the cold is brutal — October in the Altai regularly reaches -25°C — but the landscape compensates: snow-dusted steppe, larch forests in autumn colour, the Altai peaks reflecting in frozen river bends.

The Golden Eagle Festival in early October brings berkutchi families to Ulgii for competition riding and eagle demonstrations. The ten days following the festival then travel into the backcountry to see real hunting in real terrain. No festival performance is a substitute for the genuine article.`,
      location: "Bayan-Ulgii Province, Mongolian Altai",
      country: "Mongolia",
      continent: "Asia",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1600&q=80",
      highlights: [
        "Golden eagle stooping at 300 km/h from horseback in the Altai mountains",
        "Golden Eagle Festival: horseback competition and eagle display, Ulgii",
        "Living with Kazakh nomadic families in felt-lined winter gers",
        "Altai larch forest in peak October colour under first snowfall",
        "Eagle's eye contact at close range — 2m wingspan, 7kg predator on the glove",
        "Night temperatures to -25°C under a sky so clear it bends under its own stars",
        "Horseback traverse of unmarked Altai river valleys and ridgelines",
      ],
      gear: [
        "Extreme cold layering: base wool, down mid, expedition outer — rated to -30°C",
        "Face mask and goggles for -25°C riding (frostbite is real at this temperature)",
        "Insulated riding boots (pack warmers inside for the coldest days)",
        "Camera with battery grip and spare batteries kept warm inside jacket",
        "Telephoto lens 300–500mm equivalent for eagle flight shots",
        "Glove liners under outer mittens (fine camera work requires bare fingers briefly)",
        "Cash in Mongolian Tögrög — no card payment anywhere in Bayan-Ulgii province",
        "Mongolian visa (obtainable on arrival at Ulgii with Kazakh passport, arrange in advance for others)",
        "Travel insurance covering -25°C horse-riding activity",
        "Merino wool underwear (3 sets — hand washing in cold camps)",
      ],
      bestMonths: [10, 11],
      estimatedCost: 420000,
      latitude: 48.9674,
      longitude: 89.9714,
      published: true,
      userId: user2.id,
      voteCount: 93,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["horse-trekking"].id },
          { id: allTags["photography"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 12 — Skeleton Coast Self-Drive & Kayak, Namibia
  // -------------------------------------------------------------------------
  const adventure12 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-12" },
    update: {},
    create: {
      id: "seed-adventure-12",
      title: "Skeleton Coast Self-Drive & Kayak, Namibia",
      description: `The Skeleton Coast earned its name from the whale and seal bones that once lined its beaches in the age of industrial whaling, and from the shipwrecks of vessels driven onto a shore where south-flowing cold Atlantic current meets north-flowing desert air to produce permanent fog banks that roll 60 kilometres inland before burning off. It is one of the most remote and inhospitable coastlines on earth — and one of the most spectacular.

A 14-day self-drive routes south to north from Lüderitz on the southern Namibian coast through the Sperrgebiet diamond-prohibited territory to Swakopmund, then north along the Skeleton Coast to the Ugab River and the northern sector — a zone so restricted it requires a special permit and can only be visited on fly-in safaris or on foot with a registered guide.

The southern section is accessible by 4WD and rewards with: the rusted hulk of the Eduard Bohlen beached 500m from the current shore (the dunes moved around it), the fur seal colony at Cape Cross (100,000 animals, overwhelming in every sense), the red sand dunes of the Namib tumbling directly into the Atlantic, and the desert-adapted wildlife that somehow survives — black rhino, desert lion, and the Welwitschia mirabilis plant, a living fossil estimated at up to 2,000 years old.

The kayaking section runs three days from Swakopmund on the open Atlantic coast among Cape fur seals and African penguins. The cold Benguela current means the water never exceeds 16°C even in summer. The seals approach to within metres of the kayak out of pure curiosity.`,
      location: "Lüderitz to Terrace Bay, Namib Desert Coast",
      country: "Namibia",
      continent: "Africa",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600&q=80",
      highlights: [
        "Eduard Bohlen shipwreck 500m into the desert — the coastline has moved around it",
        "Cape Cross seal colony: 100,000 Cape fur seals at the surf line",
        "Namib red dunes meeting Atlantic waves — the only desert that meets the ocean",
        "Kayaking with seals and penguins from Swakopmund in 16°C Atlantic water",
        "Welwitschia mirabilis plants: 2,000-year-old living fossils in the gravel desert",
        "Fog-filled mornings in the Namib — cool silence before the sun burns it away",
        "Desert-adapted lion tracks in the sand at the Ugab River mouth",
      ],
      gear: [
        "High-clearance 4WD with dual spare tyres (roads are corrugated gravel for 600km)",
        "Recovery kit: MaxTrax, hi-lift jack, tow rope, shovel",
        "Water: 20L minimum reserve per vehicle at all times in the Sperrgebiet",
        "Satellite phone or InReach — no mobile signal for days at a time",
        "Wetsuit (full 3mm) for kayaking in cold Benguela current",
        "Binoculars for coastal wildlife (8×42 minimum)",
        "Skeleton Coast National Park permit (advance booking via NWR)",
        "Sperrgebiet entry permit (via Namibia Tourism Board if accessible)",
        "Camera with UV filter — Namib light and salt spray are brutal on glass",
        "Spare fuel: 80L jerry cans (distances between fuel stops exceed 300km in places)",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 500000,
      latitude: -21.1408,
      longitude: 13.6781,
      published: true,
      userId: user3.id,
      voteCount: 67,
      tags: {
        connect: [
          { id: allTags["desert"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["remote"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 13 — Laugavegur & Fimmvörðuháls Trail, Iceland
  // -------------------------------------------------------------------------
  const adventure13 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-13" },
    update: {},
    create: {
      id: "seed-adventure-13",
      title: "Laugavegur & Fimmvörðuháls Trail, Iceland",
      description: `The Laugavegur is Iceland's most celebrated trail and one of the world's great short treks — 55 kilometres of volcanic terrain linking the Landmannalaugar geothermal area to Þórsmörk in five days of walking through a landscape that looks rendered by a compositor who got confused between planetary biomes. Rhyolite mountains in mint green and terracotta. Black obsidian sand plains. Active sulphur fields venting pale gas. Glacial rivers you ford in boots on. Hot spring pools you soak in at camp.

The route runs north to south, finishing with a descent into Þórsmörk — a birch-covered river canyon that acts as the warmest, most sheltered microclimate in Iceland, and a dramatic contrast to the barren plateau above. The extension via Fimmvörðuháls adds two more days, crossing the 2010 Eyjafjallajökull eruption lava fields where the rock is still warm in places and sea smoke rises from vents in the basalt.

Huts along the route are the logistical anchor: Hrafntinnusker, Álftavatn, Emstrur, and Þórsmörk each have sleeping spaces, a hot meal, and a community of walkers from across the world who are all equally soaked and equally thrilled. Book huts the day they open in January for July and August dates — demand vastly exceeds supply.

Iceland's weather can deliver all four seasons in a single day. The Laugavegur has turned ankle-deep river crossings into chest-deep ones overnight after rain. Build a buffer day at Þórsmörk and use it.`,
      location: "Landmannalaugar to Þórsmörk, Southern Highlands",
      country: "Iceland",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1600&q=80",
      highlights: [
        "Landmannalaugar hot spring pool after the first day's walk — geothermal steam everywhere",
        "Rhyolite mountain palette: mint, orange, purple — colours found nowhere else on earth",
        "Fimmvörðuháls lava field crossing: 2010 eruption rock still warm underfoot",
        "Álftavatn lake camp with Eyjafjallajökull glacier behind the tent at dusk",
        "River crossings: glacial blue, thigh-deep, cold enough to take your breath",
        "Þórsmörk birch canyon: birdsong and warmth after days of barren plateau",
        "Emstrur black sand plain — stark volcanic moonscape mid-route",
      ],
      gear: [
        "Waterproof gaiters above the knee (river crossings are cold and sometimes deep)",
        "Trekking poles with large baskets (essential for river crossing stability)",
        "Waterproof trousers (worn more than off on most crossings)",
        "Gore-Tex boots that can get completely wet and still insulate",
        "Mid-layer down jacket — even in July, wind chill above 700m is severe",
        "Hut sleeping bag liner (mandatory in Ferðafélag Íslands huts)",
        "Trekking sandals for camp (don't walk a wet day in camp shoes but your feet need air)",
        "Offline maps: SafeTravel Iceland app with downloaded area",
        "Emergency bivouac bag rated to 0°C",
        "Hut booking confirmation printout (no signal at Hrafntinnusker)",
      ],
      bestMonths: [7, 8],
      estimatedCost: 150000,
      latitude: 63.9929,
      longitude: -19.0582,
      published: true,
      userId: user1.id,
      voteCount: 156,
      tags: {
        connect: [
          { id: allTags["volcanic"].id },
          { id: allTags["photography"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 14 — Cotswolds Way Weekend Walk
  // -------------------------------------------------------------------------
  const adventure14 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-14" },
    update: {},
    create: {
      id: "seed-adventure-14",
      title: "Cotswolds Way Weekend Walk",
      description: `The Cotswolds is England at its most pastoral — limestone villages with honey-coloured stone, dry-stone walls threading between sheep pastures, church towers rising from beech hangers. The Cotswolds Way runs 164 km from Chipping Campden to Bath, but a single weekend on its northern stretch gives you the heart of the route without the need for a fortnight's leave.

Start in Chipping Campden, a market town that has barely changed since the wool merchants built it in the 15th century. The first morning climbs to Dover's Hill — a natural amphitheatre with views across the Vale of Evesham — before dropping through Broadway and ascending Fish Hill, the Cotswolds' highest point at 312m. This is not altitude; it is perspective, and the view stretches forty miles on a clear day.

The second day threads Stanton, Stanway, and Hailes Abbey — a ruined Cistercian monastery half-swallowed by meadow grass — before finishing at Winchcombe. These are villages that exist to be walked through, with pubs that have been serving walkers longer than the word "tourist" has existed.

This is the ideal first multi-day walk: well-marked, well-serviced, with accommodation in every village and no technical terrain. Distance each day is 18–22km. Boots are required — the limestone clay turns slick after rain — but no specialist kit is needed. The Cotswolds rewards slow travel and stopping for every church gate.`,
      location: "Chipping Campden to Winchcombe, Gloucestershire",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
      highlights: [
        "Dover's Hill amphitheatre — 40-mile views across the Vale of Evesham",
        "Broadway village: honey-stone cottages, the Lygon Arms pub, and Tudor Market Hall",
        "Fish Hill summit (312m) — the Cotswolds' highest accessible point",
        "Hailes Abbey ruins: 13th-century Cistercian monastery in open meadow",
        "Stanton village: arguably the most perfectly preserved medieval village in England",
        "Real ale in centuries-old pubs every 8–10km along the route",
      ],
      gear: [
        "Waterproof hiking boots (limestone clay is slick after rain)",
        "Trekking poles optional but useful on descents",
        "Waterproof jacket and pack cover",
        "OS Explorer Map OL45 'The Cotswolds' (or Ordnance Survey app)",
        "Day pack 25–30L with packed lunch",
        "Layers for unpredictable English weather",
      ],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 25000,
      latitude: 52.0486,
      longitude: -1.7775,
      published: true,
      userId: user1.id,
      voteCount: 45,
      tags: {
        connect: [
          { id: allTags["multi-day"].id },
          { id: allTags["camping"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 15 — Cinque Terre Coastal Trails
  // -------------------------------------------------------------------------
  const adventure15 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-15" },
    update: {},
    create: {
      id: "seed-adventure-15",
      title: "Cinque Terre Coastal Trails",
      description: `Five fishing villages clamped to cliffs above the Ligurian Sea, connected by stone paths that have been maintained since the 12th century. The Cinque Terre — Monterosso, Vernazza, Corniglia, Manarola, and Riomaggiore — are Italy's most visited coastal stretch for good reason, and the walking trails that thread between them are among the most scenic in Europe.

The classic weekend approach walks from north to south over two days: Monterosso to Vernazza on day one (the most dramatic section, with cliff-edge path above breaking surf), then Vernazza to Manarola and down to Riomaggiore on day two via the famed Sentiero Azzurro. The Via dell'Amore — the "Lovers' Path" between Manarola and Riomaggiore — is the most photographed stretch, cut directly into the cliff face above the sea.

The high trail network — less visited and more rewarding — climbs above the coastal path into the terraced vineyards and chestnut forests. Sciacchetrà, the local dessert wine made from Bosco, Albarola, and Vermentino grapes grown on these impossibly steep terraces, is the reward for going up instead of down.

The villages fill with day-trippers from April to October; arrive early (before 9am) or stay the night to experience them in the hour before the first train arrives and the hour after the last train leaves.`,
      location: "Cinque Terre, Liguria",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1600&q=80",
      highlights: [
        "Vernazza harbour from the coastal trail above — the classic Cinque Terre view",
        "Via dell'Amore: cliff-cut path between Manarola and Riomaggiore above the Ligurian Sea",
        "High trail through terraced Sciacchetrà vineyards above Corniglia",
        "Sunrise from Manarola headland before the day-trippers arrive",
        "Monterosso beach swim after the cliff walk — the only sandy beach of the five",
        "Focaccia di Recco and local anchovies in any harbour bar",
      ],
      gear: [
        "Trail shoes or light hiking boots (paths are paved but uneven)",
        "Cinque Terre Card (trail access + train connections included)",
        "Sun protection — exposed cliff sections with no shade",
        "Small daypack 15–20L with water (fountains in every village)",
        "Swimwear for Monterosso beach",
        "Light layer for morning coastal breeze",
      ],
      bestMonths: [4, 5, 9, 10, 11],
      estimatedCost: 40000,
      latitude: 44.1274,
      longitude: 9.7052,
      published: true,
      userId: user2.id,
      voteCount: 62,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["multi-day"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 16 — Gili Islands Snorkel Escape
  // -------------------------------------------------------------------------
  const adventure16 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-16" },
    update: {},
    create: {
      id: "seed-adventure-16",
      title: "Gili Islands Snorkel Escape",
      description: `Three small coral islands off the northwest coast of Lombok, reachable by a 20-minute fast boat from Bangsal harbour. No motorised vehicles on any of the Gilis — just bicycles, horse carts, and foot traffic on sand paths. The pace drops to something close to silence.

Gili Trawangan is the largest and most social, with beach bars and a sunset strip that fills at dusk. Gili Meno in the middle is the quietest — a handful of guesthouses, a turtle sanctuary, and coral gardens that begin metres from the beach. Gili Air combines the two: enough life to feel connected, enough quiet to sleep well.

The snorkelling is the main event. The house reef at Gili Meno holds the densest population of sea turtles in Indonesia — not captive or baited, just resident. They feed on the seagrass at depths of 3–8m and are accustomed to swimmers. Green turtles and hawksbills both use the reef. You will see turtles.

The coral restoration projects around all three islands are among the most successful in Southeast Asia. Biorock structures, planted with coral fragments, have created artificial reef systems that host remarkable diversity: lionfish, bumphead parrotfish, and blacktip reef sharks patrol the outer slopes. No experience is required — rent a mask and fins from any beach shack and walk in.`,
      location: "Gili Islands, West Nusa Tenggara",
      country: "Indonesia",
      continent: "Asia",
      category: Category.DIVING,
      difficulty: Difficulty.EASY,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1600&q=80",
      highlights: [
        "Gili Meno house reef — wild sea turtles feeding at 3–8m depth, no guide needed",
        "Biorock coral restoration structures teeming with reef fish",
        "Blacktip reef sharks on the outer slope of Gili Trawangan at dusk",
        "Car-free island paths — only bicycles and horse carts between bungalows and beach",
        "Sunset from Gili Trawangan's strip: Bali's Agung volcano on the horizon",
        "Fresh grilled fish at sunset warung on any of the three islands",
      ],
      gear: [
        "Mask and snorkel (rentable on island but bring your own for fit)",
        "Reef-safe sunscreen only (chemical sunscreen banned on the Gilis)",
        "Rash guard for sun protection on extended snorkel sessions",
        "Waterproof dry bag for phone and valuables on boats",
        "Light sandals or reef shoes (coral rubble on some entry points)",
        "Cash in IDR — most warungs and smaller guesthouses don't take cards",
      ],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 30000,
      latitude: -8.3500,
      longitude: 116.0400,
      published: true,
      userId: user3.id,
      voteCount: 78,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["coastal"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 17 — Phi Phi Islands Sea Kayak
  // -------------------------------------------------------------------------
  const adventure17 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-17" },
    update: {},
    create: {
      id: "seed-adventure-17",
      title: "Phi Phi Islands Sea Kayak",
      description: `The Phi Phi archipelago in the Andaman Sea is one of Thailand's most dramatic seascapes — limestone karst towers draped in jungle, rising straight from water so clear you can see the shadow of your kayak on the seabed at 8m depth. The standard tourist experience arrives by speedboat and leaves by afternoon. The kayak experience is something else entirely.

Three days of paddling gives you access to the sea caves, hidden lagoons, and morning coves that the tour boats never reach. The hongs — enclosed tidal lagoons inside hollow karst formations — can only be entered by kayak at low tide, ducking through tunnel entrances less than a metre high to emerge into cathedral chambers open to the sky, with herons nesting on the cliff walls and mangrove roots descending into crystalline water.

Maya Bay — the beach made famous by The Beach — is best approached by kayak in the early morning before 7am, when the speedboats haven't yet arrived and the beach is empty of everything except sand, cliff, and sea. The national park closed the bay for three years to allow coral recovery; the water clarity has improved dramatically since reopening.

Camping on Phi Phi Don with a kayak allows access to the bay side beaches after sunset, when bioluminescent plankton lights the water blue with each paddle stroke.`,
      location: "Ko Phi Phi, Krabi Province",
      country: "Thailand",
      continent: "Asia",
      category: Category.KAYAKING,
      difficulty: Difficulty.EASY,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=1600&q=80",
      highlights: [
        "Sea cave hongs — tidal lagoons inside hollow karst, entered by kayak at low tide",
        "Maya Bay before 7am — empty beach in the limestone amphitheatre",
        "Bioluminescent plankton at night turning paddle strokes electric blue",
        "Viking Cave: 400-year-old sea swallow nest paintings on the cliff wall",
        "Morning snorkelling inside Pileh Lagoon — fish density visible from the kayak",
        "Sunset from Phi Phi Don viewpoint above the twin-bay silhouette",
      ],
      gear: [
        "Sit-on-top kayak (rentable at Phi Phi Don pier — double kayak for beginners)",
        "Dry bag for phone, wallet, and camera",
        "Reef-safe sunscreen (Andaman coral is sensitive)",
        "Snorkel mask (bring own for fit — lagoon snorkelling is excellent)",
        "Water shoes for rocky beach landings",
        "Waterproof phone case for underwater photos",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 20000,
      latitude: 7.7407,
      longitude: 98.7784,
      published: true,
      userId: user1.id,
      voteCount: 55,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 18 — Cape Peninsula Hike
  // -------------------------------------------------------------------------
  const adventure18 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-18" },
    update: {},
    create: {
      id: "seed-adventure-18",
      title: "Cape Peninsula Hike & Penguin Beach",
      description: `The Cape Peninsula juts 75km south from Cape Town into the South Atlantic, narrowing to the Cape of Good Hope — not the southernmost point of Africa (that's Cape Agulhas, 150km east) but the point where the continent seems to end and the two oceans begin their conversation. A two-day walk covers the peninsula's highlights from the city end to the Cape, with a return by train through the wine farms of the False Bay coast.

Day one starts at Chapman's Peak, where the cliff road is closed to traffic and open to walkers with unobstructed views of Hout Bay and the Atlantic. The trail threads through fynbos — the unique Cape floral kingdom with 8,500 plant species in an area the size of Portugal — before descending to Noordhoek Beach, a 7km arc of white sand usually shared only with horses and kelp.

Day two covers Boulders Beach, where an African penguin colony of 3,000 birds has colonised the granite boulders between the beach houses, and the Cape of Good Hope itself — the dramatic meeting point of the peninsula's final cliffs, with a lighthouse, a sign, and views that feel like the edge of something large.

This is one of the world's few places where baboons, penguins, and great white sharks all share a coastline. The baboons are genuinely dangerous in car parks; keep windows closed and bags zipped.`,
      location: "Cape Peninsula, Western Cape",
      country: "South Africa",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600&q=80",
      highlights: [
        "Boulders Beach African penguin colony — 3,000 penguins between the beach houses",
        "Cape of Good Hope: the southwest tip where two ocean systems meet",
        "Chapman's Peak cliff walk above the Atlantic with Hout Bay below",
        "Fynbos biome: 8,500 plant species in the world's smallest floral kingdom",
        "Noordhoek Beach — 7km of white sand shared only with horses",
        "Cape Point lighthouse viewpoint: 300m above the wave-cut cliffs",
      ],
      gear: [
        "Trail shoes or light hiking boots",
        "Windproof jacket (Cape winds are forceful and sudden)",
        "Sun protection — UV index routinely exceeds 11 in summer",
        "Cape Peninsula National Park entry fee (included in SAN Parks pass)",
        "Camera with a wide angle for cliff panoramas",
        "Water bottle — no springs on the upper trail",
      ],
      bestMonths: [9, 10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 15000,
      latitude: -34.3568,
      longitude: 18.4734,
      published: true,
      userId: user2.id,
      voteCount: 41,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 19 — Dolomites Tre Cime Loop
  // -------------------------------------------------------------------------
  const adventure19 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-19" },
    update: {},
    create: {
      id: "seed-adventure-19",
      title: "Dolomites Tre Cime Loop",
      description: `The Tre Cime di Lavaredo — three vertical dolomite pillars rising to 2,999m from the Sexten Dolomites plateau — are the most photographed rock formation in the Alps, and the circular trail beneath them is one of the most accessible truly spectacular mountain walks in Europe. The loop is 9km and 600m of elevation gain, and it can be walked in three hours by a fit person or stretched across a magnificent day.

The standard approach drives or takes a shuttle bus from Auronzo to the Rifugio Auronzo at 2,333m, which eliminates the hardest altitude gain. From there the trail circles anticlockwise through the rocky saddles on the north face — the dramatic side, where the walls drop 500m into the scree below — before returning across the south-facing meadows with the peaks' profiles catching the afternoon light.

The north face views are the highlight: the Cime di Dentro, Cima Grande, and Cima Occidentale standing in a row, their north walls scored with ice and lichens, the Austrian Dolomites behind them. You can often see climbers on the routes but the walls are genuinely large enough that they appear as insects.

Arrive before 8am to park, or take the shuttle after 9am and accept sharing the trail. The rifugio system offers lunch and coffee at 2,450m. Sunset from the Locatelli Rifugio on the north side is worth staying for.`,
      location: "Tre Cime di Lavaredo, South Tyrol",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1600&q=80",
      highlights: [
        "North face view of all three Cime in a line — the definitive Dolomites image",
        "Rifugio Locatelli at the north saddle — coffee with the walls directly above",
        "Climbers visible on the north face routes from the trail below",
        "Alpine meadows on the south loop: wildflowers and marmots in July",
        "Sunrise from the Auronzo Rifugio: the three peaks turning orange at dawn",
        "Forcella Lavaredo saddle (2,454m): the full north-face panorama revealed at once",
      ],
      gear: [
        "Hiking boots with ankle support (loose rock on the saddle crossings)",
        "Warm mid-layer (north face is cold and shadowed even in July)",
        "Trekking poles for the descent on loose dolomite scree",
        "Sun protection — UV at 2,400m is intense",
        "Shuttle bus ticket from Auronzo (saves parking fee, avoids queue)",
        "Cash for rifugio lunch (cards not always accepted at altitude)",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 30000,
      latitude: 46.6175,
      longitude: 12.3048,
      published: true,
      userId: user3.id,
      voteCount: 91,
      tags: {
        connect: [
          { id: allTags["alpine"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 20 — Mount Fuji Sunrise Climb
  // -------------------------------------------------------------------------
  const adventure20 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-20" },
    update: {},
    create: {
      id: "seed-adventure-20",
      title: "Mount Fuji Sunrise Climb",
      description: `Mount Fuji is Japan's highest peak at 3,776m and its most iconic symbol — a near-perfect stratovolcano that has been the subject of Japanese art for a thousand years. Climbing it overnight to reach the summit for sunrise (goraiko) is a pilgrimage that millions have made, and for good reason: watching the sun rise above a sea of cloud from Japan's roof, with the shadow of the cone stretching west across the Pacific horizon, is one of the great mountain experiences in the world.

The Yoshida Trail on the north flank is the most popular route and the best serviced — staffed mountain huts every 300m of elevation above the 5th Station, selling oxygen canisters, hot food, and warming stations for the inevitable midnight cold. The climb takes 5–7 hours to the summit crater; descent via the Subashiri Trail takes 3–4 hours on a sandy switchback designed specifically for fast descent.

Fuji's season is strictly July 1 to mid-September. Outside this window, trails are officially closed and mountain huts are shuttered. The crowds are real — weekends in August can put 10,000 people on the mountain in a single night. Weekday departures in July or early September dramatically improve the experience.

Above the 8th Station the cold is serious. The crater rim at 3,776m in July at 4am is regularly below 0°C with wind. Dress for conditions you won't encounter at 5th Station.`,
      location: "Mount Fuji, Shizuoka/Yamanashi Prefecture",
      country: "Japan",
      continent: "Asia",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1504598318550-17eba1008a68?w=1600&q=80",
      highlights: [
        "Goraiko sunrise from the crater rim — the shadow of Fuji stretching over Pacific cloud",
        "Crater walk: the full volcanic rim circuit at 3,776m takes 45 minutes",
        "Sea of clouds (Unkai) below the summit on clear mornings",
        "Mountain hut culture: hot noodles and tea at midnight above 3,000m",
        "Descent on the Subashiri sand trail — running descent on volcanic ash",
        "Yoshida 5th Station: torii gates and traditional stalls before the ascent begins",
      ],
      gear: [
        "Insulated jacket and gloves — summit temperatures below 0°C at night",
        "Waterproof outer shell (sudden storms above 3,000m)",
        "Headlamp with spare batteries (4-hour night approach)",
        "Trekking poles (Subashiri descent is steep switchback)",
        "Mountain sickness medication (optional but recommended for susceptible climbers)",
        "Cash — hut prices climb with altitude, cards not accepted at all stops",
      ],
      bestMonths: [7, 8],
      estimatedCost: 30000,
      latitude: 35.3606,
      longitude: 138.7274,
      published: true,
      userId: user1.id,
      voteCount: 115,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["photography"].id },
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
      { userId: user2.id, adventureId: adventure4.id },
      { userId: user3.id, adventureId: adventure4.id },
      { userId: user1.id, adventureId: adventure5.id },
      { userId: user2.id, adventureId: adventure5.id },
      { userId: user1.id, adventureId: adventure6.id },
      { userId: user3.id, adventureId: adventure6.id },
      { userId: user2.id, adventureId: adventure7.id },
      { userId: user3.id, adventureId: adventure7.id },
      { userId: user1.id, adventureId: adventure8.id },
      { userId: user3.id, adventureId: adventure9.id },
      { userId: user1.id, adventureId: adventure10.id },
      { userId: user2.id, adventureId: adventure10.id },
      { userId: user1.id, adventureId: adventure11.id },
      { userId: user3.id, adventureId: adventure11.id },
      { userId: user2.id, adventureId: adventure12.id },
      { userId: user1.id, adventureId: adventure13.id },
      { userId: user2.id, adventureId: adventure13.id },
      { userId: user3.id, adventureId: adventure13.id },
      { userId: user2.id, adventureId: adventure14.id },
      { userId: user3.id, adventureId: adventure14.id },
      { userId: user1.id, adventureId: adventure15.id },
      { userId: user3.id, adventureId: adventure15.id },
      { userId: user1.id, adventureId: adventure16.id },
      { userId: user2.id, adventureId: adventure16.id },
      { userId: user2.id, adventureId: adventure17.id },
      { userId: user3.id, adventureId: adventure17.id },
      { userId: user1.id, adventureId: adventure18.id },
      { userId: user3.id, adventureId: adventure18.id },
      { userId: user1.id, adventureId: adventure19.id },
      { userId: user2.id, adventureId: adventure19.id },
      { userId: user2.id, adventureId: adventure20.id },
      { userId: user3.id, adventureId: adventure20.id },
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
  console.log(`  Adventures: 13 total`);
  console.log(`  Itineraries: ${itinerary1.title}, ${itinerary2.title}, ${itinerary3.title}`);
  console.log(`  Tags: ${tags.map((t) => t.name).join(", ")}, ${extraTagNames.join(", ")}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
