"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./leaflet-map").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => (
    <div
      className="relative overflow-hidden border border-stone-800 bg-stone-900 flex items-center justify-center"
      style={{ minHeight: "inherit" }}
    >
      <p className="font-mono text-xs text-stone-600">Loading map…</p>
    </div>
  ),
});

interface MapViewProps {
  markers: Array<{ lat: number; lng: number; label: string }>;
  gpxTrackUrl?: string;
  className?: string;
}

export function MapView({ markers, gpxTrackUrl, className }: MapViewProps) {
  return <LeafletMap markers={markers} gpxTrackUrl={gpxTrackUrl} className={className} />;
}
