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
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-display text-2xl font-light italic text-stone-100 transition-colors hover:text-amber-500"
            >
              {APP_NAME}
            </Link>
            <p className="mt-4 text-xs font-light leading-relaxed text-stone-500">
              The expedition platform for serious adventurers.
            </p>
            <p className="mt-5 font-mono text-xs text-stone-700">51°30′N 0°07′W · est. 2025</p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-600">
                {heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-stone-500 transition-colors hover:text-stone-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stone-800 pt-8">
          <p className="font-mono text-xs text-stone-700">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/pro"
              className="font-mono text-xs text-stone-800 transition-colors hover:text-stone-500"
            >
              Pricing
            </Link>
            <a
              href="/privacy"
              className="font-mono text-xs text-stone-800 transition-colors hover:text-stone-500"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="font-mono text-xs text-stone-800 transition-colors hover:text-stone-500"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
