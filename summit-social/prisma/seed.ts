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
