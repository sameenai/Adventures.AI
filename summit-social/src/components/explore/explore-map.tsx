"use client";

import dynamic from "next/dynamic";
import type { ExploreMarker } from "./explore-map-inner";

const ExploreMapInner = dynamic(
  () => import("./explore-map-inner").then((m) => m.ExploreMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-stone-900">
        <p className="font-mono text-xs text-stone-600">Loading map…</p>
      </div>
    ),
  },
);

interface ExploreMapProps {
  markers: ExploreMarker[];
}

export function ExploreMap({ markers }: ExploreMapProps) {
  return <ExploreMapInner markers={markers} />;
}
