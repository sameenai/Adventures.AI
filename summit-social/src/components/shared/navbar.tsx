"use client";

import { NotificationBell } from "@/components/shared/notification-bell";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/adventures", label: "Explore" },
  { href: "/explore", label: "Map" },
  { href: "/feed", label: "Feed" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/users/search", label: "People" },
  { href: "/itineraries", label: "My Trips" },
  { href: "/bookmarks", label: "Bucket List" },
  { href: "/itinerary", label: "Plan" },
  { href: "/flights", label: "Flights" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/98 backdrop-blur-md">
      {/* Amber accent line across the top */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="font-display text-base leading-none text-amber-500 transition-colors group-hover:text-amber-400">
              ▲
            </span>
            <span className="font-display text-xl uppercase tracking-[0.25em] text-stone-100 transition-colors group-hover:text-amber-400">
              Basecamp
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-display text-xs uppercase tracking-widest text-stone-500 transition-colors hover:text-amber-500"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <NotificationBell />
              <Link
                href="/pro"
                className="border border-amber-500/50 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-amber-500 transition-colors hover:border-amber-500 hover:bg-amber-500/10"
              >
                Upgrade
              </Link>
              <Link
                href={`/profile/${session.user.id}`}
                className="hidden font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:text-amber-500 sm:block"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden font-display text-xs uppercase tracking-widest text-stone-600 transition-colors hover:text-stone-300 sm:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Join</Button>
              </Link>
            </>
          )}
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex flex-col items-center justify-center gap-1 p-1 text-stone-400 transition-colors hover:text-stone-200 md:hidden"
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-stone-800 bg-stone-950 px-4 pb-4 pt-3 md:hidden"
        >
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-2 font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:text-amber-500"
              >
                {label}
              </Link>
            ))}
          </nav>
          {session && (
            <div className="mt-3 flex items-center justify-between border-t border-stone-800 pt-3">
              <Link
                href={`/profile/${session.user.id}`}
                onClick={() => setMobileOpen(false)}
                className="font-display text-xs uppercase tracking-widest text-stone-400 hover:text-amber-500"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="font-display text-xs uppercase tracking-widest text-stone-600 hover:text-stone-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
