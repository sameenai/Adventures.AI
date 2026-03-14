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
  gpxTrackUrl?: string;
  className?: string;
}

function parseGpxPoints(xml: string): [number, number][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const trkpts = doc.querySelectorAll("trkpt");
  const points: [number, number][] = [];
  for (const pt of trkpts) {
    const lat = Number.parseFloat(pt.getAttribute("lat") ?? "");
    const lon = Number.parseFloat(pt.getAttribute("lon") ?? "");
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      points.push([lat, lon]);
    }
  }
  return points;
}

export function LeafletMap({ markers, gpxTrackUrl, className }: LeafletMapProps) {
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

    if (gpxTrackUrl) {
      fetch(gpxTrackUrl)
        .then((r) => r.text())
        .then((xml) => {
          const points = parseGpxPoints(xml);
          if (points.length > 1) {
            const polyline = L.polyline(points, { color: "#f59e0b", weight: 3, opacity: 0.9 });
            polyline.addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
          }
        })
        .catch(() => {});
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [markers, gpxTrackUrl]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border border-stone-800 ${className ?? "h-[400px]"}`}
    />
  );
}
