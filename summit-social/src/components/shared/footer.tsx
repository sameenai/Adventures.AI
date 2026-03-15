import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { href: "/adventures", label: "Adventures" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/feed", label: "Community Feed" },
      { href: "/users/search", label: "Find People" },
    ],
  },
  {
    heading: "Plan",
    links: [
      { href: "/itinerary", label: "AI Trip Planner" },
      { href: "/itineraries", label: "My Itineraries" },
      { href: "/flights", label: "Flight Search" },
    ],
  },
  {
    heading: "Share",
    links: [
      { href: "/adventures/new", label: "Submit an Adventure" },
      { href: "/profile/edit", label: "Edit Profile" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/adventures" className="group flex items-center gap-2.5">
              <span className="font-display text-base text-amber-500 transition-colors group-hover:text-amber-400">
                ▲
              </span>
              <span className="font-display text-xl uppercase tracking-[0.25em] text-stone-100 transition-colors group-hover:text-amber-400">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">
              The expedition platform for serious adventurers. Discover world-class routes, plan
              with AI, and share your journeys.
            </p>
            <p className="mt-5 font-mono text-xs text-stone-700">51°30′N 0°07′W · est. 2025</p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="font-display text-xs uppercase tracking-[0.3em] text-stone-500">
                {heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-stone-400 transition-colors hover:text-amber-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-stone-800/60 pt-8">
          <p className="font-mono text-xs text-stone-700">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="font-mono text-xs text-stone-800 cursor-default">Privacy</span>
            <span className="font-mono text-xs text-stone-800 cursor-default">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
