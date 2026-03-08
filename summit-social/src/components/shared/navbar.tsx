"use client";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/adventures", label: "Adventures" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/itinerary", label: "Plan Trip" },
  { href: "/flights", label: "Flights" },
];

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="font-display text-xl uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition-colors"
          >
            {APP_NAME.replace("S", "S·")}
          </Link>
          {session && (
            <div className="hidden items-center gap-7 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:text-amber-500"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
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
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
