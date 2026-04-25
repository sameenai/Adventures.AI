import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { formatPrice, pluralise } from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteItineraryButton } from "./delete-button";

export const metadata: Metadata = { title: "My Itineraries | Basecamp" };

export default async function ItinerariesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const itineraries = await prisma.itinerary.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      days: { orderBy: { dayNumber: "asc" }, select: { id: true, title: true } },
      _count: { select: { flightBookings: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-stone-100">
            My Itineraries
          </h1>
          <p className="mt-1 font-mono text-xs text-stone-500">
            {pluralise(itineraries.length, "saved trip")}
          </p>
        </div>
        <Link
          href="/itinerary"
          className="border border-amber-500 bg-amber-500/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-500/20"
        >
          + New Trip
        </Link>
      </div>

      {itineraries.length === 0 ? (
        <div className="border border-stone-800 p-12 text-center">
          <p className="font-display text-xs uppercase tracking-widest text-stone-500">
            No itineraries yet
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Use the AI Trip Planner to build your first day-by-day itinerary.
          </p>
          <Link
            href="/itinerary"
            className="mt-6 inline-block border border-amber-500 bg-amber-500 px-6 py-2 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
          >
            Start Planning
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {itineraries.map((itinerary) => (
            <div
              key={itinerary.id}
              className="flex items-start justify-between gap-4 border border-stone-800 p-5 hover:border-stone-700 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/itinerary/${itinerary.id}`}
                  className="font-display text-sm uppercase tracking-widest text-stone-100 hover:text-amber-500 transition-colors"
                >
                  {itinerary.title}
                </Link>
                {itinerary.description && (
                  <p className="mt-1 text-xs text-stone-500 line-clamp-1">
                    {itinerary.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-stone-600">
                  <span>{pluralise(itinerary.days.length, "day")}</span>
                  {itinerary._count.flightBookings > 0 && (
                    <span>{pluralise(itinerary._count.flightBookings, "flight")}</span>
                  )}
                  {itinerary.budget && <span>~{formatPrice(itinerary.budget)} budget</span>}
                  {itinerary.travellers > 1 && (
                    <span>{pluralise(itinerary.travellers, "traveller")}</span>
                  )}
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
                <Link
                  href={`/itinerary/${itinerary.id}`}
                  className="border border-stone-700 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Open
                </Link>
                <DeleteItineraryButton itineraryId={itinerary.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
