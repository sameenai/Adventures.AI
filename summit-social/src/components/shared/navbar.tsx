"use client";

import { NotificationBell } from "@/components/shared/notification-bell";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/adventures", label: "Explore" },
  { href: "/feed", label: "Feed" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/users/search", label: "People" },
  { href: "/itineraries", label: "My Trips" },
  { href: "/itinerary", label: "Plan" },
  { href: "/flights", label: "Flights" },
];

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/98 backdrop-blur-md">
      {/* Amber accent line across the top */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/adventures" className="group flex items-center gap-2.5">
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
                href={`/profile/${session.user.id}`}
                className="font-display text-xs uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-colors"
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
        </div>
      </nav>
    </header>
  );
}
