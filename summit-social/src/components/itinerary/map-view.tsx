"use client";

interface MapViewProps {
  markers: Array<{ lat: number; lng: number; label: string }>;
  className?: string;
}

export function MapView({ markers, className }: MapViewProps) {
  // Mapbox GL JS integration placeholder — requires NEXT_PUBLIC_MAPBOX_TOKEN
  return (
    <div className={`relative overflow-hidden border border-stone-800 bg-stone-900 ${className ?? "h-[400px]"}`}>
      <div className="flex h-full items-center justify-center text-sm text-stone-500">
        <div className="text-center">
          <p className="font-display uppercase tracking-widest text-stone-400">Map View</p>
          <p className="mt-1 text-xs text-stone-600">
            {markers.length} location{markers.length !== 1 ? "s" : ""} to display
          </p>
          <p className="mt-1 text-xs text-stone-600">Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    </div>
  );
}
