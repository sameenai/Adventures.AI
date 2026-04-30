import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOT_COUNTRIES = new Set([
  // Africa
  "Kenya", "Tanzania", "South Africa", "Botswana", "Namibia", "Zimbabwe", "Uganda",
  "Rwanda", "Ethiopia", "Morocco", "Egypt", "Senegal", "Ghana", "Madagascar",
  "Mozambique", "Zambia", "Malawi", "Comoros", "Seychelles", "Mauritius",
  // South/Southeast Asia
  "India", "Sri Lanka", "Thailand", "Vietnam", "Cambodia", "Laos", "Myanmar",
  "Malaysia", "Indonesia", "Philippines", "Brunei", "Timor-Leste",
  // Middle East / Arabian
  "Oman", "UAE", "Jordan", "Israel", "Yemen", "Saudi Arabia",
  // Central America / Caribbean
  "Costa Rica", "Panama", "Guatemala", "Belize", "Honduras", "Cuba",
  "Dominican Republic", "Jamaica", "Trinidad and Tobago",
  // South America (tropical)
  "Brazil", "Colombia", "Venezuela", "Ecuador", "Bolivia", "Peru",
  // Pacific
  "Fiji", "Vanuatu", "Solomon Islands", "Papua New Guinea",
  // Oceania
  "Maldives",
]);

const COLD_COUNTRIES = new Set([
  "Iceland", "Norway", "Sweden", "Finland", "Greenland", "Svalbard",
  "Antarctica", "Russia", "Mongolia", "Kazakhstan",
  "Canada", // generally cold (exceptions handled by category)
  "United Kingdom", // Scottish Highlands only — rough approximation
]);

const COLD_KEYWORDS = [
  "arctic", "polar", "glacier", "svalbard", "greenland", "iceland", "antarctica",
  "siberia", "alaska", "yukon", "lapland", "patagonia",
];

const HOT_KEYWORDS = [
  "sahara", "desert", "tropical", "reef", "coral", "maldives", "bali",
  "caribbean", "amazon", "rainforest", "jungle", "savanna", "savannah",
];

function inferClimate(adventure: {
  category: string;
  continent: string;
  country: string;
  location: string;
  title: string;
}): string {
  const lower = `${adventure.title} ${adventure.location} ${adventure.country}`.toLowerCase();

  // Category-based overrides (strongest signal)
  if (adventure.category === "SKIING") return "cold";
  if (adventure.category === "DIVING" || adventure.category === "SURFING") return "hot";
  if (adventure.category === "SAFARI") return "hot";

  // Keyword scan in title/location
  if (COLD_KEYWORDS.some((k) => lower.includes(k))) return "cold";
  if (HOT_KEYWORDS.some((k) => lower.includes(k))) return "hot";

  // Country-based
  if (HOT_COUNTRIES.has(adventure.country)) return "hot";
  if (COLD_COUNTRIES.has(adventure.country)) return "cold";

  // Continent-based fallback
  if (adventure.continent === "Africa") return "hot";
  if (adventure.continent === "Antarctica") return "cold";

  // Mountain categories in Asia → mixed (Himalayas etc.)
  if (
    adventure.continent === "Asia" &&
    (adventure.category === "MOUNTAINEERING" ||
      adventure.category === "TREKKING" ||
      adventure.category === "EXPEDITION")
  ) {
    return "mixed";
  }

  // Default
  return "mixed";
}

async function main() {
  const adventures = await prisma.adventure.findMany({
    where: { climate: { equals: [] } },
    select: { id: true, category: true, continent: true, country: true, location: true, title: true },
  });

  console.log(`Found ${adventures.length} adventures with no climate set`);

  const groups: Record<string, string[]> = { hot: [], cold: [], mixed: [] };

  await prisma.$transaction(
    adventures.map((a) => {
      const climate = inferClimate(a);
      groups[climate].push(a.id);
      return prisma.adventure.update({
        where: { id: a.id },
        data: { climate: [climate] },
      });
    }),
  );

  console.log(
    `Done — hot: ${groups.hot.length}, cold: ${groups.cold.length}, mixed: ${groups.mixed.length}`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
