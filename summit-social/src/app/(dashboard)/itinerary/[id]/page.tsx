import { ExportButton } from "@/components/itinerary/export-button";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { formatPrice, pluralise } from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
  return { title: `${itinerary.title} | Basecamp` };
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

      <div className="mb-8 flex items-start justify-between gap-4">
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
            className="border border-amber-500 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-500 hover:text-stone-950"
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
            href="/itinerary"
            className="mt-4 inline-block border border-amber-500 bg-amber-500 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
          >
            Open Planner
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {itinerary.days.map((day) => {
            const activities = Array.isArray(day.activities) ? day.activities : [];
            return (
              <div key={day.id} className="border border-stone-800 p-5">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-display text-xs uppercase tracking-[0.35em] text-amber-500">
                    Day {day.dayNumber}
                  </span>
                  <h2 className="font-display text-sm uppercase tracking-widest text-stone-100">
                    {day.title}
                  </h2>
                </div>
                {day.description && (
                  <p className="mb-3 text-xs text-stone-500">{day.description}</p>
                )}
                {activities.length > 0 && (
                  <ul className="space-y-2">
                    {(
                      activities as Array<{
                        time?: string;
                        activity?: string;
                        location?: string;
                        notes?: string;
                      }>
                    ).map((act, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: activities have no unique id
                      <li key={i} className="flex items-start gap-3 font-mono text-xs">
                        {act.time && (
                          <span className="shrink-0 text-stone-600 w-12">{act.time}</span>
                        )}
                        <div>
                          <span className="text-stone-300">{act.activity}</span>
                          {act.location && (
                            <span className="ml-2 text-stone-600">· {act.location}</span>
                          )}
                          {act.notes && <p className="mt-0.5 text-stone-600">{act.notes}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
