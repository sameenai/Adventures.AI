import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Basecamper — Plan Your Next Great Adventure" };

const STAT_LABELS = [
  { key: "adventures", label: "Adventures" },
  { key: "countries", label: "Countries" },
  { key: "continents", label: "Continents" },
] as const;

const CATEGORIES = [
  { label: "Trekking" },
  { label: "Mountaineering" },
  { label: "Cycling" },
  { label: "Kayaking" },
  { label: "Safari" },
  { label: "Skiing" },
  { label: "Surfing" },
  { label: "Diving" },
  { label: "Road Trip" },
  { label: "Expedition" },
];

const FEATURES = [
  {
    num: "01",
    title: "Real Routes",
    body: "Every adventure is submitted and verified by someone who has actually done it.",
  },
  {
    num: "02",
    title: "AI Itineraries",
    body: "Day-by-day plans built around your budget, fitness, and travel style.",
  },
  {
    num: "03",
    title: "Go Further",
    body: "Find and follow the people who actually make these trips happen.",
  },
];

export default async function LandingPage() {
  const [adventureCount, countryAgg, continentAgg] = await Promise.all([
    prisma.adventure.count({ where: { published: true } }),
    prisma.adventure.groupBy({
      by: ["country"],
      where: { published: true, country: { not: undefined } },
    }),
    prisma.adventure.groupBy({
      by: ["continent"],
      where: {
        published: true,
        continent: {
          in: [
            "Africa",
            "Antarctica",
            "Asia",
            "Europe",
            "North America",
            "Oceania",
            "South America",
          ],
        },
      },
    }),
  ]);

  const stats = {
    adventures: adventureCount,
    countries: countryAgg.length,
    continents: continentAgg.length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
            The adventure social network
          </p>
          <h1 className="mt-7 font-display text-6xl font-light leading-[1.0] tracking-[-0.5px] text-stone-100 sm:text-8xl lg:text-[6.5rem]">
            Your next
            <br />
            <em className="font-light italic text-amber-500">great</em> adventure
            <br />
            starts here.
          </h1>
          <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-sm text-sm font-light leading-[1.9] text-stone-500">
              Discover world-class routes, build AI-powered itineraries, and connect with the people
              who go further.
            </p>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Link
                href="/adventures"
                className="inline-block bg-amber-500 px-8 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-amber-400"
              >
                Start exploring
              </Link>
              <Link
                href="/signup"
                className="text-xs text-stone-500 underline underline-offset-4 transition-colors hover:text-stone-200"
              >
                Join the community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rule ──────────────────────────────────────────────────── */}
      <div className="border-t border-stone-800" />

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap divide-x divide-stone-800">
            {STAT_LABELS.map(({ key, label }) => (
              <div key={key} className="flex flex-col px-6 py-6 first:pl-0 sm:px-12 sm:py-10">
                <span className="font-display text-4xl font-light leading-none tracking-[-1px] text-stone-100 sm:text-5xl">
                  {stats[key]}
                </span>
                <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rule ──────────────────────────────────────────────────── */}
      <div className="border-t border-stone-800" />

      {/* ── Category tabs ─────────────────────────────────────────── */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.25em] text-stone-600">
            Every type of adventure
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ label }) => (
              <Link
                key={label}
                href={`/adventures?category=${label.toUpperCase().replace(/ /g, "_")}`}
                className="border border-stone-800 px-4 py-2 text-xs text-stone-500 transition-colors hover:border-amber-500 hover:text-amber-500"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature trio ──────────────────────────────────────────── */}
      <section className="border-t border-b border-stone-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 sm:divide-x sm:divide-stone-800">
            {FEATURES.map(({ num, title, body }) => (
              <div key={num} className="px-0 py-14 sm:px-10 sm:first:pl-0 sm:last:pr-0">
                {/* Decorative numeral: aria-hidden (the heading carries the
                    order) and the ghost token holds the 3:1 large-text AA line. */}
                <div
                  aria-hidden="true"
                  className="font-display text-5xl font-light leading-none tracking-[-1px] text-ghost"
                >
                  {num}
                </div>
                <h3 className="mt-4 font-display text-2xl font-light text-stone-100">{title}</h3>
                <p className="mt-3 text-sm font-light leading-[1.9] text-stone-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-5xl font-light leading-[1.05] tracking-[-0.5px] text-stone-100 sm:text-6xl lg:text-7xl">
            The mountain
            <br />
            <em className="italic text-amber-500">won&apos;t wait.</em>
          </h2>
          <p className="mt-6 max-w-md text-sm font-light leading-[1.9] text-stone-500">
            Let our AI plan your next expedition. Tell it where you want to go — it handles
            everything else.
          </p>
          <Link
            href="/itinerary"
            className="mt-8 inline-block bg-amber-500 px-8 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-amber-400"
          >
            Start planning →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
