"use client";

import { NotificationBell } from "@/components/shared/notification-bell";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";

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

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-4 w-4" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center text-stone-500 transition-colors hover:text-stone-200"
    >
      {isDark ? (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          />
        </svg>
      )}
    </button>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/98 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-2xl font-light italic text-stone-100 transition-colors hover:text-amber-500"
        >
          Basecamp
        </Link>

        {/* Centre nav */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs font-normal text-stone-500 transition-colors hover:text-stone-100"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">
          {session ? (
            <>
              <NotificationBell />
              <Link
                href={`/profile/${session.user.id}`}
                className="hidden text-xs text-stone-500 transition-colors hover:text-stone-100 sm:block"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden text-xs text-stone-600 transition-colors hover:text-stone-400 sm:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs text-stone-500 transition-colors hover:text-stone-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-amber-500 px-5 py-2 text-xs font-medium text-ink transition-colors hover:bg-amber-400"
              >
                Join
              </Link>
            </>
          )}
          <ThemeToggle />

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex items-center justify-center text-stone-500 transition-colors hover:text-stone-200 md:hidden"
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
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
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-stone-800 bg-stone-950 px-6 pb-5 pt-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-xs text-stone-400 transition-colors hover:text-stone-100"
              >
                {label}
              </Link>
            ))}
          </nav>
          {session && (
            <div className="mt-4 flex items-center justify-between border-t border-stone-800 pt-4">
              <Link
                href={`/profile/${session.user.id}`}
                onClick={() => setMobileOpen(false)}
                className="text-xs text-stone-400 hover:text-stone-100"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs text-stone-600 transition-colors hover:text-stone-400"
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
