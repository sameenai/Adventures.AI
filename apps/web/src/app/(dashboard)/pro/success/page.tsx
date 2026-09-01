import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Welcome to Pro | Basecamper" };

export default function ProSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 mx-auto items-center justify-center border border-amber-500/60">
        <span className="font-display text-2xl text-amber-500">▲</span>
      </div>
      <h1 className="mt-6 font-display text-3xl uppercase tracking-widest text-stone-100">
        Welcome to Pro
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">
        Your subscription is active. Unlimited AI trip planning, unlimited bookmarks, and a Pro
        badge on your profile — all unlocked.
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/itinerary">
          <Button>Start planning</Button>
        </Link>
        <Link href="/adventures">
          <Button variant="outline">Explore adventures</Button>
        </Link>
      </div>
    </div>
  );
}
