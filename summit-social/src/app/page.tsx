import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const metadata = { title: "Basecamp — Plan Your Next Great Adventure" };

const STAT_LABELS = [
  { key: "adventures", label: "Adventures" },
  { key: "countries", label: "Countries" },
  { key: "continents", label: "Continents" },
] as const;

const CATEGORIES = [
  "Trekking",
  "Mountaineering",
  "Cycling",
  "Kayaking",
  "Safari",
  "Skiing",
  "Surfing",
  "Diving",
  "Road Trip",
  "Expedition",
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
      where: { published: true, continent: { not: undefined } },
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
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-32 sm:py-40">
        {/* Dot-grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #d97706 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Radial fade overlay */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-transparent to-stone-950" />

        {/* Amber glow behind headline */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-600 mb-6">
            The adventure social network
          </p>

          {/* Headline */}
          <h1 className="font-display text-6xl uppercase tracking-[0.08em] text-stone-100 leading-none sm:text-8xl lg:text-[7rem]">
            Your next
            <br />
            <span className="text-amber-500">great adventure</span>
            <br />
            starts here
          </h1>

          {/* Sub-headline */}
          <p className="font-body mt-8 text-lg leading-relaxed text-stone-400 max-w-2xl mx-auto sm:text-xl">
            Basecamp is where serious adventurers discover, plan, and share expeditions — from
            weekend scrambles to multi-month odysseys. Browse routes, build AI-powered itineraries,
            and connect with people who go further.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/adventures"
              className="inline-flex items-center gap-2 border border-amber-500 bg-amber-500 px-8 py-3 font-display text-sm uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400 hover:border-amber-400"
            >
              Explore Adventures
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 border border-stone-700 px-8 py-3 font-display text-sm uppercase tracking-widest text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-100"
            >
              Join Basecamp
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <section className="border-y border-stone-800 bg-stone-900/50">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-stone-800">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center py-8 px-4">
              <span className="font-display text-4xl uppercase tracking-wider text-amber-500 sm:text-5xl">
                {stats[key]}
              </span>
              <span className="font-mono mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category pills ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-stone-600 mb-6">
          Every type of adventure
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="border border-stone-800 px-3 py-1 font-display text-xs uppercase tracking-widest text-stone-500"
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── Feature trio ──────────────────────────────────────────── */}
      <section className="border-t border-stone-800 bg-stone-900/30">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-600">
                Discover
              </p>
              <h3 className="font-display text-2xl uppercase tracking-widest text-stone-100">
                Real Routes
              </h3>
              <p className="font-body text-sm leading-relaxed text-stone-500">
                Browse adventures submitted by the community — filtered by difficulty, duration,
                continent, and category. Every route has been done by a real person.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-600">
                Plan
              </p>
              <h3 className="font-display text-2xl uppercase tracking-widest text-stone-100">
                AI Itineraries
              </h3>
              <p className="font-body text-sm leading-relaxed text-stone-500">
                Chat with an AI co-pilot to build day-by-day itineraries tailored to your budget,
                fitness level, and travel dates. No generic travel advice.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-600">
                Connect
              </p>
              <h3 className="font-display text-2xl uppercase tracking-widest text-stone-100">
                Go Further
              </h3>
              <p className="font-body text-sm leading-relaxed text-stone-500">
                Vote on adventures, follow other explorers, bookmark your bucket list, and share
                your own routes with a community that actually goes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="border-t border-stone-800 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-stone-600 mb-4">Ready?</p>
        <h2 className="font-display text-4xl uppercase tracking-widest text-stone-100 mb-8 sm:text-5xl">
          The mountain won&apos;t wait
        </h2>
        <Link
          href="/adventures"
          className="inline-flex items-center gap-2 border border-amber-500 bg-amber-500 px-10 py-3 font-display text-sm uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400 hover:border-amber-400"
        >
          Start Exploring
        </Link>
      </section>

      <Footer />
    </div>
  );
}
