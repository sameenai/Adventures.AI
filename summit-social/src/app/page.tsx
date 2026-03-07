import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

const FEATURES = [
  {
    label: "AI Trip Planner",
    description: "Describe your dream expedition and receive a day-by-day itinerary built around your pace, budget, and ambitions.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Community Leaderboard",
    description: "Discover and vote on world-class adventures. Treks, expeditions, kayaking routes — ranked by the people who've done them.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: "Flight Comparison",
    description: "Compare fares from Amadeus and Skyscanner in a single view. Find the route that gets you to your trailhead.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      {/* Minimal landing nav */}
      <header className="border-b border-stone-800">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="font-display text-xl uppercase tracking-[0.2em] text-amber-500">
            {APP_NAME.replace("S", "S·")}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-stone-800">
          {/* Topographic dot grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #d97706 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Diagonal amber accent line */}
          <div
            className="absolute right-0 top-0 h-full w-px origin-top-right opacity-20"
            style={{ background: "linear-gradient(180deg, #d97706 0%, transparent 60%)" }}
          />

          <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
            <div className="max-w-3xl">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-500/70 mb-6">
                Adventure Planning · Community · AI
              </p>
              <h1 className="font-display text-6xl uppercase leading-none tracking-widest text-stone-100 sm:text-8xl">
                Find Your<br />
                <span className="text-amber-500">Summit</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-stone-400">
                Plan extraordinary adventures with AI. Discover community-curated expeditions.
                Compare flights. All from a single place built for serious explorers.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg">Start Planning</Button>
                </Link>
                <Link href="/adventures">
                  <Button variant="outline" size="lg">Browse Adventures</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 border-b border-stone-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-2">
              What&rsquo;s inside
            </p>
            <h2 className="font-display text-3xl uppercase tracking-widest text-stone-100 sm:text-4xl">
              Built for the<br />serious adventurer
            </h2>

            <div className="mt-16 grid grid-cols-1 gap-px border border-stone-800 md:grid-cols-3">
              {FEATURES.map(({ label, description, icon }) => (
                <div
                  key={label}
                  className="group p-8 bg-stone-950 hover:bg-stone-900 transition-colors border-b border-stone-800 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-stone-700 text-amber-500 group-hover:border-amber-500/50 transition-colors">
                    {icon}
                  </div>
                  <h3 className="mt-6 font-display text-lg uppercase tracking-widest text-stone-100">
                    {label}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-4xl uppercase tracking-widest text-stone-100 sm:text-5xl">
              Ready to explore?
            </h2>
            <p className="mt-4 text-sm text-stone-500">
              Join a community of adventurers planning world-class expeditions.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Create Free Account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-xs text-stone-700">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
