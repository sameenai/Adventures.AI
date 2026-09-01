import { ExploreMap } from "@/components/explore/explore-map";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Explore | Basecamper" };

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  // The shell stays an RSC but no longer serialises every mapped adventure —
  // the client map fetches /api/adventures/geo for its viewport instead. Only
  // a cheap aggregate remains for the headline.
  const mappedCount = await prisma.adventure.count({
    where: {
      published: true,
      NOT: [{ latitude: null }, { longitude: null }],
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-6">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Discover
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Explore Adventures
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {mappedCount} adventure{mappedCount !== 1 ? "s" : ""} mapped worldwide
        </p>
      </div>

      <div className="h-[400px] border border-stone-800 sm:h-[600px]">
        <ExploreMap />
      </div>
    </div>
  );
}
