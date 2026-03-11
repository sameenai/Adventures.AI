"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface ExploreMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  location: string;
  category: string;
  difficulty: string;
}

interface ExploreMapInnerProps {
  markers: ExploreMarker[];
}

export function ExploreMapInner({ markers }: ExploreMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20, 0], 2);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    for (const { lat, lng, label, location, category, difficulty, id } of markers) {
      const popupContent = `
        <div style="font-family: monospace; font-size: 12px; min-width: 160px;">
          <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${label}</strong>
          <span style="color: #78716c;">${location}</span><br/>
          <span style="color: #78716c;">${category.replace(/_/g, " ")} · ${difficulty.toLowerCase()}</span><br/>
          <a href="/adventures/${id}" style="color: #f59e0b; text-decoration: none; margin-top: 6px; display: inline-block;">View adventure →</a>
        </div>
      `;
      L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(popupContent);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}
