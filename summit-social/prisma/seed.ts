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
    "8000m",
    "arctic",
    "australia",
    "camino",
    "culture",
    "cycling",
    "europe",
    "expedition",
    "gorge",
    "hiking",
    "jungle",
    "kayaking",
    "mountaineering",
    "mountains",
    "multi-sport",
    "new-zealand",
    "scotland",
    "scrambling",
    "skiing",
    "thru-hike",
    "trekking",
    "via-ferrata",
    "diving",
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
  // Adventure 21 — Snowdon via Watkin Path
  // -------------------------------------------------------------------------
  const adventure21 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-21" },
    update: {},
    create: {
      id: "seed-adventure-21",
      title: "Snowdon via the Watkin Path",
      description: `Snowdon — Yr Wyddfa in Welsh — is the highest point in England and Wales at 1,085m, and the Watkin Path is its finest ascent route: beginning in a Nantgwynant oakwood beside a waterfall and climbing through cwms, beside Bronze Age standing stones and abandoned slate quarries, to the summit ridge with 360-degree views across Snowdonia and, on clear days, Ireland.

The Watkin Path is the longest and most varied of Snowdon's six main routes. The lower section through Nantgwynant is genuinely woodland walking — ancient sessile oak hung with ferns and mosses in a landscape that has barely changed since the glaciers retreated 12,000 years ago. The ruins of the Plas Cwmllan slate quarry halfway up are a reminder that this mountain was a working landscape until the 1890s.

The upper section becomes rocky and exposed, requiring hands on rock at the final steps to the summit. The Bwlch y Saethau (Pass of the Arrows) on the ridge is where, in legend, Arthur fell in his final battle. The summit cairn holds the ruins of a Victorian railway station — the Snowdon Mountain Railway still runs from Llanberis and deposits people 50m from the top, which adds to the surreal summit experience.

Stay overnight in Beddgelert — a 45-minute drive from the trailhead — to reach the car park before the 9am rush on weekends.`,
      location: "Snowdon (Yr Wyddfa), Gwynedd",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: [
        "Nantgwynant oakwood approach — ancient sessile oak forest below the cwm",
        "Plas Cwmllan slate quarry ruins: mid-Victorian industrial archaeology at 700m",
        "Bwlch y Saethau ridge: Arthurian legend and a 180-degree ridgeline view",
        "Summit (1,085m): highest point in England and Wales, with a cafe",
        "Cwm Llan under Yr Wyddfa: glacial cirque with standing water in winter",
        "Views to Anglesey, Cardigan Bay, and (rarely) the Wicklow Mountains of Ireland",
      ],
      gear: [
        "Waterproof boots — the Watkin Path has permanent stream crossings low down",
        "Full waterproofs including trousers (Welsh weather is famously changeable)",
        "Trekking poles (upper section has loose shale)",
        "Emergency whistle and basic first aid",
        "OS Explorer Map OL17 'Snowdon' (or downloaded offline)",
        "Layers including warm mid-layer (summit is 1,085m — noticeably cold)",
      ],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 10000,
      latitude: 53.0685,
      longitude: -4.0763,
      published: true,
      userId: user2.id,
      voteCount: 38,
      tags: {
        connect: [
          { id: allTags["alpine"].id },
          { id: allTags["photography"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 22 — Trolltunga Hike, Norway
  // -------------------------------------------------------------------------
  const adventure22 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-22" },
    update: {},
    create: {
      id: "seed-adventure-22",
      title: "Trolltunga Hike, Norway",
      description: `Trolltunga — the Troll's Tongue — is a horizontal rock ledge jutting 700m above Lake Ringedalsvatnet in the Hardangerfjord region. It is the most dramatic viewpoint in Norway, and the photograph of someone standing on the ledge over that void has become one of the defining images of adventure travel. The hike is 22km and 1,100m of elevation gain, which makes it a serious day hike or a civilised two-day trip with a night at the top.

The trail begins at Skjeggedal, climbs steeply through the birch forest above the Ringedalen valley, and crosses a long alpine plateau before the final approach to the Tongue. The plateau is genuinely exposed — in cloud it reduces to compass navigation between cairns — and the climate changes fast. In June the final kilometre involves crampons on consolidated snow. By late August the plateau is bare rock and crowberries.

The two-day version camps on the plateau at the lake below Trolltunga, giving access to the ledge at sunrise before the day-hikers arrive. In summer the queue for the ledge photograph can be 90 minutes long; at 7am it is empty. The overnight also means you witness the plateau in the extraordinary light of the Norwegian summer evening — still bright at 11pm, turning amber and gold.

Book the trail bus from Odda or Tyssedal in July and August — the trailhead car park fills before 7am.`,
      location: "Trolltunga, Odda, Hardanger",
      country: "Norway",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80",
      highlights: [
        "Trolltunga ledge: standing 700m above Ringedalsvatnet — the definitive Norway shot",
        "Plateau sunrise before the day-hikers arrive — empty Tongue at 6:30am",
        "Hardangerfjord panorama from the plateau: fjord system and glacier visible together",
        "Midnight semi-darkness on the plateau — never truly dark in July",
        "Ringedalen valley ascent through silver birch forest with waterfalls",
        "Wild camping on the plateau: no crowds, total silence, no light pollution",
      ],
      gear: [
        "Trekking poles (1,100m of ascent and the same descent in a single day)",
        "Microspikes for June snow on the final approach",
        "Full waterproofs and warm layers for plateau conditions",
        "Tent if staying overnight (no hut on the route — wild camping is legal)",
        "Navigation app with offline map (plateau cairns are hard to follow in cloud)",
        "Camera — the Trolltunga shot requires a willing companion or tripod",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 20000,
      latitude: 60.1242,
      longitude: 6.7393,
      published: true,
      userId: user3.id,
      voteCount: 108,
      tags: {
        connect: [
          { id: allTags["midnight-sun"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 23 — Tongariro Alpine Crossing, New Zealand
  // -------------------------------------------------------------------------
  const adventure23 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-23" },
    update: {},
    create: {
      id: "seed-adventure-23",
      title: "Tongariro Alpine Crossing",
      description: `New Zealand's most famous single-day walk traverses the heart of Tongariro National Park — a UNESCO dual World Heritage site and the setting for Mount Doom in the Lord of the Rings films. The 19.4km crossing climbs through steam vents, across the South Crater, over the Red Crater rim at 1,886m, and descends past the Emerald Lakes — volcanic pools tinted brilliant turquoise by mineral deposits — before dropping through subalpine scrub to the Ketetahi trailhead.

The walk is one-way, requiring a shuttle bus from either end. The climb to Red Crater is steep — 300m in 2km — and the crater rim is genuinely exposed, with strong cold winds even in midsummer. The descent from Red Crater involves loose scree that is slippery in wet conditions. But the summit view rewards every element of effort: the active volcanic vent of Te Maari, the three peaks of Tongariro, Ngauruhoe, and Ruapehu in profile, and the Blue and Emerald Lakes sitting in the caldera below like alien gemstones.

The Crossing is sacred to Maori — Ngāti Tūwharetoa consider the peaks as ancestors rather than mountains. Walk respectfully: do not climb off-trail onto the summit cones, and do not remove rocks or volcanic material.

Check the eruption forecast at GeoNet before departure — the Tongariro volcano system had a minor eruption in 2012 and the hazard level fluctuates.`,
      location: "Tongariro National Park, Waikato",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1600&q=80",
      highlights: [
        "Emerald Lakes: volcanic mineral pools in the caldera — electric blue-green in morning light",
        "Red Crater rim (1,886m): the highest point, with steam and the full volcanic panorama",
        "Mount Ngauruhoe (Mount Doom) in profile on the western approach",
        "South Crater: flat volcanic plain, Mars-like in colour and emptiness",
        "Steam vents on the lower Ketetahi slope — heat rising through snow in winter",
        "The full three-volcano alignment: Ruapehu, Ngauruhoe, Tongariro across the plateau",
      ],
      gear: [
        "Sturdy hiking boots (loose volcanic scree on Red Crater descent)",
        "Windproof layer — crater rim wind can be strong even on calm days",
        "Full waterproofs (weather can close in in 30 minutes)",
        "Trekking poles for the steep scree descent",
        "Shuttle booking (one-way crossing requires transport both ends)",
        "GeoNet eruption forecast check on day of walk",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 25000,
      latitude: -39.1362,
      longitude: 175.6422,
      published: true,
      userId: user1.id,
      voteCount: 84,
      tags: {
        connect: [
          { id: allTags["volcanic"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 24 — Ben Nevis Winter Summit
  // -------------------------------------------------------------------------
  const adventure24 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-24" },
    update: {},
    create: {
      id: "seed-adventure-24",
      title: "Ben Nevis Winter Summit",
      description: `At 1,345m, Ben Nevis is the highest point in the British Isles — unremarkable in height by alpine standards, but formidable in winter condition. The north face holds Scotland's longest and most technically demanding ice routes, and the summit plateau in January sits under ice and wind that regularly exceeds 150 km/h. A winter ascent of the Mountain Track (the tourist path in summer) is a serious mountaineering objective that requires full winter equipment and navigation competence.

The Mountain Track from the Visitor Centre in Glen Nevis is 16km return with 1,345m of ascent. In summer it is a well-marked gravel path. In winter it is buried under consolidated snow and ice from the 700m mark, becomes a grade 1/2 winter climb on the final zigzags in hard conditions, and the plateau is a white-out navigation exercise in cloud. Every year ill-prepared walkers require rescue. Every year some don't come back.

Which makes the summit in good conditions one of the most rewarding day objectives in the UK. Clear winter days — rare but spectacular — give views to Ireland, Northern England, and deep into the Cairngorms. The snow cornices on the north face rim are sculptural. The ice formations in the summit observatory ruins are extraordinary. The silence at the top on a still day in February is complete.

The key hazard is the plateau: featureless, cornice-rimmed on the north, and in cloud indistinguishable from the descent route. A compass bearing (282° for the summit, 231° to descend away from the cliffs) must be known before departure.`,
      location: "Ben Nevis, Fort William, Lochaber",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=1600&q=80",
      highlights: [
        "Highest summit in the British Isles in full winter condition",
        "Summit plateau ice formations and north-face cornice viewing in clear weather",
        "Observatory ruins at 1,345m buried under winter ice",
        "360-degree view to Ireland on rare clear winter days",
        "Red Burn gully: the classic line on the Mountain Track in grade 1/2 snow",
        "Fort William below in late afternoon sun after summit descent",
      ],
      gear: [
        "12-point crampons (mandatory above 700m in winter condition)",
        "Ice axe — arrest technique essential before departure",
        "Full winter layering system rated to -20°C windchill",
        "Compass and ability to take bearings (GPS fails in wet conditions)",
        "Goggles and balaclava for plateau wind",
        "Avalanche transceiver, probe, and shovel (essential in loaded snow conditions)",
      ],
      bestMonths: [12, 1, 2, 3],
      estimatedCost: 25000,
      latitude: 56.7969,
      longitude: -5.0037,
      published: true,
      userId: user2.id,
      voteCount: 73,
      tags: {
        connect: [
          { id: allTags["alpine"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 25 — Half Dome via Cables, Yosemite
  // -------------------------------------------------------------------------
  const adventure25 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-25" },
    update: {},
    create: {
      id: "seed-adventure-25",
      title: "Half Dome via Cables, Yosemite",
      description: `Half Dome is Yosemite's iconic monolith — the 2,693m dome whose sheer northwest face has defined adventure photography since Ansel Adams pointed his camera at it in the 1940s. The summit route climbs the back of the dome via two fixed steel cables on a 45-degree polished granite slope, above a vertical face that drops 600m to the valley floor. It is not technically difficult, but it is genuinely exposed, and the cables section above the shoulder has no safety net — if you fall, you fall.

The round trip from Yosemite Valley is 24km and 1,460m of elevation gain — a serious day hike in any context, made harder by altitude and the physical demands of the cables. Most hikers start at 5–6am to reach the cables before afternoon thunderstorm buildup.

The sub-dome approach below the cables is a classic Yosemite granite scramble: hands-on slabs at 30–35 degrees, requiring some comfort with exposure. The cables themselves (two parallel steel cables supported on metal poles driven into the granite) are the crux — 130m of near-vertical granite with wooden boards as foot rests. In wet conditions the polished granite becomes ice-slick and the NPS closes the cables entirely.

A permit is required: 300 daily hikers maximum in the cable season (late May to mid-October). Apply in the permit lottery in March. Day-hike permits fill immediately.`,
      location: "Yosemite National Park, California",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: [
        "Half Dome cables: 130m of fixed-cable climbing at 45 degrees above a 600m drop",
        "Summit views: Yosemite Valley below, Clouds Rest ahead, Sierra Nevada stretching east",
        "Nevada Falls on the Mist Trail approach — rainbow in the spray at midday",
        "Sub-Dome slabs: granite scrambling above the sub-dome shoulder with exposure",
        "Yosemite Valley from above — the perspective no valley-floor viewpoint can give",
        "Merced River canyon and Liberty Cap from the summit rim",
      ],
      gear: [
        "Leather gloves (mandatory — cable friction tears skin)",
        "Helmet (rockfall risk from cables above you when crowded)",
        "Trail running shoes or approach shoes (stickier on granite than boots)",
        "Early start (5am) to beat afternoon thunderstorm risk",
        "3L of water (no reliable source above Nevada Falls)",
        "Half Dome permit (lottery in March — no permit, no cables)",
      ],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 15000,
      latitude: 37.7459,
      longitude: -119.5332,
      published: true,
      userId: user3.id,
      voteCount: 127,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["alpine"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 26 — Calanques Rock Climbing & Coastal Camp
  // -------------------------------------------------------------------------
  const adventure26 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-26" },
    update: {},
    create: {
      id: "seed-adventure-26",
      title: "Calanques Rock Climbing and Coastal Camp",
      description: `The Calanques are a 20km stretch of limestone fjords between Marseille and Cassis on the French Mediterranean coast — creamy white cliffs dropping into water so clear and blue it reads as deliberately saturated. The national park preserves some of the best sport climbing in France alongside wild swimming, coastal camping, and walking that oscillates between perfume of wild thyme and vertigo.

Three days combines the best of the Calanques: one day of climbing on the limestone bolted routes above En-Vau (the most spectacular fjord in the range, accessible only on foot or by sea), one day of coastal traversing between Cassis and Morgiou, and one overnight camp on a plateau above the cliff edge with the Mediterranean 200m below and the Calanques d'En-Vau spreading west in the evening light.

The climbing here is exceptional — 5a through 8c routes on pocketed limestone with the sea below. The beginner routes at Sormiou and Morgiou are steep and well-protected; the harder routes at Devenson have serious runout and require traditional skills. Most rental guide services offer a full climbing day for €80–100 pp.

Wild camping is technically prohibited in the Calanques National Park but tolerated on certain plateaux — check current rules with the park office in Marseille. The alternative is a B&B in Cassis (15-minute drive) and day access on foot.`,
      location: "Calanques National Park, Bouches-du-Rhone",
      country: "France",
      continent: "Europe",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=1600&q=80",
      highlights: [
        "Calanque d'En-Vau: the most dramatic fjord, accessible only on foot — turquoise below white cliffs",
        "Sport climbing above the Mediterranean on pocketed limestone with sea views",
        "Wild swimming at the base of the cliffs in water clear enough to see 15m depth",
        "Coastal traverse: scrambling between fjords with cliff tops above the sea",
        "Sunset from the En-Vau plateau — Calanques silhouettes in amber light",
        "Marseille bouillabaisse after the climb — the only acceptable post-climbing meal",
      ],
      gear: [
        "Rock shoes and harness (rentable in Cassis and Marseille)",
        "Helmet (mandatory on all limestone routes — loose pockets)",
        "Chalk bag and belaying device",
        "Approach shoes for the rocky path to En-Vau (30-minute scramble)",
        "Swimwear for calanque pools (water temperature 20–24°C in summer)",
        "Sun protection — white limestone reflects UV from above and below",
      ],
      bestMonths: [4, 5, 6, 9, 10, 11],
      estimatedCost: 50000,
      latitude: 43.2071,
      longitude: 5.4455,
      published: true,
      userId: user1.id,
      voteCount: 66,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["alpine"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 27 — Amalfi Coast Path Walk
  // -------------------------------------------------------------------------
  const adventure27 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-27" },
    update: {},
    create: {
      id: "seed-adventure-27",
      title: "Amalfi Coast Path Walk",
      description: `The Amalfi Coast is a 50km stretch of vertical southern Italy — cliff villages stacked above the Tyrrhenian Sea, lemon terraces hanging between the houses, and a driving road so narrow it has become a tourist attraction in itself. Walking it rather than driving is the only way to access the high paths that connect the villages above the road, where the real Amalfi exists: stone mule tracks, abandoned terraces reclaimed by wild oregano and rosemary, and views across the water to Capri.

The Sentiero degli Dei — the Path of the Gods — is the centrepiece. It runs high above Positano from Agerola to Nocelle, traversing the ridge at 600m with the coast and Capri below and the Lattari mountains above. It takes 4–5 hours and gains nothing in the walking: the elevation is held the entire length. The views are so consistently spectacular that progress slows involuntarily.

A five-day walk covers the full coast from Salerno to Positano via the high paths, with nights in Cetara (the finest small village on the coast), Ravello (above the road, genuinely quiet), Praiano, and Positano. Each day is 15–20km with 700–1,000m of accumulated ascent and descent on stone steps built centuries ago and maintained with serious care.

Book accommodation in April — the Amalfi coast is full in July and August and prices treble.`,
      location: "Amalfi Coast, Campania",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1529573441783-0ccba9a8abcb?w=1600&q=80",
      highlights: [
        "Sentiero degli Dei (Path of the Gods): 600m-high traverse with Capri on the horizon",
        "Ravello above the crowds: medieval village with Europe's finest coastal garden",
        "Cetara harbour: small fishing village, tuna colatura in everything",
        "Positano descent: cliff stairs through bougainvillea arriving at the beach",
        "Lemon groves between Minori and Maiori: fragrant tunnel paths under the canopy",
        "Nocelle sunset: the Positano silhouette and the open Tyrrhenian at dusk",
      ],
      gear: [
        "Comfortable trail shoes (stone steps are slippery when wet)",
        "Light daypack (20L — luggage transfer available between towns)",
        "Sun protection — limited shade on high paths",
        "Water bottle — springs in each village but limited on the ridge paths",
        "Light layers for evening (cliff villages cool fast after sunset)",
        "Small amount of cash (village trattorie and path-side bars are cash only)",
      ],
      bestMonths: [4, 5, 6, 9, 10, 11],
      estimatedCost: 80000,
      latitude: 40.6340,
      longitude: 14.6027,
      published: true,
      userId: user2.id,
      voteCount: 54,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["cultural-immersion"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 28 — Danube Cycle: Vienna to Budapest
  // -------------------------------------------------------------------------
  const adventure28 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-28" },
    update: {},
    create: {
      id: "seed-adventure-28",
      title: "Danube Cycle: Vienna to Budapest",
      description: `The EuroVelo 6 Danube Cycling Path between Vienna and Budapest is the most beginner-friendly multi-day cycle touring route in Europe: 320km of dedicated riverside path with almost no traffic, consistent elevation gain (the Danube valley is near-flat for almost the entire distance), and a succession of Baroque cities and medieval market towns that provide a cultural counterpoint to the physical progress.

Vienna to Bratislava (80km, day one) rolls through the Nationalpark Donau-Auen — a Danube floodplain forest of ash and willow — before the Bratislava skyline appears above the levee. Bratislava's old town deserves an afternoon: its scale is manageable and the castle-hill view over the Danube with the Austrian bank beyond captures the geography of the route perfectly.

From Bratislava the path continues southeast through Slovakia and Hungarian border town Esztergom — with the largest basilica in Hungary dominating the river bend above the cycle path — before the final leg into Budapest. The Danube Bend south of Esztergom is the most scenic stretch: the river hairpins through forested hills and the baroque town of Visegrád perches on its promontory above the water.

Budapest is the finish: arrive from the path on the north bank, cross the Chain Bridge, and reward yourself with a thermal bath in one of the city's 19th-century spa palaces.`,
      location: "Vienna to Budapest via Bratislava",
      country: "Austria",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.EASY,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: [
        "Bratislava old town: compact Central European Baroque on the Danube bank",
        "Esztergom Basilica: Hungary's largest church visible 20km downriver on approach",
        "Danube Bend: river hairpin through forest hills between Visegrád and Budapest",
        "Visegrád citadel above the river bend — medieval fortress on the limestone spur",
        "Budapest Chain Bridge arrival: the Chain Bridge from the river at speed",
        "Széchenyi thermal bath in Budapest: 19th-century spa to end six days of saddle time",
      ],
      gear: [
        "Touring or hybrid bike (rentable in Vienna — multiple operators near main station)",
        "Panniers or bikepacking bags (rear rack sufficient — route is flat)",
        "Padded cycling shorts (6 days in the saddle demands comfort)",
        "Lights (some tunnel sections on the path require front and rear)",
        "Offline navigation: Komoot or Ride with GPS with EuroVelo 6 downloaded",
        "Puncture kit and tyre levers (service shops in every town but not always open)",
      ],
      bestMonths: [4, 5, 6, 8, 9, 10],
      estimatedCost: 70000,
      latitude: 47.6875,
      longitude: 17.6504,
      published: true,
      userId: user3.id,
      voteCount: 49,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 29 — Galapagos Wildlife Snorkel Week
  // -------------------------------------------------------------------------
  const adventure29 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-29" },
    update: {},
    create: {
      id: "seed-adventure-29",
      title: "Galapagos Islands Wildlife Snorkel Week",
      description: `The Galapagos Islands are a living classroom in evolutionary biology — the archipelago where Darwin formulated natural selection, and where a millennium of geographic isolation has produced wildlife with no fear of humans. The marine iguanas sun themselves on your towel. The sea lions sleep on the dive pontoon. The blue-footed boobies perform their mating dance three feet from where you stand.

A week on a live-aboard or island-hopping itinerary covers the three principal wildlife zones: the western islands (Fernandina and Isabela) where the Humboldt current brings cold upwelling and the richest marine density; the central islands (Santa Cruz and Seymour Norte) for giant tortoises, frigatebirds, and the Darwin Research Station; and the southern islands (Española and Floreana) for the waved albatross colony and sea turtle nesting beaches.

Snorkelling in the Galapagos is among the best in the world without technical skill. The cold Humboldt current brings extraordinary nutrient load and unusual species: marine iguanas feeding on algae at 5m depth, sea lions spiralling around you in close circles, Galapagos penguins swimming at the surface, and whale sharks cruising by in July and August. The visibility on a calm day exceeds 20m.

July–December brings cooler and rougher conditions but whale sharks and the albatross. January–June is calmer and warmer with better visibility. Either way, the wildlife is year-round.`,
      location: "Galapagos Archipelago, Pacific Ocean",
      country: "Ecuador",
      continent: "South America",
      category: Category.DIVING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1600&q=80",
      highlights: [
        "Marine iguanas underwater: endemic lizards grazing on algae at 5m depth",
        "Sea lions spiralling around snorkellers in Galapagos sea lion bays",
        "Galapagos penguins at the surface — the only penguins north of the equator",
        "Whale sharks cruising the Gordon Rocks dive site (July–October)",
        "Blue-footed booby courtship dance at arm's reach — no fear of humans",
        "Giant tortoises at the Darwin Research Centre, Santa Cruz: 100-year-old animals",
      ],
      gear: [
        "5mm wetsuit (Humboldt current keeps water at 18–22°C even in summer)",
        "Snorkel mask (bring own — rental quality varies; marine iguanas warrant good optics)",
        "Reef-safe sunscreen only (chemical sunscreen banned in the marine reserve)",
        "Waterproof camera housing or GoPro mount",
        "National Park permit (arranged by tour operator — required for all islands)",
        "Motion sickness medication for inter-island boat crossings (Drake passage equivalent on bad days)",
      ],
      bestMonths: [1, 2, 3, 4, 5, 7, 8],
      estimatedCost: 300000,
      latitude: -0.9538,
      longitude: -90.9656,
      published: true,
      userId: user1.id,
      voteCount: 161,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["island"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 30 — Bali Temples, Rice Terraces & Jungle Trek
  // -------------------------------------------------------------------------
  const adventure30 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-30" },
    update: {},
    create: {
      id: "seed-adventure-30",
      title: "Bali Temples, Rice Terraces and Jungle Trek",
      description: `Bali's cultural and natural landscape is the most layered in Southeast Asia — a Hindu island inside a Muslim archipelago, where the rice terrace engineering of the subak irrigation system has shaped the land for a thousand years and the temple calendar runs continuously through 200+ ceremonies a year. Walking through this landscape rather than touring it by scooter reveals the depth beneath the Instagram surface.

A five-day itinerary centres on Ubud — the cultural heartland in the island's interior — and radiates out: north into the volcanic highlands of Mount Batur, east to the water temples of Pura Tirta Empul, west through the Campuhan Ridge walk above the Wos River, and south to the rice terraces of Tegalalang and Jatiluwih.

The Campuhan Ridge is the ideal first morning: a 9km walk along a narrow path between two river valleys, through stands of bamboo and the back gardens of the silver craftsmen's compound, arriving at the Pura Gunung Lebah temple above the confluence. No tourist buses reach this path. The only company is local farmers and the occasional artist seeking light.

Mount Batur at dawn requires a 2am start but pays back: the volcanic caldera at sunrise, with Lake Batur below and Agung filling the eastern horizon. It is the easiest summit in Indonesia and the most rewarding dawn view.`,
      location: "Ubud, Bali",
      country: "Indonesia",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1600&q=80",
      highlights: [
        "Campuhan Ridge walk above Ubud: riverside bamboo and artist compounds, no crowds",
        "Mount Batur sunrise (1,717m): volcanic caldera and Lake Batur at dawn",
        "Jatiluwih rice terraces: UNESCO-listed subak irrigation system in working use",
        "Pura Tirta Empul: active water temple with ritual purification in the spring pools",
        "Traditional Balinese dance performance in a torch-lit open temple courtyard",
        "Tegalalang rice paddies: stepped terraces above the Petanu River gorge",
      ],
      gear: [
        "Sarong (mandatory for temple entry — available for rent at every entrance)",
        "Comfortable walking sandals or trail shoes for ridge paths",
        "Headlamp for the Batur pre-dawn start",
        "Insect repellent (jungle paths below 800m have mosquitoes)",
        "Light rain jacket (sudden tropical showers are daily in wet season)",
        "Cash in IDR — most local warungs and temples are cash only",
      ],
      bestMonths: [4, 5, 6, 9, 10, 11],
      estimatedCost: 50000,
      latitude: -8.5069,
      longitude: 115.2625,
      published: true,
      userId: user2.id,
      voteCount: 72,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 31 — Milford Track, New Zealand
  // -------------------------------------------------------------------------
  const adventure31 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-31" },
    update: {},
    create: {
      id: "seed-adventure-31",
      title: "Milford Track, New Zealand",
      description: `The Milford Track is New Zealand's most famous Great Walk — a 53.5km one-way route through Fiordland National Park from Lake Te Anau to Milford Sound, described at its opening in 1908 as "the finest walk in the world." The description remains defensible. Four days of walking connects ancient beech forest, glacially carved river valley, mountain pass, and waterfall-threaded gorge to the sea fjord at Milford Sound — a journey through 600 million years of geological drama.

Day one is flat: a boat crossing to the trailhead and a gentle walk through Clinton River beech forest, birds calling from the canopy. The kiwi, robin, and fantail are all regular companions. Day two climbs the Clinton Valley and reaches McKinnon Pass at 1,154m — the crest of the main divide, where the weather changes between steps and both valleys are visible from the saddle. Mackinnon Hut on the pass is one of the great mountain huts in the world.

Day three descends the Arthur Valley past Sutherland Falls (580m — one of the world's tallest accessible waterfalls) to Dumpling Hut, with a side trip that gets you within spray distance of the falls' base. Day four follows the Arthur River to Sandfly Point and the Milford Sound ferry.

The walk is one-way and hut-only — no camping. Book from October 1 for the following season. The quota is 90 walkers per direction per day; numbers are genuinely limited.`,
      location: "Fiordland National Park, Southland",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1600&q=80",
      highlights: [
        "McKinnon Pass (1,154m): mountain saddle with both valleys visible, weather and light shifting constantly",
        "Sutherland Falls side trip: 580m cascade at arm's reach",
        "Clinton River beech forest: kiwi, robin, and fantail on quiet mornings",
        "Giant Gate Falls: Arthur River in flood pouring over a granite step on day four",
        "Milford Sound arrival by ferry: the fjord from the water after four days on foot",
        "Mackinnon Hut on the pass: the finest mountain hut position in New Zealand",
      ],
      gear: [
        "DOC hut booking confirmation (mandatory — no camping, no entry without booking)",
        "Waterproof everything: Fiordland receives 7,000mm of rain per year",
        "Trekking poles (McKinnon Pass descent is steep and often wet)",
        "Sandfly protection for Sandfly Point (the name is descriptive and accurate)",
        "Merino base layers (huts are cold at night even in summer)",
        "Hut sleeping bag liner (provided in huts, but own liner recommended)",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 120000,
      latitude: -44.6754,
      longitude: 167.8966,
      published: true,
      userId: user3.id,
      voteCount: 143,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["photography"].id },
          { id: allTags["alpine"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 32 — Ha Giang Loop Motorbike, Vietnam
  // -------------------------------------------------------------------------
  const adventure32 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-32" },
    update: {},
    create: {
      id: "seed-adventure-32",
      title: "Ha Giang Loop Motorbike, Vietnam",
      description: `Ha Giang Province in Vietnam's far north is the country's most dramatic and least-visited landscape: a vast karst plateau dissected by river gorges, terraced by H'mong and Dao farmers into staircases of rice and corn, and bounded to the north by the Chinese border mountains. The 350km loop from Ha Giang city through Dong Van, Meo Vac, and back is among the finest motorbike routes in Southeast Asia.

The road to Dong Van crosses the Ma Pi Leng Pass — a 20km stretch of cliff-edge mountain road above the Nho Que River gorge that is legitimately one of the most spectacular stretches of road in Asia. The gorge is 1,000m deep and the road has no barrier. The river 1,000m below appears as a turquoise thread. On a semi-automatic 110cc step-through, this section takes two hours and commands complete attention.

The H'mong and Lo Lo villages along the route have maintained their traditional dress, architecture, and market culture largely undisturbed by tourism. Sunday markets at Dong Van and Meo Vac bring together a dozen different ethnic groups in their full traditional costume. The corn wine is unavoidable and the lamb hot pot at altitude is excellent.

Rent a semi-automatic Honda at Ha Giang (no licence required, ~200,000 VND per day). The loop runs clockwise. Allow five days to avoid rushing any section. The roads are paved but narrow and trucks own the right of way.`,
      location: "Ha Giang Province, Northern Vietnam",
      country: "Vietnam",
      continent: "Asia",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1552084117-56a987666449?w=1600&q=80",
      highlights: [
        "Ma Pi Leng Pass: 20km of cliff-edge road above a 1,000m-deep turquoise gorge",
        "Dong Van Sunday market: 12 ethnic groups in traditional dress trading in the karst town",
        "Lung Cu Flag Tower: northernmost point of Vietnam, two countries visible",
        "Meo Vac cliff roads: hairpin sequences above the Nho Que river canyon",
        "H'mong stone village homestays at 1,400m with corn wine and hot pot",
        "Buckwheat flower fields in October: pink carpet across the grey limestone plateau",
      ],
      gear: [
        "Helmet (good quality available to rent in Ha Giang — inspect condition)",
        "Windproof jacket and gloves (altitude wind at 1,500m is cold year-round)",
        "Rain suit (typhoon season brings heavy rain — ponchos are sold on the route)",
        "Riding gloves and ankle-covering footwear",
        "Cash in VND — no ATMs in most villages, Ha Giang is the last reliable stop",
        "Offline maps: Maps.me or OsmAnd downloaded before departure",
      ],
      bestMonths: [9, 10, 3, 4, 5],
      estimatedCost: 30000,
      latitude: 23.2090,
      longitude: 105.0456,
      published: true,
      userId: user1.id,
      voteCount: 88,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["solo-travel"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 33 — Wadi Rum & Petra Desert Trek
  // -------------------------------------------------------------------------
  const adventure33 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-33" },
    update: {},
    create: {
      id: "seed-adventure-33",
      title: "Wadi Rum and Petra Desert Trek",
      description: `Jordan in five days combines two of the ancient world's most spectacular landscapes: Petra — the Nabataean rock city carved into rose sandstone cliffs 2,000 years ago — and Wadi Rum, the vast desert valley of towering sandstone towers that Lawrence of Arabia called "vast, echoing, and Godlike." Together they form one of the world's great desert itineraries.

Petra is best approached by the Siq at dawn — the 1.2km slot canyon narrows to 3m at its tightest point before opening onto the Treasury facade at the end of a bend. Arrive at 6am on a weekday and you will experience that moment alone. The main circuit adds the Monastery (850 steps above the valley — larger than the Treasury and usually deserted), the High Place of Sacrifice ridge walk, and the Royal Tombs facades. Two full days is the minimum to do Petra properly.

Wadi Rum is best experienced by staying with a Bedouin camp and using their guides rather than joining jeep tours. Two nights in a desert camp gives time for a full day of trekking: Jebel Rum by its north-facing gully (3–4 hours), the sand dunes of Umm Ishrin, and the red canyon at Khazali where Nabataean inscriptions are carved into the canyon walls at shoulder height. The night sky from Wadi Rum is one of the darkest in the Middle East.

Jordan is deeply hospitable; small gestures of reciprocity — accepting tea, sharing food — matter more than tip culture.`,
      location: "Petra and Wadi Rum, Ma'an Governorate",
      country: "Jordan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1539541417736-3d44c90da315?w=1600&q=80",
      highlights: [
        "Petra Siq at dawn: 1.2km slot canyon opening onto the Treasury at first light, alone",
        "The Monastery (Al-Deir): larger than the Treasury, 850 steps above the valley, usually deserted",
        "Wadi Rum Jebel Rum summit: sandstone towers above the red desert floor at sunset",
        "Khazali Canyon: Nabataean inscriptions at shoulder height in a red slot canyon",
        "Bedouin camp night in Wadi Rum: tea over the fire with the Milky Way overhead",
        "Wadi Rum sunrise: the towers emerging from darkness with the dunes turning orange",
      ],
      gear: [
        "Sun protection: hat, long sleeves, SPF50 (desert UV is extreme)",
        "Hiking boots with ankle support for rocky canyon terrain",
        "3L+ water capacity (no water in Wadi Rum between camps)",
        "Headlamp (Petra at night and early Siq approach)",
        "Jordan Pass (includes visa fee and Petra entry — significantly cheaper than paying separately)",
        "Cash in JD — Wadi Rum camps are cash only",
      ],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 80000,
      latitude: 29.5350,
      longitude: 35.4067,
      published: true,
      userId: user2.id,
      voteCount: 96,
      tags: {
        connect: [
          { id: allTags["desert"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 34 — Sahara Desert Camel Trek, Morocco
  // -------------------------------------------------------------------------
  const adventure34 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-34" },
    update: {},
    create: {
      id: "seed-adventure-34",
      title: "Sahara Desert Camel Trek, Morocco",
      description: `The Erg Chebbi dunes near Merzouga in southeast Morocco rise 150m from the hammada rock desert in one of the great landscape surprises of North Africa — you drive through three hours of flat, featureless stone desert and then the dunes are simply there, enormous and golden, stretching 22km from north to south. A five-day camel trek enters this landscape and stays in it long enough for the scale to register.

Day one loads the camels at the edge of Merzouga and crosses into the erg by afternoon, camping at the first high dune. The camel's slow gait — 4km/h, three hours per day of riding — is the right pace for the Sahara. You see the wind-sculpted surface in detail: the slip face curves, the horn formations of the barchans, the occasional dead branch of an ancient acacia tree poking from the sand.

Nights in the erg are the point. The temperature drops fast after sunset — 15°C within an hour of darkness — and the sky at Merzouga is one of the clearest in Africa. The Milky Way stands perpendicular to the horizon. Shooting stars are routine. The silence is total except for the wind over the dune crests.

The Berber guides navigate by landmark and star. There are no marked routes in the erg. Each morning the wind has reshaped the surface and the previous day's tracks have been erased.`,
      location: "Erg Chebbi, Merzouga, Draa-Tafilalet",
      country: "Morocco",
      continent: "Africa",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: [
        "Erg Chebbi dunes: 150m orange sand waves stretching 22km — nothing looks this colour in nature",
        "Dawn from the highest dune: shadow of the erg spreading west as the sun crests east",
        "Milky Way above the erg: one of Africa's darkest night skies from the desert floor",
        "Nomadic Berber tea ceremony at camp: three glasses of increasingly sweet mint tea",
        "Camel riding the crest of the barchan formations — the slip face below",
        "Abandoned ksour (fortified village) half-buried by advancing dunes at route edge",
      ],
      gear: [
        "Loose cotton long trousers and long-sleeve shirt (sun and wind protection, not warmth)",
        "Warm layer for nights — temperature drops 15°C within an hour of sunset",
        "Headscarf or shemagh (sand wind on the camel is constant)",
        "Lip balm and nasal moisturiser — the air is dessicating",
        "Camera with UV filter and sealed lens (sand is very fine and gets into everything)",
        "Flip-flops for camp (boots stay on for riding and walking)",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 60000,
      latitude: 31.0997,
      longitude: -4.0130,
      published: true,
      userId: user3.id,
      voteCount: 81,
      tags: {
        connect: [
          { id: allTags["desert"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 35 — Faroe Islands Coastal Hikes
  // -------------------------------------------------------------------------
  const adventure35 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-35" },
    update: {},
    create: {
      id: "seed-adventure-35",
      title: "Faroe Islands Coastal Hikes",
      description: `Eighteen islands of black basalt and green grass rising from the North Atlantic between Norway and Iceland — the Faroe Islands are a landscape of extremes: vertical sea cliffs, waterfalls that fall into the ocean, and a light that alternates between the grey of continuous cloud and the extraordinary gold of a North Atlantic break. In summer, the islands are walkable in a way they are not at any other time, and the path network connects the villages in a system of old post roads and shepherd tracks that predate roads entirely.

Six days covers the essential circuits: Trælanípa and the lake that drains directly into the sea (one of the most photographed viewpoints in the Faroes, but genuinely dramatic rather than merely photogenic), the cliffs of Beinisvørð at 470m above the open Atlantic, the Múlafossur waterfall at Gásadalur falling from the cliff edge into the sea below, and the Slættaratindur ascent — the highest point at 882m — with views to five islands on a clear day.

The villages are extraordinary: grass-roofed houses on turf platforms at the cliff edge, fishing boats in the grass-lined harbours, and a sense that the 20th century arrived but was absorbed rather than transformative. In Saksun, the village of a dozen houses in a tidal lagoon looks unchanged since the Norse sagas.

The Faroese have a word, søvnur, for the particular type of atmospheric melancholy the islands induce — an untranslatable combination of wonder and longing. You will understand it by day two.`,
      location: "Faroe Islands, North Atlantic",
      country: "Denmark",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: [
        "Trælanípa: the lake (Sørvágsvatn) that appears to float above the sea — optical illusion cliff edge",
        "Múlafossur waterfall: streaming off the Gásadalur cliff face into the Atlantic",
        "Beinisvørð sea cliffs (470m): sheer basalt above the open ocean with gannet colonies",
        "Slættaratindur summit (882m): highest point with five-island panorama",
        "Saksun tidal lagoon village: Norse-style turf-roofed farms at the cliff edge",
        "Atlantic puffin colonies on the grass cliff tops of Mykines island",
      ],
      gear: [
        "Full waterproofs (the Faroes receive 260+ rain days per year — assume wet every day)",
        "Windproof outer layer (cliff-edge winds exceed 60 km/h regularly)",
        "Hiking boots with good grip (basalt grass is slick when wet)",
        "Layers — temperature fluctuates 10°C in an hour",
        "Offline maps: Visit Faroe Islands trail app downloaded",
        "Respect for private land — trails cross farms; close gates behind you",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 150000,
      latitude: 62.0079,
      longitude: -6.7906,
      published: true,
      userId: user1.id,
      voteCount: 77,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["remote"].id },
          { id: allTags["island"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 36 — El Chalten & Fitz Roy Trails, Patagonia
  // -------------------------------------------------------------------------
  const adventure36 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-36" },
    update: {},
    create: {
      id: "seed-adventure-36",
      title: "El Chalten and Fitz Roy Trails, Patagonia",
      description: `El Chalten is a village of 1,500 people at the end of a road in Argentine Patagonia, built in the 1980s as a territorial claim and now the trekking capital of South America. The mountains above it — Fitz Roy (3,405m) and Cerro Torre (3,128m) — are two of the hardest technical climbs on earth, but the trail network that approaches their bases is open to anyone with good boots and patience for Patagonian weather.

The Laguna de los Tres trail is the peak experience: 22km return with 800m of ascent, climbing through southern beech forest before breaking into the moraine above Laguna de los Tres — a glacial lake directly below the Fitz Roy granite spire. On a clear morning the spire reflects in the lake and the Patagonian light turns the rock colours from pink to orange to gold within twenty minutes of sunrise. Clear mornings in El Chalten average seven to ten per month; plan for five days and expect two to three good views.

Cerro Torre via Laguna Torre is the second essential route: the granite needle of Cerro Torre appears at the valley head, with the Viedma Glacier visible to the south and the Torre Glacier calving icebergs into the lagoon below the tower. The approach is easier but the summit view is arguably more dramatic — the needle in clear conditions is one of the great mountain profiles on earth.

All trails start from El Chalten village. No permits, no booking, no fees.`,
      location: "El Chalten, Los Glaciares National Park",
      country: "Argentina",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80",
      highlights: [
        "Laguna de los Tres at sunrise: Fitz Roy reflected in the glacial lake below the spire",
        "Cerro Torre granite needle in clear conditions: arguably the world's most dramatic summit profile",
        "Torre Glacier calving icebergs into Laguna Torre below the needle",
        "Mirador del Condor: condors riding thermals above the Viedma Glacier below",
        "El Chalten village at dusk: the two towers turning pink in the Patagonian last light",
        "Southern beech forest on the lower approach — lenga in autumn gold before the open moraine",
      ],
      gear: [
        "Windproof hardshell (Patagonian wind is the defining experience — be prepared)",
        "Waterproof gaiters (stream crossings on Laguna de los Tres approach)",
        "Trekking poles (steep moraine on the final approach to Laguna de los Tres)",
        "Down jacket for summit waits — linger for the light change",
        "Extra food for weather-delay days in El Chalten",
        "Flexible itinerary: plan for five days minimum to guarantee two clear-view days",
      ],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 80000,
      latitude: -49.3316,
      longitude: -72.8864,
      published: true,
      userId: user2.id,
      voteCount: 169,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["alpine"].id },
          { id: allTags["photography"].id },
          { id: allTags["glacier"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 37 — Inca Trail to Machu Picchu
  // -------------------------------------------------------------------------
  const adventure37 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-37" },
    update: {},
    create: {
      id: "seed-adventure-37",
      title: "Inca Trail to Machu Picchu",
      description: `The classic Inca Trail is a four-day, 43km walk through the Peruvian Andes on a route the Incas built, maintained, and walked 500 years before the first European reached South America. It climbs from the Sacred Valley at 2,650m to Dead Woman's Pass at 4,215m and descends through cloud forest to emerge at the Sun Gate above Machu Picchu — the most famous archaeological reveal in trekking.

The trail is not technically difficult but it is aerobically demanding: the second day climbs 1,200m in 10km on cobbled stone steps designed for shorter-legged people and maintained in largely original condition. At altitude in the Andean sun, porters with 25kg loads overtake most walkers without apparent effort. The altitude is the variable nobody fully accounts for: Dead Woman's Pass at 4,215m is not extreme, but arriving at it without acclimatisation days in Cusco and Pisac first will reduce most fit adults to a slow shuffle.

The cloud forest on the third day is one of the great botanical environments: a closed canopy of tree ferns, bromeliads, and orchids at 3,000m, with hummingbirds feeding at eye level and Andean cock-of-the-rock displaying in the understorey. The forest opens at Wiñay Wayna — a complete Inca ruin complex embedded in the cloud forest wall — before the final descent to Intipunku.

Permits are limited to 500 per day total (guides and porters included). Book three to six months ahead for May–September. The trail closes in February.`,
      location: "Cusco to Machu Picchu, Cusco Region",
      country: "Peru",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1526400473556-aac12354f3db?w=1600&q=80",
      highlights: [
        "Sun Gate (Intipunku) at dawn: Machu Picchu revealed through the fog below",
        "Dead Woman's Pass (4,215m): the high point of the trail and the hardest single climb",
        "Wiñay Wayna Inca ruin complex embedded in the cloud forest wall",
        "Cloud forest orchids and hummingbirds on the third day's descent",
        "Machu Picchu at dawn before the train tourists arrive",
        "Andean condors riding thermals above the Urubamba Valley",
      ],
      gear: [
        "Layering system for 4,215m — night temperatures below 5°C at high camp",
        "Trekking poles (Inca stone steps are steep and slippery after rain)",
        "Waterproofs (cloud forest section is genuinely wet, not merely damp)",
        "Altitude acclimatisation: minimum three nights in Cusco before Day 1",
        "Altitude medication (Diamox 250mg — available in Cusco, prescription not always required)",
        "Inca Trail permit number and licensed guide company confirmation",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 120000,
      latitude: -13.1631,
      longitude: -72.5450,
      published: true,
      userId: user3.id,
      voteCount: 198,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 38 — Mont Blanc Summit via Gouter Route
  // -------------------------------------------------------------------------
  const adventure38 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-38" },
    update: {},
    create: {
      id: "seed-adventure-38",
      title: "Mont Blanc Summit via the Gouter Route",
      description: `At 4,808m, Mont Blanc is the highest peak in the Alps and the highest point in Western Europe. The Voie Normale via the Gouter Hut is the easiest route to the summit — a high-altitude snow climb rather than a technical mountaineering route — but it demands full alpine competence, acclimatisation, and respect for rapidly changing weather at altitude. Between 10,000 and 30,000 people attempt the summit each year; roughly a quarter turn back.

The approach from Saint-Gervais takes the Mont Blanc Express rack railway to Nid d'Aigle station (2,372m), then climbs the Tete Rousse Glacier and the notorious Grand Couloir — a rock funnel that channels stonefall from the Aiguille du Gouter above. Crossing the Grand Couloir is timed to the early morning freeze before the sun loosens the rock; the window is 45 minutes and the guide will know it precisely.

The Gouter Hut at 3,835m is the staging point for summit day. Departure is at 2am. Six hours of cramponing on 30-40 degree consolidated snow, with the Dome du Gouter at 4,304m and the Col du Dome before the final push to the summit. The altitude affects judgment — decisions about summit or turn-back are harder at 4,500m than they look from the valley. Trust your guide.

The view from the summit is 360 degrees and the horizon curves. Fourteen countries are theoretically visible. The experience is one of complete disorientation: you are standing higher than all of Western Europe, in all its smallness.`,
      location: "Mont Blanc, Chamonix Valley",
      country: "France",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: [
        "Mont Blanc summit (4,808m): highest point in the Alps and all of Western Europe",
        "Gouter Hut (3,835m) at sunset: the Chamonix valley floor 2,000m below in evening light",
        "Grand Couloir crossing in the pre-dawn freeze — calculated timing at the route's crux",
        "Dome du Gouter (4,304m): pre-summit plateau with the final ridge ahead",
        "Chamonix valley from the summit: the entire Mont Blanc massif spread below you",
        "Summit sunrise: the Alps in every direction, cloud layers below, horizon curving",
      ],
      gear: [
        "12-point steel crampons compatible with your mountaineering boots",
        "Ice axe with wrist loop",
        "Mountaineering double boots (rental available in Chamonix)",
        "Down suit or equivalent layering to -25°C windchill",
        "Helmet (Grand Couloir stonefall is real and unforeseeable)",
        "Certified mountain guide (Compagnie des Guides de Chamonix — non-negotiable for first ascent)",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 200000,
      latitude: 45.8326,
      longitude: 6.8652,
      published: true,
      userId: user1.id,
      voteCount: 147,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["glacier"].id },
          { id: allTags["alpine"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 39 — Matterhorn Hornli Ridge Ascent
  // -------------------------------------------------------------------------
  const adventure39 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-39" },
    update: {},
    create: {
      id: "seed-adventure-39",
      title: "Matterhorn Hornli Ridge Ascent",
      description: `The Matterhorn is the most recognisable mountain in the world — the perfect pyramid silhouette that has stood for the idea of an impossible peak since Whymper first stood on its summit in 1865 (and lost four companions in the descent). The Hörnli Ridge — the northeast arête above Zermatt — is the normal route and the one most first-time aspirants take. At AD+ difficulty, it requires solid rock scrambling skills, high altitude experience, and an experienced guide. It is not a walk.

The approach starts from the Schwarzsee cable car station above Zermatt and climbs to the Hörnlihutte (3,260m) — the only hut on the route — for an overnight before the summit attempt begins at 3:30am. The Hörnli Ridge is 1,220m of steep mixed terrain: rock bands, fixed ropes, ledges, and the occasional loose section that the thousands of previous climbers have exposed. Helmet is mandatory; stonefall from parties above is constant in busy season.

The route is not the hardest climb on the mountain — that would be the North Face — but it demands full commitment. The upper ridge above the Shoulder (4,257m) narrows to true arête conditions with exposure on both sides and the summit cross appearing at intervals as the angle eases before the final steepening. Summit success rate with a guide is roughly 50% on any given attempt day, weather being the dominant variable.

Zermatt below is car-free. The approach by rack railway adds to the sense of an earlier era of alpinism.`,
      location: "Matterhorn, Zermatt, Valais",
      country: "Switzerland",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXTREME,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80",
      highlights: [
        "Matterhorn summit (4,478m): the most iconic peak in the Alps",
        "Hornli Ridge upper arête: narrow rock crest with 1,000m exposure on both flanks",
        "Hornlihutte at 3,260m: the pre-dawn staging point above the Zermatt valley",
        "Zermatt below in dawn light as the ridge gains altitude",
        "Summit cross in clear conditions — the full range of the Pennine Alps visible",
        "Shoulder traverse at 4,257m: the route's narrowest and most exposed point",
      ],
      gear: [
        "Rock climbing shoes or approach shoes (guide will specify)",
        "Harness, helmet, and via ferrata set (fixed rope sections)",
        "Mountaineering boots and 12-point crampons",
        "Down jacket for pre-dawn temperatures at 4,000m+",
        "Certified UIAGM/IFMGA mountain guide (mandatory for safe ascent)",
        "Physical preparation: 5a+ rock climbing fitness and 4,000m+ altitude experience",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 250000,
      latitude: 45.9766,
      longitude: 7.6586,
      published: true,
      userId: user2.id,
      voteCount: 122,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["alpine"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 40 — Annapurna Circuit Trek, Nepal
  // -------------------------------------------------------------------------
  const adventure40 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-40" },
    update: {},
    create: {
      id: "seed-adventure-40",
      title: "Annapurna Circuit Trek, Nepal",
      description: `The Annapurna Circuit is the great loop: 160–220km (depending on access point) circumnavigating the Annapurna massif through the world's deepest gorge, over the highest trekking pass in Nepal, and through a landscape that changes from subtropical lowland to Tibetan plateau within 100km. It is one of the most diverse and complete mountain journeys on earth.

The route climbs north from Besisahar through increasingly dramatic terrain: the Marsyangdi River gorge narrows at Jagat, the forest gives way to dry scrub above Chame, and Manang sits in its high valley at 3,519m with Annapurna III (7,555m) filling the north wall. Two acclimatisation days in Manang are non-negotiable: Ice Lake at 4,600m is the standard acclimatisation hike, offering views of the entire circuit ahead.

Thorong La Pass at 5,416m is the physical and psychological centrepiece. The 3am start from High Camp gets you to the pass before the afternoon wind builds. The descent to Muktinath on the far side drops 1,600m in 8km on loose scree and moraines — the knees feel it for two days.

The Mustang region on the far side of the pass is the hidden reward: a Tibetan plateau landscape with 14th-century cave monasteries, mustard-yellow fields against red cliff faces, and prayer wheels turning in the dry wind. It feels like a different country because, a century ago, it was.`,
      location: "Annapurna Conservation Area, Gandaki Province",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: [
        "Thorong La Pass (5,416m): the high point, summit before the afternoon wind",
        "Manang acclimatisation view: Annapurna III (7,555m) across the valley floor",
        "Mustang region: Tibetan plateau landscape and 14th-century cave monasteries",
        "Ice Lake (4,600m): acclimatisation hike above Manang with full circuit panorama",
        "Marsyangdi Gorge lower section: subtropical forest and waterfalls in the deep canyon",
        "Muktinath temple: sacred Hindu and Buddhist site at 3,710m in the rain shadow",
      ],
      gear: [
        "Summit-rated down jacket and sleeping bag (-15°C for Thorong La night temperatures)",
        "Altitude medication (Diamox 250mg — mandatory above 4,000m for most trekkers)",
        "Trekking poles with large baskets (Thorong La descent on loose scree is punishing)",
        "Microspikes for the pre-dawn Thorong La approach in frozen conditions",
        "TIMS card and ACAP permit (arranged in Besisahar or Kathmandu)",
        "Offline maps: Gaia GPS or Maps.me downloaded before departure",
      ],
      bestMonths: [10, 11, 3, 4, 5],
      estimatedCost: 180000,
      latitude: 28.5965,
      longitude: 83.9575,
      published: true,
      userId: user3.id,
      voteCount: 176,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["multi-day"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 41 — Everest Base Camp Trek
  // -------------------------------------------------------------------------
  const adventure41 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-41" },
    update: {},
    create: {
      id: "seed-adventure-41",
      title: "Everest Base Camp Trek",
      description: `The walk to Everest Base Camp is the most famous trek in the world — and one of the most misrepresented. It is not a technical climb. No ropes, no crampons, no crevasses. It is a high-altitude walk on established trails that requires nothing except fitness, acclimatisation time, and the willingness to move slowly. What it delivers in return is a 14-day journey into the world's highest mountain ecosystem, culminating at 5,364m where 400 expedition tents and the Khumbu Icefall greet you with the face of the world's highest peak.

The approach from Lukla airport (2,846m) — the most dangerous commercial runway in the world — climbs through Namche Bazaar, the Sherpa capital at 3,440m, through the Sagarmatha National Park rhododendron forests to Tengboche monastery (3,867m) and across the high moraines above Dingboche to Base Camp. Acclimatisation days in Namche and Dingboche are not optional: AMS above 4,000m without adjustment kills people who ignored the same advice.

Kala Patthar (5,545m) is the real viewpoint, not Base Camp. The walk above Gorak Shep in the dark delivers you to a ridge with the full south face of Everest (8,848m) at eye level — and Lhotse, Nuptse, and Makalu filling the horizon. It is the most complete high-altitude panorama accessible to a non-climber.

The Sherpa culture that carries this mountain is the other story: the monastery at Tengboche, the yak caravans on the trail, the teahouse communities at each altitude stage.`,
      location: "Khumbu Region, Solukhumbu District",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1526400473556-aac12354f3db?w=1600&q=80",
      highlights: [
        "Kala Patthar (5,545m): full south face of Everest at eye level at dawn",
        "Everest Base Camp (5,364m): the Khumbu Icefall below the Lhotse Face",
        "Tengboche Monastery (3,867m): the highest monastery in the Himalaya with a view",
        "Namche Bazaar Saturday market: the trading hub of the Khumbu",
        "Dudh Kosi river gorge: emerald water in the deep Khumbu canyon",
        "Full eight-thousander panorama: Everest, Lhotse, Nuptse, Makalu from the high trail",
      ],
      gear: [
        "Down jacket rated to -20°C (Base Camp nights drop to -20°C even in October)",
        "Altitude medication (Diamox — start day before Namche ascent, stop at Base Camp)",
        "Microspikes for the Kala Patthar pre-dawn ascent on frozen trail",
        "Sagarmatha National Park permit and TIMS card",
        "Quality trekking boots (two weeks of rocky trail requires ankle support)",
        "Sleeping bag rated to -15°C (teahouse blankets are insufficient above 4,000m)",
      ],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 250000,
      latitude: 28.0026,
      longitude: 86.8528,
      published: true,
      userId: user1.id,
      voteCount: 231,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 42 — John Muir Trail, California
  // -------------------------------------------------------------------------
  const adventure42 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-42" },
    update: {},
    create: {
      id: "seed-adventure-42",
      title: "John Muir Trail, California",
      description: `The John Muir Trail runs 342km from Yosemite Valley to the summit of Mount Whitney — the highest peak in the contiguous United States at 4,421m — through the Sierra Nevada high country, crossing nine high passes above 3,600m and following the Pacific Crest Trail corridor through granite wilderness that Muir called "the range of light." It is the benchmark of American long-distance hiking.

The route is entirely above 2,500m for most of its length and stays above 3,000m for long stretches. The Sierras are a different mountain environment from the Rockies or Cascades: the granite is clean, the skies are reliably blue in July and August, and the trail is exceptionally well maintained. The alpine lakes — Thousand Island Lake, Rae Lakes, Guitar Lake — are the defining landscape feature: hundreds of clear bodies of water at altitude, each one different in shape and character.

Whitney Zone permits (for the final ascent) and Yosemite Valley trailhead permits are both required and both extremely competitive. Apply in the permit lottery in February for peak season dates. An alternative southern start from Horseshoe Meadows avoids the Valley permit scarcity.

Water is abundant above 3,000m but must be filtered — giardia is present in virtually all Sierra water sources. Bears are active: a bear canister is mandatory in all Sierra wilderness zones. Pack to 14–16kg (excluding water) for a 21-day thru-hike.`,
      location: "Sierra Nevada, California",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80",
      highlights: [
        "Mount Whitney summit (4,421m): highest point in the contiguous USA",
        "Thousand Island Lake: mirror granite lake with the Ritter Range reflected at sunrise",
        "Evolution Valley: the jewel of the Sierra Nevada, named for Darwin's contemporaries",
        "Forester Pass (4,009m): highest point on the PCT, snowfields in July",
        "Rae Lakes: three connected alpine lakes in a granite amphitheatre",
        "Guitar Lake: the classic camp below Whitney, guitar-shaped in satellite view",
      ],
      gear: [
        "Bear canister (mandatory in all Sierra wilderness — BV500 Bearikade or equivalent)",
        "Water filter (Sawyer Squeeze or similar — giardia in all water sources)",
        "Ultralight pack (sub-6kg base weight critical for 21-day mileage)",
        "Microspikes for June/early July high pass snowfields",
        "JMT permit + Whitney Zone permit (lottery in February)",
        "Resupply strategy: Muir Trail Ranch and Vermilion Valley Resort mid-route",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 120000,
      latitude: 37.7798,
      longitude: -119.3472,
      published: true,
      userId: user2.id,
      voteCount: 138,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["alpine"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 43 — Camino Frances de Santiago
  // -------------------------------------------------------------------------
  const adventure43 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-43" },
    update: {},
    create: {
      id: "seed-adventure-43",
      title: "Camino Frances de Santiago",
      description: `The Camino Frances — the French Way — is the principal route of the Camino de Santiago, the medieval pilgrimage road to the tomb of Saint James at Santiago de Compostela. From Saint-Jean-Pied-de-Port in the French Pyrenees it runs 780km across northern Spain: over the Pyrenees to Pamplona, through the Meseta's flat wheat plateau, over the Serra do Cebreiro into Galicia's green hills, and down to the cathedral at Santiago. Walking it takes 35 days.

The Camino is not a wilderness walk — it is a human road, a civilisation walk through two millennia of pilgrimage culture. You walk on Roman roads, sleep in medieval monasteries, and enter Burgos Cathedral past pilgrims who have walked from southern France or further. The albergue system — pilgrim hostels at 8–12 EUR a night — creates a social structure that generates its own friendships and rituals: coffee at dawn, hospitalero stamp in the credential, shared dinner at a communal table.

The Meseta — the 200km wheat plateau between Burgos and León — is what separates the Camino from other long routes. It is flat, wide, and repetitive. The sky is large and the path is straight. People who have walked the Meseta describe it as a meditation or an ordeal or both. There are no shortcuts and no scenery. The mind has to deal with itself.

The final day's walk into Santiago — the city in the rain, the plaza, the cathedral facade — is one of the great arrival moments in any form of travel.`,
      location: "Saint-Jean-Pied-de-Port to Santiago de Compostela",
      country: "Spain",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 35,
      coverImageUrl: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1600&q=80",
      highlights: [
        "Pyrenees crossing on Day 1: from Saint-Jean over the Ibañeta Pass into Spain",
        "Pamplona old town: the city of the Running of the Bulls at dawn before tourists arrive",
        "Cruz de Ferro (Iron Cross): the traditional stone-leaving ritual at 1,505m on the Meseta",
        "O Cebreiro village: Galicia's gateway, Celtic stone church in a cloud at 1,330m",
        "Santiago de Compostela cathedral arrival: the Botafumeiro incense ritual",
        "The Meseta dawn: walking into the sun on a straight Roman road with no other feature",
      ],
      gear: [
        "Trail shoes or light hikers (pavement sections demand cushioning as much as grip)",
        "Pilgrim credential (credencial del peregrino) from the first albergue or Confraternity",
        "Pack under 10% of body weight (most pilgrims start too heavy and post gear home by week two)",
        "Blister prevention: correct socks, anti-friction, toe protection from day one",
        "Sleeping bag liner for albergue bunks",
        "Walking poles (for the Pyrenees crossing and later descents in Galicia)",
      ],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 200000,
      latitude: 42.8805,
      longitude: -8.5457,
      published: true,
      userId: user3.id,
      voteCount: 121,
      tags: {
        connect: [
          { id: allTags["multi-day"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["solo-travel"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 44 — Pamir Highway Cycle, Tajikistan
  // -------------------------------------------------------------------------
  const adventure44 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-44" },
    update: {},
    create: {
      id: "seed-adventure-44",
      title: "Pamir Highway Cycle, Tajikistan",
      description: `The Pamir Highway — the M41 — is the world's second-highest international road, crossing the Wakhan Corridor and the high Pamir plateau between Dushanbe and Osh. Cycling it is a self-supported expedition through one of the least-visited and most geopolitically complex corners of the planet: the intersection of the Silk Road, the Afghan border, and the Chinese frontier, at an average altitude above 3,500m.

The route from Dushanbe to Osh is 1,500km and typically takes 21 days by bicycle. The key stages are the Wakhan Corridor — a narrow valley running along the Afghan border, where the river is the border and Afghani villages are visible across the water — and the Pamir plateau itself, beginning at Murghab (3,618m) where the road reaches the high steppe and the landscape simplifies to brown grass, blue sky, and no people for 200km at a stretch.

The Karakul Lake descent is the route's emotional peak: the saline lake sits at 3,914m in a volcanic crater, surrounded by the Muztagh Ata massif (7,546m) across the Chinese border. The colours at altitude — the deep blue of the lake against the pale brown of the steppe and the white of the glacier — are unreproducible in photograph.

Self-sufficiency is essential. Between Ishkashim and Murghab, the closest resupply point is 200km away. The Pamiri homestay network compensates: families in even the smallest settlements will feed and house a cyclist for a modest contribution.`,
      location: "Dushanbe to Osh via Wakhan Corridor",
      country: "Tajikistan",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EXTREME,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80",
      highlights: [
        "Wakhan Corridor: cycling the Afghan border with Hindukush peaks above the river",
        "Karakul Lake (3,914m): volcanic crater lake with Muztagh Ata across the Chinese border",
        "Murghab Pamir plateau: 200km of brown steppe above 3,600m with no traffic",
        "Pamiri homestay hospitality: kumiss, bread, and a felt mat in a village of 12 families",
        "Ak-Baital Pass (4,655m): the highest road pass in the former Soviet Union",
        "Wakhan petroglyphs: ancient hunting scenes carved into the cliffsides above the trail",
      ],
      gear: [
        "Expedition touring bike with 3-inch-wide tyres (road turns to track without warning)",
        "Full self-sufficiency kit: stove, food for 5 days, water filter (no resupply for 200km segments)",
        "Cold-weather sleeping system rated to -15°C (plateau nights are brutal even in July)",
        "GBAO permit for Gorno-Badakhshan Autonomous Region (arranged at Tajik embassy)",
        "Satellite communicator — no GSM signal for 500km of the route",
        "Altitude medication from 3,500m upward (cumulative altitude fatigue is real over 21 days)",
      ],
      bestMonths: [6, 7, 8],
      estimatedCost: 250000,
      latitude: 38.0039,
      longitude: 73.7921,
      published: true,
      userId: user1.id,
      voteCount: 84,
      tags: {
        connect: [
          { id: allTags["remote"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 45 — Aconcagua Normal Route
  // -------------------------------------------------------------------------
  const adventure45 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-45" },
    update: {},
    create: {
      id: "seed-adventure-45",
      title: "Aconcagua Normal Route",
      description: `Aconcagua is the highest mountain outside Asia at 6,961m — the Roof of the Americas. The Normal Route via the northwest face is a non-technical high-altitude mountaineering objective: no ropes required on the standard line, no glacier travel, no technical rock. What it demands instead is extraordinary altitude adaptation, physical conditioning, and patience for a 20-day summit window that includes acclimatisation camps, rest days, and weather holds at the mountain.

The approach from Mendoza takes three days by road and mule trail to Plaza de Mulas base camp at 4,300m — already higher than all of Europe. The climb then moves through two high camps (Nido de Condores at 5,570m and Cólera at 6,000m) to the Canaleta — the loose scree gully that is the final 350m before the summit. At altitude, the Canaleta takes 4–5 hours for what looks like a 30-minute walk.

The summit view encompasses the Pacific coast, the Chilean glaciers, and the plains of Mendoza. You are standing higher than any point in the world outside Asia. The success rate on any given expedition is roughly 30–40% for acclimatised, well-guided climbers; weather and altitude sickness are the dominant factors. Most summits come on attempt days between January 10 and February 20.

The experience of altitude at 6,900m is unlike anything below it. Decision-making degrades. Fine motor control is reduced. The team dynamic is the margin between summit and safe descent.`,
      location: "Aconcagua Provincial Park, Mendoza",
      country: "Argentina",
      continent: "South America",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 20,
      coverImageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80",
      highlights: [
        "Aconcagua summit (6,961m): highest point outside Asia — the Roof of the Americas",
        "Plaza de Mulas base camp: 4,300m, the highest established camp in the Americas",
        "Nido de Condores (5,570m): the condors riding thermals below the camp",
        "The Canaleta: the defining grind — 350m of loose scree at 6,600m+",
        "Summit view: Pacific coast, Chilean ice fields, and Argentine plains in every direction",
        "Andean condor soaring below base camp — 3m wingspan below you",
      ],
      gear: [
        "Expedition down suit (-40°C rated — summit temperatures below -30°C with wind)",
        "Double mountaineering boots (La Sportiva G2 or equivalent)",
        "12-point steel crampons",
        "Poles rated for alpine use — the Canaleta demands aggressive planting",
        "Aconcagua park permit (USD 800–1,200 depending on season and entry date)",
        "UIAGM-certified high-altitude guide (inexperienced parties have a 10% summit rate)",
      ],
      bestMonths: [1, 2],
      estimatedCost: 500000,
      latitude: -32.6532,
      longitude: -70.0109,
      published: true,
      userId: user2.id,
      voteCount: 93,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["alpine"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 46 — Svalbard Polar Wilderness Expedition
  // -------------------------------------------------------------------------
  const adventure46 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-46" },
    update: {},
    create: {
      id: "seed-adventure-46",
      title: "Svalbard Polar Wilderness Expedition",
      description: `Svalbard — the Norwegian Arctic archipelago at 78°N — is one of the world's most extreme accessible wilderness destinations: a landscape of glacier, tundra, and sea ice where polar bears outnumber people and all travel outside Longyearbyen must be accompanied by armed protection. Eight days on a small expedition vessel covers the west coast and crosses into Woodfjorden, one of the least-visited fjords in the archipelago.

The vessel anchors at the ice edge for Zodiac zodiac landings on beaches where walrus haul out in groups of 40–50, where bearded seals sleep on ice floes that calve from the tidewater glaciers above, and where reindeer pick their way through the tundra cotton grass without looking up. The guide carries a rifle and keeps watch at every landing; polar bears appear at range in every day of expedition travel.

The midnight sun makes photography viable at any hour. The light at 2am on a clear Arctic night — amber, horizontal, casting shadows 20m long — is one of the most extraordinary qualities of light on the planet. The stillness is total. No noise from any human source.

The Svalbard Global Seed Vault is visible from Longyearbyen. The permafrost layer that maintains it is the same permafrost whose retreat is the defining environmental fact of the archipelago's recent history.`,
      location: "Svalbard Archipelago, Barents Sea",
      country: "Norway",
      continent: "Europe",
      category: Category.SAFARI,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: [
        "Polar bear sighting: the defining Arctic wildlife encounter — guide keeps watch at all times",
        "Walrus haul-out on a tundra beach: 40+ animals at close range from the Zodiac",
        "Tidewater glacier calving: the sound arrives seconds after the visual",
        "Midnight sun photography at 2am: horizontal amber light, 20m shadows",
        "Sea ice edge navigation: bearded seals sleeping on floes the vessel passes at walking pace",
        "Svalbard reindeer on the tundra: the world's most northerly wild deer population",
      ],
      gear: [
        "Expedition suit or extreme cold layering: temperatures -5°C to +5°C in summer",
        "Rubber boots for Zodiac landings (all provided on vessel — confirm size in advance)",
        "Telephoto lens 400mm+ (polar bears are photographed at range for safety)",
        "Windproof outer layer (Arctic wind is constant and cutting)",
        "Motion sickness medication for Barents Sea crossings",
        "Passport and Svalbard entry documentation (special provisions for nationalities outside Schengen)",
      ],
      bestMonths: [6, 7, 8],
      estimatedCost: 600000,
      latitude: 78.2232,
      longitude: 15.6267,
      published: true,
      userId: user3.id,
      voteCount: 79,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["remote"].id },
          { id: allTags["photography"].id },
          { id: allTags["midnight-sun"].id },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Adventure 47 — Antarctic Peninsula Sailing Expedition
  // -------------------------------------------------------------------------
  const adventure47 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-47" },
    update: {},
    create: {
      id: "seed-adventure-47",
      title: "Antarctic Peninsula Sailing Expedition",
      description: `Antarctica is the last continent — the coldest, driest, windiest, and highest on average, with no permanent human population and no territorial sovereignty. Reaching it by small expedition vessel via the Drake Passage (the most violent sea crossing on earth) is the defining wilderness voyage, and a 12-day itinerary covers the Peninsula's highlights: the Lemaire Channel, the South Shetland Islands, and the vast penguin rookeries of Paradise Bay.

The Drake Passage crossing takes two days each way. In calm conditions (the "Drake Lake") it is a gentle open-ocean swell. In storm conditions (the "Drake Shake") it is 8-10m waves with all vessel operations suspended. The first sight of the Antarctic Peninsula — the cloud line that turns out to be a continent — is one of the most powerful moments in travel.

Zodiac landings on the Peninsula itself put you among the wildlife: gentoo and chinstrap penguin colonies of 50,000–100,000 birds, leopard seals resting on floes, humpback whales feeding in the nutrient-rich waters. The protocols are strict — no closer than 5m to penguins (they routinely ignore this rule), no touching wildlife, all bio-security controls for invasive species prevention.

The international expedition vessel carries scientists and specialist guides who provide lectures on the ecology, geology, and climate research underway in Antarctica. This is not a cruise ship experience. It is an expedition, complete with uncertainty about where the ice allows access each day.`,
      location: "Antarctic Peninsula, Southern Ocean",
      country: "Antarctica",
      continent: "Antarctica",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1600&q=80",
      highlights: [
        "First sight of Antarctica: the cloud line becoming a continent through binoculars",
        "Gentoo penguin colony landing: 100,000 birds on a beach with no roads or fences",
        "Humpback whale surfacing alongside the Zodiac in Paradise Bay",
        "Lemaire Channel navigation: the vessel threading between 600m ice walls",
        "Leopard seal on an ice floe: 3m predator asleep at arm's reach",
        "Drake Passage full storm: 8m swells and the bow going under white water",
      ],
      gear: [
        "Expedition parka and waterproof trousers (provided by most operators — confirm)",
        "Motion sickness prescription medication (scopolamine patches, not over-the-counter)",
        "Waterproof camera housing (sea spray on all Zodiac operations)",
        "Rubber boots for landings (mud and guano — provided by operator, bring warm liners)",
        "Binoculars 8x42 or 10x50 (whale sightings at range, glaciers across channel)",
        "Insurance covering adventure activities in Antarctica (standard travel insurance excludes this)",
      ],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 900000,
      latitude: -64.2823,
      longitude: -63.0000,
      published: true,
      userId: user1.id,
      voteCount: 105,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["remote"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["glacier"].id },
        ],
      },
    },
  });

  // Adventure 48 — Amazon Headwaters Canoe Expedition
  // -------------------------------------------------------------------------
  const adventure48 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-48" },
    update: {},
    create: {
      id: "seed-adventure-48",
      title: "Amazon Headwaters Canoe Expedition",
      description: `Paddle deep into the Ecuadorian Amazon from the Napo River tributaries into seldom-visited várzea forest. Launch from a riverside community near Tena, navigate winding blackwater streams, and camp on sandy beaches beneath cathedral jungle. Your guide — a Kichwa elder who has spent a lifetime reading the river — teaches you to identify medicinal plants, set fish traps, and read weather by cloud formation over the canopy.\n\nDays are spent paddling 20–35 km through shifting channels, pulling ashore to explore oxbow lakes teeming with caimans, river dolphins, and giant otters. Nights are spent in hammocks or simple riverside lodges, listening to howler monkeys and the chorus of ten thousand frogs. The river demands constant attention: reading currents, scouting shallows, and portaging around log jams. By the end you will have developed instincts that no classroom can teach.`,
      location: "Napo River, Tena",
      country: "Ecuador",
      continent: "South America",
      category: Category.KAYAKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: [
        "Paddle blackwater tributaries rarely visited by outsiders",
        "Travel with a Kichwa elder guide",
        "Spot river dolphins, caimans, and giant otters",
        "Camp on jungle beaches beneath the forest canopy",
        "Learn traditional plant knowledge and fishing techniques",
      ],
      gear: [
        "Sit-on-top canoe (provided)",
        "Dry bags — 20 L and 40 L",
        "Quick-dry clothing",
        "Insect repellent (DEET 30%+)",
        "Rain jacket",
        "Water purification tablets",
        "Headlamp with spare batteries",
        "Lightweight hammock",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 180000,
      latitude: -0.9,
      longitude: -77.8,
      published: true,
      userId: user3.id,
      voteCount: 19,
      tags: { connect: [{ name: "kayaking" }, { name: "jungle" }, { name: "wildlife" }] },
    },
  });

  // Adventure 49 — Atlas Mountains Traverse
  // -------------------------------------------------------------------------
  const adventure49 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-49" },
    update: {},
    create: {
      id: "seed-adventure-49",
      title: "Atlas Mountains Traverse",
      description: `Cross Morocco's High Atlas from Imlil to the remote Aït Bouguemez valley — the Valley of Happy People — via the Tichka Plateau and a string of Berber villages that have changed little in centuries. The trail climbs through walnut orchards and terraced barley fields, threads high passes where mules still carry salt and saffron, and descends into hidden valleys of rose-pink kasbahs.\n\nAccommodation is in traditional mountain gîtes where your host family serves tagine cooked over wood fire and argan oil pressed from trees on the hillside. The route tops out at 3,500 m on the Tichka Plateau, an ancient transhumance pasture where Berber families still bring their herds each summer. This is a trek for those who want to move through a living culture, not past it — unhurried, conversational, with plenty of time to accept tea.`,
      location: "Imlil to Aït Bouguemez",
      country: "Morocco",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1548693434-0571b716da38?w=1600&q=80",
      highlights: [
        "Cross the Tichka Plateau at 3,500 m",
        "Stay with Berber families in traditional gîtes",
        "Trek through the Valley of Happy People",
        "Visit kasbahs and rose-water village markets",
        "Spectacular views of the Sahara foothills to the south",
      ],
      gear: [
        "Trekking poles",
        "Layers for 5°C night temps",
        "Sun hat and high-SPF sunscreen",
        "Headlamp",
        "Day pack 20–25 L",
        "Broken-in trail shoes",
      ],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 90000,
      latitude: 31.1,
      longitude: -7.9,
      published: true,
      userId: user1.id,
      voteCount: 27,
      tags: { connect: [{ name: "trekking" }, { name: "culture" }, { name: "mountains" }] },
    },
  });

  // Adventure 50 — Scottish Munros Multi-Peak Challenge
  // -------------------------------------------------------------------------
  const adventure50 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-50" },
    update: {},
    create: {
      id: "seed-adventure-50",
      title: "Scottish Munros Multi-Peak Challenge",
      description: `Bag eight Munros across the Cairngorms and Glencoe in eight days — a highland circuit that showcases the full character of Scotland's wild places. Start in the Cairngorm plateau, the UK's only sub-arctic mountain environment, where plateau walks above 1,200 m cross snowfields well into summer. Then move west to Glencoe's famous ridges: the Aonach Eagach and the Bidean nam Bian massif where narrow crests demand hands-and-feet scrambling.\n\nThis is mountain weather at its most theatrical — mist rolling in from the Atlantic, sudden sunshine breaking on a lochan, and the almost magical quality of Scottish light in the golden hour. Navigation is core to the experience: OS map and compass work in low visibility is expected and tested. Evenings are spent in stone-walled bothies or classic mountain hostels, drying gear over radiators and sharing whisky with other hillwalkers.`,
      location: "Cairngorms and Glencoe",
      country: "Scotland",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: [
        "Summit eight Munros across two iconic mountain regions",
        "Traverse the Aonach Eagach ridge in Glencoe",
        "Navigate sub-arctic Cairngorm plateau",
        "Stay in traditional Scottish bothies",
        "Experience the extraordinary quality of highland light",
      ],
      gear: [
        "Full waterproofs (jacket + trousers)",
        "OS 1:25,000 maps + baseplate compass",
        "Trekking poles",
        "Gaiters",
        "Merino base layers",
        "Warm hat and gloves (even in summer)",
        "Emergency bivvy",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 110000,
      latitude: 57.1,
      longitude: -3.6,
      published: true,
      userId: user2.id,
      voteCount: 22,
      tags: { connect: [{ name: "mountaineering" }, { name: "hiking" }, { name: "scotland" }] },
    },
  });

  // Adventure 51 — Cape to Cape Track
  // -------------------------------------------------------------------------
  const adventure51 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-51" },
    update: {},
    create: {
      id: "seed-adventure-51",
      title: "Cape to Cape Track",
      description: `Walk the full 123 km Cape to Cape Track along Western Australia's Margaret River coast, from Cape Naturaliste lighthouse to Cape Leeuwin where the Indian and Southern Oceans meet. The trail ribbons between limestone headlands and bays of impossible turquoise, through towering karri and jarrah forest, past surf beaches where the swells arrive unbroken from Antarctica.\n\nThe track passes world-class wineries and artisan food producers — making it entirely possible to hike all day and eat very well each evening. Campsites sit at the edge of coastal cliffs or in forest clearings with birdsong for an alarm clock. The final day's descent to Cape Leeuwin, with both oceans visible and the historic lighthouse standing against an evening sky, is one of the great trail finishes in the world. Easygoing grades and clear waymarking make this an ideal multi-day trail for those new to long-distance hiking.`,
      location: "Margaret River Region",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 13,
      coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
      highlights: [
        "Walk where the Indian and Southern Oceans meet at Cape Leeuwin",
        "Limestone cliffs and turquoise bays throughout",
        "Famous Margaret River wine region along the route",
        "Ancient karri and jarrah forest sections",
        "Clear waymarking — ideal first multi-day trail",
      ],
      gear: [
        "Trail runners or light hiking boots",
        "Tent or bivvy (some free campsites)",
        "35 L hiking pack",
        "Water filter",
        "Sunscreen and sun hat (essential)",
        "Lightweight sleeping bag",
      ],
      bestMonths: [9, 10, 11, 4, 5],
      estimatedCost: 95000,
      latitude: -34.0,
      longitude: 115.1,
      published: true,
      userId: user1.id,
      voteCount: 31,
      tags: { connect: [{ name: "trekking" }, { name: "coastal" }, { name: "australia" }] },
    },
  });

  // Adventure 52 — Overland Track
  // -------------------------------------------------------------------------
  const adventure52 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-52" },
    update: {},
    create: {
      id: "seed-adventure-52",
      title: "Overland Track",
      description: `Tasmania's iconic 65 km Overland Track runs south from Cradle Mountain to Lake St Clair through the heart of the Tasmanian Wilderness World Heritage Area — one of the last great temperate wilderness areas on Earth. The route passes jagged dolerite peaks, buttongrass moorland, ancient pencil pine groves, and alpine tarns that reflect the sky in perfect stillness.\n\nThe track is well-maintained with a series of staffed huts, making it accessible to first-time multi-day trekkers who can still carry their own tent for flexibility. Side trips to the summit of Cradle Mountain or Mount Ossa — the state's highest peak — are worth the extra effort for 360° views across a landscape that has been effectively untouched for millennia. Wombats, wallabies, and echidnas wander the campsites at dusk. The final leg descends through ancient myrtle beech forest to the shores of Lake St Clair, Australia's deepest natural lake.`,
      location: "Cradle Mountain - Lake St Clair National Park",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=1600&q=80",
      highlights: [
        "Walk through UNESCO World Heritage wilderness",
        "Summit Cradle Mountain or Mount Ossa on side trips",
        "Ancient pencil pine and myrtle beech forests",
        "Wombats and wallabies at camp every evening",
        "Finish at Australia's deepest natural lake",
      ],
      gear: [
        "30–35 L pack",
        "Tent (huts available but carry one for flexibility)",
        "Full waterproofs — Tassie weather changes fast",
        "Gaiters for muddy sections",
        "Trekking poles",
        "Warm layers including fleece and down jacket",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 70000,
      latitude: -41.6,
      longitude: 145.9,
      published: true,
      userId: user2.id,
      voteCount: 36,
      tags: { connect: [{ name: "trekking" }, { name: "wildlife" }, { name: "australia" }] },
    },
  });

  // Adventure 53 — Te Araroa South Island Section
  // -------------------------------------------------------------------------
  const adventure53 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-53" },
    update: {},
    create: {
      id: "seed-adventure-53",
      title: "Te Araroa South Island Section",
      description: `The South Island section of Te Araroa covers roughly 1,100 km from Nelson at the top of the island to Bluff at the southern tip — a 25-day highlight itinerary taking in the trail's greatest chapters. Begin with the Richmond Ranges, a challenging highland traverse rarely visited by casual tourists, then descend into the wine country of Marlborough before hitting the Nelson Lakes.\n\nThe Southern Alps section via the Richmond, Poulter, and Rangitata is the heart of the walk — river crossings that demand judgment, unmarked routes across alpine tarns, and ridgelines where the views of Aoraki/Mount Cook stop you cold. The final chapter crosses the Southland plains into Fiordland, finishing on the long beach walk to Bluff's famous signpost. This is trail running territory if you move fast, or immersive long-form trekking if you don't — either way it will recalibrate your sense of what wild country means.`,
      location: "Nelson to Bluff, South Island",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 25,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: [
        "Richmond Ranges traverse with remote alpine camping",
        "Multiple significant river crossings requiring judgment",
        "Views of Aoraki/Mount Cook from the Southern Alps",
        "Fiordland coastal finale into Bluff",
        "Wild country that resets your sense of scale",
      ],
      gear: [
        "50 L pack with removable daypack",
        "Trekking poles (essential for river crossings)",
        "Tent rated to 4-season",
        "GPS device loaded with TA waypoints",
        "PLB or satellite communicator (required)",
        "River crossing shoes (crocs or dedicated pair)",
        "Waterproof map pouch",
      ],
      bestMonths: [12, 1, 2, 3],
      estimatedCost: 220000,
      latitude: -43.5,
      longitude: 171.0,
      published: true,
      userId: user3.id,
      voteCount: 28,
      tags: { connect: [{ name: "trekking" }, { name: "thru-hike" }, { name: "new-zealand" }] },
    },
  });

  // Adventure 54 — Greenland Ice Cap Trek
  // -------------------------------------------------------------------------
  const adventure54 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-54" },
    update: {},
    create: {
      id: "seed-adventure-54",
      title: "Greenland Ice Cap Trek",
      description: `Cross a section of the Greenland Ice Sheet on ski and pulk — one of the world's most spectacular wilderness traverses. The route departs from the ice edge near Kangerlussuaq and travels across a vast white plateau where the horizon in every direction is nothing but sky and ice. Crevasse navigation, polar camp craft, and white-out navigation are the skills of the day.\n\nNights are spent in expedition tents staked into the ice, temperature dropping to -20°C, the silence so complete you can hear your own heartbeat. The light at these latitudes is extraordinary — 24-hour daylight in June means you trek in golden midnight sun just as easily as noon. On clear evenings the ice glows cobalt blue from within. This route requires excellent physical fitness and cold-weather camping experience, but is accessible to non-technical trekkers with proper guiding. The sense of being alone on an ice sheet the size of a continent never leaves you.`,
      location: "Kangerlussuaq Ice Edge",
      country: "Greenland",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: [
        "Ski and pulk across the Greenland Ice Sheet",
        "24-hour daylight in June on the polar plateau",
        "Cobalt blue ice glowing at midnight",
        "Complete silence of the world's second-largest ice mass",
        "Crevasse navigation and polar camp skills",
      ],
      gear: [
        "Ski touring setup (rentable in Kangerlussuaq)",
        "Pulk sled for gear hauling",
        "Expedition sleeping bag rated to -30°C",
        "4-season polar tent",
        "Balaclava, goggles, and face protection",
        "Emergency PLB (mandatory)",
        "Stove with fuel for melting ice water",
      ],
      bestMonths: [5, 6, 7],
      estimatedCost: 350000,
      latitude: 67.0,
      longitude: -50.0,
      published: true,
      userId: user1.id,
      voteCount: 17,
      tags: { connect: [{ name: "arctic" }, { name: "skiing" }, { name: "expedition" }] },
    },
  });

  // Adventure 55 — Denali Base Camp Trek
  // -------------------------------------------------------------------------
  const adventure55 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-55" },
    update: {},
    create: {
      id: "seed-adventure-55",
      title: "Denali Base Camp Trek",
      description: `Trek to the 2,200 m base camp of Denali — North America's highest peak — via the Kahiltna Glacier without attempting the technical summit. Fly by small bush plane from Talkeetna to land directly on the glacier, where the scale of the Alaska Range immediately overwhelms every frame of reference. Denali rises 4,000 m above camp in a near-vertical wall of ice and rock.\n\nThe base camp environment during peak season is surprisingly social — mountaineers from around the world prepare their summit bids while rangers manage the world's largest high-altitude latrine excavation program (the mountain's strict Leave No Trace requirements are extraordinary). Days are spent acclimatizing on the lower glacier, learning to read ice features, and making day trips toward the Kahiltna Pass. The flying approach and glacier camp experience alone make this a once-in-a-lifetime trip; the mountain is so large it creates its own weather systems. Rangers brief you on the history of the mountain — both the triumphs and the tragedies — and the briefing humbles every person in the room.`,
      location: "Kahiltna Glacier, Denali National Park",
      country: "United States",
      continent: "North America",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1600&q=80",
      highlights: [
        "Fly by bush plane onto the Kahiltna Glacier",
        "Camp beneath the 4,000 m wall of Denali's south face",
        "Acclimatization climbs to Kahiltna Pass",
        "Meet summit teams from every corner of the world",
        "Ranger-led briefing on Denali's mountaineering history",
      ],
      gear: [
        "Double plastic mountaineering boots",
        "Crampons and ice axe",
        "Crevasse rescue kit (rope, prussiks, pulleys)",
        "4-season expedition tent",
        "Sleeping bag rated to -40°C",
        "Glacier glasses and goggles",
        "PLB (mandatory)",
        "NPS permit (required well in advance)",
      ],
      bestMonths: [5, 6],
      estimatedCost: 450000,
      latitude: 63.1,
      longitude: -151.2,
      published: true,
      userId: user2.id,
      voteCount: 21,
      tags: {
        connect: [{ name: "mountaineering" }, { name: "glacier" }, { name: "expedition" }],
      },
    },
  });

  // Adventure 56 — GR20 Corsica Complete
  // -------------------------------------------------------------------------
  const adventure56 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-56" },
    update: {},
    create: {
      id: "seed-adventure-56",
      title: "GR20 Corsica Complete",
      description: `Walk the full GR20 from Calenzana in the north to Conca in the south — 180 km across the spine of Corsica's mountains, widely considered the most demanding long-distance trail in Europe. The route climbs relentlessly through granite landscapes that feel more like the Dolomites than anything in France, with sustained scrambling, fixed chain sections, and technical route-finding that rewards map-reading over GPS.\n\nThe northern half is harder: sustained 1,000 m ascents over rough granite, boulder fields, and snow patches that linger into July. The southern half opens into maquis scrubland and red-soiled forest with a gentler pace and spectacular sea views. The refuges along the route serve cold beer and hot pasta — small luxuries that feel enormous after a 10-hour mountain day. Trekkers move at very different speeds here, so you will pass and be passed by the same faces across many days, building the trail community that makes this route unforgettable.`,
      location: "Calenzana to Conca, Haute-Corse",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 15,
      coverImageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80",
      highlights: [
        "Most demanding long-distance trail in Europe",
        "Sustained granite scrambling with fixed chains",
        "Snow patches in the north through July",
        "Stunning maquis and sea views in the south",
        "Strong trail community in mountain refuges",
      ],
      gear: [
        "45 L technical pack (weight is the enemy)",
        "Trail running shoes (faster over granite than boots)",
        "Trekking poles",
        "Helmet recommended for northern section scrambles",
        "Full waterproofs",
        "2 L water capacity (some sections have no water for hours)",
        "Sleeping bag liner (refuges have blankets)",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 130000,
      latitude: 42.3,
      longitude: 9.1,
      published: true,
      userId: user3.id,
      voteCount: 33,
      tags: { connect: [{ name: "trekking" }, { name: "scrambling" }, { name: "europe" }] },
    },
  });

  // Adventure 57 — Transylvania Cycling Tour
  // -------------------------------------------------------------------------
  const adventure57 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-57" },
    update: {},
    create: {
      id: "seed-adventure-57",
      title: "Transylvania Cycling Tour",
      description: `Pedal through the Saxon villages and forested passes of Transylvania on a 350 km loop from Brasov — a region of medieval fortified churches, hay meadows alive with wildflowers, and brown bear country where shepherds still move their flocks across ancient routes. The roads are quiet, the gradients manageable, and the landscape constantly rewards the slower pace of cycling over driving.\n\nBase yourself in guesthouses run by local families who serve plates of sarmale and tuica before you've even hung up your panniers. Climb the Bucegi Mountains on a forest road and coast into Sinaia past the Peles Castle, one of Europe's most extravagant royal residences. The medieval citadel of Sighisoara — birthplace of Vlad the Impaler — is the most atmospheric lunch stop you will ever have. This is cycling as cultural immersion: every village has a different Saxon dialect, a different church on the hill, and a different grandmother with strong opinions about which road you should take.`,
      location: "Brasov, Transylvania",
      country: "Romania",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: [
        "Medieval Saxon villages and fortified churches",
        "Brown bear country in the Carpathian Mountains",
        "Peles Castle descent from the Bucegi Mountains",
        "Sighisoara — the best-preserved medieval citadel in Europe",
        "Family guesthouses with extraordinary traditional food",
      ],
      gear: [
        "Touring or gravel bike (rentable in Brasov)",
        "Panniers or bikepacking bags",
        "Cycling helmet",
        "Merino cycling base layer",
        "Rain cape",
        "Repair kit (tube, pump, multi-tool)",
        "Bear spray (low risk but standard precaution)",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 75000,
      latitude: 45.6,
      longitude: 25.6,
      published: true,
      userId: user1.id,
      voteCount: 25,
      tags: { connect: [{ name: "cycling" }, { name: "culture" }, { name: "europe" }] },
    },
  });

  // Adventure 58 — Costa Rica Jungle to Pacific
  // -------------------------------------------------------------------------
  const adventure58 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-58" },
    update: {},
    create: {
      id: "seed-adventure-58",
      title: "Costa Rica Jungle to Pacific",
      description: `A week-long multi-sport traverse of Costa Rica's Pacific coast and Osa Peninsula — one of the most biodiverse places on Earth — combining kayak, jungle trek, and surf. Begin in Manuel Antonio, where sloths hang over the beach path and scarlet macaws screech overhead, then kayak the mangrove estuaries to reach the Osa Peninsula's Corcovado National Park.\n\nCorcovado is where naturalists go when everywhere else feels domesticated: jaguar, tapir, four species of monkey, and sea turtles nesting by starlight. Trek the coastal trail for two days, camping in park stations, then end the week with surf lessons at Pavones — one of the longest left-hand point breaks in the world. The transition from jungle to ocean to surf is seamless and the guiding infrastructure is excellent. This is an ideal first "adventure trip" for those stepping beyond resort travel — challenging enough to feel earned but supported enough to be worry-free.`,
      location: "Manuel Antonio to Pavones, Osa Peninsula",
      country: "Costa Rica",
      continent: "North America",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80",
      highlights: [
        "Corcovado National Park — the most biodiverse place on Earth",
        "Jaguar, tapir, and four monkey species",
        "Mangrove kayaking on the Osa coast",
        "Sea turtle nesting by starlight",
        "Surf lessons at Pavones' world-famous left-hand break",
      ],
      gear: [
        "Quick-dry shorts and shirts",
        "Light trail shoes and flip flops",
        "Insect repellent and lightweight long sleeves",
        "Dry bag for kayak days",
        "Reef-safe sunscreen",
        "Binoculars for wildlife spotting",
      ],
      bestMonths: [12, 1, 2, 3, 4],
      estimatedCost: 160000,
      latitude: 8.7,
      longitude: -83.5,
      published: true,
      userId: user2.id,
      voteCount: 42,
      tags: { connect: [{ name: "multi-sport" }, { name: "wildlife" }, { name: "jungle" }] },
    },
  });

  // Adventure 59 — Samaria Gorge and White Mountains
  // -------------------------------------------------------------------------
  const adventure59 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-59" },
    update: {},
    create: {
      id: "seed-adventure-59",
      title: "Samaria Gorge and White Mountains",
      description: `A five-day walking circuit across Crete's Lefka Ori — the White Mountains — culminating in a descent of the Samaria Gorge, one of Europe's longest and most dramatic gorges at 16 km. The high plateau of the Omalos plain at 1,080 m feels like the moon in summer: bare white limestone karst baking in the Mediterranean sun, wild goats on the clifftops, and silence broken only by the wind.\n\nThe trail descends through increasingly towering gorge walls — the narrowest section, the Sideroportes or Iron Gates, squeezes to just 3 m wide with walls 300 m high on either side. Water from the stream is cold enough to numb your feet and clean enough to drink. The gorge exits at the sea-level village of Agia Roumeli where you board a ferry to Hora Sfakion, then spend the final days exploring Sfakia's dramatic coastal villages on foot. This itinerary adds a high-route loop above the gorge for those who want the full mountain experience before the famous descent.`,
      location: "Lefka Ori, Western Crete",
      country: "Greece",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1600&q=80",
      highlights: [
        "Descend 16 km through Samaria Gorge, Europe's longest",
        "Iron Gates — 3 m wide between 300 m cliffs",
        "High plateau karst landscape on the Omalos plain",
        "Ferry from Agia Roumeli after exiting the gorge",
        "Sfakia coastal villages accessible only by boat or trail",
      ],
      gear: [
        "Sturdy trail shoes with ankle support",
        "2+ L water capacity (springs in gorge but plan for heat)",
        "Sun protection — hat, sunscreen, sunglasses",
        "Trekking poles",
        "Light day pack 20 L",
        "Cash for ferry and village tavernas",
      ],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 60000,
      latitude: 35.3,
      longitude: 23.9,
      published: true,
      userId: user1.id,
      voteCount: 38,
      tags: { connect: [{ name: "trekking" }, { name: "gorge" }, { name: "europe" }] },
    },
  });

  // Adventure 60 — Dolomites Alta Via 1
  // -------------------------------------------------------------------------
  const adventure60 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-60" },
    update: {},
    create: {
      id: "seed-adventure-60",
      title: "Dolomites Alta Via 1",
      description: `Walk the Alta Via 1 — 120 km from Lago di Braies to Belluno through the heart of the Dolomites, following high-level ridges that give constant views of the UNESCO-listed towers and pinnacles that make this range unique on Earth. The pale rock takes on extraordinary color at sunrise and sunset: gold, pink, then deep purple as the light fades.\n\nThe route uses rifugios throughout — comfortable mountain huts that serve full dinners with local wine, meaning you carry only a day pack. This is luxury adventure: hard enough to feel serious, comfortable enough to end every day well-fed with cold Spritz in hand. Several sections involve via ferrata moves — fixed iron rungs and cables assist exposed traverses — but overall the route is navigable without specialist climbing skills. The Cinque Torri and Tre Cime di Lavaredo sections are among the most photographed mountain landscapes in the world; on the trail you inhabit them rather than simply observe them.`,
      location: "Lago di Braies to Belluno",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80",
      highlights: [
        "120 km through UNESCO Dolomites World Heritage landscape",
        "Rifugio hut-to-hut walking with full dinners",
        "Tre Cime di Lavaredo — most iconic Dolomite towers",
        "Via ferrata sections with fixed iron aid",
        "Alpenglow — Dolomite rock turns gold then purple at dusk",
      ],
      gear: [
        "Day pack 20–25 L (luggage transfer available)",
        "Via ferrata set (harness + lanyard) for northern sections",
        "Hiking boots with ankle support",
        "Trekking poles",
        "Rain jacket",
        "Sun protection (high UV at altitude)",
        "Cash for rifugio dinners",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 140000,
      latitude: 46.7,
      longitude: 12.1,
      published: true,
      userId: user3.id,
      voteCount: 47,
      tags: { connect: [{ name: "trekking" }, { name: "via-ferrata" }, { name: "europe" }] },
    },
  });

  // Adventure 61 — K2 Base Camp Trek
  // -------------------------------------------------------------------------
  const adventure61 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-61" },
    update: {},
    create: {
      id: "seed-adventure-61",
      title: "K2 Base Camp Trek",
      description: `The trek to K2 Base Camp in the Karakoram is widely considered the finest high-altitude trek in the world — more remote, more demanding, and more raw than the Everest Base Camp route. The approach up the Baltoro Glacier passes Concordia, the confluence of four of the world's longest glaciers outside the polar regions, where an amphitheatre of 8,000 m peaks including Broad Peak, the Gasherbrums, and K2 itself rises in every direction.\n\nK2 at close range is a different experience from Everest: steeper, more geometric, almost architectural in its severity. The mountain radiates a particular kind of menace even in clear weather. The trek requires glacier travel on moraines and crevassed ice, river crossings, and sustained days at 4,000–5,000 m. Porters from the Baltistani community carry the heavy loads and contribute essential local knowledge and humor. Camping at Concordia under the full Karakoram sky — no light pollution for hundreds of kilometers — is among the most extraordinary nights available to any traveler on Earth.`,
      location: "Baltoro Glacier, Karakoram",
      country: "Pakistan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1600&q=80",
      highlights: [
        "Concordia — amphitheatre of four 8,000 m peaks",
        "K2 close-up — the most technically demanding 8,000 m peak",
        "Baltoro Glacier traverse on world's longest high-altitude moraine",
        "Camping under zero-light-pollution Karakoram sky",
        "Baltistani porter culture — extraordinary hospitality",
      ],
      gear: [
        "50 L pack (porters carry camping gear)",
        "4-season sleeping bag",
        "Trekking poles",
        "Glacier glasses and goggles",
        "Altitude medication (Diamox — consult doctor)",
        "Water purification — Sawyer Squeeze or SteriPen",
        "PLB or satellite communicator",
        "Pakistan trekking permit (required)",
      ],
      bestMonths: [7, 8],
      estimatedCost: 280000,
      latitude: 35.9,
      longitude: 76.5,
      published: true,
      userId: user2.id,
      voteCount: 29,
      tags: { connect: [{ name: "trekking" }, { name: "glacier" }, { name: "8000m" }] },
    },
  });

  // Adventure 62 — Camino Portugues Coastal
  // -------------------------------------------------------------------------
  const adventure62 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-62" },
    update: {},
    create: {
      id: "seed-adventure-62",
      title: "Camino Portugues Coastal",
      description: `Walk the Coastal Variant of the Camino Portugues from Porto to Santiago de Compostela — 280 km of Atlantic coastline, estuaries, and fishing villages that offer an alternative to the more crowded Central Route. The coastal path follows dune paths, wooden boardwalks, and clifftop trails with the Atlantic on one side and cork oak forest on the other, crossing into Galicia over a beautifully simple stone bridge at Vila Nova de Cerveira.\n\nThis is a Camino for those who want solitude alongside pilgrimage. The coastal route sees far fewer walkers than the Meseta, meaning you often have beaches entirely to yourself. Albergues are plentiful and inexpensive; the food shifts from Portuguese bacalhau to Galician pulpo as you cross the border. The final 100 km enter the required minimum for the compostela certificate, but the whole route rewards those who start from Porto. Arriving into the Plaza del Obradoiro after a week of walking carries a weight that surprises nearly everyone who experiences it.`,
      location: "Porto to Santiago de Compostela",
      country: "Portugal",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600&q=80",
      highlights: [
        "Atlantic dunes and clifftop coastal trails",
        "Far fewer pilgrims than the popular Frances route",
        "Seafood transition from Portuguese bacalhau to Galician pulpo",
        "Stone bridge crossing into Galicia at Vila Nova de Cerveira",
        "Cathedral arrival at Plaza del Obradoiro in Santiago",
      ],
      gear: [
        "Well-broken-in walking shoes — this is the most important gear",
        "25 L pack",
        "Blister kit (Compeed)",
        "Rain jacket (Atlantic weather is unpredictable)",
        "Pilgrim credential (credencial) to collect stamps",
        "Trekking poles optional but helpful",
      ],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 65000,
      latitude: 42.5,
      longitude: -8.4,
      published: true,
      userId: user1.id,
      voteCount: 52,
      tags: { connect: [{ name: "trekking" }, { name: "camino" }, { name: "coastal" }] },
    },
  });

  // Adventure 63 — Tour du Mont Blanc
  // -------------------------------------------------------------------------
  const adventure63 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-63" },
    update: {},
    create: {
      id: "seed-adventure-63",
      title: "Tour du Mont Blanc",
      description: `Circumnavigate Western Europe's highest peak on the 170 km Tour du Mont Blanc — a classic mountain circuit crossing three countries (France, Italy, Switzerland) in eleven days, with 10,000 m of cumulative ascent. The TMB is among the world's most beloved long-distance trails for good reason: the mountain reveals a completely different face from each valley, and the transition between French, Italian, and Swiss alpine cultures is as absorbing as the landscape itself.\n\nThe route uses refuges and auberges throughout, meaning you walk with a light pack and end every evening with a hot shower, cold beer, and a communal dinner with fellow trekkers from every corner of the world. The most dramatic moments come on the high passes — Col du Bonhomme, Col de la Seigne, Grand Col Ferret — where Mont Blanc itself fills the sky and you understand for the first time why the mountain has been drawing people for 250 years. The final stage returns to Chamonix through the Aiguilles Rouges for a sunset view of the entire massif, and something in you has changed.`,
      location: "Chamonix, Mont Blanc Massif",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 11,
      coverImageUrl: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=1600&q=80",
      highlights: [
        "Circle the highest peak in Western Europe across 3 countries",
        "10,000 m total ascent over 11 days",
        "Col de la Seigne — best view of Mont Blanc's Italian face",
        "Refuge hut-to-hut with full dinners and stunning company",
        "Final approach to Chamonix via the Aiguilles Rouges ridge",
      ],
      gear: [
        "30 L day pack (luggage transfer between some refuges)",
        "Trekking poles",
        "Hiking boots — waterproof with ankle support",
        "Rain jacket and warm mid-layer",
        "Sun protection (glacier UV)",
        "Refuge reservation essential (book months in advance)",
        "Cash for supplements and drinks at refuges",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 150000,
      latitude: 45.9,
      longitude: 6.9,
      published: true,
      userId: user3.id,
      voteCount: 64,
      tags: { connect: [{ name: "trekking" }, { name: "mountains" }, { name: "europe" }] },
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
      { userId: user1.id, adventureId: adventure21.id },
      { userId: user3.id, adventureId: adventure21.id },
      { userId: user1.id, adventureId: adventure22.id },
      { userId: user2.id, adventureId: adventure22.id },
      { userId: user2.id, adventureId: adventure23.id },
      { userId: user3.id, adventureId: adventure23.id },
      { userId: user1.id, adventureId: adventure24.id },
      { userId: user3.id, adventureId: adventure24.id },
      { userId: user1.id, adventureId: adventure25.id },
      { userId: user2.id, adventureId: adventure25.id },
      { userId: user2.id, adventureId: adventure26.id },
      { userId: user3.id, adventureId: adventure26.id },
      { userId: user1.id, adventureId: adventure27.id },
      { userId: user3.id, adventureId: adventure27.id },
      { userId: user1.id, adventureId: adventure28.id },
      { userId: user2.id, adventureId: adventure28.id },
      { userId: user2.id, adventureId: adventure29.id },
      { userId: user3.id, adventureId: adventure29.id },
      { userId: user1.id, adventureId: adventure30.id },
      { userId: user3.id, adventureId: adventure30.id },
      { userId: user1.id, adventureId: adventure31.id },
      { userId: user2.id, adventureId: adventure31.id },
      { userId: user2.id, adventureId: adventure32.id },
      { userId: user3.id, adventureId: adventure32.id },
      { userId: user1.id, adventureId: adventure33.id },
      { userId: user3.id, adventureId: adventure33.id },
      { userId: user1.id, adventureId: adventure34.id },
      { userId: user2.id, adventureId: adventure34.id },
      { userId: user2.id, adventureId: adventure35.id },
      { userId: user3.id, adventureId: adventure35.id },
      { userId: user1.id, adventureId: adventure36.id },
      { userId: user3.id, adventureId: adventure36.id },
      { userId: user1.id, adventureId: adventure37.id },
      { userId: user2.id, adventureId: adventure37.id },
      { userId: user2.id, adventureId: adventure38.id },
      { userId: user3.id, adventureId: adventure38.id },
      { userId: user1.id, adventureId: adventure39.id },
      { userId: user3.id, adventureId: adventure39.id },
      { userId: user1.id, adventureId: adventure40.id },
      { userId: user2.id, adventureId: adventure40.id },
      { userId: user2.id, adventureId: adventure41.id },
      { userId: user3.id, adventureId: adventure41.id },
      { userId: user1.id, adventureId: adventure42.id },
      { userId: user3.id, adventureId: adventure42.id },
      { userId: user1.id, adventureId: adventure43.id },
      { userId: user2.id, adventureId: adventure43.id },
      { userId: user2.id, adventureId: adventure44.id },
      { userId: user3.id, adventureId: adventure44.id },
      { userId: user1.id, adventureId: adventure45.id },
      { userId: user3.id, adventureId: adventure45.id },
      { userId: user1.id, adventureId: adventure46.id },
      { userId: user2.id, adventureId: adventure46.id },
      { userId: user2.id, adventureId: adventure47.id },
      { userId: user3.id, adventureId: adventure47.id },
      { userId: user1.id, adventureId: adventure48.id },
      { userId: user3.id, adventureId: adventure48.id },
      { userId: user2.id, adventureId: adventure49.id },
      { userId: user3.id, adventureId: adventure49.id },
      { userId: user1.id, adventureId: adventure50.id },
      { userId: user3.id, adventureId: adventure50.id },
      { userId: user2.id, adventureId: adventure51.id },
      { userId: user3.id, adventureId: adventure51.id },
      { userId: user1.id, adventureId: adventure52.id },
      { userId: user3.id, adventureId: adventure52.id },
      { userId: user1.id, adventureId: adventure53.id },
      { userId: user2.id, adventureId: adventure53.id },
      { userId: user2.id, adventureId: adventure54.id },
      { userId: user3.id, adventureId: adventure54.id },
      { userId: user1.id, adventureId: adventure55.id },
      { userId: user3.id, adventureId: adventure55.id },
      { userId: user1.id, adventureId: adventure56.id },
      { userId: user2.id, adventureId: adventure56.id },
      { userId: user2.id, adventureId: adventure57.id },
      { userId: user3.id, adventureId: adventure57.id },
      { userId: user1.id, adventureId: adventure58.id },
      { userId: user3.id, adventureId: adventure58.id },
      { userId: user2.id, adventureId: adventure59.id },
      { userId: user3.id, adventureId: adventure59.id },
      { userId: user1.id, adventureId: adventure60.id },
      { userId: user2.id, adventureId: adventure60.id },
      { userId: user1.id, adventureId: adventure61.id },
      { userId: user3.id, adventureId: adventure61.id },
      { userId: user2.id, adventureId: adventure62.id },
      { userId: user3.id, adventureId: adventure62.id },
      { userId: user1.id, adventureId: adventure63.id },
      { userId: user2.id, adventureId: adventure63.id },
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
  // Adventure 64 — Chamonix Vallée Blanche Off-Piste Route
  // -------------------------------------------------------------------------
  const adventure64 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-64" },
    update: {},
    create: {
      id: "seed-adventure-64",
      title: "Chamonix Vallée Blanche Off-Piste Route",
      description: `The Vallée Blanche is one of the world's great ski descents — 24 kilometres of high-mountain off-piste from the Aiguille du Midi at 3,842m down to Chamonix at 1,035m, threading through crevassed glaciers, seracs, and open powder bowls that feel genuinely remote despite the cable car that drops you in.

The descent begins with the notorious arête — a knife-edge ridge crossed in ski boots, crampons in hand, with a 1,000m drop on each side. Once down onto the glacier the terrain opens up. The classic route tracks through the Géant icefall and across the wide Mer de Glace, but variations into the Envers du Plan couloirs and the Pointe Helbronner add technical spice and solitude.

A certified mountain guide is not optional — this is a glaciated, crevasse-riddled environment where conditions change daily and route-finding experience matters. Rent a guide through the Compagnie des Guides de Chamonix and book well ahead for prime January–March powder windows.

Budget USD 300–500 per person for the guided day, cable car tickets, and lift passes. Spend a few days in Chamonix first to acclimatise and ski resort runs — arriving cold on the Vallée Blanche wastes the experience.`,
      location: "Aiguille du Midi, Chamonix-Mont-Blanc",
      country: "France",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 1,
      coverImageUrl: "https://images.unsplash.com/photo-1548116137-c9ac24e446a9?w=1600&q=80",
      highlights: [
        "The arête crossing at 3,842m — knife-edge ridge with 1,000m exposure on both sides",
        "Géant icefall — ski between house-sized seracs on the upper glacier",
        "24km continuous descent dropping 2,800m vertical metres",
        "Mer de Glace — the largest glacier in the French Alps",
        "First light on Mont Blanc and the Grandes Jorasses from the cable car",
        "Optional Envers du Plan couloirs for advanced off-piste variation",
      ],
      gear: [
        "Off-piste skis (min 95mm underfoot)",
        "Avalanche transceiver, probe, and shovel (mandatory)",
        "Ski crampons and ski mountaineering harness for arête",
        "Helmet and ski goggles (glacier UV is intense)",
        "Insulated mid-layer (temperature at 3,800m often -15°C)",
        "Glacier glasses with side shields",
        "Emergency bivy and first-aid kit",
      ],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 45000,
      latitude: 45.8767,
      longitude: 6.8872,
      published: true,
      userId: user1.id,
      voteCount: 74,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["alpine"].id },
          { id: allTags["glacier"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["europe"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure64.id },
      { userId: user2.id, adventureId: adventure64.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 65 — Niseko Powder Safari, Hokkaido
  // -------------------------------------------------------------------------
  const adventure65 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-65" },
    update: {},
    create: {
      id: "seed-adventure-65",
      title: "Niseko Powder Safari, Hokkaido",
      description: `Niseko receives an average of 15 metres of snowfall per season — more than almost any other ski resort on earth — and the quality of that snow is legendary. Cold Siberian air picks up moisture crossing the Sea of Japan and dumps it on Hokkaido as ultra-dry, ultra-light powder that skiers and snowboarders have been hunting since the early 2000s.

The resort complex (Grand Hirafu, Hanazono, Annupuri, Village) is well-connected and increasingly high-end, but the real draw is the gate access into the open backcountry trees. When the gates open after a storm cycle, locals and visitors sprint for the powder stashes in the larch forest beneath Annupuri — untouched lines that remain skiable for hours before they're tracked out.

Beyond the resorts, day trips to nearby Furano or the smaller Rusutsu resort break up a longer stay. Combine with a night in Sapporo for ramen, izakaya culture, and the famous snow festival in early February.

Ski season runs late November through late April. Peak powder window is January–February. Flights to Sapporo (New Chitose) then 90-minute bus to Niseko. Accommodation ranges from Japanese ryokan with onsen to European-style ski lodges — book months ahead for the best weeks.`,
      location: "Niseko, Shiribeshi Subprefecture",
      country: "Japan",
      continent: "Asia",
      category: Category.SKIING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1606857521015-7463af9c8a83?w=1600&q=80",
      highlights: [
        "Hokkaido champagne powder — ultra-light, ultra-dry, 15m average annual snowfall",
        "Backcountry gate access into untouched larch forest powder stashes",
        "Soaking in outdoor onsen (hot spring) after a full powder day",
        "Sapporo ramen and izakaya evenings during down days",
        "Furano day trip for uncrowded Japanese resort skiing",
        "Night skiing under lights at Grand Hirafu",
      ],
      gear: [
        "Powder skis or snowboard (min 105mm underfoot strongly recommended)",
        "Avalanche beacon, probe, and shovel for backcountry gate access",
        "Warm waterproof jacket — Hokkaido cold is genuine (-15°C common)",
        "Ski helmet and goggles",
        "IC Suica card for local transport",
        "Japan adaptor plug (Type A)",
      ],
      bestMonths: [1, 2, 3],
      estimatedCost: 300000,
      latitude: 42.8048,
      longitude: 140.6878,
      published: true,
      userId: user2.id,
      voteCount: 61,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["photography"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["cultural-immersion"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure65.id },
      { userId: user3.id, adventureId: adventure65.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 66 — Lyngen Alps Ski Touring, Norway
  // -------------------------------------------------------------------------
  const adventure66 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-66" },
    update: {},
    create: {
      id: "seed-adventure-66",
      title: "Lyngen Alps Ski Touring, Norway",
      description: `The Lyngen Alps rise almost directly from the sea in Arctic Norway — a 90km peninsula of steep, glaciated peaks descending to fjords. Ski touring here means ascending a 1,500m couloir in the morning, skiing a 45-degree face down to a fishing village, removing your skis to board a local boat, and crossing to the next fjord to do it again.

The unique topography means you can access summit ski lines without snowmobiles or helicopters — just skins, good legs, and the ability to read fjord weather that changes faster than mountain weather anywhere in the Alps. The best lines face north and northeast, sheltered from the prevailing Atlantic systems that can shut down operations for days at a time.

March and April offer the prime window — long daylight hours (18+ hours by late April), stable high-pressure systems, and consolidated snow that allows the most technical descents. The midnight sun makes it possible to ski at 11pm in a surreal pink light.

Bases are the villages of Lyngseidet and Furuflaten. A handful of specialist guiding outfits run week-long trips — book 12+ months ahead. Alternatively, rent a van and explore independently, but carry full avalanche gear and have serious ski mountaineering experience.`,
      location: "Lyngen Peninsula, Troms",
      country: "Norway",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1550581190-3af14fe29cc1?w=1600&q=80",
      highlights: [
        "Ski from Arctic summits directly to the fjord — unique sea-level access",
        "Midnight sun ski descents in late April — skiing at 11pm in pink light",
        "Fjord boat crossings between ski lines",
        "Northern lights visible from camp in March on clear nights",
        "Remote couloirs and 45-degree north-facing faces rarely skied",
        "Traditional Norwegian fishing village culture at valley level",
      ],
      gear: [
        "Ski touring setup with 110mm+ powder skis",
        "Avalanche transceiver, probe, and shovel",
        "Ski crampons for hard morning crusts",
        "Dry suit or immersion suit layer for potential water crossings",
        "Arc'teryx-style hardshell (Arctic wind is relentless)",
        "Bivy bag and emergency supplies",
        "Headlamp (March) — redundant in April midnight sun",
      ],
      bestMonths: [3, 4],
      estimatedCost: 350000,
      latitude: 69.85,
      longitude: 20.05,
      published: true,
      userId: user3.id,
      voteCount: 49,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["arctic"].id },
          { id: allTags["remote"].id },
          { id: allTags["midnight-sun"].id },
          { id: allTags["alpine"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure66.id },
      { userId: user3.id, adventureId: adventure66.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 67 — Heli-Skiing Bella Coola Wilderness, Canada
  // -------------------------------------------------------------------------
  const adventure67 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-67" },
    update: {},
    create: {
      id: "seed-adventure-67",
      title: "Heli-Skiing Bella Coola Wilderness, Canada",
      description: `Bella Coola sits at the end of a glaciated fjord in the Coast Mountains of British Columbia, accessible only by a notoriously steep gravel road or floatplane. The mountains surrounding the valley hold some of the deepest snowpack and most untracked terrain in North America — which is why heli-ski operations here have drawn powder obsessives since the 1990s.

A typical week involves four to six helicopter-accessed runs per day, dropping groups onto ridge spines above tree line before skiing 1,000–1,800m vertical through old-growth cedar and spruce forest to pickup zones. The trees here are different from most heli-ski terrain — massive old-growth with wide spacing, skiing through them like a cathedral.

The snowpack is maritime — heavy and wet by January standards, but settles into a dense, supportive base that holds well into April. The real seasons are February through April when cold high-pressure systems deliver weeks of consistent powder conditions.

Packages are typically week-long all-inclusive affairs run by Tweedsmuir Park Lodge or similar operators, including accommodation, meals, guide, and around 100,000 vertical feet of skiing. Budget USD 8,000–12,000 per person per week. Book 12–18 months in advance.`,
      location: "Bella Coola Valley, Coast Mountains",
      country: "Canada",
      continent: "North America",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1547517023-6546a27fde7b?w=1600&q=80",
      highlights: [
        "Old-growth cedar cathedral skiing — massive spaced trees unlike any resort terrain",
        "100,000+ vertical feet in a week on completely untracked snow",
        "Helicopter landings on narrow ridge spines above the Bella Coola fjord",
        "Wild salmon and coastal wilderness immersion from the lodge",
        "Completely isolated — no other skiers in sight for the entire week",
        "Glacier descents to sea-level fjord pickups",
      ],
      gear: [
        "Powder skis (115mm+ underfoot) — operator can advise and sometimes rent",
        "Avalanche transceiver, probe, and shovel (mandatory, guides check)",
        "Breathable hardshell jacket and bibs",
        "Liner gloves and gauntlet mittens",
        "Goggle and helmet",
        "Personal medications — nearest hospital is hours away",
      ],
      bestMonths: [2, 3, 4],
      estimatedCost: 1000000,
      latitude: 52.3667,
      longitude: -126.7667,
      published: true,
      userId: user1.id,
      voteCount: 38,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["remote"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["expedition"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure67.id },
      { userId: user1.id, adventureId: adventure67.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 68 — Verbier Freeride and Backcountry, Switzerland
  // -------------------------------------------------------------------------
  const adventure68 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-68" },
    update: {},
    create: {
      id: "seed-adventure-68",
      title: "Verbier Freeride and Backcountry, Switzerland",
      description: `Verbier's Valais backstory: it hosts the Freeride World Tour finals, its terrain is the benchmark against which other resorts are judged, and its après-ski is equally renowned. But beyond the circuit runs and Mont Gelé chair, the serious playground extends into the 4 Vallées — 412km of piste and an interconnected backcountry that links to Nendaz, Veysonnaz, and Thyon.

The Stairway to Heaven off-piste zone, accessible from the Jumbo cable car, gives access to the Swiss-Italian border terrain above 3,000m. The Vallon d'Arby couloir, the Chassoure face, and the Gentianes bowl are legendary powder zones tracked by resort guides and freeriders who wait out storms at the Farinet bar.

Beyond Verbier, the week-long Haute Route from Verbier to Zermatt (or Chamonix in reverse) follows a classic ski mountaineering traverse through the Pennine Alps — five to eight days of glacier travel, hut stays, and summit skiing at altitude. Non-trivial navigation and glacier skills required.

Verbier village is expensive — budget CHF 500–800 per day including accommodation, lift pass, and food. Shoulder weeks in March/April offer better snow and lower prices than peak February.`,
      location: "Verbier, Valais Canton",
      country: "Switzerland",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1484557985045-edb9d33cf0e4?w=1600&q=80",
      highlights: [
        "Mont Gelé and Attelas — the legendary Freeride World Tour circuit terrain",
        "Stairway to Heaven off-piste zone above 3,000m",
        "Chassoure face — classic 1,000m sustained steep descent",
        "Option to extend to the Verbier–Zermatt Haute Route glacier traverse",
        "World-class après-ski at the Farinet and Pub Mont Fort",
        "4 Vallées interconnect — 412km piste with no lift queues midweek",
      ],
      gear: [
        "Freeride or all-mountain skis (100mm+ underfoot)",
        "Avalanche safety kit (beacon, probe, shovel)",
        "Multi-layer base system for variable March temperatures",
        "Ski crampons for hard-snow Haute Route variant",
        "Glacier glasses and high-factor sunscreen (UV at 3,000m)",
        "CHF cash for refuge and hut stays",
      ],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 400000,
      latitude: 46.0967,
      longitude: 7.2286,
      published: true,
      userId: user2.id,
      voteCount: 55,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["alpine"].id },
          { id: allTags["europe"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure68.id },
      { userId: user3.id, adventureId: adventure68.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 69 — La Grave Unpatrolled Ski, Hautes-Alpes
  // -------------------------------------------------------------------------
  const adventure69 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-69" },
    update: {},
    create: {
      id: "seed-adventure-69",
      title: "La Grave Unpatrolled Ski, Hautes-Alpes",
      description: `La Grave is the anti-resort. One telepherique, no grooming, no ski patrol, no safety nets, no marked runs, no snowmaking. What you get instead is 2,150m of vertical on the north face of La Meije — the last unclimbed major Alpine peak when it was finally summited in 1877 — served by a single gondola that deposits you above the glaciers.

The terrain is entirely natural: glaciers, crevasse fields, couloirs ranging from 35 to 55 degrees, and open snowfields that funnel you through cliff bands and moraine. First-timers typically hire a local guide (essential for your first season); regulars learn the terrain intimately over years. The locals who ski here daily in January are among the best off-piste skiers in Europe.

The village of La Grave has resisted development with impressive stubbornness — a few cafés, a hardware shop, some basic pensions, and the Café de la Meije where the guides and mountain workers drink. No spa, no après-ski, no nightclub. Just skiing and mountains.

December–April is the season. The lift doesn't open until the snowpack is safe — sometimes January. Skiers who come specifically for La Grave's culture stay in the village and ski every day the lift opens.`,
      location: "La Grave, Hautes-Alpes",
      country: "France",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1517823249873-f642ddc2b7a4?w=1600&q=80",
      highlights: [
        "2,150m unpatrolled vertical on the north face of La Meije",
        "No grooming, no safety nets — completely natural glaciated terrain",
        "Couloirs from 35–55 degrees on the Chancel and Girose glaciers",
        "Café de la Meije — authentic mountain worker culture, no tourists",
        "La Meije summit views — one of the most dramatic peaks in the French Alps",
        "Skiing with the La Grave locals — daily riders who know every crevasse",
      ],
      gear: [
        "Expert-level off-piste skis (105mm+)",
        "Avalanche beacon, probe, shovel (mandatory — no patrol)",
        "Crevasse rescue knowledge or guided arrangement",
        "Ski crampons for morning glacial crossings",
        "Rope team equipment if venturing beyond known routes",
        "GPS device — the terrain does not have marked runs",
      ],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 120000,
      latitude: 45.0475,
      longitude: 6.3014,
      published: true,
      userId: user3.id,
      voteCount: 42,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["alpine"].id },
          { id: allTags["remote"].id },
          { id: allTags["glacier"].id },
          { id: allTags["europe"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure69.id },
      { userId: user3.id, adventureId: adventure69.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 70 — Vasaloppet 90km Cross-Country Ski Race, Sweden
  // -------------------------------------------------------------------------
  const adventure70 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-70" },
    update: {},
    create: {
      id: "seed-adventure-70",
      title: "Vasaloppet 90km Cross-Country Ski Race, Sweden",
      description: `The Vasaloppet is the world's oldest and longest cross-country ski race — 90km through the Dalarna forest from Sälen to Mora, run every first Sunday of March since 1922. Up to 15,800 competitors start in waves, following the track Gustav Vasa used to flee into exile in 1520, only to be persuaded to return and lead the Swedish revolt. The race now attracts elite professionals, world-class amateurs, and weekend warriors from 80 countries.

Training for the Vasaloppet is a year-round commitment if you want to finish respectably — the classic technique (diagonal striding and double-poling) requires specific muscle conditioning that running or cycling does not fully replicate. Skate skiing fitness transfers better. First-timers typically aim for the 6-hour mark; elites finish in under 3:40.

The course climbs and descends through snow-laden pine forest on a groomed single track that widens to 8-12 lanes at key sections. Blueberry soup and energy drinks are distributed at checkpoints — the soup is tradition. The final kilometre through Mora with 50,000 spectators lining the street is one of sport's great finishers.

Lottery entry opens in June each year; demand far exceeds supply. Stay in Mora, Borlänge, or at race-package hotels in Sälen. March in Dalarna averages -5°C but can reach -20°C — dress for the low end.`,
      location: "Sälen to Mora, Dalarna",
      country: "Sweden",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1531088941-39dbebb3e5c3?w=1600&q=80",
      highlights: [
        "90km through Dalarna forest — the world's oldest and longest ski race",
        "Up to 15,800 simultaneous starters in the mass wave start",
        "Blueberry soup tradition at mid-race checkpoints",
        "Final kilometre through Mora with 50,000 spectators lining the course",
        "Gustav Vasa's historic escape route through the frozen forest",
        "Elite vs mass participation — finish alongside world-class skiers",
      ],
      gear: [
        "Classic cross-country skis and poles (no skate skiing allowed)",
        "Race-specific low-friction ski wax matched to forecast temperature",
        "Lightweight thermal bib and race suit",
        "Energy gels and electrolyte solution for personal fuelling",
        "Balaclava and lightweight gloves for the start (-15°C possible)",
        "Race number and GPS tracker (provided at registration)",
      ],
      bestMonths: [3],
      estimatedCost: 80000,
      latitude: 61.0,
      longitude: 14.2,
      published: true,
      userId: user1.id,
      voteCount: 31,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["europe"].id },
          { id: allTags["multi-day"].id },
          { id: allTags["cultural-immersion"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure70.id },
      { userId: user1.id, adventureId: adventure70.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 71 — Revelstoke Backcountry Ski Touring, Canada
  // -------------------------------------------------------------------------
  const adventure71 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-71" },
    update: {},
    create: {
      id: "seed-adventure-71",
      title: "Revelstoke Backcountry Ski Touring, Canada",
      description: `Revelstoke Mountain Resort holds the greatest vertical drop of any ski resort in North America at 1,713m, but the backcountry surrounding the resort dwarfs even this. The Columbia Mountain range behind the town receives between 10–15m of snow annually, deposited by moisture-laden Pacific systems that stall against the peaks, and the touring terrain extends in every direction for hundreds of kilometres.

The Mt. Cartier area above the town, accessible via snowmobile approach or helicopter, offers ski mountaineering on 2,600m peaks with glacier access and 50-degree couloirs. The Frisby Ridge, Durrand Glacier, and Battle Range present multi-day traverse options requiring full glacier travel skills and emergency preparedness in genuinely remote terrain.

For those based in the resort rather than backcountry, Revelstoke's Ripper Bowl and North Bowl areas offer powder access via sidecountry gates. The town itself has evolved from a railroad heritage community into a ski culture hub — the downtown has exceptional food for its size and a culture that still values function over fashion.

Best periods: January–March for deepest snowpack, April for spring corn and longest days. The Rogers Pass area (1.5 hours east) adds world-class ski mountaineering on a UNESCO heritage landscape.`,
      location: "Revelstoke, British Columbia",
      country: "Canada",
      continent: "North America",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1578393097540-7b80c5cf34cd?w=1600&q=80",
      highlights: [
        "Greatest resort vertical in North America at 1,713m",
        "Rogers Pass UNESCO site — legendary ski mountaineering peaks 90 min away",
        "Durrand Glacier multi-day backcountry traverse",
        "Mt. Cartier ski mountaineering — 2,600m peak with 50-degree couloirs",
        "Columbia Mountains snowpack: 10–15m annual snowfall",
        "Revelstoke's authentic railroad-town culture and outstanding local food scene",
      ],
      gear: [
        "Ski touring setup or powder resort skis",
        "Full avalanche safety kit",
        "Snowmobile or helicopter access budget for backcountry approaches",
        "Crevasse and glacier travel equipment for Durrand variant",
        "Satellite communicator (SPOT/Garmin inReach) for remote terrain",
        "Bear canister for multi-day backcountry trips",
      ],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 280000,
      latitude: 51.0039,
      longitude: -118.1957,
      published: true,
      userId: user2.id,
      voteCount: 44,
      tags: {
        connect: [
          { id: allTags["skiing"].id },
          { id: allTags["mountains"].id },
          { id: allTags["remote"].id },
          { id: allTags["glacier"].id },
          { id: allTags["multi-day"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure71.id },
      { userId: user2.id, adventureId: adventure71.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 72 — Banzai Pipeline Surf Trip, Oahu, Hawaii
  // -------------------------------------------------------------------------
  const adventure72 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-72" },
    update: {},
    create: {
      id: "seed-adventure-72",
      title: "Banzai Pipeline Surf Trip, Oahu, Hawaii",
      description: `Pipeline on Oahu's North Shore is the most recognised surf break in the world — a shallow-water reef that takes North Pacific swells and turns them into perfectly-cylindrical tubes that break in under two metres of water over a sharp lava shelf. The wave is beautiful from the beach, terrifying from inside the tube.

November through February is the prime season when North Pacific storms generate the groundswells that produce 4–8m Pipeline. The Eddie Aikau invitational, held only when waves exceed 6m at Waimea Bay nearby, occasionally coincides. Sunrise sessions before the crowds (and before the trade winds turn the water surface choppy) are the best tactical choice.

Pipeline is not for beginners or even intermediate surfers — the wave is powerful, the reef is unforgiving, and a hold-down in a big set means genuine risk. Surfers in the lineup at the peak are predominantly professionals and elite amateurs who have served years of apprenticeship at nearby easier breaks like Off the Wall and Sunset. Watch from shore first; many days of a North Shore trip will be spent observing rather than surfing.

Stay in Haleiwa or Waialua — 10–20 minutes from the beach. Rent a car; the North Shore has limited public transport. Budget USD 200–350 per day including accommodation, car, and food.`,
      location: "Ehukai Beach, North Shore, Oahu",
      country: "USA",
      continent: "North America",
      category: Category.SURFING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1600&q=80",
      highlights: [
        "Watching Pipeline from the sand at sunrise — the world's most perfect tube wave",
        "Possible Eddie Aikau sighting at Waimea Bay on XXL swells",
        "North Shore shrimp trucks and açaí bowls — Hawaii surf culture food",
        "Sunset Beach and Backdoor right-handers for advanced surfers",
        "Triple Crown of Surfing events held November–December annually",
        "Haleiwa town — the authentic surf culture capital of Hawaii",
      ],
      gear: [
        "6'2\" to 7'0\" step-up shortboard for 4-6ft conditions",
        "7'0\"+ gun for larger swells (can rent from local shops)",
        "2mm shorty or spring suit — Hawaii water 24–26°C",
        "Reef booties (Pipeline reef is unforgiving on feet)",
        "Surf wax (tropical formula)",
        "Helmet strongly recommended for tube riding over shallow reef",
      ],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 250000,
      latitude: 21.6650,
      longitude: -158.0540,
      published: true,
      userId: user3.id,
      voteCount: 67,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["island"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure72.id },
      { userId: user3.id, adventureId: adventure72.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 73 — Jeffreys Bay Surfing Expedition, South Africa
  // -------------------------------------------------------------------------
  const adventure73 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-73" },
    update: {},
    create: {
      id: "seed-adventure-73",
      title: "Jeffreys Bay Surfing Expedition, South Africa",
      description: `Jeffreys Bay — J-Bay to anyone who surfs — is one of the five best point breaks on earth. The wave unzips from Boneyards through Point and on to Kitchen Windows in a single right-hand wall that in prime conditions runs for 800 metres without a section. In July during the WSL Championship Tour event, the world's best surfers compete here. The rest of the year, you share it with travelling surfers and a growing local contingent.

The Agulhas current pushes cold, nutrient-rich water up from the South Atlantic, keeping the water at 14–18°C year-round — cold enough to require a 4/3mm full suit in winter, when the best swells arrive. The beach itself has evolved from a hippie outpost into a decent surf town with good accommodation and restaurants, but hasn't lost its edge entirely.

Beyond J-Bay itself, the Eastern Cape offers remarkable marine wildlife — great white shark diving at Mossel Bay, whale watching from Cape Agulhas (August–November), and the Garden Route national parks within driving distance. A surf trip that combines J-Bay with a broader Eastern Cape road trip makes an exceptional two-week journey.

Fly to Port Elizabeth (now Gqeberha), hire a car, and base yourself in J-Bay for surf. Three to seven days at the break itself is typical before extending the road trip.`,
      location: "Jeffreys Bay, Eastern Cape",
      country: "South Africa",
      continent: "Africa",
      category: Category.SURFING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1531722569936-825d4ebd6dad?w=1600&q=80",
      highlights: [
        "Supertubes — the main J-Bay peak, 800m of right-hand wall at its best",
        "WSL Championship Tour event in July — watch the world's best surf",
        "Great white shark cage diving at Mossel Bay, 2 hours west",
        "Southern right whale watching from Cape Agulhas August–November",
        "Billabong factory outlet — original surf gear at African prices",
        "Boneyard sessions at sunrise before the onshore wind arrives",
      ],
      gear: [
        "4/3mm full wetsuit (water temperature 14–18°C year-round)",
        "6'2\"–7'0\" high-performance shortboard for clean point waves",
        "Booties and gloves for mid-winter sessions",
        "Surf wax (cold water formula)",
        "Rash vest for summer sessions when winds warm up",
      ],
      bestMonths: [5, 6, 7, 8],
      estimatedCost: 180000,
      latitude: -34.0527,
      longitude: 24.9285,
      published: true,
      userId: user1.id,
      voteCount: 52,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure73.id },
      { userId: user1.id, adventureId: adventure73.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 74 — Mentawai Islands Surf Charter, West Sumatra
  // -------------------------------------------------------------------------
  const adventure74 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-74" },
    update: {},
    create: {
      id: "seed-adventure-74",
      title: "Mentawai Islands Surf Charter, West Sumatra",
      description: `The Mentawai Islands host more world-class surf breaks per square kilometre than anywhere else on the planet. HT's, Telescopes, Bank Vaults, Lance's Right, Macaronis — these are names spoken in reverence in every surf shop in the world. They exist because the islands sit directly in the path of Southern Ocean swells generated by storms in the Roaring Forties, funnelled through deep-water channels onto shallow tropical reefs.

A live-aboard charter is the standard way to access the breaks: a boat sleeps 8–14 surfers and moves between spots daily based on swell direction, wind, and crowd avoidance. Trips run 7–14 days. The better boats have air conditioning, fresh meals, surf guides who know the breaks intimately, and enough wax to resupply your entire wetsuit bag.

The surf is serious — hollow, fast, and often over very shallow reef. Macaronis is the forgiving entry point; Bank Vaults and Lance's Right demand experience in heavy, shallow barrels. Surfers averaging 3+ sessions per week at home will typically be challenged in ways they haven't been before.

April through October offers the most consistent Southern Ocean swell. Charter packages typically run USD 3,000–6,000 per person for a 10-day trip, all-inclusive from Padang. Fly to Padang, overnight, then board.`,
      location: "Mentawai Islands, West Sumatra",
      country: "Indonesia",
      continent: "Asia",
      category: Category.SURFING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1507697635994-b95a0ac11e27?w=1600&q=80",
      highlights: [
        "Macaronis — the perfect right-hand barrel, accessible for strong intermediate surfers",
        "Bank Vaults — one of the heaviest shallow-water rights on the planet",
        "Lance's Right — long, fast, peeling point break with multiple sections",
        "Tropical live-aboard charter life — fresh fish, warm evenings, no crowds",
        "HT's and Telescopes — two world-class lefts in the same anchorage",
        "Mentawai tribal culture ashore — one of the last traditional tattoo cultures",
      ],
      gear: [
        "4–6 performance shortboards (bring more than you think — dings happen)",
        "Boardshorts only — water temperature 28–30°C year-round",
        "Reef booties (mandatory for shallow-water breaks like Bank Vaults)",
        "Surf helmet for heavy reef sections",
        "Seasickness medication for the crossing (bumpy at times)",
        "Reef first-aid kit including QuikClot and butterfly sutures",
      ],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 450000,
      latitude: -1.7,
      longitude: 99.2,
      published: true,
      userId: user2.id,
      voteCount: 59,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["coastal"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["remote"].id },
          { id: allTags["jungle"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure74.id },
      { userId: user2.id, adventureId: adventure74.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 75 — Uluwatu Cliff Break Surf Camp, Bali
  // -------------------------------------------------------------------------
  const adventure75 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-75" },
    update: {},
    create: {
      id: "seed-adventure-75",
      title: "Uluwatu Cliff Break Surf Camp, Bali",
      description: `Uluwatu is where Bali's surf culture concentrates — a left-hand reef break running along the base of dramatic limestone cliffs, accessible only by descending through a sea cave at low tide. The wave is long, consistent, and has multiple take-off zones that accommodate both intermediate and advanced surfers. In the 1970s it was one of the first breaks in Asia to gain international attention; it's been a pilgrimage site ever since.

The Bukit Peninsula below the famous temple holds a cluster of world-class breaks within a short drive of each other: Padang Padang (Kelly Slater's favourite), Bingin (perfect shortboard lefts), Impossible (rarely breaking but extraordinary when it does), and Dreamland for beginners. A week based on the Bukit lets you sample the whole lineup based on swell and tide.

The cliff-top warung restaurants above Uluwatu are legendary — plastic tables, Bintang beers, and a sunset view over the Indian Ocean with the surf far below. The famous Kecak dance at the Uluwatu temple happens every evening at dusk.

Stay on the Bukit in Pecatu, Padang Padang, or Bingin. Accommodation ranges from USD 30 cliff-edge bungalows to boutique boutique villas. Rainy season (November–March) brings offshore winds and cleaner surf; dry season (April–October) offers bigger south swells.`,
      location: "Uluwatu, Bukit Peninsula, Bali",
      country: "Indonesia",
      continent: "Asia",
      category: Category.SURFING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1519052726739-bcb1a18b24e4?w=1600&q=80",
      highlights: [
        "Uluwatu sea cave entry — paddle out through a limestone cave at low tide",
        "Padang Padang — a perfect short, hollow tube that requires precise timing",
        "Bingin right-hander — long, forgiving wall ideal for intermediate progression",
        "Sunset Kecak fire dance at Uluwatu temple above the break",
        "Cliff-top warung sunset — Bintang, grilled fish, and the Indian Ocean below",
        "Dreamland for beginners when the bukit is too big",
      ],
      gear: [
        "5'10\"–6'4\" shortboard for clean reef conditions",
        "7'0\" mini-mal for Dreamland and learning days",
        "Boardshorts only — Bali water 27–29°C",
        "Rash vest or Lycra for sun protection",
        "Reef booties recommended for Uluwatu and Padang Padang",
        "Temple sarong (mandatory for Uluwatu temple entrance)",
      ],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 120000,
      latitude: -8.8294,
      longitude: 115.0847,
      published: true,
      userId: user3.id,
      voteCount: 73,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["island"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure75.id },
      { userId: user3.id, adventureId: adventure75.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 76 — Cloud 9 Surf Trip, Siargao, Philippines
  // -------------------------------------------------------------------------
  const adventure76 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-76" },
    update: {},
    create: {
      id: "seed-adventure-76",
      title: "Cloud 9 Surf Trip, Siargao, Philippines",
      description: `Cloud 9 is the Philippines' most famous wave — a thick, hollow right-hand reef break off the northeast coast of Siargao Island that barrels with mechanical consistency when the September–November typhoon swells arrive. The wave breaks in front of a wooden tower that has become one of the most photographed backdrops in Southeast Asian surfing.

Siargao itself has transformed from a remote fishing island into a relaxed surf destination with enough good food, coconut beaches, and island-hopping options to sustain a two-week stay. The island's main town, General Luna, clusters around the surf zone — boardwalks, coconut water stalls, and surf schools for beginners who stay safely away from the Cloud 9 reef.

Beyond Cloud 9, Siargao has a half-dozen more breaks suited to varying ability levels. Stimpy's, across the channel, offers a mellower option for less experienced surfers. Day trips to Sugba Lagoon, Naked Island, and the Sohoton Cove sea caves provide non-surfing activities for travel partners.

Typhoon season brings the biggest swells (September–November) but also weather risk. February–April offers more stable conditions and smaller but still fun surf. Direct flights to Siargao (SAG) from Manila and Cebu have improved access considerably.`,
      location: "Cloud 9, General Luna, Siargao Island",
      country: "Philippines",
      continent: "Asia",
      category: Category.SURFING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1520366498724-709889c0c685?w=1600&q=80",
      highlights: [
        "Cloud 9 barrel — the iconic hollow right-hand reef in the Philippines",
        "Wooden surf tower photo backdrop — one of surfing's most recognised images",
        "Sugba Lagoon — a cathedral of turquoise water inside a hidden cove",
        "Naked Island and Guyam Island day-trip snorkelling",
        "Sohoton Cove sea caves and lagoon accessible by bangka boat",
        "General Luna night market — grilled seafood and San Miguel at sunset",
      ],
      gear: [
        "6'0\"–6'6\" shortboard for cloud 9 when it's 4–6ft",
        "Mini-mal or longboard for Stimpy's and smaller days",
        "Boardshorts and rash vest — water 27–30°C year-round",
        "Reef booties (Cloud 9 is shallow and sharp at low tide)",
        "Waterproof dry bag for bangka island trips",
      ],
      bestMonths: [9, 10, 11, 2, 3, 4],
      estimatedCost: 100000,
      latitude: 9.8411,
      longitude: 126.1558,
      published: true,
      userId: user1.id,
      voteCount: 46,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure76.id },
      { userId: user1.id, adventureId: adventure76.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 77 — Hossegor Reef and Beach Break, Landes, France
  // -------------------------------------------------------------------------
  const adventure77 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-77" },
    update: {},
    create: {
      id: "seed-adventure-77",
      title: "Hossegor Reef and Beach Break, Landes, France",
      description: `Hossegor in the Landes region of southwest France is Europe's surf capital — a beach break and reef combination that receives powerful Atlantic groundswells and turns them into fast, heavy beach-break tubes at La Nord and La Gravière, and a more forgiving reef peak at La Sud. Every September the Quiksilver Pro and Rip Curl Surf Festival bring the WSL Championship Tour to town.

The underwater bathymetry is what makes Hossegor exceptional — a deep offshore canyon focuses Atlantic swells directly onto the sandbanks, producing waves that break with more power and speed than any other beach break in Europe. La Nord in September at 6ft is a legitimate big-wave experience despite being a sandy bottom; La Gravière has produced some of the heaviest barrels ever surfed on European soil.

The town itself is a curious mix of Basque surf culture, pine forest, and serious French cuisine. Landaise food — duck confit, Bayonne ham, local wines from Madiran — is an unexpected bonus. The Basque Country is 40 minutes south, adding Biarritz, tapas bars in San Sebastián, and a completely different cultural register to a two-week trip.

Stay in Capbreton, Hossegor, or Seignosse. Budget EUR 150–250 per day. September is the prime month — the summer crowds have gone but the Atlantic season hasn't yet arrived in earnest.`,
      location: "Hossegor, Landes",
      country: "France",
      continent: "Europe",
      category: Category.SURFING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1492176273113-2d51f47b23b0?w=1600&q=80",
      highlights: [
        "La Gravière beach break — one of the heaviest barrels in European surfing",
        "Quiksilver Pro France — watch the WSL tour in September",
        "La Nord on a 6ft Atlantic swell — legitimately powerful surf on sand",
        "San Sebastián pintxos bars — 40 minutes south across the Spanish border",
        "Basque Country road trip extension: Biarritz, Pamplona, Bilbao",
        "Duck confit and Madiran wine — the Landes culinary detour",
      ],
      gear: [
        "4/3mm full suit (water 16–19°C in September–October)",
        "5'10\"–6'2\" performance shortboard for beach break power",
        "Booties and hood for winter sessions November onwards",
        "Earplugs (Hossegor is notorious for swimmer's ear from cold water)",
        "Leash — La Gravière hold-downs are long, get a 9ft strong leash",
      ],
      bestMonths: [9, 10, 11],
      estimatedCost: 160000,
      latitude: 43.6667,
      longitude: -1.4167,
      published: true,
      userId: user2.id,
      voteCount: 41,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["europe"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure77.id },
      { userId: user2.id, adventureId: adventure77.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 78 — Skeleton Bay Endless Left, Namibia
  // -------------------------------------------------------------------------
  const adventure78 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-78" },
    update: {},
    create: {
      id: "seed-adventure-78",
      title: "Skeleton Bay Endless Left, Namibia",
      description: `Skeleton Bay — also known as Donkergat — is arguably the longest and most powerful left-hand point break in the world. On the right swell, the wave runs for over a kilometre along a sandbar formed by the convergence of the Kunene River and the South Atlantic on Namibia's remote northern coast, peeling with mechanical perfection at 30–40km/h. It was virtually unknown outside Namibia until footage of surfer Cory Lopez riding it circulated in 2006.

Access requires a permit from the Namibian government for the Skeleton Coast National Park, a 4WD vehicle, and either a very long drive from Windhoek or a light aircraft flight to a nearby airstrip. The nearest town with services is Swakopmund, 400km south. You'll be camping in the desert with fog rolling off the cold Benguela current and jackals and hyenas circling camp at night.

The wave only works on a specific swell direction, period, and tide combination — perhaps 10–20 sessions per year meet all criteria. Many trips are blanked entirely. When it does fire, however, it is one of the most extraordinary natural phenomena in surfing: a single uninterrupted left that runs from point to point with power that only increases as you ride deeper.

This is an expedition, not a holiday. Bring everything you need, build in buffer days, and accept that you might not surf a single good wave. The desert and the cold Atlantic coast are themselves worth the journey.`,
      location: "Skeleton Coast, Kunene Region",
      country: "Namibia",
      continent: "Africa",
      category: Category.SURFING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=1600&q=80",
      highlights: [
        "1km+ unbroken left-hand barrel — possibly the longest point break on earth",
        "Desert camping on the Skeleton Coast with jackals and fog",
        "Cold Benguela current marine life — Cape fur seals, dolphins, great white sharks",
        "Light aircraft approach over the Namib Desert to the remote airstrip",
        "Skeleton Coast wreck photography — ghost ships on the Namibian shore",
        "Complete isolation — one of the least-visited surf breaks in the world",
      ],
      gear: [
        "4/3mm full suit minimum (water 14–17°C year-round, cold Benguela current)",
        "5mm hood and booties for extended sessions",
        "6'4\"–7'0\" step-up board for powerful, fast wave",
        "4WD vehicle with full desert recovery kit and 200L water",
        "Camping kit for 2 weeks: everything self-sufficient",
        "Namibia national park permit (apply months in advance)",
        "Satellite phone — no cell coverage in the park",
      ],
      bestMonths: [3, 4, 5, 6, 7, 8, 9],
      estimatedCost: 600000,
      latitude: -17.5,
      longitude: 11.8,
      published: true,
      userId: user3.id,
      voteCount: 28,
      tags: {
        connect: [
          { id: allTags["desert"].id },
          { id: allTags["remote"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["expedition"].id },
          { id: allTags["wildlife"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure78.id },
      { userId: user3.id, adventureId: adventure78.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 79 — Silk Road Cities: Tashkent to Khiva, Uzbekistan
  // -------------------------------------------------------------------------
  const adventure79 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-79" },
    update: {},
    create: {
      id: "seed-adventure-79",
      title: "Silk Road Cities: Tashkent to Khiva, Uzbekistan",
      description: `Uzbekistan sits at the heart of the ancient Silk Road, and its four great cities — Tashkent, Samarkand, Bukhara, and Khiva — form one of the great cultural itineraries in the world. Tamerlane's empire left behind an architectural legacy so concentrated and so vivid that even an inattentive traveller is stopped in their tracks: the turquoise domes of the Registan, the mirrored madrassas of Bukhara, the walled medieval city of Khiva.

A fast train (Afrosiyob high-speed rail) connects Tashkent to Samarkand in 2 hours and Samarkand to Bukhara in 1.5 hours. Khiva requires a flight or overnight train from Bukhara. The logical sequence is east to west: Tashkent → Samarkand → Bukhara → Khiva, spending 2 nights in each city.

Uzbekistan has become substantially easier to visit since introducing e-visa access in 2018. English signage has improved in the major tourism sites, but Uzbek and Russian remain dominant languages in local markets. The plov (rice pilaf with lamb and carrots) served at every tablecloth restaurant is among the best food you will eat in Central Asia.

Spring (April–May) and autumn (September–October) offer the best temperatures — summer in the Kyzylkum Desert can exceed 45°C. Budget USD 80–150 per day including accommodation, transport, and meals.`,
      location: "Tashkent, Samarkand, Bukhara, Khiva",
      country: "Uzbekistan",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1600&q=80",
      highlights: [
        "Registan, Samarkand — three tiled madrassas around a square that stops time",
        "Kalon minaret, Bukhara — the Pillar of Islam, 47m of intricate brickwork",
        "Itchan Kala, Khiva — a completely walled medieval city with no modernity inside",
        "Bibi-Khanym Mosque — Tamerlane's ambitious, crumbling masterpiece",
        "Chorsu Bazaar, Tashkent — the city's ancient caravanserai market",
        "Plov ceremony in Samarkand — the national dish cooked in 200-litre kazan pots",
      ],
      gear: [
        "Modest dress (shoulders and knees covered at religious sites)",
        "Comfortable walking shoes for extensive cobblestone touring",
        "Cash in USD (ATMs unreliable in smaller towns)",
        "Portable battery pack — charging infrastructure inconsistent",
        "Sunscreen and sunhat — desert sun is intense April–September",
        "Uzbek phrasebook or offline translation app",
      ],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 120000,
      latitude: 39.6547,
      longitude: 66.9758,
      published: true,
      userId: user1.id,
      voteCount: 56,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["desert"].id },
          { id: allTags["culture"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure79.id },
      { userId: user1.id, adventureId: adventure79.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 80 — Lalibela Rock Churches and Simien Mountains, Ethiopia
  // -------------------------------------------------------------------------
  const adventure80 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-80" },
    update: {},
    create: {
      id: "seed-adventure-80",
      title: "Lalibela Rock Churches and Simien Mountains, Ethiopia",
      description: `Ethiopia rewards the traveller who goes beyond safari circuits. Lalibela in the Amhara highlands contains eleven rock-hewn churches carved directly into solid volcanic bedrock in the 12th century — an engineering achievement so implausible that medieval Europeans attributed the construction to angels. Bete Giyorgis (St George), the most photographed, descends 12 metres into the earth, its cruciform roof perfectly level with the surrounding ground.

The Simien Mountains National Park, 400km northwest, is an altogether different experience — a shattered plateau of basalt columns and deep escarpments, home to the endemic Gelada baboon (the last grass-eating primate), Ethiopian wolf, and Walia ibex. Trekking here at altitudes above 4,000m to the summit of Ras Dejen, the fourth-highest peak in Africa, is a world-class high-altitude hiking experience largely undiscovered by international visitors.

Combining Lalibela, Gondar (the 17th-century castle compound), and the Simien Mountains in a single two-week itinerary is achievable via domestic flights on Ethiopian Airlines. The cuisine — injera flatbread, doro wot chicken stew, tej honey wine — is excellent and inexpensive throughout.

Dry season (October–May) is the best visiting window. Budget USD 100–180 per day including guides, permits, and accommodation.`,
      location: "Lalibela and Simien Mountains National Park",
      country: "Ethiopia",
      continent: "Africa",
      category: Category.CULTURAL,
      difficulty: Difficulty.MODERATE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1600&q=80",
      highlights: [
        "Bete Giyorgis — the cruciform rock-hewn church, a UNESCO World Heritage Site",
        "Orthodox Christian pilgrimage atmosphere of Lalibela — priests in white robes",
        "Gelada baboon troops at sunrise on the Simien escarpment",
        "Ras Dejen summit (4,550m) — fourth-highest peak in Africa",
        "Fasilides Castle complex, Gondar — 17th-century royal enclosure",
        "Ethiopian coffee ceremony — the ritual preparation and three-cup sequence",
      ],
      gear: [
        "Lightweight hiking boots (Simien trekking on rocky terrain)",
        "Warm jacket — Simien nights above 3,800m drop to 0°C",
        "Modest dress for churches (shoulders and legs covered)",
        "Ethiopian Birr cash (cards unreliable outside Addis)",
        "Altitude sickness medication (Simien plateau 3,800–4,550m)",
        "Personal water filter — tap water not potable in rural areas",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 180000,
      latitude: 12.0321,
      longitude: 39.0476,
      published: true,
      userId: user2.id,
      voteCount: 48,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["trekking"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure80.id },
      { userId: user2.id, adventureId: adventure80.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 81 — Bhutan Kingdom Highlights Tour
  // -------------------------------------------------------------------------
  const adventure81 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-81" },
    update: {},
    create: {
      id: "seed-adventure-81",
      title: "Bhutan Kingdom Highlights Tour",
      description: `Bhutan charges a Sustainable Development Fee (currently USD 200 per night) that effectively limits tourism to those who value depth over volume — and the country it protects is extraordinary. Gross National Happiness is the governing philosophy, carbon-negative forests cover 70% of the land, and the dzongs (fortified monastery-palaces) that crown every valley are architecturally unlike anything else in the Buddhist world.

The Tiger's Nest (Paro Taktsang) is the iconic image — a monastery clinging to a sheer 3,000m cliff face, a 2-hour hike from the valley floor. It is genuinely extraordinary in a way that photographs do not convey. But the Punakha Dzong at the confluence of two rivers, the Gangtey Valley Crane Festival, and the Black Mountains National Park offer equally vivid experiences with fewer crowds.

Bhutan can only be entered via a licensed tour operator, and all visitors must be on a pre-arranged itinerary with a certified guide. This is not restrictive in practice — guides are knowledgeable, the accommodation options have expanded considerably, and the tour structure means you spend time in places you'd never find independently.

October–November is the best combination of clear Himalayan views and the Thimphu Tshechu festival. March–May offers rhododendron blooms across the mountain passes.`,
      location: "Paro, Thimphu, Punakha, Bumthang",
      country: "Bhutan",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=1600&q=80",
      highlights: [
        "Tiger's Nest Monastery (Paro Taktsang) — cliff-face monastery at 3,120m",
        "Punakha Dzong — the most beautiful fortress in Bhutan at the river confluence",
        "Gangtey Valley — wintering ground for the critically endangered black-necked crane",
        "Thimphu Tshechu — masked dance festival at the national dzong (October)",
        "Dochula Pass — 108 memorial stupas with views of the Bhutan Himalaya",
        "Gross National Happiness conversation with a Bhutanese guide",
      ],
      gear: [
        "Comfortable trekking shoes (Tiger's Nest hike is 2 hours each way)",
        "Modest dress — gho or kira (national dress) not required for tourists",
        "Warm layers — Thimphu at 2,300m can be cold in October",
        "Ngultrum cash or Indian rupees (widely accepted)",
        "Camera with long lens — Himalayan views from Dochula are exceptional",
        "Travel insurance that covers altitude (Paro airport at 2,235m)",
      ],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 300000,
      latitude: 27.4716,
      longitude: 89.6386,
      published: true,
      userId: user3.id,
      voteCount: 63,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["high-altitude"].id },
          { id: allTags["photography"].id },
          { id: allTags["culture"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure81.id },
      { userId: user3.id, adventureId: adventure81.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 82 — Rajasthan Palace and Thar Desert Tour, India
  // -------------------------------------------------------------------------
  const adventure82 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-82" },
    update: {},
    create: {
      id: "seed-adventure-82",
      title: "Rajasthan Palace and Thar Desert Tour, India",
      description: `Rajasthan is India at its most theatrical — a state where maharajas built pink-stone cities, desert forts that withstood Mughal sieges, and lake palaces that float on the water. The Golden Triangle (Jaipur, Agra, Delhi) barely scratches its surface; the real Rajasthan lies in Jodhpur's blue labyrinth, Jaisalmer's sandstone city rising from the Thar Desert, and Pushkar's ghats around the only sacred lake in the world dedicated to Brahma.

The palace hotels (havelis) that were once the residences of nobility have been converted into some of the most extraordinary accommodation in India — Taj Lake Palace in Udaipur floats on Lake Pichola, SUJAN Jawai is a luxury camp among granite boulders and leopards, and Raas Jodhpur is built into the rock face below Mehrangarh Fort.

A two-week circuit can cover Jaipur (Amber Fort, the Hawa Mahal), Jodhpur (Mehrangarh Fort, blue city lanes), Jaisalmer (desert castle, camel safari into the sand dunes), Udaipur (lake palaces, City Palace), and Pushkar (Brahma temple, camel fair in November). Train connections between all major cities are reliable and comfortable in AC coaches.

November–February is the best season. Holi (March) in Jaipur and Pushkar is an extraordinary cultural experience but requires planning around the chaos.`,
      location: "Jaipur, Jodhpur, Jaisalmer, Udaipur",
      country: "India",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1600&q=80",
      highlights: [
        "Mehrangarh Fort, Jodhpur — the most impressive fort in Rajasthan above the blue city",
        "Jaisalmer Desert Camp — camel safari into the Thar dunes at sunset",
        "Taj Lake Palace, Udaipur — the floating palace hotel on Lake Pichola",
        "Amber Fort, Jaipur — elephant rides and mirror mosaic halls",
        "Pushkar Camel Fair (November) — 50,000 camels and the world's largest livestock market",
        "Thali meals at local dhabas — dal baati churma is the Rajasthani specialty",
      ],
      gear: [
        "Modest dress (temples require covered shoulders and legs)",
        "Cotton loose-fit clothing — temperatures can exceed 40°C",
        "Sturdy sandals for fort cobblestones and market lanes",
        "Anti-malarial medication (consult doctor)",
        "USD cash for accommodation tips and small merchants",
        "DSLR or mirrorless camera — Rajasthan is an extraordinary photography subject",
      ],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 200000,
      latitude: 26.9124,
      longitude: 75.7873,
      published: true,
      userId: user1.id,
      voteCount: 71,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["desert"].id },
          { id: allTags["photography"].id },
          { id: allTags["culture"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure82.id },
      { userId: user1.id, adventureId: adventure82.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 83 — Luang Prabang Temples and Mekong Slow Boat, Laos
  // -------------------------------------------------------------------------
  const adventure83 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-83" },
    update: {},
    create: {
      id: "seed-adventure-83",
      title: "Luang Prabang Temples and Mekong Slow Boat, Laos",
      description: `Luang Prabang is Southeast Asia's most perfectly preserved UNESCO heritage town — a narrow peninsula at the confluence of the Mekong and Nam Khan rivers, where 33 golden-roofed temples sit among French colonial villas, Buddhist monks in saffron robes perform the daily alms-giving (tak bat) at dawn, and the night market fills a single street with silk, paper lanterns, and sticky rice in a hundred variations.

The approach matters: the classic arrival is the two-day slow boat from the Thai border at Huay Xai, drifting 300km down the Mekong on a wooden longboat, stopping at villages along the way. It is slow, it is occasionally uncomfortable, and it is one of the great river journeys in Southeast Asia.

Beyond Luang Prabang, the Kuang Si waterfalls (turquoise tiered pools, 30km south), the mysterious Plain of Jars (megalithic stone vessels on a plateau in Phonsavanh), and Vang Vieng's karst limestone canyons extend a two-week Laos itinerary naturally. Budget travel in Laos is genuinely inexpensive — USD 50–80 per day for good guesthouses, local food, and transport.

Dry season (November–April) is the standard visiting window. February and March see the lowest water on the Mekong (slow boat may be cancelled at extreme low water).`,
      location: "Luang Prabang, Houaphanh and Mekong River",
      country: "Laos",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1498931299472-f7a63a0ef8c8?w=1600&q=80",
      highlights: [
        "Tak bat dawn alms-giving ceremony — monks collecting rice in silence at sunrise",
        "Mekong slow boat — two days drifting 300km through the jungle",
        "Kuang Si waterfalls — multi-tiered turquoise pools with rope swings",
        "Wat Xieng Thong — Luang Prabang's finest temple with mosaic Tree of Life",
        "Plain of Jars — Bronze Age mystery of 2,000-year-old stone vessels",
        "Night market silk shopping and Laotian BBQ on the river bend",
      ],
      gear: [
        "Modest dress (long trousers and covered shoulders for temples)",
        "Lightweight rain jacket (flash showers even in dry season)",
        "Insect repellent (mosquitoes active at dusk in the jungle)",
        "US dollars or Thai baht (accepted widely; ATMs available)",
        "Earplugs for slow boat hammering on wooden planks",
        "Camera for the alms-giving ceremony (no flash, respectful distance)",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 80000,
      latitude: 19.8857,
      longitude: 102.1351,
      published: true,
      userId: user2.id,
      voteCount: 54,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["culture"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure83.id },
      { userId: user2.id, adventureId: adventure83.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 84 — Oaxaca Mezcal, Monte Albán and Mixtec Villages, Mexico
  // -------------------------------------------------------------------------
  const adventure84 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-84" },
    update: {},
    create: {
      id: "seed-adventure-84",
      title: "Oaxaca Mezcal, Monte Albán and Mixtec Villages, Mexico",
      description: `Oaxaca is Mexico's most culturally complex state — eight indigenous groups with distinct languages and traditions, a pre-Columbian Zapotec capital at Monte Albán that rivals any ancient ruin in the Americas, and a food culture so sophisticated that the city hosts the continent's most prestigious culinary school. The mezcal industry here is not the industrialised spirit you find in airport duty-free but a craft distillate produced in village palenques from thirty-plus varieties of wild agave.

Monte Albán sits on an artificially levelled hilltop above the valley — 2,000 years of Zapotec civilisation compressed into plazas, ball courts, and astronomical observation platforms. Arrive at opening time before the tour buses. The valley around Oaxaca City contains more ruins, weaving villages (Teotitlán del Valle), black pottery workshops (San Bartolo Coyotepec), and mezcal production tours (Albarradas, Matatlán) within easy day-trip distance.

Oaxacan food deserves its own itinerary: mole negro (28 ingredients, 3 days to make), tlayudas, chapulines (grasshoppers), and fresh market produce at Mercado Benito Juárez. The chocolate scene — Oaxaca grows its own cacao — justifies daily morning hot chocolate rituals at Chocolate Mayordomo.

October (Day of the Dead) and July (Guelaguetza dance festival) are the two cultural peaks — book accommodation 6 months ahead for both. The rest of the year is excellent and significantly less crowded.`,
      location: "Oaxaca City and Central Valleys",
      country: "Mexico",
      continent: "North America",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1534161369-9cee8b224a87?w=1600&q=80",
      highlights: [
        "Monte Albán at sunrise — Zapotec pyramid city on a hilltop with 360-degree views",
        "Mezcal palenque visit in Matatlán — artisanal production from wild agave",
        "Day of the Dead in Oaxaca (November 1–2) — marigold altars, family vigils",
        "Mole negro cooking class — 28 ingredients and the patience of a Oaxacan grandmother",
        "Teotitlán del Valle weaving village — Zapotec tapestry using natural dyes",
        "Mercado Benito Juárez — Oaxacan tlayudas and fresh memelas for breakfast",
      ],
      gear: [
        "Comfortable walking shoes for cobblestone streets and site visits",
        "Light layers — Oaxaca at 1,550m has cool evenings even in summer",
        "Stomach medication — traveller's diarrhoea common for first-time visitors",
        "Mexican pesos (USD accepted at major hotels but pesos preferred everywhere)",
        "Camera for market and village photography (always ask permission)",
        "Reusable water bottle — bottled water essential, tap not potable",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3],
      estimatedCost: 90000,
      latitude: 17.0732,
      longitude: -96.7266,
      published: true,
      userId: user3.id,
      voteCount: 58,
      tags: {
        connect: [
          { id: allTags["cultural-immersion"].id },
          { id: allTags["photography"].id },
          { id: allTags["culture"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure84.id },
      { userId: user3.id, adventureId: adventure84.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 85 — Pacific Coast Highway, Big Sur to Los Angeles
  // -------------------------------------------------------------------------
  const adventure85 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-85" },
    update: {},
    create: {
      id: "seed-adventure-85",
      title: "Pacific Coast Highway, Big Sur to Los Angeles",
      description: `Highway 1 along California's central and southern coast is the definitive American road trip — 600km of two-lane blacktop clinging to cliffs above the Pacific, passing through Big Sur's redwood canyons, Hearst Castle's hilltop excess, Santa Barbara's Spanish architecture, and Malibu's surf breaks before the sprawl of Los Angeles eventually absorbs you.

The Big Sur stretch is the heart of the drive: Bixby Bridge arching over a 240m coastal canyon, the Henry Miller Memorial Library perched in the redwoods, Pfeiffer Beach with its purple sand and sea arch, and Julia Pfeiffer Burns State Park where McWay Falls drops directly onto the beach from the cliff above. Camping in the redwoods at Pfeiffer Big Sur State Park is one of the best campsites in America.

South of Big Sur, the tempo shifts: San Simeon for Elephant Seals and Hearst Castle, Morro Bay for seafood and the volcanic plug, San Luis Obispo wine country (Edna Valley), Santa Barbara for fish tacos and beach volleyball, and Ventura's old California downtown before the beach towns of Malibu and the Pacific Coast Highway's final miles into Santa Monica.

Do this drive from north to south to keep the ocean on your right. Allow 7–10 days minimum for the Big Sur to LA stretch. October–November offers the best weather: fog lifts earlier, summer crowds are gone, and the golden coastal scrub is at its best.`,
      location: "Big Sur to Los Angeles, California",
      country: "USA",
      continent: "North America",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.EASY,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: [
        "Bixby Bridge at sunrise — the most photographed bridge in California",
        "McWay Falls, Julia Pfeiffer Burns — waterfall dropping onto a pristine beach",
        "Pfeiffer Big Sur State Park redwood camping — coast redwoods 60m tall",
        "Elephant seal colony at San Simeon — 15,000 seals hauled out on the beach",
        "Hearst Castle — William Randolph Hearst's outrageous hilltop compound",
        "Santa Barbara fish tacos and Spanish mission on State Street",
      ],
      gear: [
        "Rental car (manual gearbox makes the coastal curves more engaging)",
        "California State Park camping reservation (book weeks ahead)",
        "Layers — Big Sur fog can sit all day even in summer",
        "Bear canister or keep food locked in car (bears active in redwoods)",
        "National Park Annual Pass (America the Beautiful — saves at multiple sites)",
        "Cash for beach parking meters and farm stands",
      ],
      bestMonths: [9, 10, 11, 4, 5],
      estimatedCost: 200000,
      latitude: 36.0,
      longitude: -121.5,
      published: true,
      userId: user1.id,
      voteCount: 79,
      tags: {
        connect: [
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure85.id },
      { userId: user1.id, adventureId: adventure85.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 86 — Iceland Ring Road Complete Circuit
  // -------------------------------------------------------------------------
  const adventure86 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-86" },
    update: {},
    create: {
      id: "seed-adventure-86",
      title: "Iceland Ring Road Complete Circuit",
      description: `Route 1, Iceland's Ring Road, circles the entire island in 1,332km — a complete circuit that passes through every major landscape type the country offers: black sand desert, active volcanoes, ice cap, fjord, lava field, waterfall, and geothermal spa. The road is fully paved and well-maintained, making the circuit accessible to ordinary rental vehicles in summer while demanding a 4WD in winter.

The classic highlights are well-documented — Jökulsárlón glacier lagoon and its icebergs, the waterfalls of the east (Skógafoss, Seljalandsfoss, Svartifoss), the Snæfellsnes Peninsula's volcanic glacier, the Westfjords for true wilderness — but the Ring Road's particular joy is the landscape between the highlights: lava deserts that look post-apocalyptic, fjord drives where you share the road with nothing but sheep, and the consistent surprise of Iceland's scale.

Midnight sun in June–July means 24-hour daylight, enabling driving and hiking at any hour. Northern lights season runs September–March, with the darkest windows in October–February providing the best aurora photography.

Rent a campervan in Reykjavik for maximum flexibility — wild camping is legal on most uncultivated land outside national parks. Budget USD 250–400 per day for rental, fuel, food, and camping fees.`,
      location: "Ring Road, Route 1, Iceland",
      country: "Iceland",
      continent: "Europe",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600&q=80",
      highlights: [
        "Jökulsárlón glacier lagoon — icebergs calving into a coastal lagoon at the Atlantic",
        "Skógafoss waterfall — walk behind the 60m curtain of water",
        "Vatnajökull National Park — Europe's largest glacier by volume",
        "Northern lights from a darkened campervan in the Westfjords (September–March)",
        "Midnight sun drive through the East Fjords in June",
        "Mývatn geothermal area — pseudocraters, boiling mud pools, and cave baths",
      ],
      gear: [
        "4WD campervan (essential for F-roads and winter travel)",
        "Layered clothing system — Icelandic weather changes hourly",
        "Waterproof jacket and trousers (guaranteed rain somewhere)",
        "Aurora forecasting app (Vedur.is is the official service)",
        "Gravel insurance for rental car (gravel roads are everywhere outside Ring Road)",
        "Portable camp stove — eating at restaurants is expensive",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 300000,
      latitude: 64.9631,
      longitude: -19.0208,
      published: true,
      userId: user2.id,
      voteCount: 82,
      tags: {
        connect: [
          { id: allTags["photography"].id },
          { id: allTags["volcanic"].id },
          { id: allTags["glacier"].id },
          { id: allTags["camping"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure86.id },
      { userId: user2.id, adventureId: adventure86.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 87 — Namibia Desert and Skeleton Coast Self-Drive
  // -------------------------------------------------------------------------
  const adventure87 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-87" },
    update: {},
    create: {
      id: "seed-adventure-87",
      title: "Namibia Desert and Skeleton Coast Self-Drive",
      description: `Namibia is one of the most visually distinctive countries in the world — the Namib Desert is the world's oldest at 55 million years, its orange-red dunes at Sossusvlei rising 300 metres from white salt pans; the Skeleton Coast is a graveyard of ships and whale bones where the cold Atlantic and the hyper-arid desert meet; and Etosha National Park is a white salt pan safari destination where elephants, lions, and rhinos gather at floodlit waterholes after dark.

The self-drive circuit of 4,000–5,000km takes 14–18 days and is well within the capability of a confident driver in a 4WD: Windhoek → Fish River Canyon → Lüderitz → Sossusvlei → Swakopmund → Skeleton Coast → Etosha → Windhoek. Roads are gravel for large sections but generally well-maintained. Fuel stations are far apart — never miss a fill-up opportunity.

Sossusvlei's Dead Vlei (a white clay pan surrounded by 1,000-year-old camel thorn skeletons against orange dunes) is one of the great photographic landscapes on earth. Arrive at dawn to photograph before the heat haze builds.

June–September is the prime window: dry season, moderate temperatures, and concentrated wildlife at Etosha waterholes. The coast is cold year-round due to the Benguela current.`,
      location: "Sossusvlei, Skeleton Coast, Etosha, Swakopmund",
      country: "Namibia",
      continent: "Africa",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 16,
      coverImageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
      highlights: [
        "Dead Vlei, Sossusvlei — ancient camel thorn skeletons on white clay, orange dunes",
        "Big Daddy Dune at sunrise — 325m of perfect Namib desert sand",
        "Etosha waterhole nights — lions hunting at the floodlit pan after dark",
        "Cape Cross Seal Reserve — 100,000 Cape fur seals on the Skeleton Coast",
        "Kolmanskop ghost town — diamond mining town reclaimed by desert sand dunes",
        "Fish River Canyon — second largest canyon in the world, 160km long",
      ],
      gear: [
        "4WD with high clearance and two spare tyres (gravel roads are hard on rubber)",
        "50L of water storage (distances between services can exceed 300km)",
        "GPS offline map (Maps.me or Gaia GPS with Namibia downloaded)",
        "Recovery kit: traction boards, shovel, tow rope",
        "Warm clothing — Namib nights and Skeleton Coast fog drop to 10°C",
        "Binoculars and telephoto lens for Etosha game drives",
      ],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 350000,
      latitude: -24.7332,
      longitude: 15.9423,
      published: true,
      userId: user3.id,
      voteCount: 66,
      tags: {
        connect: [
          { id: allTags["desert"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["safari"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure87.id },
      { userId: user3.id, adventureId: adventure87.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 88 — North Coast 500, Scottish Highlands
  // -------------------------------------------------------------------------
  const adventure88 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-88" },
    update: {},
    create: {
      id: "seed-adventure-88",
      title: "North Coast 500, Scottish Highlands",
      description: `The North Coast 500 — Scotland's answer to Route 66 — is a 500-mile loop from Inverness around the northern Highlands, passing through some of the last genuinely wild land in Europe. The route was officially established in 2015 but the landscape it traverses has resisted human domestication for millennia: Torridon's Precambrian sandstone mountains, Assynt's isolated quartzite peaks, Caithness's sea stack coastline, and the Flow Country's vast peat bog are not things you find anywhere else.

The drive itself takes 5–7 days done properly, but a week barely allows stops at each day's obvious highlights. The real value is in slowing down — Applecross village across the dramatic Bealach na Bà pass, the fairy tale castle at Eilean Donan on a still morning, Handa Island's seabird cliffs in summer, and Cape Wrath's lighthouse at the northwest corner of mainland Britain.

Scotland in summer offers 18–20 hours of daylight, making evening hikes into the mountains above wherever you're camped entirely feasible. Wild camping is a legal right in Scotland under the Land Reform Act 2003 — the entire route can be camped for the cost of a bag of coal for the firepit.

May–September is the tourist season; May offers the most daylight and fewest midges. The midges (tiny biting flies) in June–August are a genuine challenge — bring a head net and midge repellent.`,
      location: "Inverness to Inverness via North Coast, Scotland",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: [
        "Bealach na Bà — one of Britain's most dramatic mountain passes into Applecross",
        "Eilean Donan Castle at dawn — the most photographed castle in Scotland",
        "Torridon mountains — Precambrian sandstone ridges above loch and sea",
        "Cape Wrath — the northwest tip of mainland Britain and its lighthouse",
        "Handa Island seabird colony — 100,000 great skua and razorbill nesting (summer)",
        "Wild camping above Loch Assynt — sleeping under the Scottish sky",
      ],
      gear: [
        "Waterproof jacket and trousers (guaranteed rain at some point)",
        "Midge head net and repellent (June–August essential)",
        "Wild camping kit — Scotland allows it legally everywhere",
        "Ordnance Survey maps of the Highlands for day hikes",
        "Wellies or waterproof hiking boots for bog walking",
        "Whisky flask — you'll be passing distilleries",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 150000,
      latitude: 58.2,
      longitude: -4.8,
      published: true,
      userId: user1.id,
      voteCount: 69,
      tags: {
        connect: [
          { id: allTags["scotland"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
          { id: allTags["europe"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure88.id },
      { userId: user1.id, adventureId: adventure88.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 89 — Tasmania Grand Drive, Australia
  // -------------------------------------------------------------------------
  const adventure89 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-89" },
    update: {},
    create: {
      id: "seed-adventure-89",
      title: "Tasmania Grand Drive, Australia",
      description: `Tasmania is the most wilderness-intensive state in Australia — 40% of the island is national park or World Heritage Area, and its southwest corner is one of the last intact temperate rainforests on earth. A 10–14 day driving circuit from Hobart clockwise through the Midlands, Freycinet Peninsula, Bay of Fires, Cradle Mountain, the Franklin Gordon Wild Rivers, and Port Arthur brings together landscapes that simply don't exist elsewhere in the Southern Hemisphere.

The Freycinet Peninsula is the easy seduction: Wineglass Bay seen from the lookout is the image that sells Tasmania to the world, and the 3-day circuit walk that covers the full peninsula is one of Australia's finest short hikes. The Bay of Fires in the northeast — white sand beaches with orange lichen-encrusted granite boulders — has no parallel in Australian coastal scenery.

Cradle Mountain, the rugged dolerite peak above the iconic Lake Dove, anchors Tasmania's most accessible alpine walking. The 65km Overland Track (6 days) starts here; day walks around the lake are accessible to non-hikers. To the southwest, the Franklin-Gordon Wild Rivers National Park is wild in the original sense — the proposed Franklin River dam in the 1980s mobilised the modern Australian environmental movement.

Drive the circuit in 10–14 days. Hire a campervan from Hobart — Tasmania's camping infrastructure is excellent and well-maintained. Spring (September–November) offers wildflowers, green hills, and manageable summer visitor numbers.`,
      location: "Hobart, Freycinet, Cradle Mountain, Southwest Wilderness",
      country: "Australia",
      continent: "Oceania",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1504108928284-5f5eb3faa40e?w=1600&q=80",
      highlights: [
        "Wineglass Bay lookout, Freycinet — the most iconic beach view in Australia",
        "Bay of Fires — white sand and orange-granite coast with zero development",
        "Cradle Mountain at dawn — dolerite summit mirrored in Lake Dove",
        "Overland Track (6-day option) — Tasmania's premier alpine multi-day walk",
        "MONA, Hobart — David Walsh's underground museum of old and new art",
        "Salamanca Market, Hobart — Saturday morning institution for local produce",
      ],
      gear: [
        "Campervan or 4WD for gravel road access in the southwest",
        "Waterproof jacket — Tasmania's weather is genuinely unpredictable",
        "Warm layers for Cradle Mountain and alpine areas",
        "Ankle boots or trail runners for day hikes",
        "National Parks pass (Tasmania charges for all park access)",
        "Insect repellent for rainforest walking",
      ],
      bestMonths: [9, 10, 11, 12, 1, 2, 3],
      estimatedCost: 220000,
      latitude: -42.0,
      longitude: 146.5,
      published: true,
      userId: user2.id,
      voteCount: 53,
      tags: {
        connect: [
          { id: allTags["australia"].id },
          { id: allTags["coastal"].id },
          { id: allTags["photography"].id },
          { id: allTags["camping"].id },
          { id: allTags["hiking"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure89.id },
      { userId: user2.id, adventureId: adventure89.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 90 — Palau Blue Corner and Blue Hole Dive Safari
  // -------------------------------------------------------------------------
  const adventure90 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-90" },
    update: {},
    create: {
      id: "seed-adventure-90",
      title: "Palau Blue Corner and Blue Hole Dive Safari",
      description: `Palau, a Micronesian archipelago 800km east of the Philippines, consistently tops best dive destination polls for one reason: the concentration of different dive experiences is extraordinary. Blue Corner is a drift dive along a wall where the current accelerates around the corner, bringing bait fish and the sharks, rays, and large pelagics that hunt them. Blue Hole is an underwater cave system with columns of light dropping through a limestone ceiling. German Channel has resident manta rays. Jellyfish Lake has a population of golden jellyfish evolved to be stingless.

A live-aboard runs the outer reefs and remote sites; land-based diving from Koror accesses the more protected inner reef diving. First-timers typically choose land-based from Koror with day trips on a dive boat; serious divers book 7-day live-aboard packages that access all the sites optimally timed around current and tide.

The Marine Protection Act prohibits collecting any marine organism and enforces strict buoyancy standards. Palau's reefs are in better condition than almost anywhere in the Pacific as a result.

Palau is accessible via Guam, Manila, or Tokyo. Live-aboard packages run USD 2,500–3,500 for 7 days all-inclusive. Land-based diving USD 150–200 per day including 2-3 dives. Best season: October–April with calm conditions and good visibility.`,
      location: "Palau, Micronesia, Western Pacific",
      country: "Palau",
      continent: "Oceania",
      category: Category.DIVING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: [
        "Blue Corner drift dive — grey reef and whitetip sharks riding the current",
        "Blue Hole — columns of light through a limestone cathedral ceiling",
        "Jellyfish Lake — swimming through millions of stingless golden jellyfish",
        "German Channel manta ray cleaning station — up-close with oceanic mantas",
        "WWII wrecks: Iro Maru and Amatsu Maru in 10–30m of water",
        "Ngercheu Island pristine outer reef — untouched coral gardens",
      ],
      gear: [
        "PADI Open Water certification minimum (Advanced recommended for Blue Corner)",
        "Reef hook (mandatory for Blue Corner current diving)",
        "3mm wetsuit — water 28–30°C year-round",
        "Dive computer",
        "Mask, fins, BCD, regulator (all rentable in Koror)",
        "Underwater camera housing for jellyfish and shark photography",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 350000,
      latitude: 7.5149,
      longitude: 134.5825,
      published: true,
      userId: user3.id,
      voteCount: 62,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure90.id },
      { userId: user3.id, adventureId: adventure90.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 91 — Red Sea Liveaboard, Ras Mohammed to Brothers Islands
  // -------------------------------------------------------------------------
  const adventure91 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-91" },
    update: {},
    create: {
      id: "seed-adventure-91",
      title: "Red Sea Liveaboard, Ras Mohammed to Brothers Islands",
      description: `The Red Sea is one of the world's premier liveaboard diving destinations — warm, clear water, shallow-growing hard coral in superb condition, and a pelagic scene that delivers hammerhead sharks, oceanic whitetips, and thresher sharks at the Brothers Islands and Daedalus Reef. The classic southern liveaboard circuit from Hurghada runs to Ras Mohammed (the submerged tip of the Sinai Peninsula), down the Egyptian coast past Sha'ab Abu Nuhas wreck site, and out to the offshore pinnacles.

The Brothers (El Akhawein) are two tiny rocky islands in the open Red Sea, 60km offshore, that rise from 800m of water. The walls are covered in soft corals and home to schools of barracuda, jacks, and the resident oceanic whitetip sharks that were Jacques Cousteau's favourite Red Sea subject. Daedalus Reef adds hammerheads and schooling hammerhead sharks on the right swell and current.

Liveaboard boats from Hurghada run 7-day circuits year-round. The boats range from basic to comfortable — look for ADORA or WADI GIN quality boats if budget allows. Nitrox is widely available for extending bottom time. Prices run USD 900–1,800 per person for a 7-night all-inclusive liveaboard.

October–May is the prime season. Summer (June–September) is hot (air and water both 30°C+) but still excellent diving.`,
      location: "Hurghada to Brothers Islands, Red Sea",
      country: "Egypt",
      continent: "Africa",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1559827291-72cdfc29a9f2?w=1600&q=80",
      highlights: [
        "Brothers Islands oceanic whitetip sharks — Cousteau's favourite pelagic",
        "Daedalus Reef hammerhead school — seasonal but spectacular when present",
        "Sha'ab Abu Nuhas wreck alley — four cargo ships in 18–28m",
        "Ras Mohammed National Park — pristine coral walls at Sinai's southern tip",
        "Elphinstone Reef — a vertical wall with 60m+ visibility on calm days",
        "Liveaboard life — diving 3–4 times daily, sundeck evenings, Red Sea sunsets",
      ],
      gear: [
        "PADI Advanced Open Water minimum (Deep certification for Brothers walls)",
        "3mm wetsuit (water 22–28°C depending on season)",
        "Dive computer and dive torch for swim-throughs",
        "Nitrox certification (strongly recommended for extended bottom time)",
        "Seasickness medication for the overnight crossing to offshore sites",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3, 4, 5],
      estimatedCost: 150000,
      latitude: 26.3667,
      longitude: 34.2667,
      published: true,
      userId: user1.id,
      voteCount: 57,
      tags: {
        connect: [
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure91.id },
      { userId: user1.id, adventureId: adventure91.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 92 — Great Barrier Reef Liveaboard, Coral Sea
  // -------------------------------------------------------------------------
  const adventure92 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-92" },
    update: {},
    create: {
      id: "seed-adventure-92",
      title: "Great Barrier Reef Liveaboard, Coral Sea",
      description: `The Great Barrier Reef is the world's largest coral ecosystem — 2,300km of coral reef, 600 types of coral, 1,500 fish species, and 4,000 mollusk species — stretching along the Queensland coast from the Torres Strait to the Capricorn Group. Visiting from the mainland on day boats gives a surface impression; a liveaboard departing from Cairns or Port Douglas reaches the Outer Barrier Reef and the Coral Sea Ribbon Reefs, where the marine density and coral cover exceed anything accessible on a day trip.

The Ribbon Reefs (numbers 3, 9, and 10) at the northern end of the barrier are the prime liveaboard target — narrow ribbons of reef rising to the surface from the continental shelf edge, with dramatic wall diving, hawksbill turtle density, and the Cod Hole potato cod encounter (enormous 2-metre groupers that eat from divers' hands). Steve's Bommie in the Far North Section has some of the best coral cover on the reef.

The Coral Sea Osprey Reef and Shark Observatory sites add pelagic sharks, Silvertip reef sharks, and the opportunity for night dives that are among the best in the world. Day-trippers never see these sites.

Best season: June–November for clearest water and calmest conditions. Cyclone season (November–April) creates weather risk for offshore sites. 3-night liveaboards from Cairns run USD 600–900; week-long Coral Sea expeditions USD 1,500–2,500.`,
      location: "Outer Barrier Reef and Coral Sea, North Queensland",
      country: "Australia",
      continent: "Oceania",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1600&q=80",
      highlights: [
        "Cod Hole potato cod feeding — 2-metre groupers approaching at arm's length",
        "Ribbon Reef walls — 40m vertical coral gardens with zero visibility reduction",
        "Osprey Reef night dive — sleeping whitetip reef sharks and bioluminescent plankton",
        "Hawksbill sea turtle encounters — highest density on the northern barrier",
        "Steve's Bommie hard coral gardens — best coral cover on the reef",
        "Minke whale encounters on the outer ribbon reefs (June–July)",
      ],
      gear: [
        "PADI Open Water minimum; Advanced recommended for wall diving",
        "3mm shorty or 5mm full suit (water 22–28°C seasonal variation)",
        "Dive torch for night dives and crevasse exploration",
        "Reef-safe sunscreen only (chemical sunscreens banned in national parks)",
        "Underwater camera — photo quality is stunning in the Coral Sea",
      ],
      bestMonths: [6, 7, 8, 9, 10, 11],
      estimatedCost: 200000,
      latitude: -16.5,
      longitude: 146.0,
      published: true,
      userId: user2.id,
      voteCount: 64,
      tags: {
        connect: [
          { id: allTags["australia"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure92.id },
      { userId: user2.id, adventureId: adventure92.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 93 — SS Thistlegorm Wreck Dive, Gulf of Suez
  // -------------------------------------------------------------------------
  const adventure93 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-93" },
    update: {},
    create: {
      id: "seed-adventure-93",
      title: "SS Thistlegorm Wreck Dive, Gulf of Suez",
      description: `The SS Thistlegorm is the world's most famous wreck dive. The British cargo ship was sunk by German bombers in October 1941 en route to supply the British Eighth Army in North Africa, and its holds contain an intact wartime cargo: BSA motorcycles still upright on their stands, Bedford lorries, Lee-Enfield rifles, Wellington boots, and railway locomotives that broke through the deck when the stern ammunition magazine exploded.

The wreck lies in 28–32m of clear Red Sea water off Ras Muhammad, accessible from day boats from Sharm el-Sheikh or live-aboards from Hurghada. Despite being the world's most dived wreck (thousands of divers per season), the cargo is remarkably intact — no-touch rules are enforced and the Egyptian marine authorities patrol regularly.

Two dives are the standard — a swim-through of the forward holds to view the motorcycles and cargo, and a deeper dive around the stern explosion site where the hull is broken and the railway engines half-buried in sand. The anchor chain and mast swim-through complete an extraordinary day's diving.

Night dives on the Thistlegorm, when the wreck is almost completely empty of other divers, produce a completely different atmosphere: sleeping glassfish in the holds, hunting lionfish on the deck railing, and the eerie quiet of a ship that history interrupted.`,
      location: "Strait of Gubal, northern Red Sea, near Sha'ab Ali",
      country: "Egypt",
      continent: "Africa",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1552661397-4b6c76ce2c65?w=1600&q=80",
      highlights: [
        "BSA motorcycles upright in the hold — exactly as sunk in 1941",
        "Bedford army lorries with wartime cargo still intact in the cargo bay",
        "Railway locomotives half-buried in sand at the stern explosion site",
        "Hold 4 swim-through — glassfish, lionfish, and intact wartime inventory",
        "Night dive alone on the deck railing — eerie and completely different atmosphere",
        "Anchor chain ascent and mast swim-through on the second dive",
      ],
      gear: [
        "PADI Advanced Open Water with deep dive speciality (32m bottom depth)",
        "3mm wetsuit (water 22–27°C)",
        "Dive torch (mandatory for hold exploration)",
        "Underwater camera — most photogenic wreck in the world",
        "Dive computer with nitrox capability if certified",
        "Reef hook for the current that can be strong on the wreck",
      ],
      bestMonths: [10, 11, 12, 1, 2, 3, 4, 5],
      estimatedCost: 80000,
      latitude: 27.8175,
      longitude: 33.9201,
      published: true,
      userId: user3.id,
      voteCount: 71,
      tags: {
        connect: [
          { id: allTags["bucket-list"].id },
          { id: allTags["photography"].id },
          { id: allTags["cultural-immersion"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure93.id },
      { userId: user3.id, adventureId: adventure93.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 94 — Komodo Island Dive Safari, Indonesia
  // -------------------------------------------------------------------------
  const adventure94 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-94" },
    update: {},
    create: {
      id: "seed-adventure-94",
      title: "Komodo Island Dive Safari, Indonesia",
      description: `Komodo National Park in the Flores Sea is where two things happen simultaneously: above the water, Komodo dragons — the world's largest lizard — roam volcanic slopes covered in dry savanna grass; below it, ferocious currents funnel Indian Ocean and Pacific water between the island channels, creating one of the most nutrient-rich and fish-dense marine environments in the world.

The diving here is advanced — sites like Batu Bolong and Tatawa Besar have strong, unpredictable currents that require experience and a good guide. Manta Point on the eastern side of Padar Island is a cleaning station for oceanic manta rays where calm water conditions allow snorkelling with mantas within arm's reach. Crystal Rock and Castle Rock are volcanic pinnacles swept clean by current, covered in sea fans and schooling fish so dense the water turns dark.

Live-aboards departing from Labuan Bajo (accessed via Bali or Lombok) cover the full park in 3–7 days. Land-based day diving from Labuan Bajo reaches the closer sites but misses the remote eastern reefs. The dragon trekking tours on Komodo and Rinca islands combine easily with diving — same boat, same itinerary.

April–November is the prime season. Southern sites (south of Rinca) are calmer in April–October; north sites are better November–March. Budget USD 150–200 per day for land-based, USD 250–450 per day for live-aboard.`,
      location: "Komodo National Park, West Manggarai",
      country: "Indonesia",
      continent: "Asia",
      category: Category.DIVING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80",
      highlights: [
        "Manta Point — snorkel and dive with oceanic manta rays at the cleaning station",
        "Batu Bolong — a volcanic pinnacle with 80m visibility and wall-to-wall fish",
        "Komodo dragon trekking on Rinca Island — UNESCO listed predator encounter",
        "Crystal Rock current diving — schooling barracuda and giant trevally",
        "Tatawa Besar — pristine hard coral plateau with bumphead parrotfish",
        "Pink Beach — one of only seven pink-sand beaches in the world",
      ],
      gear: [
        "PADI Advanced Open Water with drift dive experience (currents are powerful)",
        "3mm wetsuit — water 26–29°C with thermoclines to 24°C",
        "Surface marker buoy (SMB) — mandatory in current diving",
        "Reef hook for stationary observation of the manta ray cleaning station",
        "Underwater camera (visibility can exceed 30m on good days)",
        "Sun protection — tropical UV on boat decks is intense",
      ],
      bestMonths: [4, 5, 6, 7, 8, 9, 10, 11],
      estimatedCost: 230000,
      latitude: -8.55,
      longitude: 119.5,
      published: true,
      userId: user1.id,
      voteCount: 58,
      tags: {
        connect: [
          { id: allTags["island"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["jungle"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure94.id },
      { userId: user1.id, adventureId: adventure94.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 95 — Haida Gwaii Outer Islands Sea Kayak, Canada
  // -------------------------------------------------------------------------
  const adventure95 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-95" },
    update: {},
    create: {
      id: "seed-adventure-95",
      title: "Haida Gwaii Outer Islands Sea Kayak, Canada",
      description: `Haida Gwaii — formerly the Queen Charlotte Islands — is an archipelago 100km off the northern British Columbia coast, separated from the mainland by the treacherous Hecate Strait and belonging to the Haida Nation, whose culture survived here while most of the Pacific Northwest coast was transformed. The outer islands of the Gwaii Haanas National Park Reserve are accessible only by kayak or small boat, and the paddling conditions are among the most demanding on the Pacific Coast.

The classic route through Gwaii Haanas covers 150km over 10–14 days, paddling between uninhabited islands dense with old-growth Sitka spruce, stopping at abandoned Haida village sites (Skedans, Tanu, Ninstints) where mortuary poles still stand in the forest — a UNESCO World Heritage Site. Wildlife is extraordinary: humpback whales surface alongside kayaks, black bears forage the shoreline, and sea otters float in kelp beds throughout.

Open-water crossings up to 10km are necessary on the outer route — plan around weather windows, paddle with a guide on first visits, and carry a VHF radio and EPIRB. The Hecate Strait is notorious; the outer coast less so, but fog and Pacific swells are genuine hazards.

Book guided trips through Archipelago Kayaks or similar qualified operators. July–September is the window; June is possible but cold. Fly to Sandspit via Vancouver.`,
      location: "Gwaii Haanas National Park Reserve, Haida Gwaii",
      country: "Canada",
      continent: "North America",
      category: Category.KAYAKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1559521783-1d1599583485?w=1600&q=80",
      highlights: [
        "SGang Gwaay (Ninstints) UNESCO village site — standing mortuary poles in old-growth forest",
        "Humpback whale surfacing alongside kayaks in open water",
        "Black bear shore foraging — common throughout the archipelago",
        "Sea otter colonies in kelp beds on the outer coast",
        "10km open-water crossings with Pacific swell — genuine ocean paddling",
        "Old-growth Sitka spruce and cedar forest — trees over 1,000 years old",
      ],
      gear: [
        "Sea kayak with bulkheads and deck rigging (usually provided on guided trips)",
        "5/4mm wetsuit or drysuit (water 10–14°C year-round)",
        "VHF marine radio and EPIRB for solo paddlers",
        "Paddling jacket and spray skirt",
        "Bear canister (bears active on all camping beaches)",
        "Haida Gwaii National Park Reserve permit (Indigenous cultural site access)",
      ],
      bestMonths: [7, 8, 9],
      estimatedCost: 400000,
      latitude: 52.5,
      longitude: -131.5,
      published: true,
      userId: user2.id,
      voteCount: 36,
      tags: {
        connect: [
          { id: allTags["kayaking"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["remote"].id },
          { id: allTags["cultural-immersion"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure95.id },
      { userId: user2.id, adventureId: adventure95.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 96 — Lake Bled and Soča Valley Kayak, Slovenia
  // -------------------------------------------------------------------------
  const adventure96 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-96" },
    update: {},
    create: {
      id: "seed-adventure-96",
      title: "Lake Bled and Soča Valley Kayak, Slovenia",
      description: `Slovenia is Europe's outdoor adventure secret — a country the size of Wales with the Julian Alps on its northern border, a turquoise river (the Soča) running through a glacial gorge that looks CGI-rendered, and Lake Bled's island church set against mountains that seem too perfect. Combining a kayak and flat-water paddle on Bled with whitewater kayaking or rafting on the Soča creates a week of varied paddling in extraordinary scenery.

The Soča River runs 138km from Triglav National Park to the Adriatic — the upper section near Bovec is Grade III–IV whitewater suitable for experienced paddlers, while the middle section below Most na Soči offers gentler paddling through gorges. The water is a deep, impossible turquoise caused by glacial minerals and remarkable clarity — visibility to 10m in calm sections.

Lake Bled on a still morning, paddling out to the island that sits at the lake's centre — the only island in Slovenia, with a church that's been the site of pilgrimage for over 1,000 years — is one of the quietest pleasures in European adventure travel. Rent a wooden pletna boat or bring your own kayak.

Combine with hiking on Triglav, Slovenia's only 2,864m peak, and cycling through the Soča Valley for a complete adventure base. Base in Bovec for Soča; Bled for lake access. May–September is the outdoor season.`,
      location: "Lake Bled and Soča Valley, Julian Alps",
      country: "Slovenia",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1600&q=80",
      highlights: [
        "Lake Bled island paddle at dawn — mirror-calm water and the church bell",
        "Soča turquoise gorge — the clearest and most impossibly coloured river in Europe",
        "Boka Waterfall — 106m plunge into the Soča valley from the cliff",
        "Triglav National Park — pristine Julian Alps with chamois and golden eagles",
        "Kozjak Waterfall via the Soča gorge walk — hidden amphitheatre pool",
        "Kobarid Museum of WWI — Soča front where Hemingway served and wrote",
      ],
      gear: [
        "Sea kayak or touring kayak for Lake Bled flat water",
        "Whitewater kayak or inflatable raft for Soča rapids (rentable in Bovec)",
        "5mm wetsuit for Soča (water temperature 10–16°C even in summer)",
        "Helmet (mandatory for Grade III+ sections of Soča)",
        "Dry bag for camera and valuables",
        "Hiking boots for Triglav day walks",
      ],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 100000,
      latitude: 46.3631,
      longitude: 14.0938,
      published: true,
      userId: user3.id,
      voteCount: 47,
      tags: {
        connect: [
          { id: allTags["kayaking"].id },
          { id: allTags["alpine"].id },
          { id: allTags["europe"].id },
          { id: allTags["photography"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure96.id },
      { userId: user3.id, adventureId: adventure96.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 97 — Doubtful Sound Sea Kayak, Fiordland
  // -------------------------------------------------------------------------
  const adventure97 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-97" },
    update: {},
    create: {
      id: "seed-adventure-97",
      title: "Doubtful Sound Sea Kayak, Fiordland",
      description: `Doubtful Sound is larger, more remote, and less visited than its famous Fiordland neighbour Milford Sound — accessible only by boat across Lake Manapouri and over the Wilmot Pass by road, which keeps day-tripper numbers manageable and the fiord genuinely wild. Paddling a sea kayak through the three arms of the sound, camping on beaches where waterfalls from the rain-soaked bluffs drop directly into the water beside you, is one of the most extraordinary paddling experiences in the Southern Hemisphere.

The fiord's daily rainfall (around 7,000mm per year) creates a permanent fresh-water layer on the surface — this causes the dark tannin-stained water to let almost no light through, creating conditions where deep-water species like black coral live at just 6–10m depth rather than 50m+. Dolphins, bottlenose and dusky, use the fiord year-round; New Zealand fur seals haul out on rocky islands throughout.

Guided 3-day kayak expeditions from Manapouri are the standard format — the logistics of getting equipment over the Wilmot Pass make independent kayaking complex on a first visit. Some operators combine kayaking with overnight cruises on the water.

Fiordland receives rain 200+ days per year — pack fully waterproof everything and accept it with equanimity. The fiord is at its most dramatic in rain: waterfalls appear on every cliff face that was dry an hour before.`,
      location: "Doubtful Sound, Fiordland National Park",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80",
      highlights: [
        "Paddling past 1,000m cliff faces with waterfalls in full flood after rain",
        "Black coral at 6m depth due to the fresh-water light-blocking layer",
        "Bottlenose dolphin pod escort through the main arm of the sound",
        "New Zealand fur seal colonies on rocky outcrops",
        "Camping on a deserted beach deep inside the fiord in total silence",
        "Milky Fiord arm — the deepest and narrowest finger with dramatic acoustics",
      ],
      gear: [
        "Sea kayak with bulkheads (provided on guided trips)",
        "Drysuit or 5mm wetsuit — water 12–16°C, rain constant",
        "Fully waterproof dry bags for sleeping bag and clothing",
        "Camp stove and cooking supplies for multi-night camping",
        "Sandfly repellent (Doubtful Sound sandflies are legendary)",
        "Rain jacket and trousers you don't mind getting soaked",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 150000,
      latitude: -45.3267,
      longitude: 166.9833,
      published: true,
      userId: user1.id,
      voteCount: 43,
      tags: {
        connect: [
          { id: allTags["kayaking"].id },
          { id: allTags["new-zealand"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["camping"].id },
          { id: allTags["remote"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure97.id },
      { userId: user1.id, adventureId: adventure97.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 98 — Stockholm Archipelago Kayak, Sweden
  // -------------------------------------------------------------------------
  const adventure98 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-98" },
    update: {},
    create: {
      id: "seed-adventure-98",
      title: "Stockholm Archipelago Kayak, Sweden",
      description: `The Stockholm Archipelago contains 30,000 islands stretching 150km into the Baltic Sea — from the busy inner archipelago accessible by regular ferry from the city, to the remote outer archipelago where the bare granite skerries are visited by sailing boats and kayaks only. Paddling through this landscape in summer, with 18 hours of daylight and water warm enough to swim in, is one of the most accessible multi-day kayak journeys in northern Europe.

The classic kayak route runs from Sandhamn (accessible by ferry from Stockholm) south and east through the Möja and Ornö archipelago groups, camping on the outer islands using Sweden's allemansrätten (Freedom to Roam) law that allows wild camping on any undeveloped land. Daily distances of 15–25km are comfortable in calm conditions; the Baltic can generate wind chop quickly, so weather monitoring matters.

The outer archipelago is genuinely quiet — you may paddle an entire day between Sandhamn and Landsort seeing only one or two other vessels. Fishing villages on larger islands (Möja, Runmarö) sell smoked fish, fresh bread, and ice cream from minimal local shops. The return to Stockholm is by ferry from any of the outer islands.

June–August is the prime season. July is peak Swedish holiday month — inner archipelago islands are busy; the outer is always calm. Budget SEK 500–800 per day for food and campsite fees (many are free under allemansrätten).`,
      location: "Stockholm Archipelago, Baltic Sea",
      country: "Sweden",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b5f04b5?w=1600&q=80",
      highlights: [
        "Paddling through 30,000-island granite archipelago in midnight sun",
        "Wild camping on outer skerries under Swedish allemansrätten — no fees, no fences",
        "Sandhamn village — historic maritime racing hub with summer restaurant culture",
        "Landsort lighthouse — southernmost point of the archipelago on a tiny island",
        "Smoked fish directly from fishermen in Möja village harbour",
        "Baltic swimming at sunset — water 20–22°C in peak summer",
      ],
      gear: [
        "Sea kayak with rudder (Baltic wind chop requires directional control)",
        "3mm shorty or swimming costume — water up to 22°C in summer",
        "Wild camping kit (tent, sleeping bag, stove)",
        "Swedish maritime charts (archipelago navigation)",
        "VHF radio for weather updates",
        "Insect repellent (mosquitoes in wooded island camping areas)",
      ],
      bestMonths: [6, 7, 8],
      estimatedCost: 80000,
      latitude: 59.2833,
      longitude: 18.8167,
      published: true,
      userId: user2.id,
      voteCount: 39,
      tags: {
        connect: [
          { id: allTags["kayaking"].id },
          { id: allTags["midnight-sun"].id },
          { id: allTags["camping"].id },
          { id: allTags["europe"].id },
          { id: allTags["solo-travel"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user3.id, adventureId: adventure98.id },
      { userId: user2.id, adventureId: adventure98.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 99 — Sea of Cortez Island-Hopping Kayak, Baja California
  // -------------------------------------------------------------------------
  const adventure99 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-99" },
    update: {},
    create: {
      id: "seed-adventure-99",
      title: "Sea of Cortez Island-Hopping Kayak, Baja California Sur",
      description: `Jacques Cousteau called the Sea of Cortez "the world's aquarium" — a semi-enclosed sea between Baja California and mainland Mexico that contains more marine species than almost anywhere else on earth due to its mix of cold Pacific upwelling and warm tropical water. Kayaking between the Espíritu Santo island group in the southern Sea of Cortez — a 3-hour ferry from La Paz — gives access to sea lion colonies, whale shark snorkelling, manta ray encounters, and deserted white sand beaches with no facilities.

The standard route covers Espíritu Santo and Partida islands: 20–30km of paddling per day on calm water between beaches shaded by cardón cactus and palo verde trees, camping in coves where California sea lions surf in the shore break and bark through the night. The snorkelling off Los Islotes is among the best in Mexico — the resident sea lion colony approaches snorkellers and plays in the bubbles.

Water temperature peaks at 28°C in August–October; winter months (December–March) see 18–22°C with clearer water and reliable whale watching (blue and fin whales in the Cortez). Kayak La Paz and similar operators run 3–7 day guided trips from La Paz with full equipment, food, and camping gear. Independent kayakers can rent from various outfitters.

November–April is the optimal combination of temperatures and whale activity. Summer (June–September) is hot (air 40°C) but whale sharks are present for snorkelling.`,
      location: "Espíritu Santo Biosphere Reserve, Baja California Sur",
      country: "Mexico",
      continent: "North America",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1544547006-f0a9c5c6e9d6?w=1600&q=80",
      highlights: [
        "Los Islotes sea lion colony — California sea lions playing with snorkellers",
        "Whale shark snorkelling — up to 12m gentle filter-feeders alongside kayaks (Jun–Oct)",
        "Blue and fin whale watching from the kayak (December–March)",
        "Deserted white sand beaches with cardón cactus forest inland",
        "Manta ray encounters in the deeper channels between islands",
        "Stargazing from the beach — Sea of Cortez has near-zero light pollution",
      ],
      gear: [
        "Sea kayak with dry storage hatches (guides provide on guided trips)",
        "Shorty wetsuit or boardshorts — water 18–28°C depending on season",
        "Snorkel mask and fins for sea lion and whale shark encounters",
        "Sun protection: hat, SPF 50, UPF clothing — Baja UV is extreme",
        "Water purification tablets or filter (no fresh water on islands)",
        "Bear canister or animal-proof food storage (coyotes on Espíritu Santo)",
      ],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 180000,
      latitude: 24.5,
      longitude: -110.5,
      published: true,
      userId: user3.id,
      voteCount: 45,
      tags: {
        connect: [
          { id: allTags["kayaking"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["island"].id },
          { id: allTags["coastal"].id },
          { id: allTags["camping"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure99.id },
      { userId: user3.id, adventureId: adventure99.id },
    ],
    skipDuplicates: true,
  });

  // -------------------------------------------------------------------------
  // Adventure 100 — Masai Mara Big Five Safari, Kenya
  // -------------------------------------------------------------------------
  const adventure100 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-100" },
    update: {},
    create: {
      id: "seed-adventure-100",
      title: "Masai Mara Big Five Safari, Kenya",
      description: `The Masai Mara is Kenya's premier game reserve — an extension of Tanzania's Serengeti ecosystem that receives the northern leg of the annual Great Migration and hosts the densest concentration of lions in Africa. Big cats are here in numbers that make spotting routine: lion prides on kopjes, cheetah mothers teaching cubs to hunt, leopards draping impala kills from acacia branches. Black rhino, the most endangered of the Big Five, inhabit the Mara Conservancies around the reserve border.

July–October brings the Great Migration — 1.5 million wildebeest, 500,000 zebra, and 250,000 Thomson's gazelle crossing the Mara River from Tanzania in dramatic mass crossings where Nile crocodiles wait in the water. The crossings are unpredictable — herds may hesitate for hours, then cross in minutes. Staying 3+ days maximises the chance of witnessing one.

The Mara Conservancies (Olare Motorogi, Mara Naboisho, Mara North) adjacent to the main reserve charge higher fees but restrict vehicle numbers — you may have a cheetah hunt entirely to yourself rather than surrounded by 15 safari vehicles.

Fly from Nairobi to Keekorok or Ol Kiombo airstrips directly into the Mara. Accommodation ranges from luxury tented camps (USD 500–1,000 per night) to budget bandas outside the reserve (USD 80–150). All game drives are in open 4WD vehicles with professional Maasai or trained guides.`,
      location: "Masai Mara National Reserve, Narok County",
      country: "Kenya",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=1600&q=80",
      highlights: [
        "Great Migration Mara River crossing — crocodile ambush on 1.5M wildebeest (Jul–Oct)",
        "Lion pride hunting on the Mara Plains — highest lion density in Africa",
        "Cheetah mother with cubs — Mara Naboisho Conservancy",
        "Leopard with impala kill in an acacia tree at sunset",
        "Hot air balloon at dawn — the Mara from 300m at sunrise",
        "Maasai village visit and cultural afternoon with game drive guide",
      ],
      gear: [
        "Neutral/khaki clothing (bright colours disturb wildlife)",
        "Binoculars (10x42 minimum for game viewing)",
        "Long lens camera (300mm minimum for big cat photography)",
        "Malaria prophylaxis (consult doctor — Kenya malaria risk is real)",
        "Yellow fever certificate (required for Kenya entry from endemic countries)",
        "Warm fleece for early morning 6am game drives (10°C in the Mara)",
      ],
      bestMonths: [7, 8, 9, 10],
      estimatedCost: 500000,
      latitude: -1.4826,
      longitude: 35.1438,
      published: true,
      userId: user1.id,
      voteCount: 88,
      tags: {
        connect: [
          { id: allTags["safari"].id },
          { id: allTags["wildlife"].id },
          { id: allTags["photography"].id },
          { id: allTags["bucket-list"].id },
        ],
      },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure100.id },
      { userId: user1.id, adventureId: adventure100.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 101
  const adventure101 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-101" },
    update: {},
    create: {
      id: "seed-adventure-101",
      title: "Chobe Elephant Safari",
      description: `Chobe National Park in northern Botswana hosts the largest concentration of elephants on Earth — up to 120,000 during the dry season. This intimate safari combines game drives along the Chobe River floodplains with sunset boat cruises, putting you within metres of breeding herds as they wade into the water to drink and bathe. Lions, leopards, wild dogs, and vast buffalo herds complete the Big Five experience in one of Africa's most wildlife-dense ecosystems.`,
      location: "Kasane",
      country: "Botswana",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.EASY,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1549366021-119a7d2f7f35?w=1600&q=80",
      highlights: [
        "Elephant herds at Chobe River",
        "Sunset boat cruise",
        "Wild dog sightings",
        "Savuti lion territory",
        "Night game drives",
      ],
      gear: ["Neutral-coloured clothing", "Binoculars", "Telephoto lens", "Insect repellent", "Wide-brimmed hat"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 3200,
      latitude: -17.8,
      longitude: 25.15,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure101.id },
      { userId: user2.id, adventureId: adventure101.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 102
  const adventure102 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-102" },
    update: {},
    create: {
      id: "seed-adventure-102",
      title: "Kruger to Canyon Safari",
      description: `South Africa's greatest safari road trip links Kruger National Park — home to the densest Big Five population in the world — with the dramatic Blyde River Canyon, the third largest canyon on Earth. Travel from open bushveld game drives at dawn to canyon viewpoints at sunset, with stops at panoramic vantage points, ancient Bourke's Luck Potholes, and lush escarpment forests along the Panorama Route. A versatile adventure combining wildlife, geology, and scenery in one sweep.`,
      location: "Kruger National Park",
      country: "South Africa",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.EASY,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80",
      highlights: [
        "Big Five game drives",
        "Blyde River Canyon panoramas",
        "Bourke's Luck Potholes",
        "Leopard Creek border camp",
        "God's Window viewpoint",
      ],
      gear: ["Safari clothing", "Binoculars", "Camera with zoom", "Sunscreen", "Comfortable walking shoes"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 2800,
      latitude: -24.0,
      longitude: 31.5,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure102.id },
      { userId: user2.id, adventureId: adventure102.id },
      { userId: user3.id, adventureId: adventure102.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 103
  const adventure103 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-103" },
    update: {},
    create: {
      id: "seed-adventure-103",
      title: "Borneo Orangutan Rainforest Safari",
      description: `The ancient rainforests of Malaysian Borneo shelter the last wild populations of Bornean orangutans along with pygmy elephants, proboscis monkeys, and clouded leopards. This jungle safari navigates the Kinabatangan River by boat at dawn and dusk, ventures into the Danum Valley old-growth forest on guided night walks, and visits the Sepilok rehabilitation centre where orphaned orangutans learn to return to the wild. One of the most biodiverse regions on the planet.`,
      location: "Sandakan",
      country: "Malaysia",
      continent: "Asia",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=1600&q=80",
      highlights: [
        "Wild orangutan sightings",
        "Kinabatangan River boat safari",
        "Sepilok Orangutan Centre",
        "Pygmy elephant herds",
        "Danum Valley night walk",
      ],
      gear: ["Waterproof clothing", "Rubber boots", "Insect repellent", "Binoculars", "Dry bags for camera"],
      bestMonths: [3, 4, 5, 6, 7, 8],
      estimatedCost: 2600,
      latitude: 5.84,
      longitude: 118.12,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["jungle"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure103.id },
      { userId: user2.id, adventureId: adventure103.id },
      { userId: user3.id, adventureId: adventure103.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 104
  const adventure104 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-104" },
    update: {},
    create: {
      id: "seed-adventure-104",
      title: "Sea to Sea Cycle Route (C2C)",
      description: `The Sea to Sea (C2C) is Britain's most popular long-distance cycle route, crossing northern England from the Irish Sea at Whitehaven to the North Sea at Sunderland or Tynemouth in around 220 km. The route climbs through the fells of the Lake District and crosses the wild Pennine moors before descending through former pit villages and industrial heritage to the east coast. A perfect mix of dramatic scenery, cultural history, and achievable challenge — most cyclists complete it in three to five days.`,
      location: "Whitehaven to Sunderland",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1600&q=80",
      highlights: [
        "Lake District fells",
        "Hartside Pass summit",
        "Pennine moorland",
        "Weardale heritage villages",
        "North Sea finish",
      ],
      gear: ["Road or gravel bike", "Panniers", "Waterproof jacket", "Cycling shorts", "Repair kit"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 600,
      latitude: 54.55,
      longitude: -3.59,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure104.id },
      { userId: user2.id, adventureId: adventure104.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 105
  const adventure105 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-105" },
    update: {},
    create: {
      id: "seed-adventure-105",
      title: "Grossglockner and Dolomites Cycling",
      description: `One of the great alpine cycling tours, this route links Austria's highest peak — the Grossglockner — with the pink limestone towers of Italy's Dolomites across some of the most spectacular mountain roads in Europe. Climb the legendary Grossglockner High Alpine Road, descend into the Puster Valley, and tackle the Tre Cime loop before finishing in the shadow of the Marmolada glacier. A tour designed for road cyclists who want to feel small in the presence of vast mountains.`,
      location: "Zell am See",
      country: "Austria",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=1600&q=80",
      highlights: [
        "Grossglockner High Alpine Road",
        "Tre Cime di Lavaredo",
        "Passo Pordoi",
        "Cortina d'Ampezzo",
        "Marmolada glacier views",
      ],
      gear: ["Road bike", "Bib shorts", "Arm/leg warmers", "Wind jacket", "Cycling computer"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1800,
      latitude: 47.3,
      longitude: 12.8,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["mountains"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure105.id },
      { userId: user2.id, adventureId: adventure105.id },
      { userId: user3.id, adventureId: adventure105.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 106
  const adventure106 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-106" },
    update: {},
    create: {
      id: "seed-adventure-106",
      title: "Mekong Delta Cycling",
      description: `The Mekong Delta in southern Vietnam is a labyrinth of rivers, canals, rice paddies, and floating markets that rewards exploration at bicycle pace. This low-key cycling adventure winds through villages where daily life flows on the water — fishermen casting nets at dawn, market boats laden with tropical fruit, children swimming from wooden jetties. The flat terrain makes it accessible to all fitness levels, while the immersive cultural experience and tropical scenery are utterly memorable.`,
      location: "Can Tho",
      country: "Vietnam",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EASY,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: [
        "Cai Rang floating market",
        "Rice paddy paths",
        "Mekong ferry crossings",
        "Local village homestay",
        "Tropical fruit orchards",
      ],
      gear: ["Lightweight bike", "Breathable clothing", "Sunhat", "Water bottles", "Sandals"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 500,
      latitude: 10.03,
      longitude: 105.78,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["culture"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure106.id },
      { userId: user2.id, adventureId: adventure106.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 107
  const adventure107 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-107" },
    update: {},
    create: {
      id: "seed-adventure-107",
      title: "Loire Valley Châteaux Cycle",
      description: `France's longest river winds through a UNESCO World Heritage valley studded with fairy-tale châteaux, Renaissance gardens, and medieval towns. The Loire à Vélo cycling network offers over 900 km of well-signposted, mostly flat routes connecting iconic châteaux such as Chambord, Chenonceau, and Villandry. Between castles, stop in vineyards producing Muscadet, Sancerre, and Vouvray, and overnight in converted manors and charming gîtes. The perfect blend of culture, cuisine, and gentle cycling.`,
      location: "Saumur",
      country: "France",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1467803738586-46b7eb7b16a1?w=1600&q=80",
      highlights: [
        "Château de Chambord",
        "Château de Chenonceau",
        "Loire wine tasting",
        "Villandry Renaissance gardens",
        "Troglodyte cave villages",
      ],
      gear: ["Touring bike", "Pannier bags", "Helmet", "French phrasebook", "Wine carrier"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 900,
      latitude: 47.26,
      longitude: 0.08,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["culture"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure107.id },
      { userId: user2.id, adventureId: adventure107.id },
      { userId: user3.id, adventureId: adventure107.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 108
  const adventure108 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-108" },
    update: {},
    create: {
      id: "seed-adventure-108",
      title: "Alps 2 Ocean Cycle Trail",
      description: `New Zealand's Alps 2 Ocean trail is a 301 km journey from the foot of Aoraki/Mount Cook — the country's highest peak — down through the Mackenzie Basin, past turquoise glacial lakes, and along braided rivers to the Pacific Ocean at Oamaru. The trail passes through high-country sheep stations, along old hydro canals, and through the Waitaki Valley wine country before descending to the Victorian port town famous for its little blue penguins. A scenic, mostly off-road ride through the heart of the South Island.`,
      location: "Aoraki/Mount Cook",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: [
        "Aoraki/Mount Cook views",
        "Lake Tekapo turquoise waters",
        "Mackenzie Basin high country",
        "Waitaki Valley vineyards",
        "Oamaru blue penguin colony",
      ],
      gear: ["Mountain bike", "Cycling gloves", "Merino base layer", "Sunscreen", "Panniers"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 1100,
      latitude: -43.74,
      longitude: 170.1,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure108.id },
      { userId: user3.id, adventureId: adventure108.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 109
  const adventure109 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-109" },
    update: {},
    create: {
      id: "seed-adventure-109",
      title: "Tierra del Fuego Circuit",
      description: `At the very tip of South America, Tierra del Fuego is a wind-scoured archipelago of glaciers, peat bogs, beech forests, and fjords shared between Chile and Argentina. This expedition circuit treks the remote Dientes de Navarino — the world's southernmost trail — crosses the Beagle Channel, and explores the end-of-the-world town of Ushuaia before venturing into the Patagonian backcountry. Harsh, isolated, and profoundly beautiful — a wilderness that truly feels like the edge of the Earth.`,
      location: "Ushuaia",
      country: "Argentina",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: [
        "Dientes de Navarino circuit",
        "Beagle Channel crossing",
        "Lapataia Bay",
        "Glacier Martial",
        "Magellanic penguin colonies",
      ],
      gear: ["4-season tent", "Down sleeping bag", "Gaiters", "Trekking poles", "Full waterproofs"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 3500,
      latitude: -54.8,
      longitude: -68.3,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["mountains"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure109.id },
      { userId: user2.id, adventureId: adventure109.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 110
  const adventure110 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-110" },
    update: {},
    create: {
      id: "seed-adventure-110",
      title: "Congo River Canoe Journey",
      description: `The Congo River is the world's second largest by water volume and the deepest river on Earth. This remarkable expedition paddles a section of the lower Congo through dense equatorial rainforest, stopping at riverside villages accessible only by water, watching forest elephants at salt licks, and camping under skies undimmed by light pollution. The region is raw, remote, and utterly unlike anywhere else — a journey into one of the last true wilderness frontiers on the planet.`,
      location: "Kinshasa",
      country: "Democratic Republic of the Congo",
      continent: "Africa",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1600&q=80",
      highlights: [
        "Dense equatorial rainforest",
        "Riverside village encounters",
        "Forest elephants",
        "Night sky camping",
        "Congo River rapids",
      ],
      gear: ["Expedition kayak or canoe", "Dry bags", "Water purification", "Malaria prophylaxis", "Satellite communicator"],
      bestMonths: [6, 7, 8],
      estimatedCost: 4500,
      latitude: -4.3,
      longitude: 15.3,
      published: true,
      userId: user1.id,
      voteCount: 1,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["jungle"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, adventureId: adventure110.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 111
  const adventure111 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-111" },
    update: {},
    create: {
      id: "seed-adventure-111",
      title: "North Pole Last Degree Ski Expedition",
      description: `The ultimate polar achievement: skiing the last degree of latitude to the Geographic North Pole, crossing 111 km of drifting Arctic Ocean sea ice. Hauling a pulk sled loaded with all food and equipment, teams navigate pressure ridges, open leads of freezing water, and unpredictable weather in temperatures as low as -40°C. The reward is standing at the very top of the world, surrounded by nothing but ice in every direction. One of the most exclusive adventures on Earth, attempted by only a handful of teams each season.`,
      location: "89°N Arctic Ocean",
      country: "International Waters",
      continent: "Arctic",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1551415923-a2297c7fda79?w=1600&q=80",
      highlights: [
        "Geographic North Pole arrival",
        "Sea ice pressure ridges",
        "Polar bear encounters",
        "Midnight sun navigation",
        "Arctic Ocean crossing",
      ],
      gear: ["Polar skis and pulk", "Expedition down suit", "-40°C sleeping bag", "GPS beacon", "Polar rations"],
      bestMonths: [4, 5],
      estimatedCost: 25000,
      latitude: 89.0,
      longitude: 0.0,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["arctic"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure111.id },
      { userId: user2.id, adventureId: adventure111.id },
      { userId: user3.id, adventureId: adventure111.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 112
  const adventure112 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-112" },
    update: {},
    create: {
      id: "seed-adventure-112",
      title: "Makalu Base Camp Trek",
      description: `Makalu, the world's fifth-highest peak at 8,485 m, sits in a seldom-visited corner of eastern Nepal, offering one of the most pristine and challenging trek approaches in the Himalaya. The trail climbs through subtropical forest, rhododendron groves, and high-alpine meadows carpeted with gentians to reach Base Camp at 5,700 m — with jaw-dropping views of Makalu's pyramidal summit and the Barun Glacier. Far fewer trekkers than the Everest or Annapurna circuits means genuine wilderness and authentic encounters with Sherpa communities.`,
      location: "Tumlingtar",
      country: "Nepal",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 20,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: [
        "Makalu Base Camp at 5700 m",
        "Barun Glacier",
        "Pristine Makalu-Barun National Park",
        "Rhododendron forest",
        "Remote Sherpa villages",
      ],
      gear: ["High-altitude down jacket", "Crampons", "Ice axe", "Expedition tent", "Acclimatisation medication"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 4200,
      latitude: 27.89,
      longitude: 87.09,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["mountains"].id }, { id: allTags["trekking"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure112.id },
      { userId: user3.id, adventureId: adventure112.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 113
  const adventure113 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-113" },
    update: {},
    create: {
      id: "seed-adventure-113",
      title: "Morocco Atlas to Sahara Multi-Sport",
      description: `Morocco in miniature: this multi-sport adventure crosses the full sweep of the country's landscapes in a single journey, from the snow-dusted peaks of the High Atlas to the orange dunes of the Sahara. Trek to a Berber village above the snowline, mountain bike across hammada stone desert, ride a camel to a Saharan camp for a night under the stars, then 4x4 through dramatic gorges back to the imperial city of Marrakech. A sensory overload of colour, culture, and adventure packed into a single tour.`,
      location: "Marrakech",
      country: "Morocco",
      continent: "Africa",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1600&q=80",
      highlights: [
        "High Atlas Berber village trek",
        "Sahara dune camp",
        "Camel ride at sunset",
        "Todra Gorge 4x4",
        "Marrakech medina",
      ],
      gear: ["Trekking boots", "Mountain bike helmet", "Desert scarf", "Sleeping bag liner", "Sunscreen"],
      bestMonths: [3, 4, 10, 11],
      estimatedCost: 1800,
      latitude: 31.63,
      longitude: -7.99,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["culture"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure113.id },
      { userId: user2.id, adventureId: adventure113.id },
      { userId: user3.id, adventureId: adventure113.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 114
  const adventure114 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-114" },
    update: {},
    create: {
      id: "seed-adventure-114",
      title: "New Zealand South Island Grand Traverse",
      description: `New Zealand's South Island packs extraordinary diversity into a relatively small area — volcanic geothermal fields, ancient glaciers, fiords, golden beaches, and the Southern Alps all within a day's travel of each other. This grand traverse combines kayaking Milford Sound, hiking the Routeburn Track, mountain biking the Old Ghost Road, and surfing at Raglan in a single end-to-end adventure that showcases the full range of terrain on offer. The ultimate multi-sport sampler of the world's adventure capital.`,
      location: "Queenstown",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1469521669194-babb45599def?w=1600&q=80",
      highlights: [
        "Milford Sound kayaking",
        "Routeburn Track",
        "Old Ghost Road mountain bike",
        "Bungee jump at Kawarau",
        "Abel Tasman sea kayaking",
      ],
      gear: ["Kayak paddle jacket", "Mountain bike", "Hiking poles", "Wetsuit", "Merino wool layers"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 3800,
      latitude: -45.03,
      longitude: 168.66,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure114.id },
      { userId: user2.id, adventureId: adventure114.id },
      { userId: user3.id, adventureId: adventure114.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 115
  const adventure115 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-115" },
    update: {},
    create: {
      id: "seed-adventure-115",
      title: "Kenya Highlands Horseback and Trek",
      description: `The Kenyan Highlands offer a rarely visited side of East Africa — green volcanic hills, tea plantations, Maasai community lands, and the dramatic Aberdare Range — best explored on horseback at dawn and on foot through the forest at dusk. Ride across the Laikipia Plateau, visit a Maasai manyatta, track wildlife on guided bush walks, and spend nights at colonial-era farm lodges overlooking the Great Rift Valley. A unique fusion of equestrian adventure and cultural immersion far from the standard safari circuit.`,
      location: "Nanyuki",
      country: "Kenya",
      continent: "Africa",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1600&q=80",
      highlights: [
        "Horseback across Laikipia Plateau",
        "Maasai village visit",
        "Aberdare forest walk",
        "Rift Valley sunset views",
        "Mount Kenya foothills",
      ],
      gear: ["Riding boots and helmet", "Trekking boots", "Light merino layers", "Sun protection", "Binoculars"],
      bestMonths: [1, 2, 6, 7, 8, 9, 10],
      estimatedCost: 3200,
      latitude: 0.01,
      longitude: 37.07,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["culture"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure115.id },
      { userId: user2.id, adventureId: adventure115.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 116
  const adventure116 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-116" },
    update: {},
    create: {
      id: "seed-adventure-116",
      title: "Canadian Rockies Adventure Week",
      description: `The Canadian Rockies around Banff and Jasper are a playground of turquoise glacial lakes, soaring limestone peaks, and abundant wildlife — best experienced through multiple disciplines. This action-packed week combines white-water rafting on the Kicking Horse River, via ferrata climbing above Lake Louise, mountain biking the Bow Valley trails, and a multi-day backcountry hike through Yoho National Park, ending at the emerald waters of Lake O'Hara. Canada's outdoor crown jewel, compressed into one unforgettable week.`,
      location: "Banff",
      country: "Canada",
      continent: "North America",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=1600&q=80",
      highlights: [
        "Kicking Horse white-water rafting",
        "Via ferrata above Lake Louise",
        "Yoho backcountry hike",
        "Lake O'Hara",
        "Icefields Parkway drive",
      ],
      gear: ["Climbing harness", "Helmet", "Mountain bike", "Dry suit liner", "Bear spray"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2500,
      latitude: 51.18,
      longitude: -115.57,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure116.id },
      { userId: user2.id, adventureId: adventure116.id },
      { userId: user3.id, adventureId: adventure116.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 117
  const adventure117 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-117" },
    update: {},
    create: {
      id: "seed-adventure-117",
      title: "Kumano Kodo Pilgrimage",
      description: `The Kumano Kodo is a network of ancient pilgrimage routes through the Kii Peninsula in southern Japan, one of only two UNESCO World Heritage trail systems in the world (the other being the Camino de Santiago). The paths wind through sacred cedar forests, past moss-covered stone lanterns, and between three Grand Shrines of Kumano, where Japanese emperors have walked for over a millennium. Overnight in traditional minshuku guesthouses, bathe in forest onsen, and absorb the deep spiritual atmosphere of this mountain pilgrimage.`,
      location: "Tanabe",
      country: "Japan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: [
        "Nakahechi main route",
        "Three Grand Shrines of Kumano",
        "Sacred cedar forests",
        "Traditional minshuku stays",
        "Forest onsen baths",
      ],
      gear: ["Waterproof hiking boots", "Trekking poles", "Rain jacket", "Pilgrim staff (kongō-tsue)", "Small backpack"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 1800,
      latitude: 33.73,
      longitude: 135.37,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["culture"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure117.id },
      { userId: user2.id, adventureId: adventure117.id },
      { userId: user3.id, adventureId: adventure117.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 118
  const adventure118 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-118" },
    update: {},
    create: {
      id: "seed-adventure-118",
      title: "Drakensberg Grand Traverse",
      description: `The Drakensberg Grand Traverse is South Africa's ultimate trekking challenge — a 220 km high-route along the rooftop of the Drakensberg escarpment, largely above 3,000 m, crossing from Cathedral Peak to Bushman's Nek in around 14 days. The route traverses a UNESCO World Heritage Site of outstanding beauty, passing Bushman rock art galleries, soaring basalt pinnacles, deep valleys carved by waterfalls, and rolling highland meadows filled with proteas and crane lilies. A demanding and remote wild camp experience through one of Africa's most spectacular mountain ranges.`,
      location: "Cathedral Peak",
      country: "South Africa",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80",
      highlights: [
        "Amphitheatre and Tugela Falls",
        "Bushman rock art galleries",
        "Rhino Peak summit",
        "High-altitude meadows",
        "Wilderness wild camping",
      ],
      gear: ["4-season tent", "30°C sleeping bag", "Trekking poles", "Navigation compass", "Water filter"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 2200,
      latitude: -28.93,
      longitude: 29.23,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure118.id },
      { userId: user2.id, adventureId: adventure118.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 119
  const adventure119 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-119" },
    update: {},
    create: {
      id: "seed-adventure-119",
      title: "GR10 Pyrenees Traverse",
      description: `The GR10 is France's great Pyrenean high route, traversing the entire mountain range from the Atlantic at Hendaye to the Mediterranean at Banyuls-sur-Mer along 866 km of mountain trail. The route stays on the French side of the border, passing through Basque country, the Hautes-Pyrénées, and Catalan foothills, with dramatic ascents over glacially sculpted cols and descents into villages famous for their cassoulet and Armagnac. Most trekkers complete the full traverse in six to eight weeks, though the route can be tackled in stages across multiple seasons.`,
      location: "Hendaye",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 50,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: [
        "Lac de Gaube and Vignemale",
        "Cirque de Gavarnie",
        "Basque country villages",
        "Bagnères-de-Luchon thermal baths",
        "Mediterranean finish at Banyuls",
      ],
      gear: ["Lightweight tent", "Trekking poles", "Waterproof boots", "Gaiters", "French IGN maps"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 3500,
      latitude: 43.37,
      longitude: -1.78,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure119.id },
      { userId: user2.id, adventureId: adventure119.id },
      { userId: user3.id, adventureId: adventure119.id },
    ],
    skipDuplicates: true,
  });

  // Adventure 120
  const adventure120 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-120" },
    update: {},
    create: {
      id: "seed-adventure-120",
      title: "Kungsleden Arctic Trail",
      description: `The Kungsleden (King's Trail) runs 440 km through the heart of Swedish Lapland from Abisko in the north to Hemavan in the south, passing through four national parks including the remote Sarek — arguably Sweden's wildest wilderness. Above the Arctic Circle, the trail crosses open fells, birch forests, and glaciated mountain terrain in a landscape shaped by reindeer herding Sámi people for millennia. STF mountain stations and huts are spaced at intervals, making this one of the world's best-supported long-distance treks, accessible in summer or on cross-country skis in winter.`,
      location: "Abisko",
      country: "Sweden",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 22,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: [
        "Sarek National Park wilderness",
        "Kebnekaise — Sweden's highest peak",
        "Northern lights (autumn)",
        "Midnight sun (summer)",
        "Sámi cultural encounters",
      ],
      gear: ["Trekking poles", "Waterproof jacket and trousers", "Midges head net", "Camp stove", "Bear canister"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2000,
      latitude: 68.35,
      longitude: 18.83,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, adventureId: adventure120.id },
      { userId: user2.id, adventureId: adventure120.id },
      { userId: user3.id, adventureId: adventure120.id },
    ],
    skipDuplicates: true,
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


  // Adventure 121
  const adventure121 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-121" },
    update: {},
    create: {
      id: "seed-adventure-121",
      title: "Laugavegur Trail",
      description: `Iceland's most celebrated multi-day trek links the geothermal highlands of Landmannalaugar with the lush valley of Þórsmörk across 55 km of raw volcanic terrain. The route crosses obsidian lava fields still steaming from geothermal vents, traverses snowfields year-round, descends into vivid rhyolite mountains streaked in rust, ochre, and lime green, and fords glacial rivers that run milky with glacial silt. Huts bookable via Ferðafélag Íslands — reserve six months ahead for July.`,
      location: "Landmannalaugar",
      country: "Iceland",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Rhyolite mountains", "Geothermal hot springs", "Glacial river crossings", "Þórsmörk forest", "Midnight twilight"],
      gear: ["Waterproof boots", "Trekking poles", "Warm layers", "River sandals", "Hut sleeping bag liner"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1200,
      latitude: 63.98,
      longitude: -19.05,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["volcanic"].id }, { id: allTags["glacier"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure121.id }, { userId: user2.id, adventureId: adventure121.id }, { userId: user3.id, adventureId: adventure121.id }], skipDuplicates: true });


  // Adventure 122
  const adventure122 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-122" },
    update: {},
    create: {
      id: "seed-adventure-122",
      title: "Milford Track",
      description: `Dubbed the finest walk in the world since 1908, the Milford Track threads 54 km through Fiordland National Park from the head of Lake Te Anau to the world-famous Milford Sound. The route passes through ancient rainforest, crosses the MacKinnon Pass at 1,154 m, and descends to the Sutherland Falls — New Zealand's tallest at 580 m. Rain is constant and glorious; pack accordingly and embrace the moss.`,
      location: "Fiordland",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["MacKinnon Pass views", "Sutherland Falls", "Milford Sound arrival", "Ancient rainforest", "Glow-worm caves"],
      gear: ["Waterproof everything", "Gaiters", "Hut footwear", "Insect repellent", "Dry bags"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 1800,
      latitude: -44.98,
      longitude: 167.93,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["new-zealand"].id }, { id: allTags["hiking"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure122.id }, { userId: user2.id, adventureId: adventure122.id }, { userId: user3.id, adventureId: adventure122.id }], skipDuplicates: true });


  // Adventure 123
  const adventure123 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-123" },
    update: {},
    create: {
      id: "seed-adventure-123",
      title: "Mont Blanc Tour",
      description: `The Tour du Mont Blanc circumnavigates the highest peak in the Alps over 170 km and 10,000 m of ascent, crossing through France, Italy, and Switzerland in 11 days. The route connects alpine villages, rifugios, and dramatic cols, with the Aiguille du Midi cable car offering an optional close-up of the massif's serac-draped north face. Start in Chamonix, finish with cold beer on the same terrace.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 11,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Three-country traverse", "Col du Bonhomme", "Rifugio Bonatti", "Champex sunset", "Chamonix finish"],
      gear: ["Trail runners or boots", "Trekking poles", "Lightweight shelter", "Sun protection", "French phrasebook"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2200,
      latitude: 45.92,
      longitude: 6.87,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure123.id }, { userId: user2.id, adventureId: adventure123.id }, { userId: user3.id, adventureId: adventure123.id }], skipDuplicates: true });


  // Adventure 124
  const adventure124 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-124" },
    update: {},
    create: {
      id: "seed-adventure-124",
      title: "Everest Base Camp Trek",
      description: `The pilgrimage to Everest Base Camp at 5,364 m follows the Dudh Kosi valley through Sherpa villages, Buddhist monasteries, and rhododendron forests before ascending to the Khumbu Glacier and the crowded, electric base camp itself. The real prize is Kala Patthar — the 5,545 m viewpoint where the full south face of Everest fills the frame. Acclimatise carefully; altitude sickness ends more trips than any other factor.`,
      location: "Khumbu",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=1600&q=80",
      highlights: ["Kala Patthar sunrise", "Namche Bazaar rest day", "Thyangboche monastery", "Khumbu Glacier", "Everest south face"],
      gear: ["Layering system", "Sleeping bag -20°C", "Altitude medication", "Trekking poles", "Down jacket"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 2500,
      latitude: 27.99,
      longitude: 86.92,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["8000m"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure124.id }, { userId: user2.id, adventureId: adventure124.id }, { userId: user3.id, adventureId: adventure124.id }], skipDuplicates: true });


  // Adventure 125
  const adventure125 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-125" },
    update: {},
    create: {
      id: "seed-adventure-125",
      title: "Camino Primitivo",
      description: `The oldest and most rugged of the Camino de Santiago routes, the Primitivo runs 320 km from Oviedo across the Cantabrian Mountains to Santiago de Compostela. It was walked by King Alfonso II in the 9th century and remains the most challenging of the main caminos, with sustained climbs, muddy forest paths, and far fewer pilgrims than the French Way. Rain is near-certain; the solitude is the reward.`,
      location: "Oviedo",
      country: "Spain",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80",
      highlights: ["Asturian mountain passes", "O Cádavo viewpoint", "Fonsagrada medieval village", "Lugo Roman walls", "Cathedral de Santiago"],
      gear: ["Broken-in boots", "Trekking poles", "Rain cover", "Blister kit", "Pilgrim credential"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 1400,
      latitude: 43.36,
      longitude: -5.84,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["camino"].id }, { id: allTags["trekking"].id }, { id: allTags["europe"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure125.id }, { userId: user2.id, adventureId: adventure125.id }], skipDuplicates: true });


  // Adventure 126
  const adventure126 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-126" },
    update: {},
    create: {
      id: "seed-adventure-126",
      title: "Haute Route Chamonix to Zermatt",
      description: `The Walker's Haute Route covers 180 km and 12,000 m of ascent between two of the Alps' most iconic towns, staying high on the ridgelines between the Swiss and French Alps. The route passes through the Val d'Hérens, crosses the Col de Torrent, and descends to Zermatt with the Matterhorn pyramid filling the final day's horizon. This is a serious mountain trail — navigation skills required.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: ["Fenêtre d'Arpette", "Col de Torrent", "Zermatt Matterhorn arrival", "Arolla glacier", "Alpine hut dinners"],
      gear: ["Alpine boots", "Ice axe (early season)", "Navigation tools", "Emergency bivouac", "Trekking poles"],
      bestMonths: [7, 8, 9],
      estimatedCost: 2800,
      latitude: 45.92,
      longitude: 6.87,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["alpine"].id }, { id: allTags["glacier"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure126.id }, { userId: user2.id, adventureId: adventure126.id }, { userId: user3.id, adventureId: adventure126.id }], skipDuplicates: true });


  // Adventure 127
  const adventure127 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-127" },
    update: {},
    create: {
      id: "seed-adventure-127",
      title: "Annapurna Circuit",
      description: `The Annapurna Circuit is Nepal's great loop trek — 160–230 km depending on route variants — circling the Annapurna massif and crossing the Thorong La pass at 5,416 m. The diversity is the draw: subtropical jungle at 800 m gives way to Tibetan plateau landscapes at 4,000 m, passing the sacred Muktinath temple and the dramatic Kali Gandaki Gorge, the world's deepest. The tea-house network is excellent; the scenery is without parallel.`,
      location: "Besisahar",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Thorong La pass", "Kali Gandaki Gorge", "Muktinath temple", "Poon Hill sunrise", "Manang plateau"],
      gear: ["Down jacket", "Altitude medication", "Sleeping bag liner", "Trekking poles", "Gaiters"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 1800,
      latitude: 28.39,
      longitude: 84.37,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["bucket-list"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure127.id }, { userId: user2.id, adventureId: adventure127.id }, { userId: user3.id, adventureId: adventure127.id }], skipDuplicates: true });


  // Adventure 128
  const adventure128 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-128" },
    update: {},
    create: {
      id: "seed-adventure-128",
      title: "Great Ocean Walk",
      description: `The Great Ocean Walk runs 104 km along Victoria's rugged southern coastline from Apollo Bay to the Twelve Apostles, with the option to finish at Johanna Beach. The trail traverses cliff-tops with Southern Ocean surf thundering below, descends to isolated beaches accessible only on foot, and passes through coastal heathland and temperate rainforest. Koalas are common in the tall gum trees; southern right whales are visible from the headlands in winter.`,
      location: "Apollo Bay",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Twelve Apostles", "Aire River crossing", "Princetown wetlands", "Koala spotting", "Sunset from Cape Otway"],
      gear: ["Hiking boots", "Tent and sleeping system", "Water filter", "Bear canister equivalent", "Sun protection"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 900,
      latitude: -38.75,
      longitude: 143.67,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["coastal"].id }, { id: allTags["australia"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure128.id }, { userId: user2.id, adventureId: adventure128.id }], skipDuplicates: true });


  // Adventure 129
  const adventure129 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-129" },
    update: {},
    create: {
      id: "seed-adventure-129",
      title: "Corsica GR20",
      description: `The GR20 is Europe's toughest long-distance trail — 180 km across the mountainous spine of Corsica from Calenzana in the north to Conca in the south, with 13,000 m of total ascent. The northern section in particular involves serious scrambling, fixed chains, and boulder fields that have humbled many experienced hikers. The reward is the most dramatic mountain scenery in the Mediterranean, with granite peaks, glacial lakes, and the scent of the maquis.`,
      location: "Calenzana",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 15,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Monte Cinto ridge", "Lac de Nino", "Brèche de Capitellu", "Bavella Needles", "Conca village finish"],
      gear: ["Trail running shoes or approach shoes", "Trekking poles", "Via ferrata gloves", "Lightweight tent", "Emergency bivouac"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1600,
      latitude: 42.5,
      longitude: 8.88,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["scrambling"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure129.id }, { userId: user2.id, adventureId: adventure129.id }, { userId: user3.id, adventureId: adventure129.id }], skipDuplicates: true });


  // Adventure 130
  const adventure130 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-130" },
    update: {},
    create: {
      id: "seed-adventure-130",
      title: "John Muir Trail",
      description: `The John Muir Trail runs 340 km from Yosemite Valley to the summit of Mount Whitney, the highest point in the contiguous United States at 4,421 m. The route passes through the High Sierra — granite domes, sapphire lakes, and meadows carpeted with wildflowers — crossing 10 passes above 3,350 m. Bear canisters are required. Permits are a lottery nightmare; apply in February for summer travel.`,
      location: "Yosemite Valley",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Half Dome permit", "Evolution Basin", "Muir Pass", "Whitney summit", "Guitar Lake campsite"],
      gear: ["Bear canister", "Water filter", "Microspikes (early season)", "Trekking poles", "Lightweight tent"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1500,
      latitude: 37.74,
      longitude: -119.57,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["thru-hike"].id }, { id: allTags["high-altitude"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure130.id }, { userId: user2.id, adventureId: adventure130.id }, { userId: user3.id, adventureId: adventure130.id }], skipDuplicates: true });


  // Adventure 131
  const adventure131 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-131" },
    update: {},
    create: {
      id: "seed-adventure-131",
      title: "Dolomites Alta Via 1",
      description: `The Alta Via 1 traverses the Dolomites from Lago di Braies to Belluno over 120 km, crossing the dramatic Fanes and Puez plateaus, the Civetta wall, and the Zoldo valley. The Dolomites are UNESCO World Heritage and the pale rock towers glow orange-pink at sunrise in a spectacle called enrosadira. Mountain refugios serve polenta and Aperol spritz at altitude.`,
      location: "Lago di Braies",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1600&q=80",
      highlights: ["Lago di Braies", "Fanes plateau", "Civetta east face", "Enrosadira alpenglow", "Rifugio dinners"],
      gear: ["Sturdy hiking boots", "Trekking poles", "Refugio sleeping sheet", "Sun protection", "Light layers"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1800,
      latitude: 46.69,
      longitude: 12.08,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure131.id }, { userId: user2.id, adventureId: adventure131.id }, { userId: user3.id, adventureId: adventure131.id }], skipDuplicates: true });


  // Adventure 132
  const adventure132 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-132" },
    update: {},
    create: {
      id: "seed-adventure-132",
      title: "Drakensberg Grand Traverse",
      description: `The Drakensberg Grand Traverse is a 220 km route along the summit plateau and escarpment of the uKhahlamba Drakensberg in South Africa, from Sentinel Peak to Cathedral Peak. The route stays mostly above 3,000 m on the Lesotho border, with the basalt escarpment dropping 1,000 m sheer to the KwaZulu-Natal foothills. San rock art shelters dot the lower valleys. Navigation in mist is difficult; this is for experienced mountain travellers.`,
      location: "Sentinel Peak",
      country: "South Africa",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Amphitheatre escarpment", "Tugela Falls", "San rock art", "Lesotho plateau", "Cathedral Peak finale"],
      gear: ["Navigation equipment", "Cold weather gear", "Shelter for all conditions", "Water filter", "Emergency beacon"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 1200,
      latitude: -28.74,
      longitude: 28.89,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure132.id }, { userId: user2.id, adventureId: adventure132.id }], skipDuplicates: true });


  // Adventure 133
  const adventure133 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-133" },
    update: {},
    create: {
      id: "seed-adventure-133",
      title: "West Highland Way",
      description: `Scotland's first and most famous long-distance path runs 154 km from Milngavie on the outskirts of Glasgow to Fort William beneath Ben Nevis. The route passes Loch Lomond's wooded eastern shore, crosses the bleak Rannoch Moor, descends through the glens of Glencoe, and finishes in the shadow of Britain's highest mountain. Midges from June to August are genuinely terrible. The Ceilidh at the end makes up for everything.`,
      location: "Milngavie",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Loch Lomond shore path", "Rannoch Moor crossing", "Glencoe valley", "Devil's Staircase", "Ben Nevis backdrop"],
      gear: ["Waterproof jacket and trousers", "Midges head net", "Hiking boots", "Trekking poles", "Pub map"],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 1100,
      latitude: 55.94,
      longitude: -4.33,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["scotland"].id }, { id: allTags["europe"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure133.id }, { userId: user2.id, adventureId: adventure133.id }], skipDuplicates: true });


  // Adventure 134
  const adventure134 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-134" },
    update: {},
    create: {
      id: "seed-adventure-134",
      title: "Appalachian Trail Thru-Hike",
      description: `The Appalachian Trail stretches 3,540 km from Springer Mountain in Georgia to Mount Katahdin in Maine, traversing 14 states and taking 5–7 months to complete. It is the world's most hiked long-distance trail, with a culture entirely its own — trail names, trail magic, and the peculiar mathematics of daily mileage obsession. About 1 in 4 thru-hikers who start in Georgia make it to Katahdin. The rest still have a story.`,
      location: "Springer Mountain",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 160,
      coverImageUrl: "https://images.unsplash.com/photo-1489659639091-8b687bc4386e?w=1600&q=80",
      highlights: ["Katahdin summit finale", "Shenandoah National Park", "White Mountains", "Trail magic culture", "14-state traverse"],
      gear: ["Ultralight shelter", "Water filter", "Trekking poles", "Zero-drop trail runners", "Resupply strategy"],
      bestMonths: [3, 4],
      estimatedCost: 8000,
      latitude: 34.63,
      longitude: -84.19,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["thru-hike"].id }, { id: allTags["trekking"].id }, { id: allTags["bucket-list"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure134.id }, { userId: user2.id, adventureId: adventure134.id }, { userId: user3.id, adventureId: adventure134.id }], skipDuplicates: true });


  // Adventure 135
  const adventure135 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-135" },
    update: {},
    create: {
      id: "seed-adventure-135",
      title: "Mont Blanc Summit via Normal Route",
      description: `The ascent of Mont Blanc via the Voie Normale from Les Houches to the summit at 4,808 m is the most-attempted serious alpine objective in the world — and it kills more climbers than any other peak in the Alps. The route is not technical but the altitude, objective hazard from seracs on the Bosses Ridge, and rapidly changing weather make this a genuine mountaineering undertaking. Acclimatise on the Aiguilles before attempting.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXTREME,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["4,808m summit", "Goûter Hut stay", "Grand Couloir crossing", "Bosses Ridge sunrise", "Chamonix descent view"],
      gear: ["Crampons", "Ice axe", "Harness and rope", "High-altitude boots", "Down suit"],
      bestMonths: [6, 7, 8],
      estimatedCost: 3500,
      latitude: 45.83,
      longitude: 6.86,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["alpine"].id }, { id: allTags["bucket-list"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure135.id }, { userId: user2.id, adventureId: adventure135.id }, { userId: user3.id, adventureId: adventure135.id }], skipDuplicates: true });


  // Adventure 136
  const adventure136 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-136" },
    update: {},
    create: {
      id: "seed-adventure-136",
      title: "Matterhorn North Face",
      description: `The Matterhorn (4,478 m) is the most recognisable mountain silhouette on earth and the Hörnli Ridge — its northeast arête — is the standard route. The climb involves 1,200 m of mixed rock and ice with considerable route-finding challenge and objective rockfall hazard, particularly above the Hörnli Hut. A private guide is strongly recommended for all but the most experienced alpinists. The summit view west into Italy and east to the Swiss Alps is unforgettable.`,
      location: "Zermatt",
      country: "Switzerland",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXTREME,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: ["4,478m Matterhorn summit", "Hörnli Hut bivouac", "Italian border summit cross", "Zermatt car-free village", "Gorner Glacier approach"],
      gear: ["Alpine boots", "Crampons", "Ice axe", "Harness and 60m rope", "Helmet"],
      bestMonths: [7, 8, 9],
      estimatedCost: 4500,
      latitude: 45.97,
      longitude: 7.66,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["alpine"].id }, { id: allTags["bucket-list"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure136.id }, { userId: user2.id, adventureId: adventure136.id }, { userId: user3.id, adventureId: adventure136.id }], skipDuplicates: true });


  // Adventure 137
  const adventure137 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-137" },
    update: {},
    create: {
      id: "seed-adventure-137",
      title: "Denali West Buttress",
      description: `Denali (6,190 m) is North America's highest peak and the West Buttress route is its standard line, taking climbers from the Kahiltna Glacier base camp through fixed camps at 4,335 m and 5,240 m to the summit ridge. The mountain is fully self-supported — teams haul sleds with food and fuel for 3 weeks. Cold reaches -50°C with windchill. The Alaska Range landscape is among the most otherworldly on the planet.`,
      location: "Talkeetna",
      country: "United States",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: ["6,190m summit", "Kahiltna Glacier ski-in", "14,200ft camp ice wall", "Alaska Range panorama", "NPS ranger station"],
      gear: ["Expedition sleeping bag -40°C", "Double boots", "Sled", "Wands", "High camp stove"],
      bestMonths: [5, 6],
      estimatedCost: 9000,
      latitude: 63.07,
      longitude: -151,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["mountaineering"].id }, { id: allTags["8000m"].id }, { id: allTags["remote"].id }, { id: allTags["arctic"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure137.id }, { userId: user2.id, adventureId: adventure137.id }], skipDuplicates: true });


  // Adventure 138
  const adventure138 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-138" },
    update: {},
    create: {
      id: "seed-adventure-138",
      title: "Inca Trail to Machu Picchu",
      description: `The classic 4-day Inca Trail covers 43 km from the Urubamba Valley to the Sun Gate above Machu Picchu, crossing three high passes including Dead Woman's Pass at 4,215 m. The route passes Inca ruins, cloud forest, and alpine tundra before the theatrical reveal of the citadel from the Inti Punku — the Sun Gate — at dawn. Permits are strictly capped at 500 per day; book six months in advance or lose your place.`,
      location: "Cusco",
      country: "Peru",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80",
      highlights: ["Machu Picchu Sun Gate arrival", "Dead Woman's Pass", "Inca ruins en route", "Cloud forest", "Llamas at sunrise"],
      gear: ["Layering system", "Altitude medication", "Trekking poles", "Rain cover", "Altitude snacks"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 2200,
      latitude: -13.16,
      longitude: -72.55,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["bucket-list"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure138.id }, { userId: user2.id, adventureId: adventure138.id }, { userId: user3.id, adventureId: adventure138.id }], skipDuplicates: true });


  // Adventure 139
  const adventure139 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-139" },
    update: {},
    create: {
      id: "seed-adventure-139",
      title: "Patagonia Ice Cap Traverse",
      description: `The Northern Patagonian Ice Cap traverse is one of the last great blank spots in alpine adventure — a 100 km ski traverse across the second largest ice cap outside the poles, with no roads, no huts, and no rescue infrastructure. Teams fly in by ski-equipped plane to the Monte San Valentín area and navigate crevassed plateau ice to reach Cochrane. Full expedition planning required; weather windows are brief and infrequent.`,
      location: "Cochrane",
      country: "Chile",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 25,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Northern Ice Cap crossing", "Monte San Valentín approach", "Crevassed glacier navigation", "Remote Patagonian fjords", "True wilderness"],
      gear: ["Ski touring kit", "Crevasse rescue equipment", "Expedition tent", "Pulk sled", "Satellite communicator"],
      bestMonths: [11, 12, 1],
      estimatedCost: 12000,
      latitude: -47.3,
      longitude: -73,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["glacier"].id }, { id: allTags["remote"].id }, { id: allTags["skiing"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure139.id }, { userId: user2.id, adventureId: adventure139.id }], skipDuplicates: true });


  // Adventure 140
  const adventure140 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-140" },
    update: {},
    create: {
      id: "seed-adventure-140",
      title: "Transylvanian Highlands Cycling",
      description: `A 500 km cycle tour through Transylvania's fortified Saxon villages, bear-patrolled forests, and Carpathian mountain passes — from Brasov to Cluj-Napoca via Sighisoara and Sibiu. The roads are quiet, the medieval architecture is extraordinary, and the locals are among the most hospitable in Europe. Brown bears genuinely roam these forests; ask locals about recent sightings before cycling forest sections at dusk.`,
      location: "Brasov",
      country: "Romania",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Sighisoara medieval citadel", "Bran Castle (Dracula's)", "Fagaras Mountains backdrop", "Saxon fortified churches", "Bear forest trails"],
      gear: ["Touring bike", "Panniers", "Bear spray", "Repair kit", "EU health card"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 1200,
      latitude: 45.65,
      longitude: 25.61,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["europe"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure140.id }, { userId: user2.id, adventureId: adventure140.id }], skipDuplicates: true });


  // Adventure 141
  const adventure141 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-141" },
    update: {},
    create: {
      id: "seed-adventure-141",
      title: "Mekong River Cycle",
      description: `Cycling the Mekong from the Golden Triangle in northern Thailand to the Mekong Delta in Vietnam covers roughly 4,500 km through five countries — Thailand, Laos, Cambodia, and Vietnam — on roads varying from smooth tarmac to dusty jungle track. The river is the constant companion, a brown presence swelling in monsoon and shrinking in dry season. This is a fully self-planned tour; no agencies, just the river and the road.`,
      location: "Chiang Rai",
      country: "Thailand",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 60,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: ["Golden Triangle", "Luang Prabang monks", "4000 Islands (Si Phan Don)", "Phnom Penh riverfront", "Mekong Delta canals"],
      gear: ["Expedition touring bike", "Panniers", "Chainstay cover", "Water purification", "Spare cables and spokes"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 5000,
      latitude: 20.28,
      longitude: 99.88,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["jungle"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure141.id }, { userId: user2.id, adventureId: adventure141.id }], skipDuplicates: true });


  // Adventure 142
  const adventure142 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-142" },
    update: {},
    create: {
      id: "seed-adventure-142",
      title: "Sri Lanka Coast to Coast",
      description: `A 900 km cycling loop of Sri Lanka from Colombo takes in the Cultural Triangle of Sigiriya, Polonnaruwa and Anuradhapura, the cool tea estates of Nuwara Eliya, the surf town of Arugam Bay, and the whale-watching coast near Mirissa. Traffic is challenging in the cities; the hill country roads are steep, beautiful, and relatively quiet. The food — hopper breakfasts, kottu roti, fresh coconut — is a constant highlight.`,
      location: "Colombo",
      country: "Sri Lanka",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=1600&q=80",
      highlights: ["Sigiriya Lion Rock", "Nuwara Eliya tea estates", "Arugam Bay surf", "Whale watching Mirissa", "Ancient temple circuit"],
      gear: ["Touring bike", "Panniers", "Helmet", "Repair kit", "Sun protection"],
      bestMonths: [12, 1, 2, 3, 4],
      estimatedCost: 2000,
      latitude: 6.93,
      longitude: 79.85,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["island"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure142.id }, { userId: user2.id, adventureId: adventure142.id }], skipDuplicates: true });


  // Adventure 143
  const adventure143 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-143" },
    update: {},
    create: {
      id: "seed-adventure-143",
      title: "Scottish Islands Kayak Expedition",
      description: `A 500 km sea kayak expedition along Scotland's west coast from the Mull of Kintyre to Cape Wrath, crossing to the Hebridean islands of Islay, Jura, Colonsay, Mull, Skye, and the Summer Isles. The Atlantic swell, tidal races, and unpredictable weather make this serious expedition paddling. Compensation comes in the form of white-sand beaches deserted except for seals, puffins nesting on sea stacks, and the aurora australis on clear nights.`,
      location: "Mull of Kintyre",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Hebrides island crossings", "Corryvreckan whirlpool passage", "Puffin sea stacks", "Cape Wrath finish", "Wild camping beaches"],
      gear: ["Sea kayak", "Paddle float", "VHF radio", "Dry suit", "Tidal atlas"],
      bestMonths: [5, 6, 7, 8],
      estimatedCost: 4000,
      latitude: 55.31,
      longitude: -5.78,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["island"].id }, { id: allTags["scotland"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure143.id }, { userId: user2.id, adventureId: adventure143.id }], skipDuplicates: true });


  // Adventure 144
  const adventure144 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-144" },
    update: {},
    create: {
      id: "seed-adventure-144",
      title: "Galápagos Diving Expedition",
      description: `The Galápagos Islands offer the most dramatic macro and mega-fauna diving on earth — hammerhead sharks school in their hundreds at Darwin and Wolf, whale sharks cruise the deep channel at Wolf, and manta rays barrel-roll in cleaning stations. Fur seals play in the shallows and marine iguanas graze on the sea floor. Liveaboard access to the northern islands of Darwin and Wolf is the only way to experience the best sites; book 6–12 months in advance.`,
      location: "Galápagos Islands",
      country: "Ecuador",
      continent: "South America",
      category: Category.DIVING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Hammerhead shark schools", "Whale shark encounters", "Marine iguanas", "Darwin Arch", "Manta cleaning stations"],
      gear: ["Advanced Open Water minimum", "Wetsuit 5mm", "SMB", "Dive computer", "Underwater camera"],
      bestMonths: [6, 7, 8, 9, 10, 11],
      estimatedCost: 5500,
      latitude: -0.95,
      longitude: -90.97,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["wildlife"].id }, { id: allTags["island"].id }, { id: allTags["bucket-list"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure144.id }, { userId: user2.id, adventureId: adventure144.id }, { userId: user3.id, adventureId: adventure144.id }], skipDuplicates: true });


  // Adventure 145
  const adventure145 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-145" },
    update: {},
    create: {
      id: "seed-adventure-145",
      title: "Great Barrier Reef Liveaboard",
      description: `A 7-day liveaboard on the Great Barrier Reef's Coral Sea and Ribbon Reefs delivers up to 25 dives at sites inaccessible from shore — Osprey Reef with its oceanic whitetip sharks and vertical wall diving, the Cod Hole where large potato cod approach divers expecting a feed, and Pixie Pinnacle's psychedelic soft coral gardens. Night diving reveals octopus, cuttlefish, and flatworms that hide during the day.`,
      location: "Cairns",
      country: "Australia",
      continent: "Oceania",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Osprey Reef wall diving", "Cod Hole potato cod", "Coral Sea visibility", "Night diving", "Ribbon Reefs coral gardens"],
      gear: ["Open Water minimum", "Wetsuit 3mm", "SMB", "Dive torch for nights", "Underwater camera"],
      bestMonths: [6, 7, 8, 9, 10, 11],
      estimatedCost: 3200,
      latitude: -16.92,
      longitude: 145.78,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["wildlife"].id }, { id: allTags["australia"].id }, { id: allTags["island"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure145.id }, { userId: user2.id, adventureId: adventure145.id }], skipDuplicates: true });


  // Adventure 146
  const adventure146 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-146" },
    update: {},
    create: {
      id: "seed-adventure-146",
      title: "Cocos Island Shark Dive",
      description: `Cocos Island, 550 km off the Pacific coast of Costa Rica, is perhaps the world's best shark-diving destination — a submerged seamount that aggregates scalloped hammerheads in groups of hundreds, plus tiger sharks, silky sharks, and the occasional whale shark. The island is national park; access is strictly liveaboard only, with 5–6 day passages from Puntarenas. Strong currents require Advanced Open Water and experience.`,
      location: "Puntarenas",
      country: "Costa Rica",
      continent: "North America",
      category: Category.DIVING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1600&q=80",
      highlights: ["Hammerhead schools", "Tiger shark encounters", "Mantas at Alcyone", "Cocos Island rainforest", "Oceanic whiteetip sharks"],
      gear: ["Advanced certification", "Wetsuit 5mm", "Current hook", "SMB mandatory", "Underwater camera"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 6500,
      latitude: 5.54,
      longitude: -87.06,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["wildlife"].id }, { id: allTags["island"].id }, { id: allTags["bucket-list"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure146.id }, { userId: user2.id, adventureId: adventure146.id }, { userId: user3.id, adventureId: adventure146.id }], skipDuplicates: true });


  // Adventure 147
  const adventure147 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-147" },
    update: {},
    create: {
      id: "seed-adventure-147",
      title: "Serengeti Migration Safari",
      description: `The great wildebeest migration is the largest movement of land animals on earth — 1.5 million wildebeest, 200,000 zebra, and 400,000 gazelle circling the Serengeti-Masai Mara ecosystem in a year-round cycle. The river crossings at the Mara River, when thousands of wildebeest plunge through crocodile-infested water, are among the most dramatic wildlife spectacles anywhere. Timing is everything: July–October for the Mara crossings.`,
      location: "Serengeti",
      country: "Tanzania",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.EASY,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1600&q=80",
      highlights: ["Mara River crossings", "Lion pride hunts", "Big Five", "Hot air balloon at dawn", "Ngorongoro Crater"],
      gear: ["Neutral clothing (no bright colours)", "Binoculars", "Long lens camera", "Sunscreen", "Malaria prophylaxis"],
      bestMonths: [7, 8, 9, 10],
      estimatedCost: 5500,
      latitude: -2.33,
      longitude: 34.83,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["bucket-list"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure147.id }, { userId: user2.id, adventureId: adventure147.id }, { userId: user3.id, adventureId: adventure147.id }], skipDuplicates: true });


  // Adventure 148
  const adventure148 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-148" },
    update: {},
    create: {
      id: "seed-adventure-148",
      title: "Okavango Delta Mokoro Safari",
      description: `The Okavango Delta in Botswana is the world's largest inland delta — 15,000 sq km of permanently flooded waterways, papyrus channels, and palm-covered islands teeming with elephant, hippo, crocodile, lion, leopard, and 500 bird species. A mokoro (dugout canoe) safari poled by a local guide through the lily-covered channels is an utterly silent, intimate way to experience wildlife at water level. Camping on remote islands under the stars completes the picture.`,
      location: "Maun",
      country: "Botswana",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.EASY,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Mokoro channel paddling", "Elephant herds at water", "Night lion encounters", "Island bush camping", "500+ bird species"],
      gear: ["Quick-dry clothing", "Binoculars", "Camera with zoom", "Headtorch", "Antimalarials"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 4200,
      latitude: -19.98,
      longitude: 23.42,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure148.id }, { userId: user2.id, adventureId: adventure148.id }], skipDuplicates: true });


  // Adventure 149
  const adventure149 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-149" },
    update: {},
    create: {
      id: "seed-adventure-149",
      title: "Gorilla Trekking Bwindi",
      description: `Bwindi Impenetrable Forest in southwest Uganda harbours half the world's remaining mountain gorillas — roughly 460 individuals in around 40 habituated groups. Trekking to spend the permitted one hour with a gorilla family is among the most powerful wildlife encounters on earth. The trek itself through dense rainforest on steep, muddy slopes takes 30 minutes to 6 hours depending on where the gorillas rested. Permits sell out months ahead at USD 700 each.`,
      location: "Bwindi",
      country: "Uganda",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=1600&q=80",
      highlights: ["Mountain gorilla face-to-face", "Silverback encounter", "Bwindi rainforest", "Golden monkey trek", "Volcanoes NP option"],
      gear: ["Waterproof boots", "Gardening gloves for nettles", "Neutral clothing", "Long sleeves", "Camera"],
      bestMonths: [1, 2, 6, 7, 8, 9],
      estimatedCost: 3500,
      latitude: -1.07,
      longitude: 29.68,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["jungle"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure149.id }, { userId: user2.id, adventureId: adventure149.id }, { userId: user3.id, adventureId: adventure149.id }], skipDuplicates: true });


  // Adventure 150
  const adventure150 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-150" },
    update: {},
    create: {
      id: "seed-adventure-150",
      title: "Chamonix Freeride Season",
      description: `Chamonix is the freeride capital of the Alps — the Vallée Blanche glacier descent, the Grands Montets couloirs, and the off-piste terrain accessible from the Aiguille du Midi cable car represent the pinnacle of European ski touring and freeride. The combination of high-altitude terrain, consistent snowpack from November to April, and easy access to the mountains via cable car makes this unlike any resort-based skiing experience. Avalanche awareness is mandatory.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Vallée Blanche descent", "Grands Montets couloirs", "Aiguille du Midi cable car", "Off-piste guide days", "Chamonix après"],
      gear: ["Freeride skis", "Avalanche transceiver, probe, shovel", "Ski touring skins", "Helmet", "Powder pants"],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 3500,
      latitude: 45.92,
      longitude: 6.87,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure150.id }, { userId: user2.id, adventureId: adventure150.id }, { userId: user3.id, adventureId: adventure150.id }], skipDuplicates: true });


  // Adventure 151
  const adventure151 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-151" },
    update: {},
    create: {
      id: "seed-adventure-151",
      title: "Hokkaido Powder Skiing",
      description: `Niseko on Hokkaido island receives some of the world's deepest, driest powder snow — an average of 15 m per season driven by cold Siberian air masses crossing the Sea of Japan. The Grand Hirafu, Hanazono, Annupuri, and Niseko Village interconnected resorts offer 30 km of lifts with unlimited off-piste terrain. After skiing, onsens (volcanic hot springs) and seafood — Hokkaido king crab, uni, and sashimi — complete an absurdly good week.`,
      location: "Niseko",
      country: "Japan",
      continent: "Asia",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["15m annual snowfall", "Night skiing in powder", "Onsen hot springs", "Hokkaido seafood", "Yuki no Hana powder guarantee"],
      gear: ["Powder skis", "Avalanche safety kit", "Ski helmet", "Goggles", "Base layers merino"],
      bestMonths: [12, 1, 2, 3],
      estimatedCost: 4200,
      latitude: 42.74,
      longitude: 140.69,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure151.id }, { userId: user2.id, adventureId: adventure151.id }, { userId: user3.id, adventureId: adventure151.id }], skipDuplicates: true });


  // Adventure 152
  const adventure152 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-152" },
    update: {},
    create: {
      id: "seed-adventure-152",
      title: "Pipeline North Shore Surfing",
      description: `The Banzai Pipeline on Oahu's North Shore breaks over a shallow reef to produce the world's most photogenic — and most dangerous — surf break. The hollow left-hand barrel reaches 6–8 m in peak season and has claimed more lives than any other surfbreak. This is for expert surfers only; beginners can watch from the beach as the world's best compete in the Eddie Aikau and Pipe Masters events between November and February.`,
      location: "Haleiwa",
      country: "United States",
      continent: "North America",
      category: Category.SURFING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=1600&q=80",
      highlights: ["Banzai Pipeline barrel", "Eddie Aikau contest", "Sunset Beach", "North Shore shrimp trucks", "Waimea Bay jump"],
      gear: ["Shortboard 6ft2 minimum", "Reef boots", "Helmet (optional but wise)", "Leash", "Sunscreen SPF50"],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 3000,
      latitude: 21.66,
      longitude: -158.05,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["island"].id }, { id: allTags["photography"].id }, { id: allTags["coastal"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure152.id }, { userId: user2.id, adventureId: adventure152.id }, { userId: user3.id, adventureId: adventure152.id }], skipDuplicates: true });

  // Adventure 153
  const adventure153 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-153" },
    update: {},
    create: {
      id: "seed-adventure-153",
      title: "Mentawai Islands Surf Charter",
      description: `The Mentawai Islands off the west coast of Sumatra host some of the world's most perfect surf breaks — HT's, Lances Right, Macaronis, and Rifles deliver long, hollow waves that break with mechanical consistency over shallow tropical reef. A 7-day liveaboard puts 6–8 breaks within easy reach, moving with the swell and anchoring away from other boats. This is intermediate to advanced surfing in a genuinely remote tropical island setting.`,
      location: "Padang",
      country: "Indonesia",
      continent: "Asia",
      category: Category.SURFING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1600&q=80",
      highlights: ["Macaronis perfection", "HT's barrels", "Lances Right length", "Island village visits", "Tropical reef fish"],
      gear: ["Shortboard and mid-length", "Reef booties", "Wetsuit top (optional)", "Sun protection", "Reef-safe sunscreen"],
      bestMonths: [4, 5, 6, 7, 8],
      estimatedCost: 3800,
      latitude: -2.06,
      longitude: 99.09,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["island"].id }, { id: allTags["coastal"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure153.id }, { userId: user2.id, adventureId: adventure153.id }], skipDuplicates: true });


  // Adventure 154
  const adventure154 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-154" },
    update: {},
    create: {
      id: "seed-adventure-154",
      title: "Pacific Coast Highway Road Trip",
      description: `Highway 1 from Vancouver to the Mexican border traces the Pacific coastline for 2,400 km — through Olympic National Park and Oregon's crater-lake forests, past Big Sur's cliff-hugging turns and sea-lion rocks, into the Malibu surf culture and San Diego's perfect climate. Campgrounds book out for summer; the shoulder seasons of April–May and September–October offer emptier roads and dramatic light.`,
      location: "Vancouver",
      country: "United States",
      continent: "North America",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.EASY,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: ["Big Sur coastline", "Olympic National Park", "Crater Lake", "Point Reyes seals", "San Francisco Golden Gate"],
      gear: ["Reliable vehicle", "Camping kit", "Cooler", "Good speakers", "US national parks pass"],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 4000,
      latitude: 49.25,
      longitude: -123.12,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["coastal"].id }, { id: allTags["camping"].id }, { id: allTags["photography"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure154.id }, { userId: user2.id, adventureId: adventure154.id }], skipDuplicates: true });


  // Adventure 155
  const adventure155 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-155" },
    update: {},
    create: {
      id: "seed-adventure-155",
      title: "Iceland Ring Road",
      description: `Iceland's Route 1 circumnavigates the entire island in 1,332 km, passing glaciers calving into lagoons, geysers erupting on schedule, black sand beaches with seal colonies, and the northern lights when darkness finally returns in September. The Westfjords detour adds the most dramatic fjord scenery in Europe and the remote Hornstrandir nature reserve. A campervan in July means 24-hour daylight; September brings aurora and autumn colour to the birch woods.`,
      location: "Reykjavik",
      country: "Iceland",
      continent: "Europe",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.EASY,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1548449112-96a38a643324?w=1600&q=80",
      highlights: ["Jökulsárlón glacier lagoon", "Geysir eruptions", "Black sand beach seals", "Northern lights", "Westfjords detour"],
      gear: ["Rental 4WD or campervan", "Warm layers", "Rain gear", "Aurora alarm app", "Good coffee thermos"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 3500,
      latitude: 64.13,
      longitude: -21.83,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["photography"].id }, { id: allTags["volcanic"].id }, { id: allTags["midnight-sun"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure155.id }, { userId: user2.id, adventureId: adventure155.id }, { userId: user3.id, adventureId: adventure155.id }], skipDuplicates: true });


  // Adventure 156
  const adventure156 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-156" },
    update: {},
    create: {
      id: "seed-adventure-156",
      title: "Pamir Highway",
      description: `The Pamir Highway (M41) from Osh in Kyrgyzstan to Dushanbe in Tajikistan is the second-highest highway in the world, crossing the Pamir plateau at elevations consistently above 4,000 m through some of the emptiest landscape in Asia. Yak herders, Soviet-era infrastructure, and the deep blue of Karakul Lake at 3,900 m alongside the Chinese border provide the backdrop for what cyclists and motorcyclists rate among the world's greatest road adventures.`,
      location: "Osh",
      country: "Kyrgyzstan",
      continent: "Asia",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: ["Karakul Lake", "Wakhan Corridor", "Murgab Tajik market", "Yurt homestays", "Afghan mountains across the Panj"],
      gear: ["4WD or motorcycle", "Fuel cans (sparse filling stations)", "Cold weather kit", "US dollars cash", "Altitude medication"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2800,
      latitude: 40.53,
      longitude: 72.79,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["remote"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure156.id }, { userId: user2.id, adventureId: adventure156.id }], skipDuplicates: true });


  // Adventure 157
  const adventure157 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-157" },
    update: {},
    create: {
      id: "seed-adventure-157",
      title: "Silk Road Journey",
      description: `The ancient Silk Road from Xi'an to Istanbul traces 7,000 km of trade routes through China's Gobi Desert, Central Asian steppes, Persian caravanserais, and Anatolian highlands. By a combination of train, bus, and shared taxi, the journey moves through Dunhuang's Mogao Caves, Uzbekistan's Registan Square, Turkmenistan's Gates of Hell, and Iranian bazaars where saffron and pistachios overflow in technicolour piles.`,
      location: "Xi'an",
      country: "China",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.MODERATE,
      durationDays: 45,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: ["Mogao Caves Dunhuang", "Registan Square Samarkand", "Gates of Hell Darvaza", "Iranian bazaars", "Istanbul Grand Bazaar"],
      gear: ["Modest clothing", "Visa documentation", "Offline maps", "Stomach medication", "USD cash"],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 5000,
      latitude: 34.34,
      longitude: 108.94,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["desert"].id }, { id: allTags["remote"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure157.id }, { userId: user2.id, adventureId: adventure157.id }], skipDuplicates: true });


  // Adventure 158
  const adventure158 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-158" },
    update: {},
    create: {
      id: "seed-adventure-158",
      title: "Japan Pilgrimage Shikoku 88",
      description: `The Shikoku Henro is an 1,200 km walking pilgrimage circling the island of Shikoku, visiting 88 Buddhist temples associated with the monk Kūkai (Kōbō Daishi). Pilgrims walk in white robes carrying a wooden staff, believed to embody the spirit of Kōbō Daishi himself. The route takes 30–60 days depending on pace and includes mountain sections, coastal paths, and city temple visits. The culture of osetai — gifts of food and money given to pilgrims — is extraordinary.`,
      location: "Tokushima",
      country: "Japan",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 45,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: ["88 temple circuit", "White pilgrim robe", "Osetai gift culture", "Cape Muroto", "Mount Tsurugi climb"],
      gear: ["Walking staff", "White pilgrim robe", "Temple book for stamps", "Minimalist pack", "Blister care"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 3500,
      latitude: 34.07,
      longitude: 134.56,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["trekking"].id }, { id: allTags["solo-travel"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure158.id }, { userId: user2.id, adventureId: adventure158.id }], skipDuplicates: true });


  // Adventure 159
  const adventure159 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-159" },
    update: {},
    create: {
      id: "seed-adventure-159",
      title: "Trans-Siberian Railway",
      description: `The Trans-Siberian Railway is the longest railway on earth — 9,289 km from Moscow to Vladivostok, crossing 8 time zones, the Ural Mountains, the vast Western Siberian plain, Lake Baikal (the world's deepest lake), and the Russian Far East over 7 days in one continuous run or 3 weeks with stops. The Mongolian branch via Ulaanbaatar and Beijing adds the Gobi Desert crossing and the most dramatic scenery. Bring books, vodka, and patience.`,
      location: "Moscow",
      country: "Russia",
      continent: "Europe",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1600&q=80",
      highlights: ["Lake Baikal ice walk (winter)", "Ulaanbaatar Mongolia", "Gobi Desert crossing", "Vladivostok Pacific finish", "Siberian taiga forests"],
      gear: ["Sleeping bag liner", "Train slippers", "Instant noodles (serious)", "USD and local currencies", "Books — many"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 4000,
      latitude: 55.75,
      longitude: 37.62,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["solo-travel"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure159.id }, { userId: user2.id, adventureId: adventure159.id }], skipDuplicates: true });


  // Adventure 160
  const adventure160 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-160" },
    update: {},
    create: {
      id: "seed-adventure-160",
      title: "Amazon River Journey",
      description: `Travelling the Amazon from Iquitos in Peru to Belém on the Atlantic coast of Brazil — 3,700 km on slow cargo boats and jungle lodges — is among the most immersive journeys on earth. Pink river dolphins surface alongside the boat, sloths hang from cecropia trees at the waterline, caimans glow in headtorch light, and the scale of the forest — 5.5 million sq km — reduces everything else to perspective. The slow boat from Leticia to Manaus takes 5–7 days; hammock space is cheap.`,
      location: "Iquitos",
      country: "Peru",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["Pink river dolphins", "Piranha fishing", "Jungle lodge nights", "Leticia-Manaus hammock boat", "Belém do Pará"],
      gear: ["Hammock", "Mosquito net", "Malaria prophylaxis", "Water purification", "Waterproof bags"],
      bestMonths: [6, 7, 8, 9, 10, 11],
      estimatedCost: 4500,
      latitude: -3.74,
      longitude: -73.25,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["jungle"].id }, { id: allTags["wildlife"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure160.id }, { userId: user2.id, adventureId: adventure160.id }], skipDuplicates: true });


  // Adventure 161
  const adventure161 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-161" },
    update: {},
    create: {
      id: "seed-adventure-161",
      title: "Skeleton Coast Expedition",
      description: `The Skeleton Coast of Namibia runs 500 km of fog-shrouded Atlantic desert coastline from the Kunene River to Swakopmund, one of the most inhospitable and eerily beautiful landscapes on earth. Shipwrecks rust in the dunes, Cape fur seals crowd rocky points in their tens of thousands, and desert-adapted lions and elephants survive in this extreme environment. Access to the northern zone requires permits or a fly-in safari; the southern section is reachable by 4WD.`,
      location: "Skeleton Coast",
      country: "Namibia",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Desert-adapted lions", "Cape fur seal colonies", "Shipwrecks in dunes", "Fly-in camp access", "Kunene River"],
      gear: ["4WD", "Recovery equipment", "Fuel reserves", "Water supplies", "Sat phone"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 7000,
      latitude: -20,
      longitude: 13,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["desert"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure161.id }, { userId: user2.id, adventureId: adventure161.id }], skipDuplicates: true });


  // Adventure 162
  const adventure162 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-162" },
    update: {},
    create: {
      id: "seed-adventure-162",
      title: "Borneo Orangutan Trek",
      description: `The rainforests of Borneo — spanning Sabah, Sarawak, and Kalimantan — harbour wild orangutans accessible on foot in Danum Valley, Deramakot Forest Reserve, and the Kinabatangan River. Proboscis monkeys with their extraordinary noses, pygmy elephants, and hornbills complete the jungle cast. Danum Valley requires a lodge booking and is strict about access; the Kinabatangan is accessible by boat from Sukau, where river safaris reveal orangutans feeding in riverine forest.`,
      location: "Lahad Datu",
      country: "Malaysia",
      continent: "Asia",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["Wild orangutan sightings", "Danum Valley primary forest", "Kinabatangan river safari", "Pygmy elephants", "Hornbill species"],
      gear: ["Lightweight clothes", "Waterproof boots", "Insect repellent", "Binoculars", "Camera"],
      bestMonths: [3, 4, 7, 8],
      estimatedCost: 3000,
      latitude: 4.93,
      longitude: 117.33,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["jungle"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure162.id }, { userId: user2.id, adventureId: adventure162.id }], skipDuplicates: true });


  // Adventure 163
  const adventure163 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-163" },
    update: {},
    create: {
      id: "seed-adventure-163",
      title: "Spitsbergen Polar Bear Safari",
      description: `Svalbard at 78° North is the world's most accessible Arctic wilderness — a high-Arctic archipelago of glaciers, polar bears, walrus, and Arctic foxes reachable by scheduled flight from Tromsø. Summer brings the midnight sun and boat expeditions into drift ice where polar bears hunt. Winter brings the blue twilight of polar night and the northern lights. Armed guide requirement means most access is via guided expedition.`,
      location: "Longyearbyen",
      country: "Norway",
      continent: "Europe",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1531166936337-7c912a4589a7?w=1600&q=80",
      highlights: ["Polar bear encounters", "Glacier boat expeditions", "Walrus haul-outs", "Arctic fox", "Midnight sun (or polar night)"],
      gear: ["Expedition cold-weather kit", "Flotation suit (boat trips)", "Layers (minimum -20°C capable)", "Camera telephoto", "Waterproof boots"],
      bestMonths: [3, 4, 6, 7, 8],
      estimatedCost: 5500,
      latitude: 78.22,
      longitude: 15.63,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["arctic"].id }, { id: allTags["wildlife"].id }, { id: allTags["expedition"].id }, { id: allTags["photography"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure163.id }, { userId: user2.id, adventureId: adventure163.id }, { userId: user3.id, adventureId: adventure163.id }], skipDuplicates: true });


  // Adventure 164
  const adventure164 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-164" },
    update: {},
    create: {
      id: "seed-adventure-164",
      title: "Faroe Islands Coastal Hiking",
      description: `The Faroe Islands — 18 volcanic islands between Norway and Iceland — offer some of the most dramatic coastal hiking in Europe, with vertiginous cliffs over the Atlantic, waterfalls falling directly into the sea, and turf-roofed villages accessible only on foot. The Slættaratindur ridge, Gásadalur waterfall trail, and the Hornið ridge above Enniberg (the world's highest sea cliffs at 754 m) are standout routes. The light in the Faroes is unlike anywhere else on earth.`,
      location: "Tórshavn",
      country: "Faroe Islands",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Enniberg sea cliffs", "Gásadalur waterfall", "Sørvágsvatn lake over sea", "Slættaratindur summit", "Turf-roofed village Saksun"],
      gear: ["Waterproof jacket", "Hiking poles", "Layers", "Strong footwear", "Wind protection"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2500,
      latitude: 62,
      longitude: -6.79,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["coastal"].id }, { id: allTags["island"].id }, { id: allTags["photography"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure164.id }, { userId: user2.id, adventureId: adventure164.id }], skipDuplicates: true });


  // Adventure 165
  const adventure165 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-165" },
    update: {},
    create: {
      id: "seed-adventure-165",
      title: "Ethiopian Simien Mountains Trek",
      description: `The Simien Mountains of northern Ethiopia are an eroded basalt plateau dissected into dramatic table mountains, with escarpments dropping 1,500 m to the Sudanese lowlands. The park is one of the last habitats for the Gelada baboon — troops of 1,000 graze the cliff-edge meadows — as well as the Ethiopian wolf and Walia ibex. The 5-day circuit from Sankaber to Ras Dashen, Ethiopia's highest peak at 4,550 m, combines serious altitude with extraordinary wildlife.`,
      location: "Gondar",
      country: "Ethiopia",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Gelada baboon herds", "Ras Dashen summit 4,550m", "Escarpment cliff views", "Ethiopian wolf", "Walia ibex"],
      gear: ["Layering system", "Altitude medication", "Trekking poles", "Sleeping bag (cold nights)", "Scout mandatory"],
      bestMonths: [10, 11, 12, 1, 2, 3],
      estimatedCost: 1500,
      latitude: 13.25,
      longitude: 38.28,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["wildlife"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure165.id }, { userId: user2.id, adventureId: adventure165.id }], skipDuplicates: true });


  // Adventure 166
  const adventure166 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-166" },
    update: {},
    create: {
      id: "seed-adventure-166",
      title: "Kyrgyzstan Horse Trekking",
      description: `Kyrgyzstan's Tian Shan mountains offer horse trekking through high-altitude jailoos (summer pastures) where nomadic herding families still move their flocks between valleys seasonally. Routes from Karakol into the Terskey Alatau ranges or from Naryn into the Song Kul plateau cross high passes above 4,000 m, reach ice-cold alpine lakes, and end each night in a yurt with fermented mare's milk and mutton. No technical riding experience needed; the horses know the terrain.`,
      location: "Karakol",
      country: "Kyrgyzstan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: ["Song Kul lake at 3,016m", "Yurt homestay dinners", "High mountain passes", "Nomad family encounters", "Tian Shan panoramas"],
      gear: ["Riding trousers", "Layers for altitude cold", "Waterproof jacket", "Camera", "Nomadic patience"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1400,
      latitude: 42.49,
      longitude: 78.39,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["horse-trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure166.id }, { userId: user2.id, adventureId: adventure166.id }], skipDuplicates: true });


  // Adventure 167
  const adventure167 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-167" },
    update: {},
    create: {
      id: "seed-adventure-167",
      title: "Via Francigena Italy",
      description: `The Via Francigena is the ancient pilgrim road from Canterbury to Rome — 1,000 km of the Italian section alone runs from the Gran San Bernardo Pass through Tuscany and Lazio to St Peter's Basilica. The route passes through Siena's Piazza del Campo, the Crete Senesi lunar landscape, the medieval towers of San Gimignano, and thermal baths at Bagno Vignoni. This is gentle cultural walking at its finest, staying in abbeys and agriturismo.`,
      location: "Aosta",
      country: "Italy",
      continent: "Europe",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=1600&q=80",
      highlights: ["Siena Piazza del Campo", "Crete Senesi landscape", "San Gimignano towers", "Bagno Vignoni hot springs", "St Peter's arrival"],
      gear: ["Comfortable walking shoes", "Pilgrim credential book", "Lightweight pack", "Italian phrasebook", "Sunscreen"],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 3000,
      latitude: 45.74,
      longitude: 7.32,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["camino"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["europe"].id }, { id: allTags["solo-travel"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure167.id }, { userId: user2.id, adventureId: adventure167.id }], skipDuplicates: true });


  // Adventure 168
  const adventure168 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-168" },
    update: {},
    create: {
      id: "seed-adventure-168",
      title: "Svalbard Ski Touring",
      description: `Ski touring in Svalbard's high-Arctic wilderness in April — when the sun returns but the temperature remains deep-winter cold — is one of the most adventurous ski experiences in the world. Routes from Longyearbyen explore glaciated valleys, cross the Nordenskiöld Glacier, and traverse sea ice with polar bear escort (guides carry rifles). The ice quality in April is excellent; the light at high Arctic spring is magical.`,
      location: "Longyearbyen",
      country: "Norway",
      continent: "Europe",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["Arctic glacier skiing", "Polar bear encounters on ski", "Sea ice traverses", "24-hour daylight in April", "Svalbard ice fjord"],
      gear: ["Ski touring kit", "Polar expedition sleeping bag", "Rifle guide required", "Polar tent", "Avalanche safety kit"],
      bestMonths: [3, 4, 5],
      estimatedCost: 5500,
      latitude: 78.22,
      longitude: 15.63,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["arctic"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure168.id }, { userId: user2.id, adventureId: adventure168.id }], skipDuplicates: true });


  // Adventure 169
  const adventure169 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-169" },
    update: {},
    create: {
      id: "seed-adventure-169",
      title: "Quebrada Humahuaca Cultural Trek",
      description: `The Quebrada de Humahuaca in Argentina's Jujuy province is a UNESCO World Heritage canyon running north from Jujuy city for 155 km into the Bolivian altiplano. Pre-Inca fortresses, colonial churches painted in local red-and-ochre pigments, the Fourteen Colours Hill of Cerro de los Siete Colores, and the carnival at Humahuaca town make this a cultural and visual feast. Altitude from 2,000–3,400 m; acclimatise in Jujuy first.`,
      location: "Jujuy",
      country: "Argentina",
      continent: "South America",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80",
      highlights: ["Cerro de los Siete Colores", "Tilcara Pucará fortress", "Carnival procession", "Salinas Grandes salt flat", "Iruya village walk"],
      gear: ["Sun protection (high altitude UV)", "Altitude medication", "Light layers", "Good camera", "Pesos cash"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 1200,
      latitude: -23.19,
      longitude: -65.3,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["high-altitude"].id }, { id: allTags["desert"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure169.id }, { userId: user2.id, adventureId: adventure169.id }], skipDuplicates: true });


  // Adventure 170
  const adventure170 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-170" },
    update: {},
    create: {
      id: "seed-adventure-170",
      title: "Morocco Sahara Camel Trek",
      description: `A camel trek from M'Hamid into the Erg Chigaga — Morocco's remotest and most untouched dune field, 55 km from the last road — takes three days and two nights in the full silence of the deep desert. Arriving at the caravanserai camp as the sun sets behind 100 m dunes turns the whole landscape gold, then pink, then purple. Stars at this longitude and altitude are extraordinary. This is the real Sahara, not the day-tripper dunes.`,
      location: "M'Hamid el Ghizlane",
      country: "Morocco",
      continent: "Africa",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Erg Chigaga dunes", "Camel riding at sunset", "Desert star nights", "Berber camp dinner", "Silence of the Sahara"],
      gear: ["Loose cotton layers", "Sun protection", "Headscarf for sand", "Headtorch", "Small daypack"],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 1000,
      latitude: 29.83,
      longitude: -5.72,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["desert"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure170.id }, { userId: user2.id, adventureId: adventure170.id }], skipDuplicates: true });


  // Adventure 171
  const adventure171 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-171" },
    update: {},
    create: {
      id: "seed-adventure-171",
      title: "Corsica Sea Kayak",
      description: `Paddling the 1,000 km coastline of Corsica by sea kayak takes 6–8 weeks and reveals the island's true character — cliffs inaccessible from land, hidden sea caves echoing with swell, turquoise coves with transparent water, and wild camping on beaches shared only with loggerhead turtles. The west coast is rougher and more dramatic; the east coast is calmer and more agricultural. Winds from the Mistral and Libeccio can pin you in a cove for days.`,
      location: "Bastia",
      country: "France",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 40,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Scandola Nature Reserve", "Girolata hidden cove", "Bonifacio sea caves", "Loggerhead turtle encounters", "Calanques de Piana"],
      gear: ["Sea kayak with rudder", "Paddle float", "VHF radio", "Dry bags", "Tidal and wind forecasting"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 3500,
      latitude: 42.7,
      longitude: 9.45,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["island"].id }, { id: allTags["coastal"].id }, { id: allTags["europe"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure171.id }, { userId: user2.id, adventureId: adventure171.id }], skipDuplicates: true });


  // Adventure 172
  const adventure172 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-172" },
    update: {},
    create: {
      id: "seed-adventure-172",
      title: "Wrangell-St. Elias Packraft",
      description: `Wrangell-St. Elias National Park in Alaska is the largest in the US — six times the size of Yellowstone — and a multi-day packraft expedition through the Chitina River corridor combines glacier hiking, wild river paddling, and grizzly bear country in a landscape of active volcanoes and the world's largest subpolar glaciers. No maintained trails, no infrastructure. All travel is self-supported wilderness adventure.`,
      location: "McCarthy",
      country: "United States",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Chitina River paddling", "Root Glacier walk-in", "Grizzly bear country", "Nabesna volcanic area", "True wilderness solitude"],
      gear: ["Packraft", "Whitewater paddle", "Glacier travel kit", "Bear spray and canister", "Emergency beacon"],
      bestMonths: [6, 7, 8],
      estimatedCost: 5000,
      latitude: 61.43,
      longitude: -142.9,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["kayaking"].id }, { id: allTags["glacier"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure172.id }, { userId: user2.id, adventureId: adventure172.id }], skipDuplicates: true });


  // Adventure 173
  const adventure173 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-173" },
    update: {},
    create: {
      id: "seed-adventure-173",
      title: "Ladakh High-Altitude Trek",
      description: `The Markha Valley trek in Ladakh traverses the heart of the Trans-Himalayan high-altitude desert — a landscape more Central Asian than South Asian, with Buddhist monasteries perched on clifftops, blue sheep herds on rocky hillsides, and the soaring passes of Kongmaru La (5,260 m) offering views across to Stok Kangri (6,153 m). Nights in homestays with Ladakhi families, butter tea, and tsampa barley complete an experience found nowhere else.`,
      location: "Leh",
      country: "India",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Kongmaru La pass 5,260m", "Hemis monastery", "Blue sheep (bharal)", "Markha village homestays", "Zanskar range views"],
      gear: ["Layering system", "Altitude medication", "Down jacket", "Trekking poles", "Sleeping bag liner"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1600,
      latitude: 34.16,
      longitude: 77.58,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["mountains"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure173.id }, { userId: user2.id, adventureId: adventure173.id }], skipDuplicates: true });


  // Adventure 174
  const adventure174 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-174" },
    update: {},
    create: {
      id: "seed-adventure-174",
      title: "Tierra del Fuego Kayak",
      description: `Paddling the Beagle Channel and the inner fjords of Tierra del Fuego is one of the most remote sea kayak expeditions available outside of polar regions — conditions include tidal races, glacial calving, williwaw squalls that can reach 100 km/h with zero warning, and water cold enough to kill in minutes. The reward is the Darwin Range in winter light, Magellanic penguins on shore, and the knowledge that Fitzroy and Darwin passed these same channels.`,
      location: "Ushuaia",
      country: "Argentina",
      continent: "South America",
      category: Category.KAYAKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Beagle Channel paddling", "Magellanic penguins", "Glacier ice approach", "Darwin Range views", "Williwaw weather experience"],
      gear: ["Expedition sea kayak", "Dry suit mandatory", "VHF radio", "Tow rope", "Emergency flares"],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 5000,
      latitude: -54.8,
      longitude: -68.3,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["expedition"].id }, { id: allTags["glacier"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure174.id }, { userId: user2.id, adventureId: adventure174.id }], skipDuplicates: true });


  // Adventure 175
  const adventure175 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-175" },
    update: {},
    create: {
      id: "seed-adventure-175",
      title: "Tongariro Alpine Crossing",
      description: `The Tongariro Alpine Crossing is widely regarded as the best one-day walk in New Zealand — 19.4 km across the volcanic landscape of Tongariro National Park, past the emerald and blue Tongariro lakes, over the South Crater, and around the flanks of Mount Ngauruhoe (better known as Mount Doom). The crossing starts at Mangatepopo and ends at Ketetahi; the middle section requires good fitness and appropriate weather. Check volcanic activity alerts before going.`,
      location: "Tongariro",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 1,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Tongariro Lakes", "Mount Ngauruhoe (Mount Doom)", "South Crater", "Steam vents", "Ketetahi descent"],
      gear: ["Waterproof jacket", "Hiking boots", "Warm layers", "Trekking poles", "Extra water"],
      bestMonths: [12, 1, 2, 3, 4],
      estimatedCost: 200,
      latitude: -39.13,
      longitude: 175.64,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["volcanic"].id }, { id: allTags["new-zealand"].id }, { id: allTags["hiking"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure175.id }, { userId: user2.id, adventureId: adventure175.id }, { userId: user3.id, adventureId: adventure175.id }], skipDuplicates: true });


  // Adventure 176
  const adventure176 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-176" },
    update: {},
    create: {
      id: "seed-adventure-176",
      title: "Aosta Valley Via Ferrata Circuit",
      description: `The Aosta Valley in the Italian Alps is the via ferrata capital of the world — iron rungs, stemples, and wire ropes bolted into impossibly sheer granite faces allow access to summit ridges that would otherwise require serious rock climbing. The Ferrata degli Alpini above Courmayeur, the Ferrata del Cervino on Monte Rosa, and the spectacular Ferrata Recoaro in the Brenta group are all within reach of a week-long circuit based at valley campsites.`,
      location: "Courmayeur",
      country: "Italy",
      continent: "Europe",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1600&q=80",
      highlights: ["Ferrata degli Alpini", "Mont Blanc approach views", "Iron rung cliff traverses", "Alpine refugio lunches", "Courmayeur village"],
      gear: ["Via ferrata set (lanyard + harness)", "Helmet", "Gloves", "Approach shoes", "Headlamp"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2200,
      latitude: 45.79,
      longitude: 6.98,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["via-ferrata"].id }, { id: allTags["alpine"].id }, { id: allTags["mountaineering"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure176.id }, { userId: user2.id, adventureId: adventure176.id }], skipDuplicates: true });


  // Adventure 177
  const adventure177 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-177" },
    update: {},
    create: {
      id: "seed-adventure-177",
      title: "Rinjani Summit Trek",
      description: `Mount Rinjani (3,726 m) on Lombok is Indonesia's second-highest volcano and the most dramatic summit on Bali's doorstep. The standard 3-day trek circles the caldera rim, descends to the crater lake Segara Anak, and ascends the steep final cone to the summit crater. Views at dawn from the rim extend over Bali, Sumbawa, and the Java Sea. The trek requires good fitness; the crater descent involves long, sandy slopes that reward momentum.`,
      location: "Sembalun",
      country: "Indonesia",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1600&q=80",
      highlights: ["Segara Anak crater lake", "Summit caldera sunrise", "Hot springs in crater", "Multi-island views", "Sembalun highland start"],
      gear: ["Trekking poles", "Warm jacket (cold summit night)", "Head torch", "Good boots", "Rain cover"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 600,
      latitude: -8.41,
      longitude: 116.46,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["volcanic"].id }, { id: allTags["high-altitude"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure177.id }, { userId: user2.id, adventureId: adventure177.id }], skipDuplicates: true });


  // Adventure 178
  const adventure178 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-178" },
    update: {},
    create: {
      id: "seed-adventure-178",
      title: "Yellowstone Winter Snowshoe",
      description: `Visiting Yellowstone in winter transforms the world's first national park into a silent, steam-filled landscape of geysers erupting through snow, bison standing in thermal hot spots to keep warm, and wolves hunting elk across snow-covered valleys. Snowshoe access to the interior is by snowcoach from West Yellowstone; the Old Faithful area, Mammoth Hot Springs terraces, and Lamar Valley wolf watching are the key experiences. The park is almost entirely yours.`,
      location: "West Yellowstone",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Old Faithful in snow", "Wolf spotting Lamar Valley", "Bison thermal pools", "Mammoth terraces", "Winter silence"],
      gear: ["Snowshoes", "Cold weather kit -30°C", "Binoculars", "Microspikes", "Wool base layers"],
      bestMonths: [1, 2, 3],
      estimatedCost: 2500,
      latitude: 44.66,
      longitude: -110.83,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure178.id }, { userId: user2.id, adventureId: adventure178.id }], skipDuplicates: true });


  // Adventure 179
  const adventure179 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-179" },
    update: {},
    create: {
      id: "seed-adventure-179",
      title: "Bhutan Snowman Trek",
      description: `The Snowman Trek is considered one of the world's hardest treks — 30 days and 30 passes above 4,500 m crossing the remote north of Bhutan from Laya to Lunana and out to Bumthang. With 11 passes above 5,000 m, constant risk of snowstorm, and no rescue infrastructure, this is genuinely expedition-grade. Less than 500 people complete it per year. Bhutan's tourism levy (USD 250/day minimum) applies; book a licensed operator.`,
      location: "Paro",
      country: "Bhutan",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Gangkhar Puensum view (unclimbed)", "Lunana remote villages", "11 passes above 5,000m", "Yak herder culture", "Complete Bhutanese wilderness"],
      gear: ["Expedition sleeping bag", "Down suit", "Trekking poles", "High-altitude boots", "Altitude medication"],
      bestMonths: [9, 10],
      estimatedCost: 12000,
      latitude: 27.43,
      longitude: 89.88,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["8000m"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure179.id }, { userId: user2.id, adventureId: adventure179.id }], skipDuplicates: true });


  // Adventure 180
  const adventure180 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-180" },
    update: {},
    create: {
      id: "seed-adventure-180",
      title: "Kimberley Coast Expedition",
      description: `The Kimberley coast of Western Australia is one of the most remote and dramatic coastlines on earth — 2,500 km of sandstone gorges, waterfalls that flow direct into the sea in the wet season, Aboriginal rock art sites accessible only by boat, and saltwater crocodiles on every beach. Expedition yachts or small cruise vessels navigate the horizontal waterfalls (a tidal hydraulic unlike anything else on the planet) and the Montgomery Reef tidal emergence.`,
      location: "Broome",
      country: "Australia",
      continent: "Oceania",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Horizontal Falls", "Montgomery Reef tidal emergence", "Aboriginal rock art", "King George Falls", "Crocodile spotting"],
      gear: ["Sandfly protection", "Water shoes", "Snorkelling kit", "Sun protection extreme", "Croc-awareness briefing"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 8000,
      latitude: -17.96,
      longitude: 122.23,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["coastal"].id }, { id: allTags["australia"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure180.id }, { userId: user2.id, adventureId: adventure180.id }], skipDuplicates: true });


  // Adventure 181
  const adventure181 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-181" },
    update: {},
    create: {
      id: "seed-adventure-181",
      title: "Balkans Mountain Traverse",
      description: `Walking the Via Dinarica — the unofficial long trail traversing the Dinaric Alps from Slovenian Triglav to Albanian Mount Korab — covers 1,200 km through eight countries, connecting the Julian Alps, Croatian karst, Bosnian war-memory landscapes, Montenegro's Durmitor, Kosovo's Rugova, North Macedonia's Galicica, and Albanian peaks. The infrastructure is sparse but the hospitality of mountain communities across former Yugoslavia is extraordinary.`,
      location: "Ljubljana",
      country: "Slovenia",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 60,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Mount Triglav", "Durmitor Black Lake", "Kotor Bay view", "Rugova Gorge", "Korab summit Albania"],
      gear: ["Navigation tools", "Camping kit", "Multiple country visas checked", "Language phrasebooks", "Cash (remote areas)"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 4000,
      latitude: 46.05,
      longitude: 14.51,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["europe"].id }, { id: allTags["mountains"].id }, { id: allTags["camping"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure181.id }, { userId: user2.id, adventureId: adventure181.id }], skipDuplicates: true });


  // Adventure 182
  const adventure182 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-182" },
    update: {},
    create: {
      id: "seed-adventure-182",
      title: "Papua New Guinea Kokoda Track",
      description: `The Kokoda Track is a 96 km mountain trail across the Owen Stanley Range of Papua New Guinea, following the route of the 1942 Second World War campaign where Australian forces fought to halt the Japanese advance. The terrain — steep, jungle-clad ridges in intense tropical heat and humidity — is relentless. The track is as much a pilgrimage of military history as it is an adventure; every village has a war story, and porters carry both your pack and the oral history.`,
      location: "Port Moresby",
      country: "Papua New Guinea",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["WWII battlefield sites", "Owen Stanley Range ridges", "Kokoda village memorial", "Papua New Guinea culture", "Tropical forest immersion"],
      gear: ["Lightweight trek clothes", "Waterproof boots", "Malaria prophylaxis", "Electrolytes", "Porter engagement"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 2800,
      latitude: -9.44,
      longitude: 147.18,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["jungle"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure182.id }, { userId: user2.id, adventureId: adventure182.id }], skipDuplicates: true });


  // Adventure 183
  const adventure183 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-183" },
    update: {},
    create: {
      id: "seed-adventure-183",
      title: "Namibia Desert Trek",
      description: `A 5-day self-supported trek through the Namib-Naukluft National Park — from the ancient Sossusvlei dunes through the calcrete plains and granite inselbergs of the Naukluft to the Olive Trail — crosses the world's oldest desert in its least-visited corner. Dead acacia trees bleached white against orange dunes, gemsbok leaving lone tracks across clay pans, and stars unpolluted for 1,000 km in any direction make this an austere, beautiful experience.`,
      location: "Sesriem",
      country: "Namibia",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Sossusvlei dead vlei dawn", "Naukluft massif", "Gemsbok herds", "Desert star sky", "Olive Trail circuit"],
      gear: ["10L water minimum per day", "Sun protection extreme", "Lightweight shelterr", "Navigation tools", "Minimal weight"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 1800,
      latitude: -24.69,
      longitude: 15.34,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["desert"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure183.id }, { userId: user2.id, adventureId: adventure183.id }], skipDuplicates: true });


  // Adventure 184
  const adventure184 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-184" },
    update: {},
    create: {
      id: "seed-adventure-184",
      title: "Cotswold Way Walking",
      description: `The Cotswold Way is 164 km from Chipping Campden to Bath along the western escarpment of the Cotswolds, passing honey-stone villages built from local oolitic limestone, Iron Age hill forts, beech-wood ridge paths, and the spectacular Cleeve Hill and Haresfield Beacon. It is quintessential English long-distance walking — gentle enough for beginners, varied enough to satisfy experienced walkers, and finishable with a Roman bath and a gin and tonic.`,
      location: "Chipping Campden",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=1600&q=80",
      highlights: ["Bourton-on-the-Water", "Cleeve Hill views", "Bath Roman finish", "Haresfield Beacon", "Cotswold limestone villages"],
      gear: ["Walking boots", "Waterproof jacket", "Trekking poles optional", "B&B accommodation list", "OS map"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 900,
      latitude: 52.05,
      longitude: -1.77,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["europe"].id }, { id: allTags["hiking"].id }, { id: allTags["solo-travel"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure184.id }, { userId: user2.id, adventureId: adventure184.id }], skipDuplicates: true });


  // Adventure 185
  const adventure185 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-185" },
    update: {},
    create: {
      id: "seed-adventure-185",
      title: "Atacama Salt Flats Cycling",
      description: `Cycling from San Pedro de Atacama through the Salar de Atacama — the world's driest desert and largest lithium deposit — to the Bolivian salt flats of Uyuni combines dramatic desert scenery with extreme altitude. The route crosses geysers at dawn, flamingo lagoons tinted pink at sunset, and the infinite white mirror of the Uyuni salt flat. Roads are rough; altitude from 3,500–5,000 m demands acclimatisation. Winds in the afternoon are fierce.`,
      location: "San Pedro de Atacama",
      country: "Chile",
      continent: "South America",
      category: Category.CYCLING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Salar de Atacama", "Uyuni salt flat Bolivia", "Geysers del Tatio at dawn", "Flamingo lagoons", "Atacama stargazing"],
      gear: ["Mountain bike (fat tyres preferred)", "Panniers", "Altitude medication", "Sun protection extreme", "Down jacket for nights"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 2200,
      latitude: -22.91,
      longitude: -68.2,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["desert"].id }, { id: allTags["high-altitude"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure185.id }, { userId: user2.id, adventureId: adventure185.id }], skipDuplicates: true });


  // Adventure 186
  const adventure186 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-186" },
    update: {},
    create: {
      id: "seed-adventure-186",
      title: "Outer Hebrides Cycling",
      description: `The Hebridean Way runs 300 km from Vatersay in the south to the Butt of Lewis in the north, cycling the string of islands connected by causeways through the wildest Atlantic seascape in Europe. The Western Isles have 6,000 years of human history layered under the surface — Callanish Standing Stones, Dun Carloway broch, and the black houses of Arnol — and beaches of white shell sand and turquoise water that would pass for the Caribbean if the temperature were 20° warmer.`,
      location: "Vatersay",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Callanish Standing Stones", "Luskentyre beach", "Harris Tweed mill visit", "Dun Carloway broch", "Butt of Lewis lighthouse"],
      gear: ["Touring bike", "Panniers", "Waterproof kit", "Wind jacket", "Midges head net"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 1800,
      latitude: 57.08,
      longitude: -7.54,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["island"].id }, { id: allTags["scotland"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure186.id }, { userId: user2.id, adventureId: adventure186.id }], skipDuplicates: true });


  // Adventure 187
  const adventure187 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-187" },
    update: {},
    create: {
      id: "seed-adventure-187",
      title: "Rwenzori Mountains Trek",
      description: `The Rwenzori Mountains — Africa's Mountains of the Moon straddling the Uganda-DRC border — are a UNESCO World Heritage site and one of the most unusual landscapes on earth. Giant lobelias and groundsels, some over 6 m tall, crowd the valleys; the summit zone of Mount Stanley (5,109 m) is perpetually glaciated at the equator. The 7-day Central Circuit visits all the high camps and the glaciers that are visibly retreating each year. A guide and porter are mandatory.`,
      location: "Kasese",
      country: "Uganda",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Mount Stanley 5,109m", "Giant lobelia forest", "Equatorial glaciers", "Scott Elliott Pass", "Bujuku Lake"],
      gear: ["Waterproof everything", "Crampons (summit attempt)", "Down jacket", "Gaiters", "Trekking poles"],
      bestMonths: [12, 1, 2, 6, 7, 8],
      estimatedCost: 2500,
      latitude: 0.37,
      longitude: 29.9,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["glacier"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure187.id }, { userId: user2.id, adventureId: adventure187.id }], skipDuplicates: true });


  // Adventure 188
  const adventure188 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-188" },
    update: {},
    create: {
      id: "seed-adventure-188",
      title: "Iceland Winter Ice Cave",
      description: `The crystal blue ice caves that form each winter inside the Vatnajökull glacier in southeast Iceland are one of nature's most extraordinary interiors — curved walls of ancient glacial ice in every shade of blue, from pale aquamarine to deep cobalt, with black volcanic ash layers recording past eruptions. Caves form between October and March and are guided-access only. Combine with the Jökulsárlón glacial lagoon where icebergs float silently to the black sand Diamond Beach.`,
      location: "Jökulsárlón",
      country: "Iceland",
      continent: "Europe",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EASY,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Blue crystal ice cave interior", "Jökulsárlón glacier lagoon", "Diamond Beach icebergs", "Northern lights", "Skaftafell ice walk"],
      gear: ["Micro-spikes provided", "Warm layers", "Waterproof boots", "Camera", "Aurora alert app"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 2500,
      latitude: 64.05,
      longitude: -16.18,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["glacier"].id }, { id: allTags["photography"].id }, { id: allTags["arctic"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure188.id }, { userId: user2.id, adventureId: adventure188.id }, { userId: user3.id, adventureId: adventure188.id }], skipDuplicates: true });


  // Adventure 189
  const adventure189 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-189" },
    update: {},
    create: {
      id: "seed-adventure-189",
      title: "Elburz Mountains Ski Tour",
      description: `The Alborz range north of Tehran rises to over 5,600 m at Mount Damavand, the world's highest volcano, and offers extraordinary ski touring on snow that is consistently deep, dry, and cold from December to April. The Dizin resort at 3,600 m offers lift-accessed off-piste; the Damavand approach involves a 2-day tour on crampons and skis to a crater-rim summit. The contrast between Tehran's urban sprawl and the pristine alpine world one hour away is remarkable.`,
      location: "Tehran",
      country: "Iran",
      continent: "Asia",
      category: Category.SKIING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["Mount Damavand 5,610m", "Dizin resort off-piste", "Dry powder snow", "Tochal ski area", "Persian hospitality"],
      gear: ["Ski touring kit", "Crampons for Damavand", "Avalanche safety equipment", "Layering system", "Visa documents"],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 2500,
      latitude: 35.76,
      longitude: 51.41,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["mountaineering"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure189.id }, { userId: user2.id, adventureId: adventure189.id }], skipDuplicates: true });


  // Adventure 190
  const adventure190 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-190" },
    update: {},
    create: {
      id: "seed-adventure-190",
      title: "Australian Outback Walk",
      description: `The Larapinta Trail runs 230 km along the backbone of the West MacDonnell Ranges from Alice Springs to Mount Sonder, through ancient quartzite ranges, red gorges, and desert waterholes where black-footed rock wallabies come to drink at dusk. The trail is dry — carry 6 litres minimum between water caches — and remote. Walking in June–August brings mild days and cold nights; April–May and September–October offer wildflower colour. Aboriginal Arrernte country requires cultural awareness.`,
      location: "Alice Springs",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Mount Sonder summit", "Ormiston Gorge waterhole", "Wallaby sightings at dusk", "Desert red rock landscape", "Alice Springs start"],
      gear: ["6L+ water carry capacity", "Sun protection extreme", "Lightweight tent", "Insulation for cold nights", "Satellite communicator"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 1500,
      latitude: -23.7,
      longitude: 133.88,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["desert"].id }, { id: allTags["australia"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure190.id }, { userId: user2.id, adventureId: adventure190.id }], skipDuplicates: true });


  // Adventure 191
  const adventure191 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-191" },
    update: {},
    create: {
      id: "seed-adventure-191",
      title: "Socotra Island Trekking",
      description: `Socotra Island in the Arabian Sea is the Galápagos of the Indian Ocean — 37% of its plant species are found nowhere else on earth, including the extraordinary Dragon Blood Tree with its umbrella canopy, the frankincense trees, and the bottle-shaped Desert Rose. The island has basic tourism infrastructure and requires a Yemeni visa (current access via flights from Abu Dhabi). Trekking the interior plateau and coastal dunes is the way to experience the alien vegetation.`,
      location: "Hadibo",
      country: "Yemen",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Dragon Blood Trees", "Desert Rose succulent forests", "Dihamri Marine Reserve", "Detwah lagoon", "Nomadic herder encounters"],
      gear: ["Light summer clothing", "Sun protection extreme", "Cash only (no ATMs)", "Water purification", "Wind protection"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 2500,
      latitude: 12.64,
      longitude: 54.01,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["island"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure191.id }, { userId: user2.id, adventureId: adventure191.id }], skipDuplicates: true });


  // Adventure 192
  const adventure192 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-192" },
    update: {},
    create: {
      id: "seed-adventure-192",
      title: "Tour de Mont Blanc Running",
      description: `Running the Tour du Mont Blanc (the Ultra-Trail du Mont Blanc course) in 5 days — rather than the hiker's 11 — is one of the most accessible ultra-endurance challenges in the mountains. The 170 km circuit with 10,000 m of gain is split into 30–40 km days with rifugio nights. No technical terrain, but sustained effort at altitude. September after the UTMB race sees the trails quieter and the larch forests turning gold.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.EXTREME,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["UTMB course", "Three-country traverse", "September larch colour", "Rifugio Bonatti", "Chamonix start and finish"],
      gear: ["Trail running shoes", "Poles (optional)", "Lightweight pack", "Navigation watch", "Mandatory safety kit"],
      bestMonths: [7, 8, 9],
      estimatedCost: 2000,
      latitude: 45.92,
      longitude: 6.87,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["multi-sport"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure192.id }, { userId: user2.id, adventureId: adventure192.id }], skipDuplicates: true });


  // Adventure 193
  const adventure193 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-193" },
    update: {},
    create: {
      id: "seed-adventure-193",
      title: "Wadi Rum Desert Traverse",
      description: `Wadi Rum is the largest wadi in Jordan — a valley of red and orange sandstone rising in monumental jebels (mountains) over a vast flat desert floor, where Lawrence of Arabia camped and where the Martian landscape draws film crews from around the world. A 5-day trek crosses the interior on foot with a Bedouin guide, sleeping in black goat-hair tents and waking to silence. The rock climbing at Jebel Rum is world-class; the sunsets are simply impossible.`,
      location: "Wadi Rum",
      country: "Jordan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Bedouin camp nights", "Jebel Rum monolith", "Lawrence's Spring", "Desert sunset colours", "Star sky from open desert"],
      gear: ["Light loose clothing", "Sun protection", "Headtorch", "Cash (Jordan dinars)", "Scarf for sand"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 1200,
      latitude: 29.57,
      longitude: 35.42,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["desert"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure193.id }, { userId: user2.id, adventureId: adventure193.id }], skipDuplicates: true });


  // Adventure 194
  const adventure194 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-194" },
    update: {},
    create: {
      id: "seed-adventure-194",
      title: "Azores Multi-Island Trek",
      description: `The nine volcanic islands of the Azores in the mid-Atlantic are connected by ferry and short hops, offering a week of crater lake hikes, whale watching, geothermal pools, and dramatic coastal paths. Sete Cidades on São Miguel — two lakes in a single caldera, one blue and one green — is the icon; Pico's volcanic cone at 2,351 m is the challenge. The whale watching from Faial is considered among the best in the world.`,
      location: "Ponta Delgada",
      country: "Portugal",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Sete Cidades crater lakes", "Pico volcano summit", "Whale watching Faial", "Caldeira do Faial", "Furnas geothermal valley"],
      gear: ["Hiking boots", "Waterproof jacket", "Layers", "Snorkelling kit", "Island hopping schedule"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 2500,
      latitude: 37.74,
      longitude: -25.67,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["island"].id }, { id: allTags["volcanic"].id }, { id: allTags["europe"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure194.id }, { userId: user2.id, adventureId: adventure194.id }], skipDuplicates: true });


  // Adventure 195
  const adventure195 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-195" },
    update: {},
    create: {
      id: "seed-adventure-195",
      title: "Iditarod Trail Dog Sled",
      description: `The Iditarod Trail — 1,600 km from Anchorage to Nome across Alaska's frozen interior — is best known as the world's toughest sled dog race, but the trail is also accessible for supported expeditions and ski touring from Knik to Skwentna in the southern sections. Mushing even a short distance with a 12-dog team through boreal forest and tundra silence is a transport experience unlike any other on earth. The Yukon Quest route from Fairbanks is the alternative.`,
      location: "Anchorage",
      country: "United States",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: ["Dog sled experience", "Alaskan interior tundra", "Aurora borealis", "Nome finish (race spectator)", "Susitna River ice crossing"],
      gear: ["Arctic cold weather kit", "Sled (guided provision)", "Glacier glasses", "Balaclava", "Emergency bivouac"],
      bestMonths: [2, 3, 4],
      estimatedCost: 8000,
      latitude: 61.22,
      longitude: -149.9,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["arctic"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure195.id }, { userId: user2.id, adventureId: adventure195.id }], skipDuplicates: true });


  // Adventure 196
  const adventure196 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-196" },
    update: {},
    create: {
      id: "seed-adventure-196",
      title: "Via Alpina Green Route",
      description: `The Via Alpina Green Route traverses the entire Alpine arc from Trieste to Monaco in 161 stages and 2,500 km across 5 countries — Slovenia, Austria, Germany, Liechtenstein, Switzerland, and France — staying entirely in the mountains from the Julian Alps to the Maritime Alps. Most trekkers take the summer to walk a section; completing the full route requires a dedicated season. Mountain huts, alpine meadows, and the entire Alpine ecosystem.`,
      location: "Trieste",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 90,
      coverImageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1600&q=80",
      highlights: ["Julian Alps Slovenia", "Zugspitze approach Germany", "Swiss Alpine passes", "Maritime Alps finale", "161-stage circuit"],
      gear: ["Lightweight trekking kit", "Hut sleeping sheet", "Navigation tools", "Multi-country currency", "Long-distance mindset"],
      bestMonths: [6, 7, 8],
      estimatedCost: 8000,
      latitude: 45.65,
      longitude: 13.77,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["expedition"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure196.id }, { userId: user2.id, adventureId: adventure196.id }], skipDuplicates: true });


  // Adventure 197
  const adventure197 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-197" },
    update: {},
    create: {
      id: "seed-adventure-197",
      title: "Everest Three Passes Trek",
      description: `The Three High Passes route in the Khumbu extends the standard Everest Base Camp trek with crossings of Renjo La (5,360 m), Cho La (5,420 m), and Kongma La (5,535 m) — making it one of the most physically demanding trekking routes in Nepal. The circuit takes in Gokyo Lake and Ri (spectacular Everest views from the fifth lake), crosses exposed glacial moraine between passes, and includes the EBC hike. Allow acclimatisation days; this is a minimum 18-day commitment.`,
      location: "Lukla",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 20,
      coverImageUrl: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=1600&q=80",
      highlights: ["Gokyo Ri sunrise views", "Three passes above 5,300m", "Everest Base Camp", "Cho La glacier crossing", "Khumbu Icefall view"],
      gear: ["Sleeping bag -20°C", "Crampons for glacier passes", "Trekking poles", "Altitude medication", "Layering system"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 3000,
      latitude: 27.69,
      longitude: 86.73,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["glacier"].id }, { id: allTags["bucket-list"].id }, { id: allTags["8000m"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure197.id }, { userId: user2.id, adventureId: adventure197.id }], skipDuplicates: true });


  // Adventure 198
  const adventure198 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-198" },
    update: {},
    create: {
      id: "seed-adventure-198",
      title: "Lost Coast Trail",
      description: `The Lost Coast of northern California is one of the few sections of the US Pacific Coast inaccessible by road — the terrain was too steep and the population too sparse for Highway 1 to penetrate. The 35 km King Range trail runs between Mattole Beach and Shelter Cove along a coastline of tidal rocks, sea stacks, black sand beaches, and old-growth Douglas fir forest. Timing is critical — the tidal flats impassable at high tide. Plan around the tidal tables.`,
      location: "Petrolia",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Black sand beaches", "Tidal rock hopping", "Sea lion haul-outs", "King Range old growth forest", "Zero road access"],
      gear: ["Tidal tables (mandatory)", "Waterproof boots", "Bear canister", "Camping kit", "Lightweight pack"],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 600,
      latitude: 40.32,
      longitude: -124.28,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["coastal"].id }, { id: allTags["camping"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure198.id }, { userId: user2.id, adventureId: adventure198.id }], skipDuplicates: true });


  // Adventure 199
  const adventure199 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-199" },
    update: {},
    create: {
      id: "seed-adventure-199",
      title: "Pyrenees Haute Route",
      description: `The Pyrenees Haute Route is the high-level traverse of the Pyrenees from the Atlantic near Hendaye to the Mediterranean at Banyuls-sur-Mer — 800 km of mountain walking at altitude, mostly in Spain with regular dips into France. The route passes the volcanic Gavarnie cirque (the largest in Europe), the granite towers of the Aiguilles d'Ansabère, the remote Ordesa canyon, and the summit of Aneto (3,404 m), the highest point in the Pyrenees.`,
      location: "Hendaye",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 40,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Cirque de Gavarnie", "Aneto summit 3,404m", "Ordesa canyon", "Aiguilles d'Ansabère", "Mediterranean finish at Banyuls"],
      gear: ["Navigation tools", "Bivouac capability", "Crampons (early season Aneto)", "Trekking poles", "French-Spanish phrasebook"],
      bestMonths: [7, 8, 9],
      estimatedCost: 4500,
      latitude: 43.37,
      longitude: -1.77,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["thru-hike"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure199.id }, { userId: user2.id, adventureId: adventure199.id }], skipDuplicates: true });


  // Adventure 200
  const adventure200 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-200" },
    update: {},
    create: {
      id: "seed-adventure-200",
      title: "Nanda Devi Sanctuary Trek",
      description: `The Nanda Devi Sanctuary in the Garhwal Himalaya of Uttarakhand is one of the world's most restricted wilderness areas — surrounded by a ring of peaks above 6,000 m, the inner sanctuary can only be visited with special permits and under strict quota. The approach from Lata village via the Rishi Gorge is famous as one of the most demanding approach treks in the Himalaya. Nanda Devi herself at 7,816 m is the second-highest peak in India.`,
      location: "Joshimath",
      country: "India",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 25,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Nanda Devi 7,816m", "Rishi Gorge approach", "Sanctuary restricted interior", "Himalayan flora sanctuary", "Garhwal village culture"],
      gear: ["Expedition sleeping system", "High-altitude boots", "Rishi Gorge technical climbing gear", "Altitude medication", "Special permit documentation"],
      bestMonths: [5, 6, 9, 10],
      estimatedCost: 6000,
      latitude: 30.56,
      longitude: 79.57,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["mountaineering"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["8000m"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure200.id }, { userId: user2.id, adventureId: adventure200.id }], skipDuplicates: true });


  // Adventure 201
  const adventure201 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-201" },
    update: {},
    create: {
      id: "seed-adventure-201",
      title: "Trolltunga Hike",
      description: `Trolltunga (Troll's Tongue) is the most spectacular rock formation in Norway — a horizontal slab of gneiss jutting 700 m above Lake Ringedalsvatnet in the Hardangerfjord region. The 28 km return hike gains 1,000 m and takes 8–12 hours round trip from Odda. The queues for the photograph have grown enormous in summer; arriving at the summit in the pre-dawn darkness for sunrise is the way to experience the place as it was meant to be seen.`,
      location: "Odda",
      country: "Norway",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Trolltunga rock ledge", "Lake Ringedalsvatnet", "Hardangerfjord views", "Sunrise from the tongue", "Norwegian mountain scenery"],
      gear: ["Hiking boots", "Waterproof jacket", "Head torch for pre-dawn start", "Warm layers", "Trekking poles"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 800,
      latitude: 60.13,
      longitude: 6.74,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["europe"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure201.id }, { userId: user2.id, adventureId: adventure201.id }, { userId: user3.id, adventureId: adventure201.id }], skipDuplicates: true });


  // Adventure 202
  const adventure202 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-202" },
    update: {},
    create: {
      id: "seed-adventure-202",
      title: "Bolivia Altiplano Salt Flat Trek",
      description: `Crossing the Salar de Uyuni — 10,582 sq km of perfectly flat salt at 3,656 m — on foot over three days is one of the most disorientating experiences in travel: no horizon, no shadow, no depth, just white. The edge effects of the salt flat's geometric polygon cracks, the Isla Incahuasi cactus island in the middle, and the mirror effect after light rain transform the landscape repeatedly. Nights camping on the salt under the Milky Way at altitude are unforgettable.`,
      location: "Uyuni",
      country: "Bolivia",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Salar mirror effect after rain", "Isla Incahuasi cactus", "Salt flat camping at night", "Coloured lagoons Eduardo Avaroa", "Flamingo breeding lakes"],
      gear: ["Sun protection (reflected UV severe)", "Sunglasses polarised", "Altitude medication", "Wind layers", "Water purification"],
      bestMonths: [1, 2, 3, 11, 12],
      estimatedCost: 1200,
      latitude: -20.46,
      longitude: -66.83,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["desert"].id }, { id: allTags["high-altitude"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure202.id }, { userId: user2.id, adventureId: adventure202.id }, { userId: user3.id, adventureId: adventure202.id }], skipDuplicates: true });


  // Adventure 203
  const adventure203 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-203" },
    update: {},
    create: {
      id: "seed-adventure-203",
      title: "Easter Island Discovery",
      description: `Easter Island (Rapa Nui) sits 3,500 km off the Chilean coast in the southeast Pacific — the most remote inhabited island on earth — and hosts 900 moai statues carved from volcanic tuff and placed on ceremonial ahu platforms across a 163 sq km landscape. Walking the circuit of the island in 4 days reveals the quarry at Rano Raraku where 400 unfinished statues remain, the ceremonial village of Orongo, and cliff-top views over endless Pacific.`,
      location: "Hanga Roa",
      country: "Chile",
      continent: "South America",
      category: Category.CULTURAL,
      difficulty: Difficulty.EASY,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80",
      highlights: ["Rano Raraku moai quarry", "Ahu Tongariki 15 moai", "Orongo ceremonial village", "Anakena beach", "Island circuit walk"],
      gear: ["Sun protection extreme", "Light hiking shoes", "Camera", "Rapa Nui national park pass", "Spanish phrasebook"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 3000,
      latitude: -27.11,
      longitude: -109.37,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["island"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure203.id }, { userId: user2.id, adventureId: adventure203.id }], skipDuplicates: true });


  // Adventure 204
  const adventure204 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-204" },
    update: {},
    create: {
      id: "seed-adventure-204",
      title: "Nepal Mustang Kingdom Trek",
      description: `The Upper Mustang — the ancient kingdom of Lo on the Tibetan plateau north of Annapurna — was opened to trekking only in 1992 and remains heavily restricted (USD 500 permit for 10 days). The landscape is a high-altitude desert of wind-eroded red cliffs, centuries-old cave monasteries, whitewashed villages where Tibetan Buddhism survives in its pre-Chinese form, and the walled capital of Lo Manthang. The restricted permit keeps it genuinely remote.`,
      location: "Jomsom",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Lo Manthang walled city", "Cave monastery frescoes", "Tibetan desert landscape", "Kali Gandaki headwaters", "Traditional Tibetan culture"],
      gear: ["Restricted permit (arranged in Kathmandu)", "Altitude medication", "Layering system", "Trekking poles", "Wind protection"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 3500,
      latitude: 29.18,
      longitude: 83.97,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure204.id }, { userId: user2.id, adventureId: adventure204.id }], skipDuplicates: true });


  // Adventure 205
  const adventure205 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-205" },
    update: {},
    create: {
      id: "seed-adventure-205",
      title: "Fiji Multi-Island Surf Trip",
      description: `Fiji has the world's most consistent surf, with Cloudbreak at Tavarua producing the longest, most powerful left-hand barrel in the Southern Hemisphere. The Mamanuca and Yasawa island chains offer surf breaks at every level from Restaurants (gentle reef fun) to Cloudbreak (expert only). Combine charter boat access to empty reef passes, island village kava ceremonies, and above-water bure accommodation for a surf trip that goes well beyond the surf.`,
      location: "Nadi",
      country: "Fiji",
      continent: "Oceania",
      category: Category.SURFING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=1600&q=80",
      highlights: ["Cloudbreak at Tavarua", "Restaurants beginner reef", "Kava ceremony", "Yasawa island villages", "Namotu Left"],
      gear: ["Shortboard and fun board", "Reef booties", "Wetsuit rash top", "Sun protection", "GoPro mount"],
      bestMonths: [4, 5, 6, 7, 8, 9, 10],
      estimatedCost: 5000,
      latitude: -17.71,
      longitude: 177.45,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["island"].id }, { id: allTags["coastal"].id }, { id: allTags["bucket-list"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure205.id }, { userId: user2.id, adventureId: adventure205.id }], skipDuplicates: true });


  // Adventure 206
  const adventure206 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-206" },
    update: {},
    create: {
      id: "seed-adventure-206",
      title: "Masoala Peninsula Trek",
      description: `The Masoala Peninsula in northeast Madagascar is the largest primary rainforest reserve in Madagascar and the richest biodiversity hotspot in the Indian Ocean — home to 11 lemur species, the helmet vanga, red ruffed lemurs, and the iridescent comet moth. Getting there involves a boat from Maroantsetra; moving through the park involves local guides and basic forest camps. The peninsula's bay-side beaches are among the most isolated in the Indian Ocean.`,
      location: "Maroantsetra",
      country: "Madagascar",
      continent: "Africa",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["Red ruffed lemurs", "Helmet vanga birdwatching", "Comet moth", "Masoala rainforest interior", "Bay of Antongil humpbacks"],
      gear: ["Lightweight jungle clothes", "Waterproof bags", "Malaria prophylaxis", "Leech socks", "Binoculars"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 3500,
      latitude: -15.43,
      longitude: 49.74,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["jungle"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["island"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure206.id }, { userId: user2.id, adventureId: adventure206.id }], skipDuplicates: true });


  // Adventure 207
  const adventure207 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-207" },
    update: {},
    create: {
      id: "seed-adventure-207",
      title: "Traverse of the Angels",
      description: `The Traverse of the Angels (Traversata degli Angeli) is a 7-day high-level route across the Apuan Alps in Tuscany — an unusual mountain range of white Carrara marble rising directly above the Ligurian coast, where marble quarries expose raw white cliffs visible from the sea. The traverse links via ferrata, ridge paths, and mountain rifugi, with views simultaneously inland to the Apennines and out to sea.`,
      location: "Carrara",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1600&q=80",
      highlights: ["Marble quarry landscapes", "Rifugio Carrara", "Apuan ridge traverses", "Ligurian Sea views", "Monte Pisanino summit"],
      gear: ["Hiking boots", "Via ferrata kit", "Trekking poles", "Map and compass", "Italian-English dictionary"],
      bestMonths: [5, 6, 7, 8, 9, 10],
      estimatedCost: 1500,
      latitude: 44.08,
      longitude: 10.1,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["via-ferrata"].id }, { id: allTags["europe"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure207.id }, { userId: user2.id, adventureId: adventure207.id }], skipDuplicates: true });


  // Adventure 208
  const adventure208 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-208" },
    update: {},
    create: {
      id: "seed-adventure-208",
      title: "Ganges Source Trek",
      description: `The Gangotri to Gomukh trek follows the Bhagirathi River to its source at the Gangotri Glacier at 3,900 m — a 20 km route through the Garhwal Himalaya that is simultaneously a Hindu pilgrimage and a mountain wilderness trek. The glacier snout at Gomukh, from which the holy river emerges, is retreating visibly; scientists estimate 22 m per year. Continuing to Tapovan meadow above the glacier gives views of Shivling and Bhagirathi peaks.`,
      location: "Gangotri",
      country: "India",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Gomukh glacier snout", "Shivling peak view", "Gangotri temple ritual", "Tapovan meadow", "Himalayan flora"],
      gear: ["Trekking poles", "Altitude medication", "Layering system", "Waterproof boots", "Headtorch"],
      bestMonths: [5, 6, 9, 10],
      estimatedCost: 1200,
      latitude: 30.99,
      longitude: 79.07,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["glacier"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure208.id }, { userId: user2.id, adventureId: adventure208.id }], skipDuplicates: true });


  // Adventure 209
  const adventure209 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-209" },
    update: {},
    create: {
      id: "seed-adventure-209",
      title: "Trollfjord Kayak Norway",
      description: `Trollfjord is perhaps the most dramatic fjord in Norway — 2 km long and barely 100 m wide, enclosed by vertical walls of gabbro rising 1,000 m on each side, accessible only by boat. Kayaking into Trollfjord at dusk, when the rock walls reflect in still water and sea eagles patrol the cliff tops, is one of the defining fjord experiences in Scandinavia. The base is Svolvær in the Lofoten Islands; week-long circumnavigation of Austvågøya island is the full circuit.`,
      location: "Svolvær",
      country: "Norway",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Trollfjord approach", "Sea eagle encounters", "Lofoten islands scenery", "Midnight sun kayaking", "Svolvær fishing village"],
      gear: ["Sea kayak", "Dry suit", "VHF radio", "Tidal atlas", "Camping kit"],
      bestMonths: [5, 6, 7, 8],
      estimatedCost: 2500,
      latitude: 68.24,
      longitude: 14.57,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["europe"].id }, { id: allTags["midnight-sun"].id }, { id: allTags["photography"].id }, { id: allTags["coastal"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure209.id }, { userId: user2.id, adventureId: adventure209.id }], skipDuplicates: true });


  // Adventure 210
  const adventure210 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-210" },
    update: {},
    create: {
      id: "seed-adventure-210",
      title: "Canyonlands Canyoneering",
      description: `The canyon country of southern Utah — Canyonlands, Capitol Reef, and the remote Escalante canyons — offers world-class canyoneering: slot canyons sculpted by water into sinuous grooves of Navajo sandstone, rappels into ankle-deep water, and narrows where shoulders brush both walls. The most technical canyons in the Zion Narrows and Buckskin Gulch require permits and experience; the Peek-a-Boo and Spooky slots near Escalante need only a topo map and good judgment.`,
      location: "Moab",
      country: "United States",
      continent: "North America",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Zion Narrows wade", "Buckskin Gulch slot", "Peek-a-Boo loop", "Rappel drops", "Desert arch photography"],
      gear: ["Wetsuit (water canyons)", "Canyoneering shoes", "Rappel device and harness", "Dry bag", "Flood forecast check"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 1800,
      latitude: 38.57,
      longitude: -109.55,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["desert"].id }, { id: allTags["gorge"].id }, { id: allTags["photography"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure210.id }, { userId: user2.id, adventureId: adventure210.id }], skipDuplicates: true });


  // Adventure 211
  const adventure211 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-211" },
    update: {},
    create: {
      id: "seed-adventure-211",
      title: "Greenland Icesheet Traverse",
      description: `Crossing the Greenland Ice Sheet on skis from Kangerlussuaq on the west coast to Isortoq on the east coast — or the Nansen Route from Ammassalik — is a 3-week polar expedition on an ice sheet 1.8 km thick and 2,500 km long. The surface is flat but wind-blasted sastrugi make progress exhausting; white-outs are disorientating; temperatures drop to -40°C. Each team is fully self-supported with pulk sleds. This is a bucket-list polar traverse.`,
      location: "Kangerlussuaq",
      country: "Greenland",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 25,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Greenland Ice Sheet crossing", "Polar sunset from ice", "Sastrugi ice landscape", "Complete self-sufficiency", "East coast fjord arrival"],
      gear: ["Ski touring kit", "Pulk sled", "Polar sleeping bag -40°C", "Satellite communicator", "Wind-proof expedition tent"],
      bestMonths: [4, 5, 6],
      estimatedCost: 15000,
      latitude: 67.01,
      longitude: -50.69,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["glacier"].id }, { id: allTags["arctic"].id }, { id: allTags["remote"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure211.id }, { userId: user2.id, adventureId: adventure211.id }], skipDuplicates: true });


  // Adventure 212
  const adventure212 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-212" },
    update: {},
    create: {
      id: "seed-adventure-212",
      title: "Copper Canyon Trekking",
      description: `The Copper Canyon (Barrancas del Cobre) in Chihuahua, Mexico, is a network of six canyons deeper and broader than the Grand Canyon — up to 1,879 m deep and 150 km wide — carved by six rivers draining the Sierra Tarahumara. The Tarahumara (Rarámuri) people have lived in cave dwellings and scattered ranchos across the canyon for millennia and are famous for long-distance barefoot running. The Chepe train from Los Mochis to Chihuahua City is the iconic journey.`,
      location: "Creel",
      country: "Mexico",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80",
      highlights: ["Batopilas canyon descent", "Tarahumara community visit", "Chepe railway journey", "Divisadero viewpoint", "Urique river canyon floor"],
      gear: ["Hiking boots", "Sun protection", "Water (canyon is hot)", "Trekking poles", "Spanish phrasebook"],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 1500,
      latitude: 27.74,
      longitude: -107.64,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["gorge"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["desert"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure212.id }, { userId: user2.id, adventureId: adventure212.id }], skipDuplicates: true });


  // Adventure 213
  const adventure213 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-213" },
    update: {},
    create: {
      id: "seed-adventure-213",
      title: "Kungsleden Southern Section",
      description: `The southern Kungsleden from Hemavan to Ammarnäs (78 km, 5 days) passes through some of the quietest wilderness in Europe — old-growth birch forest, open fells patrolled by golden eagles, brown bears foraging the bilberry hillsides, and rivers running tea-brown over granite boulders. This section has fewer hikers than the iconic northern Abisko-Kebnekaise stretch and the mountain station infrastructure is simpler and more personal.`,
      location: "Hemavan",
      country: "Sweden",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
      highlights: ["Lappland old-growth birch", "Golden eagle sightings", "Bear country walking", "Ammarnäs mountain station", "Tärnaby lake views"],
      gear: ["Midges head net", "Waterproof boots", "Trekking poles", "Layering system", "Bear awareness"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1400,
      latitude: 65.86,
      longitude: 15.08,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["europe"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure213.id }, { userId: user2.id, adventureId: adventure213.id }], skipDuplicates: true });


  // Adventure 214
  const adventure214 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-214" },
    update: {},
    create: {
      id: "seed-adventure-214",
      title: "Whitsundays Sailing",
      description: `The Whitsundays in Queensland — 74 islands in the Coral Sea, half of them national park, accessible only by boat — are among the world's finest bareboat charter destinations. Whitehaven Beach with its 98%-pure silica sand and the Hill Inlet colour-shifting tidal pool are the icons; the snorkelling at Bait Reef and Hardy Reef delivers turtles, reef sharks, and dense coral gardens. A bareboat charter for 4–6 people makes the mathematics work out better than a resort.`,
      location: "Airlie Beach",
      country: "Australia",
      continent: "Oceania",
      category: Category.KAYAKING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Whitehaven Beach silica", "Hill Inlet tidal pattern", "Hardy Reef snorkelling", "Island hopping anchorages", "Bareboat navigation"],
      gear: ["Sailing qualification or skipper hire", "Sun protection extreme", "Snorkelling kit", "Provisioning for 7 days", "Boat shoes"],
      bestMonths: [6, 7, 8, 9, 10, 11],
      estimatedCost: 4500,
      latitude: -20.27,
      longitude: 148.72,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["island"].id }, { id: allTags["coastal"].id }, { id: allTags["australia"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure214.id }, { userId: user2.id, adventureId: adventure214.id }], skipDuplicates: true });


  // Adventure 215
  const adventure215 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-215" },
    update: {},
    create: {
      id: "seed-adventure-215",
      title: "Stikine River Raft",
      description: `The Stikine River cuts through the Coast Mountains of British Columbia in the deepest navigable canyon in North America — the Grand Canyon of the Stikine — inaccessible except by river. The 90 km traverse between Telegraph Creek and Wrangell crosses Class IV–V whitewater in a glacially carved corridor with 2,000 m walls rising directly from the water. Eagles, bears, and mountain goats are constant companions. Self-supported rafting only; no outfitter access.`,
      location: "Telegraph Creek",
      country: "Canada",
      continent: "North America",
      category: Category.KAYAKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Grand Canyon of the Stikine", "Class V whitewater", "2,000m canyon walls", "Grizzly bear country", "Eagle colony watching"],
      gear: ["Raft or hardshell kayak", "Class V experience required", "Dry suits", "First aid kit", "Satellite communicator"],
      bestMonths: [6, 7, 8],
      estimatedCost: 5000,
      latitude: 57.91,
      longitude: -131.14,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["remote"].id }, { id: allTags["gorge"].id }, { id: allTags["expedition"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure215.id }, { userId: user2.id, adventureId: adventure215.id }], skipDuplicates: true });


  // Adventure 216
  const adventure216 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-216" },
    update: {},
    create: {
      id: "seed-adventure-216",
      title: "Fitz Roy Massif Trek",
      description: `The Fitz Roy massif in Los Glaciares National Park near El Chaltén is Patagonia's most dramatic granite terrain — a vertical world of towers and needles that inspired the Patagonia clothing logo. The base camp hike to Laguna de los Tres offers the iconic reflection of Monte Fitz Roy (3,405 m) in ice-cold water. Multiday circuits reach the Hielo Continental from the west; via ferrata access to the base of the Supercanaleta is for climbers only.`,
      location: "El Chaltén",
      country: "Argentina",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Laguna de los Tres reflection", "Fitz Roy sunrise alpenglow", "Cerro Torre approach", "El Chaltén trekking village", "Patagonian condors"],
      gear: ["Wind layers (essential)", "Waterproof jacket and trousers", "Trekking poles", "Warm sleeping bag", "Gaiters"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 2500,
      latitude: -49.33,
      longitude: -72.89,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["glacier"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure216.id }, { userId: user2.id, adventureId: adventure216.id }, { userId: user3.id, adventureId: adventure216.id }], skipDuplicates: true });


  // Adventure 217
  const adventure217 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-217" },
    update: {},
    create: {
      id: "seed-adventure-217",
      title: "Atlas Mountains Trek",
      description: `Jebel Toubkal (4,167 m) is the highest peak in North Africa and in the Atlas Mountains south of Marrakech. The 2-day ascent from Imlil via the Toubkal Refuge is straightforward in summer; winter conditions with ice and snow make crampons and ice axe necessary. Combine the summit with a 5-day circuit of the Toubkal massif via the Azzaden Valley and Tizi n'Ouanoums pass, sleeping in traditional Berber gîtes and eating tagine with mountain herbs.`,
      location: "Imlil",
      country: "Morocco",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Toubkal summit 4,167m", "Berber gîte hospitality", "Azzaden Valley views", "Marrakech arrival", "Atlas wildflower meadows"],
      gear: ["Crampons (winter/spring)", "Ice axe (winter)", "Layering system", "Trekking poles", "Sun protection"],
      bestMonths: [4, 5, 6, 9, 10],
      estimatedCost: 1200,
      latitude: 31.07,
      longitude: -7.92,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure217.id }, { userId: user2.id, adventureId: adventure217.id }], skipDuplicates: true });


  // Adventure 218
  const adventure218 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-218" },
    update: {},
    create: {
      id: "seed-adventure-218",
      title: "Kinabalu Summit Climb",
      description: `Mount Kinabalu in Sabah, Borneo, is the highest peak in Southeast Asia at 4,095 m and one of the world's great botanical mountains — the Park protects 5,000 plant species including 800 orchid species, 9 species of pitcher plant, and the world's largest flower, Rafflesia. The two-day summit climb from Timpohon Gate via the Laban Rata guesthouse is well-organised and popular; early booking is essential. The granite summit plateau at dawn is extraordinary.`,
      location: "Kota Kinabalu",
      country: "Malaysia",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1600&q=80",
      highlights: ["Summit plateau at 4,095m", "Low's Peak sunrise", "Pitcher plants", "Rafflesia bloom (seasonal)", "Borneo wildlife in the park"],
      gear: ["Hiking boots", "Warm layers (summit night)", "Head torch", "Gloves", "Summit permit (pre-book)"],
      bestMonths: [3, 4, 5, 6, 7, 8, 9],
      estimatedCost: 800,
      latitude: 6.08,
      longitude: 116.55,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure218.id }, { userId: user2.id, adventureId: adventure218.id }], skipDuplicates: true });


  // Adventure 219
  const adventure219 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-219" },
    update: {},
    create: {
      id: "seed-adventure-219",
      title: "Perito Moreno Glacier Trek",
      description: `The Perito Moreno glacier in Los Glaciares National Park is one of the few glaciers in the world that is not retreating — it advances at 2 m per day and periodically creates an ice dam across the Brazo Rico channel, which then breaks spectacularly. Ice trekking on the glacier surface with crampons takes you across a blue-white world of seracs, moulins, and crevasses that calve into the turquoise lake with thunder. The catwalks opposite offer free viewing; the ice trek is the upgrade.`,
      location: "El Calafate",
      country: "Argentina",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Glacier ice trekking", "Calving ice wall", "Brazo Rico dam formation", "Seracs and moulins", "Blue ice photography"],
      gear: ["Crampons provided", "Waterproof boots", "Wind jacket", "Gloves", "Camera"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 1800,
      latitude: -50.5,
      longitude: -73.05,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["glacier"].id }, { id: allTags["photography"].id }, { id: allTags["expedition"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure219.id }, { userId: user2.id, adventureId: adventure219.id }, { userId: user3.id, adventureId: adventure219.id }], skipDuplicates: true });


  // Adventure 220
  const adventure220 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-220" },
    update: {},
    create: {
      id: "seed-adventure-220",
      title: "Sahara Erg Chebbi Run",
      description: `A 250 km multi-stage running race through the Moroccan Sahara — the Marathon des Sables format — carries each runner's food and equipment on their back for 6 days through the Erg Chebbi dunes, rocky hamadas, dry riverbeds, and oasis palmeries. Each stage between 20 km and 80 km (the 'long stage') must be completed before dark. Over 1,000 runners from 40+ countries share a profound experience of physical and mental challenge in one of the world's most beautiful landscapes.`,
      location: "Ouarzazate",
      country: "Morocco",
      continent: "Africa",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.EXTREME,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["250km self-supported running", "Erg Chebbi dune crossing", "Long stage night survival", "Bivouac tent community", "Sahara silence at 3am"],
      gear: ["Ultralight mandatory kit list", "7 days food", "Gaiters (sand)", "Trail running shoes (local sand-adapted)", "Emergency kit"],
      bestMonths: [4],
      estimatedCost: 4500,
      latitude: 30.93,
      longitude: -6.9,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["multi-sport"].id }, { id: allTags["desert"].id }, { id: allTags["bucket-list"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure220.id }, { userId: user2.id, adventureId: adventure220.id }], skipDuplicates: true });


  // Adventure 221
  const adventure221 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-221" },
    update: {},
    create: {
      id: "seed-adventure-221",
      title: "Senja Island Norway Hiking",
      description: `Senja, Norway's second-largest island, combines the Lofoten Islands' dramatic scenery with almost none of the crowds — jagged peaks dropping to fjords on the west and gentle agricultural slopes on the east, Arctic terns diving over fishing villages, and the midnight sun painting everything gold from May to July. The Segla summit hike (638 m) is the iconic route; the Husfjellet ridge walk is the quieter alternative. Eagles and orca in Øksfjorden complete the picture.`,
      location: "Skaland",
      country: "Norway",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Segla summit views", "Midnight sun fjord light", "Arctic tern diving", "Orca spotting (winter)", "Empty trails"],
      gear: ["Hiking boots", "Waterproof jacket", "Warm layers", "Camera telephoto", "Midges protection"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 2000,
      latitude: 69.23,
      longitude: 17.52,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["island"].id }, { id: allTags["europe"].id }, { id: allTags["midnight-sun"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure221.id }, { userId: user2.id, adventureId: adventure221.id }], skipDuplicates: true });


  // Adventure 222
  const adventure222 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-222" },
    update: {},
    create: {
      id: "seed-adventure-222",
      title: "Flores Island Hiking",
      description: `Flores in eastern Indonesia is the gateway to Komodo National Park and the home of Mount Kelimutu — three crater lakes that change colour independently between turquoise, black, and deep red depending on volcanic chemistry. The lake colours shift seasonally; dawn visits catch the mist lifting from the caldera. Walking the Bajawa plateau reveals traditional Ngada villages with conical men's houses and shrine ancestor poles; the road from Labuan Bajo to Ende passes extraordinary volcanic scenery.`,
      location: "Labuan Bajo",
      country: "Indonesia",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1600&q=80",
      highlights: ["Kelimutu crater lakes", "Komodo dragon encounter", "Ngada traditional villages", "Bajawa volcanic plateau", "Manta ray snorkelling"],
      gear: ["Hiking boots", "Snorkelling kit", "Sun protection", "Light clothing", "Camera"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 1500,
      latitude: -8.46,
      longitude: 120.01,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["volcanic"].id }, { id: allTags["island"].id }, { id: allTags["wildlife"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure222.id }, { userId: user2.id, adventureId: adventure222.id }], skipDuplicates: true });


  // Adventure 223
  const adventure223 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-223" },
    update: {},
    create: {
      id: "seed-adventure-223",
      title: "Lofoten Islands Winter Hike",
      description: `The Lofoten Islands in winter — from November to March — offer dramatic mountain scenery under the northern lights, the chance to ski directly from peaks into fjords (the Lofoten phenomenon of 'skreien', dry powder over steep sea-slope terrain), and the extraordinary experience of hiking across empty beaches at -10°C with aurora dancing overhead. Svolvær Goat (Svolværgeita) is the technical twin-summit that defines the islands' silhouette.`,
      location: "Svolvær",
      country: "Norway",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Northern lights", "Svolvær Goat summit", "Arctic beach landscapes", "Skrei cod season villages", "Sea-to-summit skiing"],
      gear: ["Winter hiking boots", "Crampons", "Head torch", "Aurora alert app", "Cold weather layering"],
      bestMonths: [1, 2, 3, 11, 12],
      estimatedCost: 2500,
      latitude: 68.23,
      longitude: 14.57,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["arctic"].id }, { id: allTags["europe"].id }, { id: allTags["photography"].id }, { id: allTags["skiing"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure223.id }, { userId: user2.id, adventureId: adventure223.id }], skipDuplicates: true });


  // Adventure 224
  const adventure224 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-224" },
    update: {},
    create: {
      id: "seed-adventure-224",
      title: "Otter Trail South Africa",
      description: `The Otter Trail is South Africa's oldest and most oversubscribed hiking trail — 42 km along the Garden Route coastline from Storms River Mouth to Nature's Valley, crossing 11 rivers (some requiring swimming) through dense indigenous coastal forest of Outeniqua yellowwood and milkwood trees. Cape clawless otters, Knysna loeries, and dolphins surfing the shore swell are the companions. Permit bookings open 12 months in advance and close within hours.`,
      location: "Storms River",
      country: "South Africa",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["River estuary crossings", "Cape clawless otters", "Knysna loerie", "Coastal forest canopy", "Nature's Valley finish"],
      gear: ["Waterproof bags (river crossings)", "Hiking boots", "Snacks and self-catering kit", "Permit (book 12 months ahead)", "Dry bags"],
      bestMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      estimatedCost: 800,
      latitude: -33.99,
      longitude: 23.89,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["coastal"].id }, { id: allTags["wildlife"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure224.id }, { userId: user2.id, adventureId: adventure224.id }], skipDuplicates: true });


  // Adventure 225
  const adventure225 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-225" },
    update: {},
    create: {
      id: "seed-adventure-225",
      title: "Karakoram Highway Cycle",
      description: `The Karakoram Highway from Islamabad to Kashgar in China is one of the world's highest paved international roads, crossing the Khunjerab Pass at 4,693 m through the Karakoram, Himalayan, and Hindu Kush ranges simultaneously. Cycling this road passes under the second and twelfth highest mountains in the world (K2 from Concordia is a separate trek), through the Hunza Valley with its apricot orchards and ancient Silk Road forts, and over the pass into Xinjiang.`,
      location: "Islamabad",
      country: "Pakistan",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EXTREME,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Hunza Valley apricot season", "Khunjerab Pass 4,693m", "Passu Cones mountain view", "Kashgar Sunday market", "K2 visible from highway"],
      gear: ["Mountain touring bike", "Panniers", "Altitude medication", "Tent (wild camping)", "Pakistan SIM"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 3500,
      latitude: 33.72,
      longitude: 73.04,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["high-altitude"].id }, { id: allTags["mountains"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure225.id }, { userId: user2.id, adventureId: adventure225.id }], skipDuplicates: true });


  // Adventure 226
  const adventure226 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-226" },
    update: {},
    create: {
      id: "seed-adventure-226",
      title: "Overland Track Tasmania",
      description: `The Overland Track crosses the Tasmanian Wilderness World Heritage Area from Cradle Mountain to Lake St Clair over 65 km and 6 days, through alpine moorland, glacial lakes, ancient Huon pine forests, and the summit of Mount Ossa (1,617 m), Tasmania's highest peak. The walk is genuinely remote — no road access for the central 5 days. Side trips to Barn Bluff, Pelion West, and the waterfalls of the Narcissus River add days and rewards.`,
      location: "Cradle Mountain",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Cradle Mountain sunrise", "Mount Ossa summit 1,617m", "Wombat and wallaby", "Huon pine ancient forest", "Lake St Clair finish"],
      gear: ["Tent (huts limited)", "Warm layers (alpine conditions)", "Waterproof everything", "Fuel stove", "Bear canister equivalent"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 1200,
      latitude: -41.65,
      longitude: 145.95,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["australia"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure226.id }, { userId: user2.id, adventureId: adventure226.id }], skipDuplicates: true });


  // Adventure 227
  const adventure227 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-227" },
    update: {},
    create: {
      id: "seed-adventure-227",
      title: "Xinjiang Wilderness Traverse",
      description: `The Kanas Lake region in northern Xinjiang, on the border of Russia, Mongolia, and Kazakhstan, contains some of the most pristine and least-visited boreal wilderness in Asia — Mongolian-style steppe, Siberian taiga forest, and the deep blue of Kanas Lake, which local Tuvan herders believe contains a sea monster. Trekking from Hemu village through the forests and over the passes requires Chinese permits and a guide; autumn colour in late September is extraordinary.`,
      location: "Burqin",
      country: "China",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
      highlights: ["Kanas Lake", "Hemu Tuvan village", "Autumn taiga colour", "Altai Mountains crossing", "Semi-nomadic herder culture"],
      gear: ["Layering system", "Waterproof boots", "Tent (remote camping)", "Chinese SIM", "Permit documentation"],
      bestMonths: [8, 9, 10],
      estimatedCost: 2500,
      latitude: 47,
      longitude: 87,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["remote"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["wildlife"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure227.id }, { userId: user2.id, adventureId: adventure227.id }], skipDuplicates: true });


  // Adventure 228
  const adventure228 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-228" },
    update: {},
    create: {
      id: "seed-adventure-228",
      title: "El Caminito del Rey",
      description: `El Caminito del Rey (The King's Little Path) is a 7.7 km walkway pinned along the vertical walls of the Málaga gorges of El Chorro — originally built for hydroelectric workers in 1905 and restored in 2015 after years of closure following fatal accidents. The route traverses two gorges — Desfiladero de los Gaitanes and Desfiladero de Gaitanejo — on a 1 m-wide pathway with sheer drops below and the rock face inches from your shoulder. Book online; it sells out.`,
      location: "Málaga",
      country: "Spain",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80",
      highlights: ["El Chorro gorge path", "Gaitanes vertical walls", "Reservoir views", "Historical worker route", "Málaga base"],
      gear: ["Hiking shoes", "Helmet provided", "No vertigo", "Water", "Sunscreen"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 500,
      latitude: 36.93,
      longitude: -4.79,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["gorge"].id }, { id: allTags["europe"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure228.id }, { userId: user2.id, adventureId: adventure228.id }, { userId: user3.id, adventureId: adventure228.id }], skipDuplicates: true });


  // Adventure 229
  const adventure229 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-229" },
    update: {},
    create: {
      id: "seed-adventure-229",
      title: "Leh to Manali Motorcycle",
      description: `The Leh-Manali Highway is one of the world's great motorcycle journeys — 428 km across the Himalayan high plateau through five passes including Tanglang La at 5,328 m, the second-highest motorable pass in the world. The road is open only from June to early October; outside this window, snow closes all access. Riding through Tibetan Buddhist landscapes at altitude, camping at Sarchu (4,290 m), and descending into the Kullu valley via the Rohtang Pass is a week of unforgettable riding.`,
      location: "Leh",
      country: "India",
      continent: "Asia",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
      highlights: ["Tanglang La pass 5,328m", "Sarchu plateau camping", "Enfield Royal (hire)", "Ladakhi monastery stops", "Manali descent"],
      gear: ["Motorcycle licence", "Helmet", "Altitude medication", "Warm riding kit", "Basic repair kit"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1800,
      latitude: 34.16,
      longitude: 77.58,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure229.id }, { userId: user2.id, adventureId: adventure229.id }], skipDuplicates: true });


  // Adventure 230
  const adventure230 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-230" },
    update: {},
    create: {
      id: "seed-adventure-230",
      title: "Aeolian Islands Sea Kayak",
      description: `The seven Aeolian Islands north of Sicily — Lipari, Vulcano, Stromboli, Salina, Filicudi, Alicudi, and Panarea — form an active volcanic archipelago accessible by sea kayak from Milazzo. Paddling between islands takes advantage of the thermal winds and the reliable summer calm to cross channels up to 22 km. Stromboli's permanent eruption (every 15–20 minutes) is best viewed from the sea at night; Vulcano's fumarole beach is a sulphurous natural spa.`,
      location: "Milazzo",
      country: "Italy",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Stromboli night eruption view", "Vulcano fumarole spa beach", "Salina island green landscape", "Inter-island channel crossings", "Sicilian seafood at anchorage"],
      gear: ["Sea kayak", "Camping kit", "VHF radio", "Wind forecasting", "Waterproof maps"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 2500,
      latitude: 38.23,
      longitude: 15.22,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["island"].id }, { id: allTags["volcanic"].id }, { id: allTags["europe"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure230.id }, { userId: user2.id, adventureId: adventure230.id }], skipDuplicates: true });


  // Adventure 231
  const adventure231 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-231" },
    update: {},
    create: {
      id: "seed-adventure-231",
      title: "Torres del Paine Circuit",
      description: `The full Torres del Paine Circuit (the O, not just the W) adds the back side of the Paine Massif to the classic W Trek — 130 km total, taking in the remote Campamento Paso, the Torres del Paine north face, and the Los Perros glacier passage in a 9-day loop. The back side is dramatically emptier than the W, with Andean condors riding thermals above glacial lakes and the massif's granite towers seen from angles no photograph has captured. Weather is genuinely dangerous; refugios non-existent.`,
      location: "Puerto Natales",
      country: "Chile",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Torres back face", "Los Perros glacier", "Andean condors", "John Gardner Pass", "Back-circuit solitude"],
      gear: ["4-season tent", "Wind-proof everything", "Trekking poles", "Gaiters", "Emergency communication"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 2800,
      latitude: -51.73,
      longitude: -72.9,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["glacier"].id }, { id: allTags["mountains"].id }, { id: allTags["camping"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure231.id }, { userId: user2.id, adventureId: adventure231.id }], skipDuplicates: true });


  // Adventure 232
  const adventure232 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-232" },
    update: {},
    create: {
      id: "seed-adventure-232",
      title: "Sahel Overland",
      description: `The West African Sahel — the semi-arid transition zone from the Sahara to the savannas — stretches 5,400 km from Senegal to Chad and has been traversed by overlanders since the 1960s trans-Africa rallies. By 4WD from Dakar across Mali, Burkina Faso, Niger, and into Nigeria, the route passes Dogon cliff villages, Fulani cattle camps, and the ancient mud mosques of Djenné. Logistics are complex; political situations change; this is for experienced overland travellers.`,
      location: "Dakar",
      country: "Senegal",
      continent: "Africa",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.EXTREME,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Djenné mud mosque", "Dogon cliff villages", "Sahara-Sahel transition", "Fulani cattle drives", "Niger River in flood"],
      gear: ["4WD expedition vehicle", "Fuel reserves", "Water filtration", "Medical kit", "Multi-country insurance"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 8000,
      latitude: 14.69,
      longitude: -17.44,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["desert"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["safari"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure232.id }, { userId: user2.id, adventureId: adventure232.id }], skipDuplicates: true });


  // Adventure 233
  const adventure233 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-233" },
    update: {},
    create: {
      id: "seed-adventure-233",
      title: "British Columbia Coast Trek",
      description: `The North Coast Trail on the northern tip of Vancouver Island runs 43 km between San Josef Bay and Shushartie Bay through old-growth Sitka spruce and western red cedar rainforest, with bear grass meadows, isolated sea stacks, and black sand beaches. The trail is genuinely challenging — muddy, rooted, and sometimes requiring rope-assisted descents — and accessible only by floatplane or water taxi. Black bears are common; cougars have been sighted. This is the Canadian coast at its most raw.`,
      location: "Port Hardy",
      country: "Canada",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Old-growth cedar rainforest", "Isolated sea stack beaches", "Black bear encounters", "Floatplane access", "Pacific storm coast"],
      gear: ["Waterproof everything", "Bear canister", "Sturdy boots", "Tarp", "Bear spray"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 1800,
      latitude: 50.7,
      longitude: -127.49,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["coastal"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure233.id }, { userId: user2.id, adventureId: adventure233.id }], skipDuplicates: true });


  // Adventure 234
  const adventure234 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-234" },
    update: {},
    create: {
      id: "seed-adventure-234",
      title: "Nepal Kanchenjunga Trek",
      description: `Kanchenjunga (8,586 m), the world's third-highest mountain, is the most remote and least-visited of Nepal's 8,000 m peaks — a 3-week trek just to reach its base camps. The north and south base camp circuit passes through intact rhododendron and bamboo forest still harbouring red pandas and snow leopards, through Tibetan-influenced villages at the Taplejung headwaters, and to the stupendous Yalung Glacier viewpoint beneath the south face. Restricted area permit required.`,
      location: "Taplejung",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=1600&q=80",
      highlights: ["Kanchenjunga south face", "Red panda sightings", "Snow leopard territory", "Yalung Glacier", "North base camp 5,143m"],
      gear: ["Expedition sleeping system", "Layering for -20°C nights", "Altitude medication", "Trekking poles", "Restricted area permit"],
      bestMonths: [3, 4, 5, 10, 11],
      estimatedCost: 4000,
      latitude: 27.71,
      longitude: 87.86,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["8000m"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure234.id }, { userId: user2.id, adventureId: adventure234.id }], skipDuplicates: true });


  // Adventure 235
  const adventure235 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-235" },
    update: {},
    create: {
      id: "seed-adventure-235",
      title: "Rocky Mountain High Route",
      description: `The Wind River High Route in Wyoming is a 100 km off-trail traverse of the Wind River Range — the most continuous wilderness in the lower 48 states — from Big Sandy Lodge to Elkhart Park, staying above 3,000 m throughout and crossing 10 passes without a maintained trail. Navigation by map and compass, boulder-hopping on persistent talus, and fishing for cutthroat trout in untouched alpine lakes make this the definitive American wilderness experience.`,
      location: "Pinedale",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Cirque of the Towers", "Knife Point Glacier", "Off-trail navigation", "Cutthroat trout fishing", "Wind River Range solitude"],
      gear: ["Navigation tools (no trail)", "Lightweight tent", "Fishing licence and rod", "Bear canister", "Microspikes (early season)"],
      bestMonths: [7, 8],
      estimatedCost: 1500,
      latitude: 42.87,
      longitude: -109.86,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["camping"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure235.id }, { userId: user2.id, adventureId: adventure235.id }], skipDuplicates: true });


  // Adventure 236
  const adventure236 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-236" },
    update: {},
    create: {
      id: "seed-adventure-236",
      title: "Okinawa Island Diving",
      description: `Okinawa's Kerama Islands, 35 km west of Naha, are considered one of Japan's finest dive destinations — visibility regularly exceeds 30 m, coral coverage is among the highest in Japan, and hammerhead sharks gather at Yonaguni Island's rocky seamounts from December to April. The underwater ruins at Yonaguni — rectangular stone formations at 25 m debated as natural or ancient — add an archaeological dimension unique in world diving. Manta rays at Ishigaki's Manta Scramble are reliable from spring.`,
      location: "Naha",
      country: "Japan",
      continent: "Asia",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Yonaguni underwater ruins", "Hammerhead sharks Yonaguni", "Ishigaki manta rays", "Kerama Island coral", "Okinawan culture and food"],
      gear: ["Open Water minimum", "Wetsuit 3mm", "SMB", "Dive computer", "Underwater camera"],
      bestMonths: [12, 1, 2, 3, 4, 5],
      estimatedCost: 3000,
      latitude: 26.21,
      longitude: 127.68,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["wildlife"].id }, { id: allTags["island"].id }, { id: allTags["photography"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure236.id }, { userId: user2.id, adventureId: adventure236.id }], skipDuplicates: true });


  // Adventure 237
  const adventure237 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-237" },
    update: {},
    create: {
      id: "seed-adventure-237",
      title: "Sub-Antarctic Islands Voyage",
      description: `The sub-Antarctic islands south of New Zealand — Auckland, Campbell, Antipodes, Bounty, and Snares — are among the least-visited places on earth and the most important seabird and marine mammal breeding grounds in the Southern Hemisphere. A permit expedition vessel visit lands by Zodiac on island coastlines thick with Hooker's sea lions, southern elephant seals, wandering albatrosses with 3 m wingspans, and yellow-eyed penguins. New Zealand permits are heavily restricted.`,
      location: "Bluff",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Wandering albatross nesting", "Hooker's sea lion beaches", "Yellow-eyed penguins", "Southern Ocean swells", "Most restricted access in NZ"],
      gear: ["Waterproof expedition kit", "Flotation suit Zodiac", "Seasickness medication", "Camera telephoto", "Warm layering"],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 12000,
      latitude: -50.5,
      longitude: 166.1,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["wildlife"].id }, { id: allTags["island"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure237.id }, { userId: user2.id, adventureId: adventure237.id }], skipDuplicates: true });


  // Adventure 238
  const adventure238 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-238" },
    update: {},
    create: {
      id: "seed-adventure-238",
      title: "Tateyama Kurobe Alpine Route",
      description: `The Tateyama Kurobe Alpine Route traverses the Northern Japan Alps from Toyama on the Sea of Japan to Nagano in the interior, crossing at 2,450 m through the Tateyama mountain complex by a succession of cable cars, trolley buses, and ropeways — with a section on foot across the caldera at Murodo. In late April to May, the route cuts through snow walls up to 20 m high. Mount Tateyama (3,015 m) is one of Japan's three holy mountains.`,
      location: "Toyama",
      country: "Japan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["20m snow wall corridor", "Tateyama holy mountain", "Murodo caldera walk", "Kurobe Dam", "Alpine wildflowers (June)"],
      gear: ["Hiking boots", "Warm layers", "Microspikes (spring)", "Camera", "Japan Rail Pass"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 1500,
      latitude: 36.57,
      longitude: 137.62,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["alpine"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure238.id }, { userId: user2.id, adventureId: adventure238.id }, { userId: user3.id, adventureId: adventure238.id }], skipDuplicates: true });


  // Adventure 239
  const adventure239 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-239" },
    update: {},
    create: {
      id: "seed-adventure-239",
      title: "Carpathian Bear Country Trek",
      description: `The Romanian Carpathians have the highest density of brown bears in Europe — an estimated 6,000 animals in the mountain forests of Transylvania and Moldavia. Trekking the 1,500 km Via Carpatica long trail from Slovakia through Poland and Ukraine into Romania follows the ridge of the Carpathian arc through bear, wolf, and lynx territory on trails that are still largely unmarked and require navigation. Village guesthouses, forest ranger huts, and wild camping are the accommodation.`,
      location: "Brasov",
      country: "Romania",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 20,
      coverImageUrl: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1600&q=80",
      highlights: ["Brown bear encounters", "Wolf and lynx territory", "Fagaras mountain ridge", "Retezat National Park", "Carpathian wildflower meadows"],
      gear: ["Bear spray", "Navigation tools", "Tent", "Layering system", "Water filter"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2500,
      latitude: 45.65,
      longitude: 25.61,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["wildlife"].id }, { id: allTags["europe"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure239.id }, { userId: user2.id, adventureId: adventure239.id }], skipDuplicates: true });


  // Adventure 240
  const adventure240 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-240" },
    update: {},
    create: {
      id: "seed-adventure-240",
      title: "Raja Ampat Liveaboard Diving",
      description: `Raja Ampat in West Papua, Indonesia, sits at the heart of the Coral Triangle — 75% of the world's known coral species, 1,400+ fish species, and the densest marine biodiversity on earth. Liveaboard diving reaches the unmissable sites: the pygmy seahorses of Mioskon, the manta rays of Cape Kri, the walking sharks at Misool, and the baitball at Melissa's Garden. Above water, the karst limestone islands are among the world's most extraordinary seascapes.`,
      location: "Sorong",
      country: "Indonesia",
      continent: "Asia",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Coral Triangle biodiversity", "Manta ray feeding", "Walking sharks", "Pygmy seahorses", "Karst island landscape"],
      gear: ["Open Water minimum", "Wetsuit 3mm", "SMB", "Macro lens", "Dive computer"],
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      estimatedCost: 4500,
      latitude: -0.86,
      longitude: 130.52,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["wildlife"].id }, { id: allTags["island"].id }, { id: allTags["photography"].id }, { id: allTags["bucket-list"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure240.id }, { userId: user2.id, adventureId: adventure240.id }, { userId: user3.id, adventureId: adventure240.id }], skipDuplicates: true });


  // Adventure 241
  const adventure241 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-241" },
    update: {},
    create: {
      id: "seed-adventure-241",
      title: "Iceland Volcanic Interior Trek",
      description: `The Highlands of Iceland — accessible only in summer when the F-roads open — are the emptiest landscape in Europe. The Fjallabak Reserve and Sprengisandur highland route cross black lava plateaus, active geothermal areas, and the vast Hofsjökull and Langjökull ice caps. The interior has no huts in some sections; navigation across featureless lava desert requires GPS. This is the Iceland no tourist bus reaches.`,
      location: "Reykjavik",
      country: "Iceland",
      continent: "Europe",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Sprengisandur volcanic desert", "Hofsjökull ice cap", "Landmannalaugar hot springs", "Askja caldera", "No tourist infrastructure"],
      gear: ["4WD or backpacking kit", "GPS navigation", "River fording capability", "Emergency shelter", "Water filter"],
      bestMonths: [7, 8],
      estimatedCost: 3000,
      latitude: 64.13,
      longitude: -19.02,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["volcanic"].id }, { id: allTags["remote"].id }, { id: allTags["glacier"].id }, { id: allTags["arctic"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure241.id }, { userId: user2.id, adventureId: adventure241.id }], skipDuplicates: true });


  // Adventure 242
  const adventure242 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-242" },
    update: {},
    create: {
      id: "seed-adventure-242",
      title: "Spain Picos de Europa",
      description: `The Picos de Europa are a compact limestone massif on the northern coast of Spain — only 40 km from the Bay of Biscay coast, rising to 2,648 m at Torre Cerredo. The famous Cares Gorge walk (24 km, mostly flat, carved into the canyon wall) is the accessible classic; the high mountain circuits from Fuente Dé cable car deliver scrambling on karst limestone with chamois and griffon vultures. The towns of Potes and Cangas de Onís are charming bases.`,
      location: "Potes",
      country: "Spain",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80",
      highlights: ["Cares Gorge canyon path", "Torre Cerredo views", "Chamois (rebeco)", "Fuente Dé cable car", "Spanish mountain food"],
      gear: ["Hiking boots", "Trekking poles", "Map (complex terrain)", "Waterproof jacket", "Sun protection"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 1200,
      latitude: 43.15,
      longitude: -4.73,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["gorge"].id }, { id: allTags["europe"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure242.id }, { userId: user2.id, adventureId: adventure242.id }], skipDuplicates: true });


  // Adventure 243
  const adventure243 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-243" },
    update: {},
    create: {
      id: "seed-adventure-243",
      title: "GR11 Pyrenean Traverse",
      description: `The GR11 traverses the entire Spanish side of the Pyrenees from Cabo Higuer on the Bay of Biscay to Cap de Creus on the Mediterranean — 800 km through the Spanish national parks of Ordesa, Aigüestortes, and Cadí, staying almost entirely in Spain rather than the mixed-country approach of the Haute Route. The GR11 is well-marked, well-serviced with refugios, and follows the valley floors and passes in approximately equal measure. A classic European long trail.`,
      location: "Cabo Higuer",
      country: "Spain",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 45,
      coverImageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80",
      highlights: ["Ordesa Canyon", "Aigüestortes lakes", "Aneto highest pass", "Mediterranean finish", "Pyrenean chamois"],
      gear: ["Trekking poles", "Boots", "Refugio sleeping sheet", "Navigation tools", "Spanish phrasebook"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 5000,
      latitude: 43.38,
      longitude: -1.79,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["thru-hike"].id }, { id: allTags["alpine"].id }, { id: allTags["europe"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure243.id }, { userId: user2.id, adventureId: adventure243.id }], skipDuplicates: true });


  // Adventure 244
  const adventure244 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-244" },
    update: {},
    create: {
      id: "seed-adventure-244",
      title: "Okhotsk Sea Ice Walk",
      description: `The drift ice of the Sea of Okhotsk reaches the coast of Hokkaido near Abashiri and Shiretoko Peninsula each winter — the southernmost drift ice in the Northern Hemisphere — and walking on it in late February to March with icebreaker cruise access is a uniquely Japanese experience. The Shiretoko Peninsula, UNESCO World Heritage, extends into the ice floes and hosts Steller's sea eagles, white-tailed eagles, and the rare Blakiston's fish owl in the forest behind the ice.`,
      location: "Abashiri",
      country: "Japan",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["Walking on drift ice", "Icebreaker cruise", "Steller's sea eagle", "Blakiston's fish owl", "Shiretoko Wilderness"],
      gear: ["Dry suit or immersion suit", "Ice microspikes", "Camera telephoto", "Extreme cold kit", "Waterproof boots"],
      bestMonths: [2, 3],
      estimatedCost: 2500,
      latitude: 44.02,
      longitude: 144.28,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["arctic"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }, { id: allTags["expedition"].id }, { id: allTags["island"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure244.id }, { userId: user2.id, adventureId: adventure244.id }], skipDuplicates: true });


  // Adventure 245
  const adventure245 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-245" },
    update: {},
    create: {
      id: "seed-adventure-245",
      title: "Spiti Valley Trek",
      description: `The Spiti Valley in Himachal Pradesh is India's most dramatic high-altitude desert — a cold, arid, Tibetan-plateau landscape of white Himalayan peaks, ancient mud-brick monasteries (Key Gompa, Tabo, Dhankar), and the Pin River gorge. The Pin-Parvati Pass crossing at 5,319 m connects the green Kullu Valley with the desert Spiti in a dramatic 10-day trek through both environments. Altitude, remoteness, and cultural immersion combine to make this an exceptional Himalayan journey.`,
      location: "Kaza",
      country: "India",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Pin-Parvati Pass 5,319m", "Key Gompa monastery", "Tabo cave monastery", "Snow leopard territory", "Spiti stargazing"],
      gear: ["Expedition tent", "Sleeping bag -20°C", "Crampons and ice axe", "Altitude medication", "Guide essential"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 2200,
      latitude: 32.23,
      longitude: 78.07,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["8000m"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure245.id }, { userId: user2.id, adventureId: adventure245.id }], skipDuplicates: true });


  // Adventure 246
  const adventure246 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-246" },
    update: {},
    create: {
      id: "seed-adventure-246",
      title: "Fiordland Packrafting",
      description: `Packrafting the remote river valleys of Fiordland National Park in New Zealand — inflating a 2.5 kg raft to cross the Dusky Sound, float the Arthur River, or descend the Seaforth to the sea — opens up wilderness that is physically inaccessible by foot or boat alone. Fiordland receives up to 8 m of rain per year; the rivers flood rapidly and dramatically. Floatplane access, river knowledge, and self-rescue skills are prerequisites. The reward is primeval rainforest with no other human presence.`,
      location: "Te Anau",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.KAYAKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Dusky Sound wilderness", "Arthur River descent", "Floatplane access", "Fiordland rainforest", "No other humans"],
      gear: ["Packraft + paddle", "Dry suit", "Self-rescue kit", "Emergency beacon", "Waterproof everything"],
      bestMonths: [1, 2, 3, 11, 12],
      estimatedCost: 4500,
      latitude: -45.41,
      longitude: 167.72,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["new-zealand"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure246.id }, { userId: user2.id, adventureId: adventure246.id }], skipDuplicates: true });


  // Adventure 247
  const adventure247 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-247" },
    update: {},
    create: {
      id: "seed-adventure-247",
      title: "Cerro Aconcagua Summit",
      description: `Aconcagua (6,961 m) is the highest peak in the Americas and the highest summit outside Asia — a non-technical ascent by the Normal Route but requiring full acclimatisation, high-altitude camping at four camps, and 18+ days on the mountain including weather days. The Horcones Valley approach from Mendoza is straightforward; the mountain is a serious altitude undertaking with storms that can pin teams at Camp 3 for days. The summit view from the Roof of the Americas is earned.`,
      location: "Mendoza",
      country: "Argentina",
      continent: "South America",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80",
      highlights: ["6,961m roof of the Americas", "Plaza de Mulas base camp", "Canaleta summit gully", "Mercedario and Tupungato views", "Mendoza wine finish"],
      gear: ["High-altitude boots", "Down suit", "Crampons", "Sleeping bag -40°C", "Expedition tent"],
      bestMonths: [12, 1, 2],
      estimatedCost: 7000,
      latitude: -32.65,
      longitude: -70.01,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["high-altitude"].id }, { id: allTags["8000m"].id }, { id: allTags["bucket-list"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure247.id }, { userId: user2.id, adventureId: adventure247.id }], skipDuplicates: true });


  // Adventure 248
  const adventure248 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-248" },
    update: {},
    create: {
      id: "seed-adventure-248",
      title: "Bibbulmun Track",
      description: `The Bibbulmun Track runs 1,000 km through the forests and coastline of Western Australia's south-west from Kalamunda near Perth to Albany on the Southern Ocean. The route passes through jarrah, karri, and tingle forests — some of the world's tallest flowering trees — past wetlands with black swans and southern boobook owls, over granite outcrops, and along isolated beaches where sea eagles fish. The three-sided timber shelters (waugals) are spaced at 18–25 km intervals.`,
      location: "Kalamunda",
      country: "Australia",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 55,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Valley of the Giants tingle trees", "Pemberton karri forest", "Southern Ocean cliff coast", "Black swan wetlands", "Albany finish"],
      gear: ["Tent or hut kit", "Water filter", "Snake gaiters", "Blister kit", "Resupply strategy"],
      bestMonths: [8, 9, 10, 11],
      estimatedCost: 5500,
      latitude: -31.97,
      longitude: 116.05,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["thru-hike"].id }, { id: allTags["trekking"].id }, { id: allTags["australia"].id }, { id: allTags["wildlife"].id }, { id: allTags["coastal"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure248.id }, { userId: user2.id, adventureId: adventure248.id }], skipDuplicates: true });


  // Adventure 249
  const adventure249 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-249" },
    update: {},
    create: {
      id: "seed-adventure-249",
      title: "Antarctica Expedition Cruise",
      description: `An expedition cruise to the Antarctic Peninsula is the most extreme mainstream adventure travel destination on earth — 11 days aboard an ice-strengthened vessel from Ushuaia to the peninsula, landing by Zodiac on beaches with 10,000 chinstrap and gentoo penguins, approaching humpback whales from open inflatable boats, and crossing the Drake Passage twice. Nothing in travel prepares you for the scale and silence of Antarctica. Camping on the ice is the optional upgrade.`,
      location: "Ushuaia",
      country: "Argentina",
      continent: "Antarctica",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 11,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Penguin colony landings", "Humpback whale encounters", "Drake Passage crossing", "Antarctic ice camping", "Complete polar silence"],
      gear: ["Waterproof expedition kit", "Flotation suit Zodiac", "Waterproof boots", "Camera telephoto", "Seasickness medication"],
      bestMonths: [11, 12, 1, 2],
      estimatedCost: 10000,
      latitude: -54.8,
      longitude: -68.3,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["wildlife"].id }, { id: allTags["glacier"].id }, { id: allTags["remote"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure249.id }, { userId: user2.id, adventureId: adventure249.id }, { userId: user3.id, adventureId: adventure249.id }], skipDuplicates: true });


  // Adventure 250
  const adventure250 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-250" },
    update: {},
    create: {
      id: "seed-adventure-250",
      title: "Sahara Ahaggar Plateau Trek",
      description: `The Ahaggar Mountains in southern Algeria rise from the Sahara desert in extraordinary volcanic plugs and serrated basalt ridges, reaching 2,918 m at Mount Tahat — the highest point in Algeria. This is the traditional homeland of the Tuareg, and trekking the plateaus and canyons of the Parc National de l'Ahaggar requires a Tuareg guide from Tamanrasset. The rock art at Tassili n'Ajjer depicts animals extinct in the Sahara for 5,000 years. This is the Sahara at its most profound.`,
      location: "Tamanrasset",
      country: "Algeria",
      continent: "Africa",
      category: Category.EXPEDITION,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Ahaggar volcanic massif", "Tassili prehistoric rock art", "Tuareg guide culture", "Mount Tahat summit", "Sahara silence at maximum"],
      gear: ["10L water per day", "Sun protection extreme", "Wind protection", "Guide mandatory", "Algerian visa"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 3500,
      latitude: 22.78,
      longitude: 5.52,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["desert"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure250.id }, { userId: user2.id, adventureId: adventure250.id }], skipDuplicates: true });


  // Adventure 251
  const adventure251 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-251" },
    update: {},
    create: {
      id: "seed-adventure-251",
      title: "Manaslu Circuit Trek",
      description: `The Manaslu Circuit circumnavigates the world's eighth-highest mountain through remote Nubri and Tsum valleys. The route crosses the Larkya La pass at 5,106 metres, offering close views of Manaslu's sweeping ice faces. Traditional Tibetan Buddhist culture pervades every village along the way.`,
      location: "Arughat Bazaar",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Larkya La pass at 5106 metres", "Restricted area permit zone", "Tibetan Buddhist monasteries", "Manaslu north face views", "Remote Nubri valley villages"],
      gear: ["Expedition down sleeping bag", "Trekking poles", "Crampons for icy pass", "Altitude sickness medication", "Layered insulation system"],
      bestMonths: [3, 4, 10, 11],
      estimatedCost: 1800,
      latitude: 28.55,
      longitude: 84.56,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure251.id }, { userId: user2.id, adventureId: adventure251.id }, { userId: user3.id, adventureId: adventure251.id }], skipDuplicates: true });


  // Adventure 252
  const adventure252 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-252" },
    update: {},
    create: {
      id: "seed-adventure-252",
      title: "Kanchenjunga Base Camp Trek",
      description: `Nepal's most remote major trek leads to the base camps of Kanchenjunga, the world's third-highest peak at 8,586 metres. The trail passes through dense rhododendron forests and yak pastures before reaching the glacial moraines below the mountain. Both north and south base camps can be combined into a challenging loop.`,
      location: "Taplejung",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 22,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Kanchenjunga north and south base camps", "Pristine Ghunsa valley", "Rhododendron and magnolia forests", "Yak herder pastures at Lhonak", "Untouched wilderness with minimal trekkers"],
      gear: ["4-season sleeping bag", "Water purification tablets", "Emergency bivouac shelter", "Trekking poles", "High-altitude gaiters"],
      bestMonths: [3, 4, 10, 11],
      estimatedCost: 2400,
      latitude: 27.7,
      longitude: 87.99,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["8000m"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure252.id }, { userId: user2.id, adventureId: adventure252.id }], skipDuplicates: true });


  // Adventure 253
  const adventure253 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-253" },
    update: {},
    create: {
      id: "seed-adventure-253",
      title: "Upper Dolpo Trek",
      description: `Upper Dolpo is one of Nepal's most restricted and extraordinary trekking destinations, a high-altitude Tibetan plateau world virtually untouched by modernity. The route passes through Shey Phoksundo National Park and the crystal blue lake, then crosses multiple passes above 5,000 metres to reach the sacred Shey Gompa. Peter Matthiessen immortalised this landscape in The Snow Leopard.`,
      location: "Juphal",
      country: "Nepal",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 25,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Shey Phoksundo turquoise lake", "Shey Gompa crystal mountain monastery", "Snow leopard habitat", "Ancient Bon religion villages", "Kang La pass at 5360 metres"],
      gear: ["Expedition tent and sleeping system", "Full camp kitchen setup", "Portable altitude oximeter", "Satellite communicator", "Cold weather base layers"],
      bestMonths: [9, 10],
      estimatedCost: 4500,
      latitude: 29.1,
      longitude: 82.96,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure253.id }, { userId: user2.id, adventureId: adventure253.id }, { userId: user3.id, adventureId: adventure253.id }], skipDuplicates: true });


  // Adventure 254
  const adventure254 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-254" },
    update: {},
    create: {
      id: "seed-adventure-254",
      title: "Rolwaling Valley Trek",
      description: `Rolwaling is one of Nepal's most sacred and seldom-visited valleys, protected by its difficult access and restricted permit requirements. The 19-kilometre-long valley leads toward Tashi Lapcha pass at 5,755 metres, the classic route connecting to the Khumbu region. Dramatic peaks including Gauri Shankar and Menlungtse tower above the narrow gorge.`,
      location: "Charikot",
      country: "Nepal",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 20,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Tashi Lapcha high pass at 5755 metres", "Sacred Rolwaling valley", "Gauri Shankar peak views", "Remote Buddhist monasteries", "Tsho Rolpa glacial lake"],
      gear: ["Technical ice axe", "Harness and crampons", "Fixed rope ascenders", "High camp sleeping bag", "Waterproof mountaineering boots"],
      bestMonths: [5, 10],
      estimatedCost: 3200,
      latitude: 27.86,
      longitude: 86.08,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["remote"].id }, { id: allTags["high-altitude"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure254.id }, { userId: user2.id, adventureId: adventure254.id }], skipDuplicates: true });


  // Adventure 255
  const adventure255 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-255" },
    update: {},
    create: {
      id: "seed-adventure-255",
      title: "Karakoram Highway Cycling",
      description: `The Karakoram Highway is one of the world's most spectacular cycling routes, crossing the Khunjerab Pass at 4,693 metres on the China-Pakistan border. The road follows ancient Silk Road caravan routes through the Hunza Valley past Rakaposhi and Nanga Parbat. The combination of engineering audacity and mountain grandeur makes this a legendary adventure cycling journey.`,
      location: "Islamabad",
      country: "Pakistan",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 16,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Khunjerab Pass at 4693 metres", "Hunza Valley apricot orchards", "Rakaposhi north face views", "Ancient Silk Road history", "Attabad Lake turquoise waters"],
      gear: ["Touring bicycle with low gearing", "Panniers and rear rack", "Altitude sickness pills", "Windproof cycling jacket", "Repair kit and spare tubes"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 1200,
      latitude: 36.84,
      longitude: 74.9,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["cultural-immersion"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure255.id }, { userId: user2.id, adventureId: adventure255.id }, { userId: user3.id, adventureId: adventure255.id }], skipDuplicates: true });


  // Adventure 256
  const adventure256 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-256" },
    update: {},
    create: {
      id: "seed-adventure-256",
      title: "K2 Base Camp Trek",
      description: `The trek to K2 base camp in the Karakoram is widely considered the world's greatest trekking objective, ending beneath the savage pyramid of the world's second-highest mountain. The Baltoro Glacier route passes Concordia, the throne room of the mountain gods, where K2, Broad Peak, and the Gasherbrums converge in an unparalleled cirque. Over 60 kilometres of glacier walking make this a true expedition undertaking.`,
      location: "Askole",
      country: "Pakistan",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 22,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["K2 base camp at 5150 metres", "Concordia junction of four 8000m peaks", "Baltoro Glacier 60km traverse", "Trango Towers rock walls", "Broad Peak and Gasherbrums views"],
      gear: ["Glacier travel crampons", "Ice axe", "Rope and harness", "Expedition sleeping bag to minus 20", "Trekking poles"],
      bestMonths: [6, 7, 8],
      estimatedCost: 4000,
      latitude: 35.88,
      longitude: 76.51,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["8000m"].id }, { id: allTags["glacier"].id }, { id: allTags["mountaineering"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure256.id }, { userId: user2.id, adventureId: adventure256.id }, { userId: user3.id, adventureId: adventure256.id }], skipDuplicates: true });


  // Adventure 257
  const adventure257 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-257" },
    update: {},
    create: {
      id: "seed-adventure-257",
      title: "Nanga Parbat Rupal Face Trek",
      description: `The Rupal face of Nanga Parbat presents the highest mountain wall on Earth, rising over 4,600 metres from the valley floor to the summit at 8,125 metres. The trek through the Rupal Valley offers a completely different perspective from the more-visited Fairy Meadows on the Diamir side. Remote villages, wildflower meadows, and jaw-dropping exposure to the face make this one of Pakistan's finest routes.`,
      location: "Tarashing",
      country: "Pakistan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Highest mountain face on Earth 4600m wall", "Mazeno high camp viewpoint", "Rupal valley wildflower meadows", "Remote Herligkoffer base camp", "Nanga Parbat summit views at 8125m"],
      gear: ["Hiking boots", "Trekking poles", "Down sleeping bag", "Water filter", "Sun protection"],
      bestMonths: [7, 8],
      estimatedCost: 900,
      latitude: 35.22,
      longitude: 74.59,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure257.id }, { userId: user2.id, adventureId: adventure257.id }], skipDuplicates: true });


  // Adventure 258
  const adventure258 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-258" },
    update: {},
    create: {
      id: "seed-adventure-258",
      title: "Spiti Valley Motorcycle Journey",
      description: `Spiti Valley in the Indian Himalaya is a high-altitude cold desert accessed by two dramatically different mountain passes, Rohtang and Kunzum La. The route through Kaza, Pin Valley, and Kibber village winds past ancient Buddhist monasteries perched on eroded cliffs above the turquoise Spiti River. This is one of India's most rewarding motorcycle journeys, combining lunar landscapes with living Himalayan culture.`,
      location: "Manali",
      country: "India",
      continent: "Asia",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Kunzum La pass at 4590 metres", "Key Monastery 1000-year-old gompa", "Pin Valley National Park", "Kibber village highest motorable village", "Rohtang Pass crossing"],
      gear: ["Motorcycle and riding gear", "Altitude sickness medication", "Warm layers for night camps", "Tool kit and puncture repair", "Offline maps"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 700,
      latitude: 32.24,
      longitude: 78.07,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure258.id }, { userId: user2.id, adventureId: adventure258.id }], skipDuplicates: true });


  // Adventure 259
  const adventure259 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-259" },
    update: {},
    create: {
      id: "seed-adventure-259",
      title: "Markha Valley Trek",
      description: `The Markha Valley trek in Ladakh crosses two high passes and follows the Markha River through a remote gorge flanked by Buddhist gompas and chortens. The route crosses Ganda La at 4,973 metres and Kongmaru La at 5,220 metres, with Kang Yatze peak dominating the horizon throughout. Homestays in traditional Ladakhi homes provide warm hospitality above 4,000 metres.`,
      location: "Leh",
      country: "India",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Kongmaru La pass at 5220 metres", "Kang Yatze peak views 6400m", "Markha village gompa", "Traditional Ladakhi homestays", "Hemis National Park wildlife"],
      gear: ["Trekking poles", "Down jacket", "Sun protection factor 50", "Water purification", "Acclimatisation schedule"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 600,
      latitude: 34.15,
      longitude: 77.58,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure259.id }, { userId: user2.id, adventureId: adventure259.id }, { userId: user3.id, adventureId: adventure259.id }], skipDuplicates: true });


  // Adventure 260
  const adventure260 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-260" },
    update: {},
    create: {
      id: "seed-adventure-260",
      title: "Chadar Trek - Frozen Zanskar River",
      description: `The Chadar trek follows the frozen Zanskar River through an impossibly deep gorge in Ladakh during the brief winter window when the river becomes walkable ice. Temperatures can plunge to minus 35 degrees Celsius, and trekkers sleep in shallow caves carved from frozen waterfalls. This extraordinary journey is the traditional winter supply route for Zanskar villages cut off by snow.`,
      location: "Chilling",
      country: "India",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 9,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Walking on frozen Zanskar River", "Cave camping at minus 30 celsius", "Sheer 300m canyon walls", "Frozen waterfall formations", "Zanskar village cultural immersion"],
      gear: ["Arctic expedition sleeping bag minus 40", "Microspike ice traction", "Balaclava and pogies", "Down suit", "Chemical hand warmers"],
      bestMonths: [1, 2],
      estimatedCost: 800,
      latitude: 33.76,
      longitude: 76.81,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["arctic"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure260.id }, { userId: user2.id, adventureId: adventure260.id }, { userId: user3.id, adventureId: adventure260.id }], skipDuplicates: true });


  // Adventure 261
  const adventure261 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-261" },
    update: {},
    create: {
      id: "seed-adventure-261",
      title: "Fann Mountains Traverse, Tajikistan",
      description: `The Fann Mountains in western Tajikistan are a hidden alpine gem with dramatic peaks, turquoise lakes, and virtually no tourist infrastructure. The classic traverse links the Seven Lakes chain with high-altitude passes and culminates near Iskanderkul, the jewel-blue lake that Alexander the Great supposedly discovered. This is Central Asia trekking at its most raw and rewarding.`,
      location: "Penjakent",
      country: "Tajikistan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Seven Lakes turquoise chain", "Iskanderkul lake of Alexander the Great", "Chimtarga peak at 5489 metres", "Dushakha pass crossing", "Authentic Tajik hospitality"],
      gear: ["Camping stove and fuel", "Water filter", "Trekking poles", "Mountain tent", "Navigational compass"],
      bestMonths: [7, 8, 9],
      estimatedCost: 900,
      latitude: 39.33,
      longitude: 68.21,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure261.id }, { userId: user2.id, adventureId: adventure261.id }], skipDuplicates: true });


  // Adventure 262
  const adventure262 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-262" },
    update: {},
    create: {
      id: "seed-adventure-262",
      title: "Wakhan Corridor Trek",
      description: `The Wakhan Corridor is one of the world's most remote and historically significant mountain corridors, a narrow strip of Afghan territory flanked by Tajikistan, Pakistan, and China. Accessible from the Tajik side, the route passes Wakhi villages whose inhabitants have maintained ancient Silk Road traditions for centuries. The Big Pamir plateau at 4,000 metres offers views into Afghanistan and encounters with nomadic Kyrgyz herders.`,
      location: "Ishkashim",
      country: "Tajikistan",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Big Pamir plateau at 4000 metres", "Wakhi and Kyrgyz cultural encounters", "Ancient Silk Road route", "Views into four countries", "Zorkul Lake wildlife reserve"],
      gear: ["Four-season tent", "Expedition sleeping bag", "Horse rental for supplies", "Satellite phone", "Water purification system"],
      bestMonths: [7, 8],
      estimatedCost: 2500,
      latitude: 37.49,
      longitude: 72.78,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["high-altitude"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure262.id }, { userId: user2.id, adventureId: adventure262.id }], skipDuplicates: true });


  // Adventure 263
  const adventure263 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-263" },
    update: {},
    create: {
      id: "seed-adventure-263",
      title: "Tian Shan Kyrgyz Circuit",
      description: `Kyrgyzstan's Tian Shan mountains offer world-class trekking through a country where nomadic culture remains alive on summer jailoo pastures dotted with yurts. The classic Ak-Suu traverse in the Terskey Ala-Too range crosses five high passes above 3,800 metres and descends into valleys where you can sleep in family yurts and drink fermented mare's milk. The route culminates near Song Kol lake.`,
      location: "Karakol",
      country: "Kyrgyzstan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Ak-Suu traverse five high passes", "Nomadic yurt stays", "Fermented mare's milk tradition", "Terskey Ala-Too granite peaks", "Song Kol high-altitude lake"],
      gear: ["Mountain tent", "Trekking poles", "Warm sleeping bag", "Horse hire option", "Cash only areas"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 700,
      latitude: 42.49,
      longitude: 78.39,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["mountains"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure263.id }, { userId: user2.id, adventureId: adventure263.id }], skipDuplicates: true });


  // Adventure 264
  const adventure264 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-264" },
    update: {},
    create: {
      id: "seed-adventure-264",
      title: "Ausangate Circuit, Peru",
      description: `The Ausangate Circuit in the Cordillera Vilcanota south of Cusco is one of South America's most spectacular high-altitude treks, circling Ausangate peak at 6,384 metres through a landscape of turquoise glacial lakes, red and yellow mineral springs, and vicuna herds. The route crosses four passes above 5,000 metres and passes through Quechua herding communities where alpaca wool weaving is still practised. The adjacent Rainbow Mountain has become famous, but this circuit remains the authentic experience.`,
      location: "Tinqui",
      country: "Peru",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Four passes above 5000 metres", "Ausangate peak at 6384 metres", "Mineral hot springs at high camp", "Vicuna and alpaca herds", "Quechua weaving community visits"],
      gear: ["High altitude sleeping bag", "Warm base layers", "Altitude sickness medication", "Trekking poles", "Waterproof hiking boots"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 600,
      latitude: -13.78,
      longitude: -71.22,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["high-altitude"].id }, { id: allTags["mountains"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure264.id }, { userId: user2.id, adventureId: adventure264.id }, { userId: user3.id, adventureId: adventure264.id }], skipDuplicates: true });


  // Adventure 265
  const adventure265 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-265" },
    update: {},
    create: {
      id: "seed-adventure-265",
      title: "Cordillera Real Traverse, Bolivia",
      description: `The Cordillera Real forms the spectacular eastern backbone of the Bolivian Andes, with seventeen peaks above 5,000 metres accessible from La Paz. The Condoriri Circuit passes beneath hanging glaciers and electric-blue glacial lakes before crossing the high ridge at 5,000 metres with panoramic views toward the Amazon basin. Bolivian mountaineering culture is concentrated here, with numerous 6,000-metre peaks accessible to acclimatised trekkers.`,
      location: "La Paz",
      country: "Bolivia",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Condoriri mountain group reflections", "Seventeen peaks above 5000 metres", "Chearoco and Chiar Apu views", "Glacial turquoise lakes", "High-altitude bolivian wildlife"],
      gear: ["Ice axe for summit attempts", "Crampons", "Altitude acclimatisation kit", "Expedition sleeping bag", "Layered cold-weather system"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 500,
      latitude: -16.4,
      longitude: -68.2,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["high-altitude"].id }, { id: allTags["glacier"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure265.id }, { userId: user2.id, adventureId: adventure265.id }], skipDuplicates: true });


  // Adventure 266
  const adventure266 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-266" },
    update: {},
    create: {
      id: "seed-adventure-266",
      title: "Quilotoa Loop, Ecuador",
      description: `The Quilotoa Loop circles a magnificent volcanic caldera lake in the Ecuadorian Andes through indigenous Kichwa villages that have maintained traditional agricultural practices for centuries. The crater rim at 3,914 metres offers vertiginous views into the emerald green lake 250 metres below. This independently walkable multi-day route connects a chain of weekend markets in different villages.`,
      location: "Latacunga",
      country: "Ecuador",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Quilotoa crater lake emerald green", "Kichwa indigenous village markets", "Ingas highland farmland scenery", "Tigua naif art galleries", "Sigchos and Chugchilan village stays"],
      gear: ["Lightweight day pack", "Rain jacket", "Hiking boots", "Cash for accommodation", "Altitude awareness kit"],
      bestMonths: [6, 7, 8, 9, 10],
      estimatedCost: 250,
      latitude: -0.86,
      longitude: -78.9,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["volcanic"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure266.id }, { userId: user2.id, adventureId: adventure266.id }], skipDuplicates: true });


  // Adventure 267
  const adventure267 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-267" },
    update: {},
    create: {
      id: "seed-adventure-267",
      title: "Ciudad Perdida Trek, Colombia",
      description: `The trek to Ciudad Perdida, the Lost City of the Tayrona people, winds through Sierra Nevada de Santa Marta jungle for four to six days to reach a pre-Columbian city that predates Machu Picchu by over 600 years. The route crosses the Rio Buritaca numerous times and climbs over 1,200 stone steps carved by the Tayrona into the jungle hillside. Indigenous Kogi, Arhuaco and Wiwa communities still consider this site sacred.`,
      location: "Santa Marta",
      country: "Colombia",
      continent: "South America",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["1260 stone steps to Lost City", "Tayrona civilisation ruins 800 AD", "Sierra Nevada jungle crossing", "River crossings through gorge", "Kogi indigenous guide stories"],
      gear: ["Lightweight jungle kit", "River-crossing sandals", "Hammock and mosquito net", "Insect repellent", "Water purification"],
      bestMonths: [12, 1, 2, 3],
      estimatedCost: 350,
      latitude: 11.03,
      longitude: -73.92,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["jungle"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["hiking"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure267.id }, { userId: user2.id, adventureId: adventure267.id }, { userId: user3.id, adventureId: adventure267.id }], skipDuplicates: true });


  // Adventure 268
  const adventure268 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-268" },
    update: {},
    create: {
      id: "seed-adventure-268",
      title: "Pacific Crest Trail - Sierra Nevada Section",
      description: `The Sierra Nevada section of the Pacific Crest Trail from Kennedy Meadows to Tuolumne Meadows covers the most dramatic 500 kilometres of the entire 4,300-kilometre trail. The route crosses Forester Pass at 4,009 metres (the highest point on the PCT), traverses the John Muir Trail, and passes through Kings Canyon, Sequoia, and Yosemite National Parks. This is the definitive American long-distance hiking experience at its most spectacular.`,
      location: "Kennedy Meadows",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 30,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Forester Pass at 4009 metres highest PCT point", "Kings Canyon and Sequoia wilderness", "John Muir Trail junction", "Evolution Basin granite lakes", "Tuolumne Meadows Yosemite"],
      gear: ["Bear canister required", "Ultralight backpacking kit", "Ice axe for early season", "PCTA permit", "Satellite communicator"],
      bestMonths: [7, 8, 9],
      estimatedCost: 2500,
      latitude: 36.07,
      longitude: -118.12,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["thru-hike"].id }, { id: allTags["mountains"].id }, { id: allTags["camping"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure268.id }, { userId: user2.id, adventureId: adventure268.id }, { userId: user3.id, adventureId: adventure268.id }], skipDuplicates: true });


  // Adventure 269
  const adventure269 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-269" },
    update: {},
    create: {
      id: "seed-adventure-269",
      title: "Continental Divide Trail - Wind River Range",
      description: `The Wind River Range section of the Continental Divide Trail crosses Wyoming's most remote and spectacular mountain range, with over 40 named peaks above 4,000 metres and the largest glaciated area in the American Rockies. The Cirque of the Towers and Stroud Peak are iconic destinations along this high alpine route above treeline. This off-trail wilderness demands strong navigation skills and rewards with complete solitude.`,
      location: "Pinedale",
      country: "United States",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Cirque of the Towers granite spires", "Fremont Peak at 4190 metres", "Largest Rocky Mountain glaciers", "Above-treeline route for days", "Bighorn sheep and moose sightings"],
      gear: ["Topo maps and navigation compass", "Bear canister", "Ice axe", "Ultralight tent", "Water filter"],
      bestMonths: [7, 8],
      estimatedCost: 800,
      latitude: 42.77,
      longitude: -109.86,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["thru-hike"].id }, { id: allTags["remote"].id }, { id: allTags["mountains"].id }, { id: allTags["glacier"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure269.id }, { userId: user2.id, adventureId: adventure269.id }], skipDuplicates: true });


  // Adventure 270
  const adventure270 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-270" },
    update: {},
    create: {
      id: "seed-adventure-270",
      title: "Wrangell-St. Elias Backpack",
      description: `Wrangell-St. Elias National Park is the largest national park in the United States, encompassing four major mountain ranges with nine of America's sixteen highest peaks. The Chitistone and Nizina canyon routes follow Native Athabascan travel corridors through a wilderness larger than Switzerland. Grizzly bears, Dall sheep, and wolverines share the tundra above the historic Kennecott copper mines.`,
      location: "McCarthy",
      country: "United States",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Largest US national park no maintained trails", "Chitistone canyon 1000m walls", "Kennecott copper mine ghost town", "Nabesna glacier crossing", "Grizzly bear and Dall sheep"],
      gear: ["Bear electric fence", "Satellite communicator", "River crossing dry bags", "Packraft for stream crossings", "Bear spray"],
      bestMonths: [7, 8],
      estimatedCost: 2200,
      latitude: 61.43,
      longitude: -142.9,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["glacier"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure270.id }, { userId: user2.id, adventureId: adventure270.id }], skipDuplicates: true });


  // Adventure 271
  const adventure271 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-271" },
    update: {},
    create: {
      id: "seed-adventure-271",
      title: "Gates of the Arctic Traverse",
      description: `Gates of the Arctic National Park sits entirely above the Arctic Circle in Alaska and contains no roads, no maintained trails, and no facilities whatsoever. The classic traverse follows the North Fork of the Koyukuk River through the Brooks Range passes that Robert Marshall first explored and named in the 1930s. Caribou migrations of tens of thousands of animals can be witnessed during the September traverse.`,
      location: "Bettles",
      country: "United States",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Entirely above Arctic Circle", "No trails zero infrastructure", "Brooks Range mountain wilderness", "September caribou migration", "Midnight sun and aurora borealis"],
      gear: ["Float plane charter", "Packraft", "Satellite communicator", "Tundra-rated sleeping bag", "Grizzly bear spray and fence"],
      bestMonths: [7, 8, 9],
      estimatedCost: 4000,
      latitude: 67.78,
      longitude: -153.3,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["arctic"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure271.id }, { userId: user2.id, adventureId: adventure271.id }, { userId: user3.id, adventureId: adventure271.id }], skipDuplicates: true });


  // Adventure 272
  const adventure272 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-272" },
    update: {},
    create: {
      id: "seed-adventure-272",
      title: "Greek Island Hiking - Sporades Arc",
      description: `The Sporades islands of Skopelos, Alonnisos, and Skyros offer exceptional mule-track hiking through Mediterranean maquis above turquoise waters. Alonnisos is the centre of Europe's largest marine protected area, and its ancient trails lead to abandoned medieval villages. The combination of superb swimming, fresh seafood, and well-waymarked trails makes this ideal for those seeking a gentler European hiking experience.`,
      location: "Skiathos",
      country: "Greece",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EASY,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Alonnisos marine park snorkelling", "Byzantine mule track network", "Abandoned kastro village ruins", "Traditional fishing harbour tavernas", "Sporades wildlife Eleonora's falcon"],
      gear: ["Light hiking shoes", "Snorkel set", "Sun protection", "Ferry timetable", "Greek phrasebook"],
      bestMonths: [4, 5, 9, 10],
      estimatedCost: 1200,
      latitude: 39.16,
      longitude: 23.9,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["coastal"].id }, { id: allTags["island"].id }, { id: allTags["europe"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure272.id }, { userId: user2.id, adventureId: adventure272.id }], skipDuplicates: true });


  // Adventure 273
  const adventure273 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-273" },
    update: {},
    create: {
      id: "seed-adventure-273",
      title: "Via Dinarica, Bosnia and Herzegovina",
      description: `The Via Dinarica is a pioneering long-distance route through the Dinaric Alps connecting Slovenia to Albania through some of Europe's most remote mountain communities. The Bosnian section through the Prenj massif and Sutjeska National Park offers genuine wilderness, pristine rivers, and a chance to experience a region still emerging from the shadow of its recent conflict. Primeval Perucica Forest contains trees over 300 years old.`,
      location: "Mostar",
      country: "Bosnia and Herzegovina",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Prenj massif 2155m summit", "Sutjeska primeval forest 300-year trees", "Neretva river valley scenery", "War history cultural depth", "Authentic mountain villages"],
      gear: ["Trekking poles", "Mountain tent", "Navigation compass", "Blister prevention kit", "Cash for rural guesthouses"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 600,
      latitude: 43.34,
      longitude: 17.81,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["europe"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure273.id }, { userId: user2.id, adventureId: adventure273.id }], skipDuplicates: true });


  // Adventure 274
  const adventure274 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-274" },
    update: {},
    create: {
      id: "seed-adventure-274",
      title: "Lofoten Islands Sea Kayaking",
      description: `The Lofoten archipelago above the Arctic Circle in Norway offers world-class sea kayaking through a dramatic landscape of jagged peaks rising directly from the sea. Paddling between fishing villages where stockfish still dries on wooden racks, passing sea eagles overhead and glimpsing orca fins in winter, this is Scandinavian adventure at its most iconic. The midnight sun illuminates the mountains in amber and rose from June to July.`,
      location: "Svolvaer",
      country: "Norway",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Midnight sun paddling", "Sea eagle sightings overhead", "Traditional fishing village culture", "Trollfjord narrow gorge", "Orca whale watching in season"],
      gear: ["Sea kayak with spray skirt", "Dry suit", "VHF radio", "Navigation charts", "Tow rope"],
      bestMonths: [6, 7],
      estimatedCost: 1500,
      latitude: 68.23,
      longitude: 14.57,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["midnight-sun"].id }, { id: allTags["coastal"].id }, { id: allTags["arctic"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure274.id }, { userId: user2.id, adventureId: adventure274.id }, { userId: user3.id, adventureId: adventure274.id }], skipDuplicates: true });


  // Adventure 275
  const adventure275 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-275" },
    update: {},
    create: {
      id: "seed-adventure-275",
      title: "Finland Lakeland Canoe Route",
      description: `Finland's Lakeland region contains nearly 200,000 lakes connected by rivers, channels, and short portages into one of the world's great canoe touring networks. The Blue Highway crosses from Heinola to Joensuu over 500 kilometres through primeval forests of pine and birch where elk and ospreys are daily sightings. Remote wilderness camping is legal everywhere under Everyman's Right, and the silence of the Finnish forest is profound.`,
      location: "Heinola",
      country: "Finland",
      continent: "Europe",
      category: Category.KAYAKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 21,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["200000 interconnected lake system", "Everyman Right wild camping", "Midnight sun June canoe days", "Elk and osprey wildlife", "Traditional smoke sauna culture"],
      gear: ["Touring canoe", "Portage cart", "Waterproof dry bags", "Fishing rod", "Finnish sauna towel"],
      bestMonths: [6, 7, 8],
      estimatedCost: 800,
      latitude: 61.2,
      longitude: 26.03,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["midnight-sun"].id }, { id: allTags["camping"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure275.id }, { userId: user2.id, adventureId: adventure275.id }], skipDuplicates: true });


  // Adventure 276
  const adventure276 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-276" },
    update: {},
    create: {
      id: "seed-adventure-276",
      title: "Mont Blanc Ultra-Trail Preparation Circuit",
      description: `The Tour du Mont Blanc is the iconic 170-kilometre circuit around western Europe's highest massif, passing through France, Italy, and Switzerland in a continuous high-mountain loop. The route crosses eleven major passes and gains over 10,000 metres of total elevation, passing through Chamonix, Courmayeur, and Champex. The annual UTMB race follows this route, but the classic 10-day walking version allows full immersion in alpine culture.`,
      location: "Chamonix",
      country: "France",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Three-country circuit France Italy Switzerland", "Ten high mountain passes", "Chamonix valley glacier views", "Refuge hut-to-hut accommodation", "Mont Blanc 4808m summit views"],
      gear: ["Trail running poles", "Mountain refuges booking", "Gaiters", "Rain jacket", "Hut sleeping sheet"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1200,
      latitude: 45.92,
      longitude: 6.87,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["mountains"].id }, { id: allTags["europe"].id }, { id: allTags["alpine"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure276.id }, { userId: user2.id, adventureId: adventure276.id }, { userId: user3.id, adventureId: adventure276.id }], skipDuplicates: true });


  // Adventure 277
  const adventure277 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-277" },
    update: {},
    create: {
      id: "seed-adventure-277",
      title: "Kumano Kodo Pilgrimage, Japan",
      description: `The Kumano Kodo is a network of ancient pilgrimage routes in the Kii Peninsula that have been walked for over 1,000 years, connecting the imperial capital Kyoto with the three Grand Shrines of Kumano. The Nakahechi route is the most historic section, passing through cedar forest and small onsen villages where pilgrims have sought purification since the Heian period. The route shares UNESCO World Heritage status with the Camino de Santiago.`,
      location: "Tanabe",
      country: "Japan",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["UNESCO World Heritage pilgrimage route", "Nachi waterfall Japan highest", "Kumano Hongu Taisha Grand Shrine", "Traditional onsen hot spring villages", "Ancient cedar forest paths"],
      gear: ["Hiking poles", "Traditional pilgrim white shirt", "Rain cover for pack", "Onsen bathing kit", "Japanese phrasebook"],
      bestMonths: [3, 4, 10, 11],
      estimatedCost: 1500,
      latitude: 33.73,
      longitude: 135.38,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["hiking"].id }, { id: allTags["camino"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure277.id }, { userId: user2.id, adventureId: adventure277.id }, { userId: user3.id, adventureId: adventure277.id }], skipDuplicates: true });


  // Adventure 278
  const adventure278 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-278" },
    update: {},
    create: {
      id: "seed-adventure-278",
      title: "Vietnam Northern Loop Motorcycle",
      description: `The northern Vietnam loop through Ha Giang, Dong Van, and the Lung Cu border area passes through the most dramatic karst mountain scenery in Southeast Asia. The Dong Van Karst Plateau Geopark UNESCO site contains fossilised coral formations 400-500 million years old, and the Sunday markets of Bac Ha and Can Cau draw hill tribe communities in full traditional dress. This is a genuine frontier road trip along China's border.`,
      location: "Ha Giang",
      country: "Vietnam",
      continent: "Asia",
      category: Category.ROAD_TRIP,
      difficulty: Difficulty.MODERATE,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Dong Van Karst Plateau UNESCO Geopark", "Lung Cu border post marker", "H'mong and Dao hill tribe markets", "Ma Pi Leng mountain pass", "Nho Que river emerald gorge"],
      gear: ["Automatic scooter", "Rain poncho", "Offline maps downloaded", "Helmet with visor", "Motorbike permit"],
      bestMonths: [10, 11, 12, 3, 4],
      estimatedCost: 400,
      latitude: 23.22,
      longitude: 105.04,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["mountains"].id }, { id: allTags["remote"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure278.id }, { userId: user2.id, adventureId: adventure278.id }], skipDuplicates: true });


  // Adventure 279
  const adventure279 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-279" },
    update: {},
    create: {
      id: "seed-adventure-279",
      title: "Laos Gibbon Experience Ziplines",
      description: `The Gibbon Experience in the Bokeo Nature Reserve in northwestern Laos combines zipline travel through the jungle canopy with treehouse sleeping to minimise ground impact. Guests travel between treehouses built 30 metres above the forest floor on steel cables up to 500 metres long, moving through the territory of the endangered black-crested gibbon. Dawn serenades of gibbon calls and sleeping above the clouds define this unique adventure.`,
      location: "Huay Xai",
      country: "Laos",
      continent: "Asia",
      category: Category.MULTI_SPORT,
      difficulty: Difficulty.MODERATE,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Treehouse sleeping 30m above forest floor", "Zipline network through jungle canopy", "Black-crested gibbon dawn calls", "Bokeo Nature Reserve conservation", "River crossing by zipline"],
      gear: ["Sturdy closed-toe shoes", "Insect repellent", "Lightweight dry bag", "Head torch", "Nothing valuable"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 280,
      latitude: 20.27,
      longitude: 100.43,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["jungle"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }, { id: allTags["multi-sport"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure279.id }, { userId: user2.id, adventureId: adventure279.id }, { userId: user3.id, adventureId: adventure279.id }], skipDuplicates: true });


  // Adventure 280
  const adventure280 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-280" },
    update: {},
    create: {
      id: "seed-adventure-280",
      title: "New Zealand Heaphy Track",
      description: `The Heaphy Track crosses Kahurangi National Park from the Golden Bay coast to the West Coast in a route that passes through tussock-covered tablelands, goblin forests of ancient beech, and palm-fringed beaches where the Tasman Sea pounds limestone cliffs. This is New Zealand's longest Great Walk at 78 kilometres, crossing five distinct ecological zones. The remoteness and variety make it New Zealand's most biodiverse tramp.`,
      location: "Collingwood",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Nikau palm forest on the West Coast", "Gouland Downs tussock plateau", "Kohaihai beach camp site", "Five ecological zones in one walk", "Limestone cliffs and seal colonies"],
      gear: ["DOC hut booking required", "Sandfly protection", "Waterproof pack liner", "Gaiters for mud", "Hut sleeping bag"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 400,
      latitude: -40.97,
      longitude: 172.42,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["new-zealand"].id }, { id: allTags["coastal"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure280.id }, { userId: user2.id, adventureId: adventure280.id }], skipDuplicates: true });


  // Adventure 281
  const adventure281 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-281" },
    update: {},
    create: {
      id: "seed-adventure-281",
      title: "New Zealand Paparoa Track",
      description: `The Paparoa Track is New Zealand's newest Great Walk, opened in 2019 as a tribute to the 29 men who died in the Pike River Mine disaster in 2010. The route traverses the Paparoa Range and passes the historic Brunner Mine site on the West Coast, combining mountain panoramas with industrial heritage. Mountain bike use is permitted alongside trampers, making this the only Great Walk accessible to cyclists.`,
      location: "Westport",
      country: "New Zealand",
      continent: "Oceania",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Newest New Zealand Great Walk 2019", "Pike River Mine memorial", "Paparoa Range panoramas", "Mountain biking permitted", "West Coast rainforest"],
      gear: ["Mountain bike optional", "DOC hut booking", "Rain gear essential", "Sandfly protection", "Navigation app"],
      bestMonths: [11, 12, 1, 2, 3],
      estimatedCost: 350,
      latitude: -42.04,
      longitude: 171.63,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["new-zealand"].id }, { id: allTags["hiking"].id }, { id: allTags["cycling"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure281.id }, { userId: user2.id, adventureId: adventure281.id }], skipDuplicates: true });


  // Adventure 282
  const adventure282 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-282" },
    update: {},
    create: {
      id: "seed-adventure-282",
      title: "West Coast Trail, Canada",
      description: `The West Coast Trail on Vancouver Island's Pacific coast was originally built as a lifeline rescue route for shipwrecked sailors on the Graveyard of the Pacific. Today it is one of Canada's most challenging and rewarding multi-day coastal routes, requiring ladder climbing, cable car crossings, and surf beach navigation over 75 kilometres. Ancient Quu'as West Coast Trail passes through Nuu-chah-nulth First Nations territory.`,
      location: "Port Renfrew",
      country: "Canada",
      continent: "North America",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["75km wild Pacific coast route", "Cable car and ladder crossings", "Ancient Sitka spruce forest", "Tidal surf beach navigation", "Sea lions wolves and bears"],
      gear: ["Tide tables essential", "Waterproof bags", "Bear canister", "River sandals for crossings", "Parks Canada permit"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 700,
      latitude: 48.55,
      longitude: -124.55,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["coastal"].id }, { id: allTags["remote"].id }, { id: allTags["camping"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure282.id }, { userId: user2.id, adventureId: adventure282.id }, { userId: user3.id, adventureId: adventure282.id }], skipDuplicates: true });


  // Adventure 283
  const adventure283 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-283" },
    update: {},
    create: {
      id: "seed-adventure-283",
      title: "Mount Kenya Technical Climb",
      description: `Mount Kenya's twin summits of Batian and Nelion are technical rock and ice climbs requiring rope and crampon work at 5,199 and 5,188 metres respectively, while the non-technical Point Lenana at 4,985 metres rewards high-altitude trekkers. The mountain straddles the equator at 17,053 feet and has a dramatically compressed ecology from equatorial rainforest to permanent glaciers in only a few vertical kilometres. The Lewis Glacier has shrunk by 90% since 1900.`,
      location: "Nanyuki",
      country: "Kenya",
      continent: "Africa",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXTREME,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Equatorial glacier climbing", "Batian summit at 5199 metres", "Lewis Glacier shrinking since 1900", "Giant lobelia and groundsel zones", "Vertical ecology equatorial to arctic"],
      gear: ["Technical climbing harness", "Ice axes and crampons", "Altitude acclimatisation schedule", "Rock climbing helmet", "Rope 50 metres"],
      bestMonths: [1, 2, 7, 8],
      estimatedCost: 1200,
      latitude: -0.15,
      longitude: 37.3,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["glacier"].id }, { id: allTags["alpine"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure283.id }, { userId: user2.id, adventureId: adventure283.id }], skipDuplicates: true });


  // Adventure 284
  const adventure284 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-284" },
    update: {},
    create: {
      id: "seed-adventure-284",
      title: "Simien Mountains Ethiopian Trek",
      description: `The Simien Mountains of northern Ethiopia form a dramatic highland plateau dissected by erosion into cathedral columns and sheer escarpments dropping thousands of metres to the lowlands. The endangered Walia ibex, gelada baboons, and Ethiopian wolves inhabit these highlands, which are a UNESCO World Heritage Site. The trek to Ras Dashen, Africa's fourth-highest peak at 4,550 metres, crosses the roof of Ethiopia.`,
      location: "Debark",
      country: "Ethiopia",
      continent: "Africa",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Gelada baboon herds thousands strong", "Walia ibex endangered species", "Ras Dashen 4550m fourth highest Africa", "Cathedral column escarpments", "UNESCO World Heritage landscape"],
      gear: ["Warm layers for cold nights", "Scout and armed guard required", "Camera telephoto lens", "High UV sun protection", "Trekking boots"],
      bestMonths: [10, 11, 12, 1, 2, 3],
      estimatedCost: 700,
      latitude: 13.25,
      longitude: 38.37,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["wildlife"].id }, { id: allTags["mountains"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure284.id }, { userId: user2.id, adventureId: adventure284.id }], skipDuplicates: true });


  // Adventure 285
  const adventure285 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-285" },
    update: {},
    create: {
      id: "seed-adventure-285",
      title: "Trolltunga Hike, Norway",
      description: `Trolltunga, the Troll's Tongue, is a horizontal rock ledge that juts out 700 metres above Lake Ringedalsvatnet in western Norway, creating one of the world's most dramatic photography spots. The 22-kilometre return hike gains 800 metres of elevation through birch forest and over open alpine terrain. The two-hour queue for photos at the tip in summer is bypassed completely by starting before dawn.`,
      location: "Odda",
      country: "Norway",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Trolltunga ledge 700m above fjord", "Ringedalsvatnet turquoise lake", "Alpine plateau scenery", "Wild camping on plateau", "Dawn start to avoid crowds"],
      gear: ["Hiking boots with ankle support", "Rain jacket", "Headlamp for early start", "Snacks and water 4 litres", "Emergency bivouac"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 400,
      latitude: 60.12,
      longitude: 6.74,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["europe"].id }, { id: allTags["photography"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure285.id }, { userId: user2.id, adventureId: adventure285.id }, { userId: user3.id, adventureId: adventure285.id }], skipDuplicates: true });


  // Adventure 286
  const adventure286 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-286" },
    update: {},
    create: {
      id: "seed-adventure-286",
      title: "Rwenzori Mountains Trek, Uganda",
      description: `The Rwenzori Mountains on the Uganda-DRC border are Ptolemy's Mountains of the Moon, the legendary source of the Nile, shrouded in cloud and draped with bizarre Afroalpine vegetation. The central circuit passes through zones of giant heather, groundsels the size of trees, and lobelia forests dripping with moss, before reaching the glaciated peaks of Margherita at 5,109 metres. This is the most botanically extraordinary mountain trek in the world.`,
      location: "Kasese",
      country: "Uganda",
      continent: "Africa",
      category: Category.MOUNTAINEERING,
      difficulty: Difficulty.EXTREME,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Giant heather trees 10 metres high", "Margherita Peak 5109m third Africa", "Equatorial glaciers rapidly retreating", "Unique Afroalpine plant zones", "Mountains of the Moon mythology"],
      gear: ["Waterproof everything mud ubiquitous", "Gaiters up to the knee", "Ice axe and crampons for summit", "Altitude sleeping bag", "Anti-fungal foot treatment"],
      bestMonths: [12, 1, 2, 6, 7, 8],
      estimatedCost: 1800,
      latitude: 0.37,
      longitude: 29.9,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["mountaineering"].id }, { id: allTags["jungle"].id }, { id: allTags["glacier"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure286.id }, { userId: user2.id, adventureId: adventure286.id }], skipDuplicates: true });


  // Adventure 287
  const adventure287 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-287" },
    update: {},
    create: {
      id: "seed-adventure-287",
      title: "Trans-Siberian Cycling Expedition",
      description: `Cycling the full Trans-Siberian route from Vladivostok to Moscow covers over 10,000 kilometres through the taiga forests, steppe grasslands, and Siberian cities that span eleven time zones. The route passes through the remote Buryat Buddhist regions around Lake Baikal and crosses the Ural Mountains, the traditional boundary between Europe and Asia. This is the ultimate long-distance cycling challenge in terms of sheer distance and logistical complexity.`,
      location: "Vladivostok",
      country: "Russia",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 90,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["10000km across eleven time zones", "Lake Baikal world deepest lake", "Ural Mountains Europe-Asia boundary", "Buryat Buddhist temple stays", "Trans-Siberian railway parallel route"],
      gear: ["Touring bicycle fully loaded", "Expedition tent", "Bear spray Siberian wildlife", "Russian SIM card", "Comprehensive tool kit"],
      bestMonths: [6, 7, 8],
      estimatedCost: 3000,
      latitude: 43.12,
      longitude: 131.9,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["expedition"].id }, { id: allTags["remote"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure287.id }, { userId: user2.id, adventureId: adventure287.id }, { userId: user3.id, adventureId: adventure287.id }], skipDuplicates: true });


  // Adventure 288
  const adventure288 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-288" },
    update: {},
    create: {
      id: "seed-adventure-288",
      title: "Africa Cycling - Cairo to Cape Town",
      description: `The Cairo to Cape Town cycling route is considered the greatest cycling challenge in Africa, covering over 12,000 kilometres through ten countries from the Pyramids to the Cape of Good Hope. The route passes through the Nubian desert, Ethiopian highlands, East African Rift Valley, and Malawian lakeshore before entering southern Africa. The Tour d'Afrique organised race attracts over a hundred cyclists annually, but independent riders have their own extraordinary experience.`,
      location: "Cairo",
      country: "Egypt",
      continent: "Africa",
      category: Category.CYCLING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 120,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Cairo Pyramids start point", "Nile valley cycling first week", "Ethiopian highland climbs", "Rift Valley lake camps", "Cape of Good Hope finish"],
      gear: ["Touring bicycle and spare parts", "Multi-entry visas arranged", "Expedition budget for four months", "Panniers waterproofed", "Malaria prophylaxis"],
      bestMonths: [12, 1, 2, 3, 4],
      estimatedCost: 6000,
      latitude: 30.04,
      longitude: 31.23,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["expedition"].id }, { id: allTags["safari"].id }, { id: allTags["multi-day"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure288.id }, { userId: user2.id, adventureId: adventure288.id }, { userId: user3.id, adventureId: adventure288.id }], skipDuplicates: true });


  // Adventure 289
  const adventure289 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-289" },
    update: {},
    create: {
      id: "seed-adventure-289",
      title: "Caribbean Diving - Turks and Caicos Wall",
      description: `The Turks and Caicos Islands sit on the edge of the third-largest coral reef system in the world, with vertical walls dropping thousands of feet into the Columbus Passage. The legendary Wall at Providenciales descends from 10 metres to beyond 600 metres, draped with black coral and patrolled by reef and silky sharks. French Cay and West Caicos offer pristine sites visited by whale sharks between February and April.`,
      location: "Providenciales",
      country: "Turks and Caicos Islands",
      continent: "North America",
      category: Category.DIVING,
      difficulty: Difficulty.MODERATE,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["Vertical wall diving to 600 metres", "Whale shark encounters Feb-Apr", "Reef shark and silky shark populations", "Third largest coral reef world", "Crystal clear 30m visibility"],
      gear: ["Advanced open water certification", "Dive computer", "Wide-angle underwater lens", "Wetsuit 3mm", "Mask fins BCD"],
      bestMonths: [2, 3, 4, 5, 11, 12],
      estimatedCost: 2200,
      latitude: 21.77,
      longitude: -72.26,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["diving"].id }, { id: allTags["island"].id }, { id: allTags["wildlife"].id }, { id: allTags["coastal"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure289.id }, { userId: user2.id, adventureId: adventure289.id }], skipDuplicates: true });


  // Adventure 290
  const adventure290 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-290" },
    update: {},
    create: {
      id: "seed-adventure-290",
      title: "Micronesia Blue Hole Diving - Palau",
      description: `Palau's dive sites rank consistently among the top five in the world, with the Blue Corner wall dive seeing hundreds of grey reef sharks and Napoleon wrasse gathering in the current. The Jellyfish Lake is a landlocked marine lake where two species of stingless jellyfish have evolved since being isolated from the ocean 12,000 years ago, numbering up to five million individuals. The WWII shipwrecks of Helmet Wreck and Iro Maru add historical depth.`,
      location: "Koror",
      country: "Palau",
      continent: "Oceania",
      category: Category.DIVING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Blue Corner grey reef shark aggregation", "Jellyfish Lake stingless jellyfish millions", "WWII shipwreck diving", "Manta ray cleaning station", "Rock Island marine protected area"],
      gear: ["Advanced open water", "Reef hook for current diving", "Dive computer", "Underwater wide-angle lens", "Snorkel for Jellyfish Lake"],
      bestMonths: [11, 12, 1, 2, 3, 4],
      estimatedCost: 2500,
      latitude: 7.34,
      longitude: 134.47,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["diving"].id }, { id: allTags["island"].id }, { id: allTags["wildlife"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure290.id }, { userId: user2.id, adventureId: adventure290.id }, { userId: user3.id, adventureId: adventure290.id }], skipDuplicates: true });


  // Adventure 291
  const adventure291 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-291" },
    update: {},
    create: {
      id: "seed-adventure-291",
      title: "Borneo Headhunter's Trail",
      description: `The Headhunter's Trail follows an ancient Iban war route from Limbang in Sarawak across the watershed into Sabah through the heart of Borneo's Crocker Range. The route passes through longhouse communities where traditional woodcarving and weaving continue, and the jungle contains proboscis monkeys, pygmy elephants, and wild orangutans. This is one of the few routes in Borneo that still requires guide navigation through unmarked primary forest.`,
      location: "Limbang",
      country: "Malaysia",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Ancient Iban headhunter war route", "Iban longhouse community stays", "Wild orangutan and proboscis monkey", "Untouched primary Borneo rainforest", "Sabah Sarawak border crossing"],
      gear: ["Jungle boots with leeches protection", "Parang machete", "Water purification", "Malaria prophylaxis", "Waterproof dry bags"],
      bestMonths: [3, 4, 5, 6],
      estimatedCost: 1400,
      latitude: 4.76,
      longitude: 115.74,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["jungle"].id }, { id: allTags["expedition"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure291.id }, { userId: user2.id, adventureId: adventure291.id }], skipDuplicates: true });


  // Adventure 292
  const adventure292 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-292" },
    update: {},
    create: {
      id: "seed-adventure-292",
      title: "Greenland Ice Cap Ski Traverse",
      description: `Crossing the Greenland Ice Cap from Kangerlussuaq to Sisimiut is one of the world's great polar ski journeys, covering 550 kilometres on the world's second-largest ice sheet at altitudes up to 2,500 metres. The route follows the Nansen historic track from 1888 on skis with pulks loaded with three weeks of supplies. White-out conditions, katabatic winds, and polar cold make this a serious polar expedition.`,
      location: "Kangerlussuaq",
      country: "Greenland",
      continent: "North America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 24,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Second largest ice sheet on Earth", "550km unsupported traverse", "Nansen 1888 historic route", "Polar white-out navigation", "Sisimiut coastal Greenland finish"],
      gear: ["Pulk sled 40kg supplies", "Polar tent double-wall", "Cross-country skis with skins", "Satellite communicator", "Polar expedition clothing system"],
      bestMonths: [4, 5],
      estimatedCost: 8000,
      latitude: 66.99,
      longitude: -50.7,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["glacier"].id }, { id: allTags["arctic"].id }, { id: allTags["skiing"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure292.id }, { userId: user2.id, adventureId: adventure292.id }, { userId: user3.id, adventureId: adventure292.id }], skipDuplicates: true });


  // Adventure 293
  const adventure293 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-293" },
    update: {},
    create: {
      id: "seed-adventure-293",
      title: "Sri Lanka Coastal Cycle",
      description: `Cycling the Sri Lankan coast from Colombo to Jaffna via the Cultural Triangle passes ancient temple complexes, colonial Dutch forts, and spice plantations in a country that packs extraordinary cultural density into a small island. The central highlands section through Kandy and Ella requires climbing tea plantation roads above 2,000 metres. Sri Lanka's post-war renewal makes this one of Asia's most rewarding cycle touring destinations.`,
      location: "Colombo",
      country: "Sri Lanka",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.MODERATE,
      durationDays: 18,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Sigiriya rock fortress UNESCO site", "Ella highland tea plantation roads", "Ancient Anuradhapura kingdom ruins", "Blue whale watching off Mirissa", "Jaffna Tamil culture peninsula"],
      gear: ["Touring bicycle with racks", "Buddhist temple entrance sarong", "Rain gear monsoon season", "Cycling computer", "Repair kit"],
      bestMonths: [12, 1, 2, 3, 4],
      estimatedCost: 900,
      latitude: 6.93,
      longitude: 79.85,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["coastal"].id }, { id: allTags["island"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure293.id }, { userId: user2.id, adventureId: adventure293.id }], skipDuplicates: true });


  // Adventure 294
  const adventure294 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-294" },
    update: {},
    create: {
      id: "seed-adventure-294",
      title: "Jordan Desert Hiking - Wadi Rum Circuit",
      description: `The Wadi Rum desert in southern Jordan is a vast sandstone and granite landscape of towering red pillars and sweeping dunescapes that Lawrence of Arabia called the most magnificent place on Earth. Multi-day trekking circuits through Wadi Rum traverse ancient Nabataean camel routes between Bedouin camps where tea is always offered beneath the stars. The Jebel Rum massif and Burdah Rock Bridge are iconic objectives on the longer routes.`,
      location: "Wadi Rum Village",
      country: "Jordan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Burdah Rock Bridge scramble 80m high", "Bedouin camp stargazing", "Lawrence of Arabia film sites", "Nabataean petroglyphs rock art", "Jebel Rum highest summit 1754m"],
      gear: ["Desert hiking boots", "Sun protection system", "Sleeping bag for cold nights", "Head torch", "Sahara scarf"],
      bestMonths: [10, 11, 3, 4],
      estimatedCost: 500,
      latitude: 29.58,
      longitude: 35.42,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["desert"].id }, { id: allTags["camping"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure294.id }, { userId: user2.id, adventureId: adventure294.id }, { userId: user3.id, adventureId: adventure294.id }], skipDuplicates: true });


  // Adventure 295
  const adventure295 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-295" },
    update: {},
    create: {
      id: "seed-adventure-295",
      title: "Mongolia Eagle Hunters Journey",
      description: `The Kazakh eagle hunters of western Mongolia's Bayan-Ulgii province have practised berkutchi eagle hunting for over 4,000 years, training golden eagles to hunt foxes and rabbits on horseback across the Altai steppe. Staying with a hunting family during the autumn migration and witnessing the training of an immature eagle is one of the most extraordinary cultural encounters available anywhere. The annual Golden Eagle Festival in Ulgii brings all hunters together in October.`,
      location: "Ulgii",
      country: "Mongolia",
      continent: "Asia",
      category: Category.CULTURAL,
      difficulty: Difficulty.MODERATE,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Eagle hunting with Kazakh berkutchi masters", "Golden Eagle Festival October Ulgii", "Altai Mountain steppe horseback", "Kazakh ger hospitality", "Eagle training ceremony observation"],
      gear: ["Warm winter layers October", "Camera telephoto lens", "Horseback riding experience", "Mongolian translation app", "Gifts for hosting families"],
      bestMonths: [9, 10],
      estimatedCost: 1200,
      latitude: 48.97,
      longitude: 89.97,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cultural-immersion"].id }, { id: allTags["horse-trekking"].id }, { id: allTags["remote"].id }, { id: allTags["wildlife"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure295.id }, { userId: user2.id, adventureId: adventure295.id }], skipDuplicates: true });


  // Adventure 296
  const adventure296 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-296" },
    update: {},
    create: {
      id: "seed-adventure-296",
      title: "Himalayan Bike Descent - Mustang",
      description: `The Upper Mustang restricted area in Nepal preserves the last remnant of the ancient Lo Kingdom, with its Tibetan-style cave cities, medieval walled town of Lo Manthang, and completely arid landscape unlike anywhere else in Nepal. Descending by mountain bike from the high desert plateau at 3,800 metres through the Kali Gandaki gorge, the world's deepest valley, is a unique adventure combining restricted zone access with technical riding.`,
      location: "Jomsom",
      country: "Nepal",
      continent: "Asia",
      category: Category.CYCLING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80",
      highlights: ["Lo Manthang medieval walled city", "Restricted area permit zone", "World's deepest Kali Gandaki gorge", "Tibetan cave city ruins 3000 years old", "Annapurna and Dhaulagiri views"],
      gear: ["Full suspension mountain bike", "Upper Mustang permit 500 USD", "Warm desert layers", "Bike tool kit", "Satellite emergency device"],
      bestMonths: [3, 4, 5, 9, 10, 11],
      estimatedCost: 1500,
      latitude: 29.18,
      longitude: 83.97,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure296.id }, { userId: user2.id, adventureId: adventure296.id }], skipDuplicates: true });


  // Adventure 297
  const adventure297 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-297" },
    update: {},
    create: {
      id: "seed-adventure-297",
      title: "Dogsledding - Svalbard Wilderness",
      description: `Svalbard at 78 degrees north offers authentic Arctic dogsledding through a wilderness landscape of glaciers, frozen fjords, and polar bear habitat. Spring expeditions from Longyearbyen cover up to 30 kilometres per day through the high Arctic light, with overnight stays in heated wilderness tents. Polar bears roam freely here and rifle-carrying guides are mandatory outside settlements.`,
      location: "Longyearbyen",
      country: "Norway",
      continent: "Europe",
      category: Category.EXPEDITION,
      difficulty: Difficulty.MODERATE,
      durationDays: 6,
      coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
      highlights: ["Arctic dogsledding 78 degrees north", "Polar bear habitat patrol", "Spring Arctic light photography", "Glacier and frozen fjord traverse", "Polar night and aurora winter option"],
      gear: ["Arctic clothing provided", "Down sleeping bag minus 40", "Camera cold-weather protection", "Passport EU rules apply", "No experience required"],
      bestMonths: [3, 4],
      estimatedCost: 2800,
      latitude: 78.22,
      longitude: 15.65,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["arctic"].id }, { id: allTags["expedition"].id }, { id: allTags["wildlife"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure297.id }, { userId: user2.id, adventureId: adventure297.id }, { userId: user3.id, adventureId: adventure297.id }], skipDuplicates: true });


  // Adventure 298
  const adventure298 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-298" },
    update: {},
    create: {
      id: "seed-adventure-298",
      title: "Cook Islands Sea Kayaking",
      description: `The Cook Islands in the South Pacific offer some of the world's finest sea kayaking in the protected lagoons of Aitutaki and Rarotonga, with visibility of 30 metres to the coral below and virtually no boat traffic. The uninhabited motu islets of Aitutaki lagoon can only be reached by paddle, and camping is permitted on some, allowing private tropical island experiences. The outer islands of Mangaia and Mitiaro offer rugged coastal exploration on traditional coral limestone makatea terrain.`,
      location: "Rarotonga",
      country: "Cook Islands",
      continent: "Oceania",
      category: Category.KAYAKING,
      difficulty: Difficulty.EASY,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
      highlights: ["Aitutaki lagoon 30m visibility paddling", "Private motu island camping", "Tropical coral garden snorkelling", "Polynesian navigation tradition", "One Foot Island uninhabited paradise"],
      gear: ["Sea kayak and paddle", "Snorkel set", "Reef shoes", "Dry bag", "Sunscreen reef-safe"],
      bestMonths: [4, 5, 6, 7, 8, 9],
      estimatedCost: 2000,
      latitude: -21.23,
      longitude: -159.78,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["kayaking"].id }, { id: allTags["island"].id }, { id: allTags["coastal"].id }, { id: allTags["diving"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure298.id }, { userId: user2.id, adventureId: adventure298.id }], skipDuplicates: true });


  // Adventure 299
  const adventure299 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-299" },
    update: {},
    create: {
      id: "seed-adventure-299",
      title: "Scottish Highland High Route",
      description: `The Scottish Highland High Route follows the watershed ridges and high passes of the Scottish Highlands from Aviemore to Torridon in a 160-kilometre route entirely above the valleys. The Cairngorm plateau, Grey Corries, Kintail Five Sisters, and Torridon quartzite peaks form the backbone of this serious off-trail mountaineering traverse. Scotland's Munros, hills above 3,000 feet, provide a lifetime of mountain challenges for peak baggers.`,
      location: "Aviemore",
      country: "United Kingdom",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.EXTREME,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
      highlights: ["Cairngorm plateau Britain highest plateau", "Kintail Five Sisters ridge traverse", "Torridon 750m quartzite faces", "Off-trail navigation required", "Ben Nevis via CMD Arete option"],
      gear: ["Navigation compass and OS maps", "Winter ice axe and crampons", "Mountain tent windproof", "Gaiter system for heather", "Emergency bivouac shelter"],
      bestMonths: [6, 7, 8, 9],
      estimatedCost: 600,
      latitude: 57.19,
      longitude: -3.83,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["scotland"].id }, { id: allTags["mountains"].id }, { id: allTags["scrambling"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure299.id }, { userId: user2.id, adventureId: adventure299.id }], skipDuplicates: true });


  // Adventure 300
  const adventure300 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-300" },
    update: {},
    create: {
      id: "seed-adventure-300",
      title: "Peru Amazon Headwaters Expedition",
      description: `The Madre de Dios drainage in southeastern Peru contains the most biodiverse region on Earth, with Manu National Park UNESCO Biosphere Reserve recording more bird species than the entire continental United States. Canoe journeys from Atalaya down remote tributaries pass through territory where some indigenous communities maintain voluntary isolation. The transition from Andean cloud forest at 3,500 metres to Amazon lowland at 300 metres within a single journey is biologically staggering.`,
      location: "Cusco",
      country: "Peru",
      continent: "South America",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXTREME,
      durationDays: 12,
      coverImageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1600&q=80",
      highlights: ["Manu National Park highest biodiversity", "Harpy eagle jaguar sightings", "Cloud forest to Amazon descent", "Indigenous community visits", "Oxbow lake caiman and giant otters"],
      gear: ["Malaria prophylaxis essential", "Waterproof dry bags", "Rubber jungle boots", "Binoculars wildlife spotting", "Yellow fever vaccination"],
      bestMonths: [5, 6, 7, 8, 9],
      estimatedCost: 2000,
      latitude: -13.52,
      longitude: -71.98,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["jungle"].id }, { id: allTags["wildlife"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure300.id }, { userId: user2.id, adventureId: adventure300.id }, { userId: user3.id, adventureId: adventure300.id }], skipDuplicates: true });


  // Adventure 301
  const adventure301 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-301" },
    update: {},
    create: {
      id: "seed-adventure-301",
      title: "Iceland Laugavegur Trail",
      description: `The Laugavegur trail from Landmannalaugar to Thorsmork is Iceland's iconic multi-day trekking route, crossing a landscape of rainbow rhyolite mountains, obsidian lava fields, glaciers, and geothermal hot springs in 55 kilometres. Natural hot spring bathing is built into the journey, with pools at Landmannalaugar offering post-hike soaks in 38-degree water. The optional Fimmvorduhals continuation crosses two active volcanic fissures from the 2010 Eyjafjallajokull eruption.`,
      location: "Landmannalaugar",
      country: "Iceland",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.CHALLENGING,
      durationDays: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
      highlights: ["Rainbow rhyolite mountain colours", "Natural geothermal hot spring soaks", "Eyjafjallajokull 2010 lava fields", "Thorsmork birch forest oasis", "River crossings without bridges"],
      gear: ["Trekking poles for river crossings", "Waterproof boots", "Hut sleeping bag liner", "Rain jacket windproof", "Gaiters"],
      bestMonths: [7, 8],
      estimatedCost: 900,
      latitude: 63.99,
      longitude: -19.07,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["volcanic"].id }, { id: allTags["europe"].id }, { id: allTags["mountains"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure301.id }, { userId: user2.id, adventureId: adventure301.id }, { userId: user3.id, adventureId: adventure301.id }], skipDuplicates: true });


  // Adventure 302
  const adventure302 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-302" },
    update: {},
    create: {
      id: "seed-adventure-302",
      title: "Iran Alborz Mountain Ski Touring",
      description: `The Alborz Mountains north of Tehran contain some of the finest ski touring in Asia, with Tochal mountain gondola reaching 3,815 metres and Damavand, the highest peak in the Middle East at 5,610 metres, offering a demanding ski mountaineering objective above Tehran's smog. The Iranian ski culture is thriving and welcoming, with a surprising number of ski resorts at Dizin and Shemshak operating on weekends. Ski touring to Damavand's crater is a serious high-altitude ski mountaineering objective.`,
      location: "Tehran",
      country: "Iran",
      continent: "Asia",
      category: Category.SKIING,
      difficulty: Difficulty.EXTREME,
      durationDays: 8,
      coverImageUrl: "https://images.unsplash.com/photo-1530178662788-3be1a7c55749?w=1600&q=80",
      highlights: ["Damavand 5610m highest Middle East ski", "Tehran visible from 5000m summit", "Dizin ski resort Asia best conditions", "Tochal gondola 3815m overnight hut", "Crater lake summit views"],
      gear: ["Ski mountaineering skis", "Skins and crampons", "Altitude medication", "Iranian visa in advance", "Mountain guide required Damavand"],
      bestMonths: [1, 2, 3, 4],
      estimatedCost: 1500,
      latitude: 35.96,
      longitude: 52.1,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["high-altitude"].id }, { id: allTags["mountains"].id }, { id: allTags["expedition"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure302.id }, { userId: user2.id, adventureId: adventure302.id }], skipDuplicates: true });


  // Adventure 303
  const adventure303 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-303" },
    update: {},
    create: {
      id: "seed-adventure-303",
      title: "Bhutan Snowman Trek",
      description: `The Snowman Trek in Bhutan is consistently ranked among the world's most challenging high-altitude treks, crossing eleven passes above 4,500 metres and spending three weeks in zones where no villages exist and resupply is impossible. Only about 25% of trekkers who start actually complete the full 35-day route from Paro to Sephu, due to altitude sickness, weather, and sheer difficulty. The traverse of the Lunana district passes through Bhutan's most remote inhabited valley.`,
      location: "Paro",
      country: "Bhutan",
      continent: "Asia",
      category: Category.EXPEDITION,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 35,
      coverImageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
      highlights: ["Eleven passes above 4500 metres", "Lunana remotest inhabited valley", "25 percent completion rate", "Bhutan 250 USD daily tourism fee", "Gangkhar Puensum views highest unclimbed mountain"],
      gear: ["Expedition horse support required", "Full camping system", "Mandatory Bhutanese guide", "High altitude sleeping bag", "Emergency altitude medication"],
      bestMonths: [9, 10],
      estimatedCost: 9000,
      latitude: 27.43,
      longitude: 89.41,
      published: true,
      userId: user2.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["expedition"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }, { id: allTags["bucket-list"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure303.id }, { userId: user2.id, adventureId: adventure303.id }, { userId: user3.id, adventureId: adventure303.id }], skipDuplicates: true });


  // Adventure 304
  const adventure304 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-304" },
    update: {},
    create: {
      id: "seed-adventure-304",
      title: "Dolomites Alta Via 1",
      description: `The Alta Via 1 is the premier long-distance route through the Italian Dolomites, connecting Lago di Braies to Belluno in 120 kilometres along a series of dramatic ridgelines, via ferrata sections, and Alpine rifugios serving polenta and red wine at 2,700 metres. The orange limestone towers of the Tre Cime di Lavaredo, Marmolada, and Civetta appear in sequence along the route. The combination of extraordinary scenery and comfortable hut accommodation makes this the ideal introduction to Alpine trekking.`,
      location: "Lago di Braies",
      country: "Italy",
      continent: "Europe",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 10,
      coverImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
      highlights: ["Tre Cime di Lavaredo iconic towers", "Rifugio hut-to-hut accommodation", "Marmolada glacier views", "Via ferrata sections with fixed cables", "Dolomiti UNESCO World Heritage"],
      gear: ["Via ferrata set harness and lanyard", "Hiking poles", "Mountain hut booking in advance", "Mountain boots with ankle support", "Rifugio sleeping sheet"],
      bestMonths: [7, 8, 9],
      estimatedCost: 1500,
      latitude: 46.69,
      longitude: 12.08,
      published: true,
      userId: user3.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["trekking"].id }, { id: allTags["europe"].id }, { id: allTags["via-ferrata"].id }, { id: allTags["alpine"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure304.id }, { userId: user2.id, adventureId: adventure304.id }, { userId: user3.id, adventureId: adventure304.id }], skipDuplicates: true });


  // Adventure 305
  const adventure305 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-305" },
    update: {},
    create: {
      id: "seed-adventure-305",
      title: "Trans-Himalayan Winter Ski Tour",
      description: `Ski touring in the Zanskar and Lahaul ranges of the Indian Himalaya during winter offers extreme isolation and world-class powder above 4,000 metres with virtually no other skiers present. The legendary Drang-Drung glacier above Kargil provides a 15-kilometre descent that challenges even expert ski mountaineers. This is considered one of the last truly wild ski mountaineering frontiers, with new routes being established each season.`,
      location: "Manali",
      country: "India",
      continent: "Asia",
      category: Category.SKIING,
      difficulty: Difficulty.EXPEDITION_GRADE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
      highlights: ["Drang-Drung glacier 15km descent", "Zero other skiers complete isolation", "Himalayan winter wilderness", "New route potential frontier", "Altitude 4000m powder skiing"],
      gear: ["Ski mountaineering skis and skins", "Avalanche beacon probe shovel", "High altitude cold weather system", "Satellite communicator", "Mountain guide essential"],
      bestMonths: [1, 2, 3],
      estimatedCost: 3000,
      latitude: 32.24,
      longitude: 77.19,
      published: true,
      userId: user1.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["skiing"].id }, { id: allTags["expedition"].id }, { id: allTags["high-altitude"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure305.id }, { userId: user2.id, adventureId: adventure305.id }], skipDuplicates: true });


  // Adventure 306
  const adventure306 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-306" },
    update: {},
    create: {
      id: "seed-adventure-306",
      title: "Tanzania Zanzibar Spice Tour Cycling",
      description: `Cycling through Zanzibar Stone Town's labyrinthine Arab-Indian quarter and out into the spice plantations of the interior connects the island's history as the world's main clove producer with its Swahili coastal culture. The north coast road to Nungwi passes through villages where dhow building has continued unchanged for centuries, and the turquoise waters fringing the sand are among the clearest in the Indian Ocean. Spice farm visits explain the Portuguese and Omani colonial botanical legacy.`,
      location: "Stone Town",
      country: "Tanzania",
      continent: "Africa",
      category: Category.CYCLING,
      difficulty: Difficulty.EASY,
      durationDays: 7,
      coverImageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
      highlights: ["Stone Town UNESCO World Heritage", "Clove and vanilla spice farm visits", "Traditional dhow building workshops", "Nungwi beach turquoise water", "Swahili culture food markets"],
      gear: ["Comfortable touring bicycle", "Modest dress for village visits", "Beach gear for coastal stops", "Snorkel for coral reefs", "Swahili phrasebook"],
      bestMonths: [6, 7, 8, 9, 10],
      estimatedCost: 800,
      latitude: -6.16,
      longitude: 39.2,
      published: true,
      userId: user2.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["cycling"].id }, { id: allTags["cultural-immersion"].id }, { id: allTags["island"].id }, { id: allTags["coastal"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure306.id }, { userId: user2.id, adventureId: adventure306.id }], skipDuplicates: true });


  // Adventure 307
  const adventure307 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-307" },
    update: {},
    create: {
      id: "seed-adventure-307",
      title: "Yakushima Forest Trek, Japan",
      description: `Yakushima Island in southern Japan contains cryptomeria cedar trees over 2,000 years old, including the legendary Jomon Sugi estimated at 7,200 years, making it the oldest living tree in Japan. The interior mountain of Miyanoura-dake at 1,936 metres is the highest point in Kyushu and is covered in gnarled ancient forest that inspired the forest landscapes of Studio Ghibli's Princess Mononoke. The island receives 10,000 millimetres of rain annually and the moss-covered forest has an otherworldly quality.`,
      location: "Miyanoura Port",
      country: "Japan",
      continent: "Asia",
      category: Category.TREKKING,
      difficulty: Difficulty.MODERATE,
      durationDays: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1600&q=80",
      highlights: ["Jomon Sugi cedar 7200 years old", "Princess Mononoke forest inspiration", "Miyanoura-dake 1936m island summit", "Rainforest deer and flying squirrels", "UNESCO World Heritage ancient cedar"],
      gear: ["Waterproof everything always raining", "Hiking boots with grip", "Mosquito repellent", "Warm layers summit winds", "Photography rain covers"],
      bestMonths: [3, 4, 9, 10, 11],
      estimatedCost: 600,
      latitude: 30.33,
      longitude: 130.53,
      published: true,
      userId: user3.id,
      voteCount: 2,
      tags: { connect: [{ id: allTags["hiking"].id }, { id: allTags["jungle"].id }, { id: allTags["island"].id }, { id: allTags["photography"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure307.id }, { userId: user2.id, adventureId: adventure307.id }], skipDuplicates: true });


  // Adventure 308
  const adventure308 = await prisma.adventure.upsert({
    where: { id: "seed-adventure-308" },
    update: {},
    create: {
      id: "seed-adventure-308",
      title: "Madagascar Lemur Trek",
      description: `Madagascar has been isolated from Africa for 88 million years and has evolved an entirely unique fauna including over 100 lemur species found nowhere else on Earth. The Andasibe-Mantadia National Park near Antananarivo contains indri lemurs whose haunting territorial calls echo through the forest at dawn. The Ankarana Tsingy de Bemaraha reserve presents a surreal landscape of razor-sharp limestone pinnacles rising 70 metres from the forest floor.`,
      location: "Antananarivo",
      country: "Madagascar",
      continent: "Africa",
      category: Category.SAFARI,
      difficulty: Difficulty.MODERATE,
      durationDays: 14,
      coverImageUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1600&q=80",
      highlights: ["Indri lemur dawn calls Andasibe", "Tsingy limestone pinnacle forests", "100 lemur species found only here", "Fossa Madagascar apex predator", "Avenue of the Baobabs iconic trees"],
      gear: ["Binoculars for lemur spotting", "Camera telephoto lens", "Malaria prophylaxis", "Comfortable trekking footwear", "Mosquito net"],
      bestMonths: [7, 8, 9, 10],
      estimatedCost: 2500,
      latitude: -18.91,
      longitude: 47.54,
      published: true,
      userId: user1.id,
      voteCount: 3,
      tags: { connect: [{ id: allTags["safari"].id }, { id: allTags["wildlife"].id }, { id: allTags["jungle"].id }, { id: allTags["remote"].id }] },
    },
  });
  await prisma.vote.createMany({ data: [{ userId: user1.id, adventureId: adventure308.id }, { userId: user2.id, adventureId: adventure308.id }, { userId: user3.id, adventureId: adventure308.id }], skipDuplicates: true });

  const adventureCount = await prisma.adventure.count();
  console.log("Seed data created successfully");
  console.log(`  Users: ${user1.name}, ${user2.name}, ${user3.name}`);
  console.log(`  Adventures: ${adventureCount} total`);
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
