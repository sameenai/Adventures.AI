import type { ItineraryDayData } from "@/components/itinerary/day-card";
import { ExportButton } from "@/components/itinerary/export-button";
import { ItineraryTimeline } from "@/components/itinerary/itinerary-timeline";
import { MapView } from "@/components/itinerary/map-view";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { formatPrice, pluralise } from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

/** Pull map markers out of activities that carry coordinates. */
function extractMarkers(
  days: ItineraryDayData[],
): Array<{ lat: number; lng: number; label: string }> {
  const markers: Array<{ lat: number; lng: number; label: string }> = [];
  for (const day of days) {
    if (!Array.isArray(day.activities)) continue;
    for (const raw of day.activities) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const act = raw as { lat?: unknown; lng?: unknown; activity?: unknown; location?: unknown };
      if (typeof act.lat !== "number" || typeof act.lng !== "number") continue;
      const name =
        typeof act.activity === "string" && act.activity.length > 0
          ? act.activity
          : typeof act.location === "string" && act.location.length > 0
            ? act.location
            : day.title;
      markers.push({ lat: act.lat, lng: act.lng, label: `Day ${day.dayNumber}: ${name}` });
    }
  }
  return markers;
}

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!itinerary) return {};
  return { title: `${itinerary.title} | Basecamper` };
}

export default async function ItineraryDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const itinerary = await prisma.itinerary.findUnique({
    where: { id, userId: session.user.id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        select: { id: true, dayNumber: true, title: true, description: true, activities: true },
      },
    },
  });

  if (!itinerary) notFound();

  const markers = extractMarkers(itinerary.days);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-600">
        <Link href="/itineraries" className="hover:text-amber-500 transition-colors">
          My Itineraries
        </Link>
        <span>/</span>
        <span className="text-stone-400">{itinerary.title}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="font-display text-2xl uppercase tracking-widest text-stone-100">
            {itinerary.title}
          </h1>
          {itinerary.description && (
            <p className="mt-2 text-sm text-stone-500">{itinerary.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs text-stone-600">
            <span>{pluralise(itinerary.days.length, "day")}</span>
            {itinerary.travellers > 1 && (
              <span>{pluralise(itinerary.travellers, "traveller")}</span>
            )}
            {itinerary.budget && <span>~{formatPrice(itinerary.budget)} budget</span>}
            <span
              className={
                itinerary.status === "COMPLETED" || itinerary.status === "BOOKED"
                  ? "text-green-500"
                  : itinerary.status === "DRAFT"
                    ? "text-stone-500"
                    : "text-amber-500"
              }
            >
              {itinerary.status.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {itinerary.days.length > 0 && (
            <ExportButton
              title={itinerary.title}
              description={itinerary.description}
              days={itinerary.days}
              travellers={itinerary.travellers}
              budget={itinerary.budget}
              status={itinerary.status}
            />
          )}
          <Link
            href={`/adventures/new?title=${encodeURIComponent(itinerary.title)}&durationDays=${itinerary.days.length || 1}`}
            className="border border-amber-500 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-500 hover:text-ink"
          >
            Publish as Adventure
          </Link>
        </div>
      </div>

      {itinerary.days.length === 0 ? (
        <div className="border border-stone-800 p-8 text-center">
          <p className="font-mono text-xs text-stone-600">
            No days planned yet. Use the AI Trip Planner to build your itinerary.
          </p>
          <Link
            href={`/itinerary?resume=${itinerary.id}`}
            className="mt-4 inline-block border border-amber-500 bg-amber-500 px-4 py-2 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
          >
            Continue planning
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {markers.length > 0 && (
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Route Map
              </h2>
              <MapView markers={markers} className="h-[280px]" />
            </section>
          )}
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
              Day by Day
            </h2>
            <ItineraryTimeline days={itinerary.days} />
          </section>
          <div className="border-t border-stone-800 pt-6 text-center">
            <Link
              href={`/itinerary?resume=${itinerary.id}`}
              className="font-display text-xs uppercase tracking-widest text-amber-500 transition-colors hover:text-amber-400"
            >
              Continue planning →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
