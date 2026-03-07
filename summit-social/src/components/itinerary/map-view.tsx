"use client";

interface MapViewProps {
  markers: Array<{ lat: number; lng: number; label: string }>;
  className?: string;
}

export function MapView({ markers, className }: MapViewProps) {
  // Mapbox GL JS integration placeholder — requires NEXT_PUBLIC_MAPBOX_TOKEN
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-100 ${className ?? "h-[400px]"}`}>
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        <div className="text-center">
          <p>Map View</p>
          <p className="mt-1 text-xs text-gray-400">
            {markers.length} location{markers.length !== 1 ? "s" : ""} to display
          </p>
          <p className="mt-1 text-xs text-gray-400">Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable</p>
        </div>
      </div>
    </div>
  );
}
