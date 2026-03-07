import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Explore",
    links: [
      { href: "/adventures", label: "Adventures" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/flights", label: "Flights" },
    ],
  },
  {
    heading: "Plan",
    links: [{ href: "/itinerary", label: "AI Trip Planner" }],
  },
  {
    heading: "Community",
    links: [{ href: "/adventures", label: "Share an Adventure" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-lg uppercase tracking-[0.2em] text-amber-500">
              {APP_NAME.replace("S", "S·")}
            </span>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">
              World-class adventures. AI-powered planning. A community of explorers.
            </p>
          </div>
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="font-display text-xs uppercase tracking-widest text-stone-500">
                {heading}
              </h3>
              <ul className="mt-4 space-y-2">
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
        <div className="mt-10 border-t border-stone-800 pt-8 flex items-center justify-between">
          <p className="text-xs text-stone-600">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-stone-700 cursor-default">Privacy</span>
            <span className="text-xs text-stone-700 cursor-default">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
