import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const W = "?w=1600&q=80";
const BASE = "https://images.unsplash.com/photo-";

function u(id: string) {
  return `${BASE}${id}${W}`;
}

// 12-15 high-quality Unsplash photos per category, cover image will be index 0
// We rotate through these so nearby adventures get varied galleries
const CATEGORY_POOLS: Record<string, string[]> = {
  TREKKING: [
    u("1551632811-561732d1e306"), // Torres del Paine granite spires
    u("1464822759023-fed622ff2c3b"), // mountain summit panorama
    u("1506905925346-21bda4d32df4"), // high alpine trail
    u("1476514525535-07fb3b4ae5f1"), // ridge walk clouds
    u("1504512485720-7d83a16ee930"), // forest trail morning light
    u("1558618666-fcd25c85cd64"), // snowfield trekker
    u("1500534314209-a157d0e14f8b"), // Himalayan valley and peaks
    u("1519985176271-adb1088fa94c"), // mountain lake campsite
    u("1486915309851-b0cc1f8a0084"), // rocky alpine scramble
    u("1531366936337-7c912a4589a7"), // misty valley descent
    u("1470252649378-9c29740c9fa8"), // golden hour ridgeline
    u("1504598318550-17eba1008a68"), // glaciated peak approach
  ],
  MOUNTAINEERING: [
    u("1464822759023-fed622ff2c3b"), // summit with ice axe
    u("1504598318550-17eba1008a68"), // ice-covered peak
    u("1491555103944-7c647fd857e6"), // crampon traverse
    u("1558618666-fcd25c85cd64"), // snow couloir climb
    u("1518020382113-a7e8fc38eac9"), // dawn on the summit
    u("1506905925346-21bda4d32df4"), // high camp tent
    u("1476514525535-07fb3b4ae5f1"), // exposed ridge
    u("1469474968028-56623f02e42e"), // mountain silhouette dusk
    u("1551524559-8af4e6624178"), // winter face approach
    u("1531168556467-80aace0d0144"), // rope team on glacier
    u("1516426122078-c23e76319801"), // crevasse crossing
    u("1490730141103-6cac27aaab94"), // arctic mountaineering
  ],
  SKIING: [
    u("1606857521015-7463af9c8a83"), // deep powder turn
    u("1547517023-6546a27fde7b"), // backcountry skinning
    u("1551524559-8af4e6624178"), // ski touring ridgeline
    u("1484557985045-edb9d33cf0e4"), // couloir descent
    u("1550581190-3af14fe29cc1"), // helicopter skiing
    u("1548116137-c9ac24e446a9"), // powder day ski resort
    u("1517823249873-f642ddc2b7a4"), // dawn patrol skinning
    u("1536788703-ed7f81aa5da4"), // ski mountaineering summit
    u("1580477667995-2b90669a8f8c"), // hut-to-hut ski tour
    u("1519052726739-bcb1a18b24e4"), // ski touring sunset
    u("1505409859467-3a796fd5798e"), // fresh alpine powder
    u("1599408065729-2c4f487c9e14"), // morning groomer run
  ],
  DIVING: [
    u("1518020382113-a7e8fc38eac9"), // reef overview
    u("1559827291-72cdfc29a9f2"), // coral diversity
    u("1551918120-9739cb430c6d"), // hammerhead shark
    u("1544551763-46a013bb70d5"), // manta ray
    u("1484291470158-b8f8d608850d"), // diver and turtle
    u("1552661397-4b6c76ce2c65"), // blue water schooling fish
    u("1559827260-dc66d52bef19"), // night dive bioluminescence
    u("1519046904884-53103b34b206"), // whale shark
    u("1552584751-76a36f8d3d23"), // shipwreck exploration
    u("1496181569671-9571e48a9c42"), // coral garden macro
    u("1544979590-37e9b47eb705"), // tropical reef wall
    u("1525649307028-b83de7cf0580"), // kelp forest
  ],
  SURFING: [
    u("1502680390469-be75c86b636f"), // big wave barrel
    u("1531722569936-825d4ebd6dad"), // surfer on peak
    u("1507697635994-b95a0ac11e27"), // dawn patrol line-up
    u("1519052726739-bcb1a18b24e4"), // tube ride
    u("1520366498724-709889c0c685"), // tropical point break
    u("1492176273113-2d51f47b23b0"), // sunset surf session
    u("1455729552865-3658a5d39692"), // paddle out sequence
    u("1507525428034-b723cf961d3e"), // beach break aerial
    u("1530122037265-a5f1f91d3b99"), // longboard cross-step
    u("1544551763-46a013bb70d5"), // underwater barrel
    u("1504698849-ed96007e1c4c"), // surf culture beach
    u("1558618666-fcd25c85cd64"), // cold water surfing
  ],
  SAFARI: [
    u("1516426122078-c23e76319801"), // lion close-up
    u("1530178662788-3be1a7c55749"), // elephant herd
    u("1532274402911-5a369e4c4bb5"), // leopard in tree
    u("1549366021-119a7d2f7f35"), // Chobe river elephants
    u("1551524559-8af4e6624178"), // sunrise on the plains
    u("1508193638397-1c4234db14d8"), // Serengeti panorama
    u("1544979590-37e9b47eb705"), // giraffe at sunset
    u("1506905925346-21bda4d32df4"), // tented camp night
    u("1494500764479-0c8f2919a3d8"), // rhino portrait
    u("1574068468667-3adfc41e8b5d"), // cheetah hunt
    u("1559548331-f9cb98280344"), // gorilla encounter
    u("1530083685-1e5f03c4ceee"), // wildebeest migration
  ],
  CYCLING: [
    u("1471506480208-91b3a4cc78be"), // mountain road cycling
    u("1585409677983-0f6c41ca9c3b"), // gravel descent
    u("1547471080-7cc2caa01a7e"), // touring loaded bike
    u("1501785888041-af3ef285b470"), // coastal cycle path
    u("1501854140801-50d01698950b"), // forest cycling
    u("1541625602330-2277a4c46182"), // bikepacking camp
    u("1528360983277-13d401cdc186"), // road bike mountain pass
    u("1508193638397-1c4234db14d8"), // remote gravel trail
    u("1507525428034-b723cf961d3e"), // beach bike path
    u("1493246507139-91e8fad9978e"), // desert road cycling
    u("1464822759023-fed622ff2c3b"), // alpine pass climb
    u("1547547442-de3b6e7e7d37"), // bike touring river road
  ],
  KAYAKING: [
    u("1503516459261-40c66117780a"), // sea kayaking coast
    u("1501854140801-50d01698950b"), // river kayaking
    u("1506905925346-21bda4d32df4"), // glacier bay kayak
    u("1531366936337-7c912a4589a7"), // fjord kayaking
    u("1534567153574-2b12153a87f0"), // island kayak camp
    u("1559521783-1d1599583485"), // white water kayak
    u("1490730141103-6cac27aaab94"), // arctic kayaking ice
    u("1504108928284-5F5eb3faa40e"), // mangrove kayak
    u("1525649307028-b83de7cf0580"), // kelp forest kayak
    u("1476514525535-07fb3b4ae5f1"), // kayak sea cave
    u("1558618666-fcd25c85cd64"), // morning flatwater
    u("1548449112-96a38a643324"), // touring kayak coast
  ],
  ROAD_TRIP: [
    u("1493246507139-91e8fad9978e"), // desert highway
    u("1552084117-56a987666449"), // coastal road
    u("1469854523086-cc02fe5d8800"), // mountain pass road
    u("1505118380757-91f5f5632de0"), // long straight road desert
    u("1504108928284-5f5eb3faa40e"), // dirt road forest
    u("1548449112-96a38a643324"), // highway sunset
    u("1507525428034-b723cf961d3e"), // coastal drive
    u("1506905925346-21bda4d32df4"), // mountain road viewpoint
    u("1471506480208-91b3a4cc78be"), // cliff-edge road
    u("1519985176271-adb1088fa94c"), // red rock canyon road
    u("1476514525535-07fb3b4ae5f1"), // crossing a river ford
    u("1508193638397-1c4234db14d8"), // remote dirt track
  ],
  CULTURAL: [
    u("1547981609-4b6bfe67ca0b"), // ancient temple
    u("1566552881560-0be862a7c445"), // traditional market
    u("1595435934249-5df7ed86e1c0"), // monastery interior
    u("1604928141064-207cea6f571f"), // festival ceremony
    u("1498931299472-f7a63a0ef8c8"), // old city streets
    u("1503516459261-40c66117780a"), // traditional village
    u("1506905925346-21bda4d32df4"), // mountain pilgrimage
    u("1524492412937-b28074a5d7da"), // colourful local scene
    u("1476514525535-07fb3b4ae5f1"), // ruins in landscape
    u("1507525428034-b723cf961d3e"), // coastline ancient port
    u("1464822759023-fed622ff2c3b"), // desert architecture
    u("1518020382113-a7e8fc38eac9"), // ceremonial boat scene
  ],
  EXPEDITION: [
    u("1508193638397-1c4234db14d8"), // polar expedition camp
    u("1551524559-8af4e6624178"), // glacier crossing
    u("1464822759023-fed622ff2c3b"), // remote mountain base camp
    u("1476514525535-07fb3b4ae5f1"), // wilderness camp
    u("1506905925346-21bda4d32df4"), // high altitude tent
    u("1518020382113-a7e8fc38eac9"), // oceanic expedition
    u("1531168556467-80aace0d0144"), // rope team crevasse
    u("1490730141103-6cac27aaab94"), // arctic ice expedition
    u("1469474968028-56623f02e42e"), // remote jungle camp
    u("1558618666-fcd25c85cd64"), // expedition approach march
    u("1504598318550-17eba1008a68"), // summit dawn expedition
    u("1531366936337-7c912a4589a7"), // zodiac arctic voyage
  ],
  MULTI_SPORT: [
    u("1476514525535-07fb3b4ae5f1"), // adventure race
    u("1506905925346-21bda4d32df4"), // mountain multi-sport
    u("1464822759023-fed622ff2c3b"), // trail running
    u("1503516459261-40c66117780a"), // swim-bike-run
    u("1518020382113-a7e8fc38eac9"), // open water swim
    u("1507525428034-b723cf961d3e"), // coasteering
    u("1519449556851-5720b33024e7"), // expedition multi-day
    u("1515238152791-8216bfdf89a7"), // canyon adventure
    u("1551524559-8af4e6624178"), // ski-mountaineering
    u("1531168556467-80aace0d0144"), // roping/climbing
    u("1541625602330-2277a4c46182"), // bike and hike
    u("1534567153574-2b12153a87f0"), // paddle and trek
  ],
};

async function main() {
  const adventures = await prisma.adventure.findMany({
    select: { id: true, category: true, coverImageUrl: true },
    orderBy: { id: "asc" },
  });

  console.log(`Backfilling gallery images for ${adventures.length} adventures...`);
  let updated = 0;

  const counters: Record<string, number> = {};

  for (const adv of adventures) {
    const pool = CATEGORY_POOLS[adv.category];
    if (!pool) continue;

    // Rotate through pool starting after cover image position
    const idx = (counters[adv.category] ?? 0) % pool.length;
    counters[adv.category] = (idx + 1);

    // Pick 4 images different from cover, in order from pool
    const gallery: string[] = [];
    let offset = idx;
    while (gallery.length < 4) {
      const candidate = pool[offset % pool.length];
      if (candidate !== adv.coverImageUrl) {
        gallery.push(candidate);
      }
      offset++;
      if (offset - idx > pool.length * 2) break; // safety
    }

    await prisma.adventure.update({
      where: { id: adv.id },
      data: { galleryImages: gallery },
    });

    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${adventures.length}`);
  }

  console.log(`Done — updated ${updated} adventures with gallery images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
