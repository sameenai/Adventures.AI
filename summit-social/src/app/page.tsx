import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Basecamp — Plan Your Next Great Adventure" };

const STAT_LABELS = [
  { key: "adventures", label: "Adventures" },
  { key: "countries", label: "Countries" },
  { key: "continents", label: "Continents" },
] as const;

const CATEGORIES = [
  { label: "Trekking", icon: "⛰" },
  { label: "Mountaineering", icon: "🧗" },
  { label: "Cycling", icon: "🚵" },
  { label: "Kayaking", icon: "🛶" },
  { label: "Safari", icon: "🦁" },
  { label: "Skiing", icon: "⛷" },
  { label: "Surfing", icon: "🏄" },
  { label: "Diving", icon: "🤿" },
  { label: "Road Trip", icon: "🛣" },
  { label: "Expedition", icon: "🗺" },
];

const FEATURES = [
  {
    tag: "Discover",
    title: "Real Routes",
    body: "Browse adventures submitted by the community — filtered by difficulty, duration, continent, and category. Every route has been done by a real person.",
  },
  {
    tag: "Plan",
    title: "AI Itineraries",
    body: "Chat with an AI co-pilot to build day-by-day itineraries tailored to your budget, fitness level, and travel dates. No generic travel advice.",
  },
  {
    tag: "Connect",
    title: "Go Further",
    body: "Vote on adventures, follow other explorers, bookmark your bucket list, and share your own routes with a community that actually goes.",
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
        {/* Dot-grid background — opacity comes from CSS var so it adapts per mode */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, var(--bc-amber-600) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: "var(--dot-opacity)",
          }}
        />
        {/* Radial vignette so text stays readable at center */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-transparent to-stone-950" />
        {/* Amber glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/8 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-500 mb-6">
            ▲ The adventure social network
          </p>

          <h1 className="font-display text-6xl uppercase tracking-[0.08em] text-stone-100 leading-none sm:text-8xl lg:text-[7rem]">
            Your next
            <br />
            <span className="text-amber-500">great adventure</span>
            <br />
            starts here
          </h1>

          <p
            className="mt-8 text-lg leading-relaxed text-stone-400 max-w-2xl mx-auto sm:text-xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Discover world-class routes, build AI-powered itineraries, and connect with the people
            who go further.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/adventures"
              className="inline-flex items-center gap-2 border-2 border-amber-500 bg-amber-500 px-8 py-3 font-display text-sm uppercase tracking-widest text-ink transition-colors hover:bg-amber-400 hover:border-amber-400"
            >
              Explore Adventures →
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 border-2 border-stone-600 px-8 py-3 font-display text-sm uppercase tracking-widest text-stone-200 transition-colors hover:border-amber-500 hover:text-amber-500"
            >
              Join Basecamp
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <section className="border-y-2 border-stone-800 bg-stone-900/60">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x-2 divide-stone-800">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center py-10 px-4">
              <span className="font-display text-5xl uppercase tracking-wider text-amber-500 sm:text-6xl">
                {stats[key]}
              </span>
              <span className="font-mono mt-2 text-xs uppercase tracking-[0.3em] text-stone-400">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category pills ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-500/70 mb-8">
          Every type of adventure
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(({ label, icon }) => (
            <Link
              key={label}
              href={`/adventures?category=${label.toUpperCase().replace(/ /g, "_")}`}
              className="flex items-center gap-1.5 border border-stone-700 bg-stone-900 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-amber-500 hover:text-amber-500"
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Feature trio ──────────────────────────────────────────── */}
      <section className="border-t-2 border-stone-800">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-0 sm:grid-cols-3 sm:divide-x-2 sm:divide-stone-800">
            {FEATURES.map(({ tag, title, body }) => (
              <div key={tag} className="px-0 py-8 sm:px-8 sm:py-0 first:pl-0 last:pr-0">
                <p className="font-display text-[11px] uppercase tracking-[0.35em] text-amber-500">
                  {tag}
                </p>
                <h3 className="mt-2 font-display text-3xl uppercase tracking-wider text-stone-100">
                  {title}
                </h3>
                <div className="mt-2 h-0.5 w-8 bg-amber-500/50" />
                <p
                  className="mt-4 text-sm leading-relaxed text-stone-400"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t-2 border-stone-800 py-24 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, var(--bc-amber-600) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: "var(--dot-opacity)",
          }}
        />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-500/70 mb-4">
            Ready?
          </p>
          <h2 className="font-display text-5xl uppercase tracking-widest text-stone-100 mb-8 sm:text-6xl">
            The mountain
            <br />
            won&apos;t wait
          </h2>
          <Link
            href="/adventures"
            className="inline-flex items-center gap-2 border-2 border-amber-500 bg-amber-500 px-12 py-4 font-display text-sm uppercase tracking-widest text-ink transition-colors hover:bg-amber-400 hover:border-amber-400"
          >
            Start Exploring →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
