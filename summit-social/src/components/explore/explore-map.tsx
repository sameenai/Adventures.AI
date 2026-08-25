"use client";

import dynamic from "next/dynamic";

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

export function ExploreMap() {
  return <ExploreMapInner />;
}
