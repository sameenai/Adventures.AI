"use client";

import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-summit-700">
            {APP_NAME}
          </Link>
          {session && (
            <div className="hidden items-center gap-6 md:flex">
              <Link href="/adventures" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Adventures
              </Link>
              <Link href="/itinerary" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Plan Trip
              </Link>
              <Link href="/flights" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Flights
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Leaderboard
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href={`/profile/${session.user.id}`}>
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name ?? session.user.email}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
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
