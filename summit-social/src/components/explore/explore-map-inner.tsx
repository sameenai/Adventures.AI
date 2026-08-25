"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface GeoMarker {
  id: string;
  title: string;
  location: string;
  country: string;
  category: string;
  difficulty: string;
  lat: number;
  lng: number;
}

export interface GeoCluster {
  lat: number;
  lng: number;
  count: number;
}

interface GeoResponse {
  markers?: GeoMarker[];
  clusters?: GeoCluster[];
}

/** Viewport refetches wait this long after the last move before firing. */
const VIEWPORT_DEBOUNCE_MS = 300;

/**
 * Status line shown over the map after a viewport fetch settles: `null`
 * clears it (success), 429 names the per-IP limit — waiting genuinely fixes
 * it — and anything else gets the generic notice. Either way the last
 * successfully drawn layer stays put; the map degrades, it never blanks.
 * Aborted fetches (a newer pan superseded this one) must change nothing and
 * never reach this function.
 */
export function geoFetchStatus(
  result: { ok: true } | { ok: false; httpStatus: number | null },
): string | null {
  if (result.ok) return null;
  return result.httpStatus === 429
    ? "Map data paused — too many requests, try again in a minute"
    : "Map data unavailable";
}

/** Escape user-controlled text before interpolating into popup HTML (stored-XSS guard). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Count badge for a server-side cluster; clicking zooms two levels toward it. */
function clusterIcon(count: number): L.DivIcon {
  const size = count >= 100 ? 44 : count >= 10 ? 38 : 32;
  const style = [
    "display:flex;align-items:center;justify-content:center;",
    `width:${size}px;height:${size}px;border-radius:9999px;`,
    "background:rgba(245,158,11,0.9);border:2px solid #292524;color:#1c1917;",
    "font-family:monospace;font-size:12px;font-weight:700;",
  ].join("");
  const html = `<div style="${style}">${count}</div>`;
  return L.divIcon({
    html,
    className: "explore-cluster-badge",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Viewport-driven explore map: instead of receiving every mapped adventure as
 * props, it asks `/api/adventures/geo` for the current bounds on load and on
 * move-end (debounced), and renders either markers or cluster count badges.
 */
export function ExploreMapInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20, 0], 2);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    let controller: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const renderMarkers = (markers: GeoMarker[]) => {
      layer.clearLayers();
      for (const { id, lat, lng, title, location, country, category, difficulty } of markers) {
        const popupContent = `
          <div style="font-family: monospace; font-size: 12px; min-width: 160px;">
            <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${escapeHtml(title)}</strong>
            <span style="color: #78716c;">${escapeHtml(`${location}, ${country}`)}</span><br/>
            <span style="color: #78716c;">${escapeHtml(category.replace(/_/g, " "))} · ${escapeHtml(difficulty.toLowerCase())}</span><br/>
            <a href="/adventures/${encodeURIComponent(id)}" style="color: #f59e0b; text-decoration: none; margin-top: 6px; display: inline-block;">View adventure →</a>
          </div>
        `;
        L.marker([lat, lng], { icon: markerIcon }).addTo(layer).bindPopup(popupContent);
      }
    };

    const renderClusters = (clusters: GeoCluster[]) => {
      layer.clearLayers();
      for (const { lat, lng, count } of clusters) {
        const badge = L.marker([lat, lng], { icon: clusterIcon(count) });
        badge.on("click", () => {
          map.setView([lat, lng], Math.min(map.getZoom() + 2, 18));
        });
        badge.addTo(layer);
      }
    };

    const loadViewport = async () => {
      controller?.abort();
      const ownController = new AbortController();
      controller = ownController;
      const bounds = map.getBounds();
      const query = new URLSearchParams({
        west: String(bounds.getWest()),
        south: String(Math.max(bounds.getSouth(), -90)),
        east: String(bounds.getEast()),
        north: String(Math.min(bounds.getNorth(), 90)),
        zoom: String(Math.min(Math.max(map.getZoom(), 1), 18)),
      });
      try {
        const res = await fetch(`/api/adventures/geo?${query}`, { signal: ownController.signal });
        if (!res.ok) {
          // Keep the last successfully drawn layer, but say why it froze.
          setStatusMessage(geoFetchStatus({ ok: false, httpStatus: res.status }));
          return;
        }
        const data = (await res.json()) as GeoResponse;
        if (data.clusters) {
          renderClusters(data.clusters);
        } else {
          renderMarkers(data.markers ?? []);
        }
        setStatusMessage(geoFetchStatus({ ok: true }));
      } catch {
        // A newer pan superseded this fetch — it will report its own outcome.
        if (ownController.signal.aborted) return;
        // Network hiccup: keep the last drawn layer, surface the notice.
        setStatusMessage(geoFetchStatus({ ok: false, httpStatus: null }));
      }
    };

    const scheduleLoad = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void loadViewport(), VIEWPORT_DEBOUNCE_MS);
    };

    map.on("moveend", scheduleLoad);
    void loadViewport();

    return () => {
      clearTimeout(debounceTimer);
      controller?.abort();
      map.off("moveend", scheduleLoad);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {statusMessage && (
        <output className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] block -translate-x-1/2 whitespace-nowrap border border-stone-700 bg-stone-900/90 px-3 py-1 font-mono text-xs text-amber-500">
          {statusMessage}
        </output>
      )}
    </div>
  );
}
