import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getClientIp } from "@/lib/request";
import { adventureGeoSchema } from "@/lib/validators/adventure";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Marker mode never returns more than this many rows (highest voteCount first). */
const MARKER_CAP = 300;

/** Below this zoom the response switches from markers to server-side grid clusters. */
const CLUSTER_MAX_ZOOM = 6;

/** Wrap any longitude into [-180, 180) so wrapped Leaflet bounds keep working. */
function wrapLongitude(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

/**
 * PUBLIC viewport query for the explore map — anonymous, IP rate-limited, and
 * hand-rolled like the catalog list (`/api/adventures`) rather than `withApi`.
 *
 * zoom >= 6 → `{ markers }` inside the bbox, capped at MARKER_CAP.
 * zoom <  6 → `{ clusters }` snapped to a grid of ≈ 360/2^zoom/8 degrees,
 *             computed in one pass over a lat/lng-only select (no groupBy).
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfter } = await rateLimit(
    `geo:search:${ip}`,
    RATE_LIMITS.geoSearch.limit,
    RATE_LIMITS.geoSearch.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const parsed = adventureGeoSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bounding box", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { south, north, zoom } = parsed.data;
  // A viewport ≥ 360° wide sees the whole world. Anything narrower is wrapped
  // into [-180, 180) and may straddle the antimeridian (west > east after wrap).
  const spansWorld = parsed.data.east - parsed.data.west >= 360;
  const west = wrapLongitude(parsed.data.west);
  const east = wrapLongitude(parsed.data.east);

  const longitudeFilter: Prisma.AdventureWhereInput = spansWorld
    ? { longitude: { not: null } }
    : west <= east
      ? { longitude: { gte: west, lte: east } }
      : { OR: [{ longitude: { gte: west } }, { longitude: { lte: east } }] };

  const where: Prisma.AdventureWhereInput = {
    published: true,
    latitude: { gte: south, lte: north },
    ...longitudeFilter,
  };

  if (zoom < CLUSTER_MAX_ZOOM) {
    // Minimal-column pass: every matching coordinate, nothing else. The cap
    // only applies to full-row marker fetches below.
    const points = await prisma.adventure.findMany({
      where,
      select: { latitude: true, longitude: true },
    });

    const cellDegrees = 360 / 2 ** zoom / 8;
    const cells = new Map<string, { latSum: number; lngSum: number; count: number }>();
    for (const point of points) {
      if (point.latitude === null || point.longitude === null) continue;
      const latCell = Math.floor(point.latitude / cellDegrees);
      const lngCell = Math.floor(point.longitude / cellDegrees);
      const key = `${latCell}:${lngCell}`;
      const cell = cells.get(key) ?? { latSum: 0, lngSum: 0, count: 0 };
      cell.latSum += point.latitude;
      cell.lngSum += point.longitude;
      cell.count += 1;
      cells.set(key, cell);
    }

    const clusters = [...cells.values()].map((cell) => ({
      lat: cell.latSum / cell.count,
      lng: cell.lngSum / cell.count,
      count: cell.count,
    }));

    return NextResponse.json({ clusters });
  }

  const adventures = await prisma.adventure.findMany({
    where,
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
    orderBy: [{ voteCount: "desc" }, { id: "asc" }],
    take: MARKER_CAP,
  });

  const markers = adventures.flatMap((adventure) =>
    adventure.latitude === null || adventure.longitude === null
      ? []
      : [
          {
            id: adventure.id,
            title: adventure.title,
            location: adventure.location,
            country: adventure.country,
            category: adventure.category,
            difficulty: adventure.difficulty,
            lat: adventure.latitude,
            lng: adventure.longitude,
          },
        ],
  );

  return NextResponse.json({ markers });
}
