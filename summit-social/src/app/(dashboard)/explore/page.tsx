import { ExploreMap } from "@/components/explore/explore-map";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Explore | Basecamp" };

// Coordinates change only when adventures are added/edited — revalidate hourly.
export const revalidate = 3600;

export default async function ExplorePage() {
  const adventures = await prisma.adventure.findMany({
    where: {
      published: true,
      NOT: [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      title: true,
      location: true,
      country: true,
      category: true,
      difficulty: true,
      latitude: true,
      longitude: true,
    },
  });

  const markers = adventures
    .filter((a) => a.latitude !== null && a.longitude !== null)
    .map((a) => ({
      id: a.id,
      lat: a.latitude as number,
      lng: a.longitude as number,
      label: a.title,
      location: `${a.location}, ${a.country}`,
      category: a.category,
      difficulty: a.difficulty,
    }));

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
          {markers.length} adventure{markers.length !== 1 ? "s" : ""} mapped worldwide
        </p>
      </div>

      <div className="h-[600px] border border-stone-800">
        <ExploreMap markers={markers} />
      </div>
    </div>
  );
}
