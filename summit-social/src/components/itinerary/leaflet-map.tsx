"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

// Fix leaflet's broken default marker icon paths under webpack/Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LeafletMapProps {
  markers: Array<{ lat: number; lng: number; label: string }>;
  className?: string;
}

export function LeafletMap({ markers, className }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      markers.length === 1
        ? [markers[0].lat, markers[0].lng]
        : markers.length > 1
          ? [
              markers.reduce((s, m) => s + m.lat, 0) / markers.length,
              markers.reduce((s, m) => s + m.lng, 0) / markers.length,
            ]
          : [20, 0];

    const map = L.map(containerRef.current).setView(center, markers.length === 1 ? 8 : 3);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    for (const { lat, lng, label } of markers) {
      L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(label);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border border-stone-800 ${className ?? "h-[400px]"}`}
    />
  );
}
