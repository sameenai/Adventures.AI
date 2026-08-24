import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetentionStats {
  adventureViewsDeleted: number;
  readNotificationsDeleted: number;
  emptyItinerariesDeleted: number;
}

/**
 * Storage-limitation pass (UK GDPR Art 5(1)(e)) — the retention schedule
 * published in /privacy is enforced here:
 *  - adventure view records older than 90 days
 *  - read notifications older than 90 days
 *  - auto-created itineraries that never became trips (no days, at most the
 *    opening exchange in chat history) older than 30 days
 */
export async function runRetention(now = new Date()): Promise<RetentionStats> {
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const views = await prisma.adventureView.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });

  const notifications = await prisma.notification.deleteMany({
    where: { read: true, createdAt: { lt: ninetyDaysAgo } },
  });

  // Abandoned planner sessions: never got itinerary days and the chat never
  // progressed past the opening exchange. Anything a user actually built is
  // kept until they delete it themselves.
  const candidates = await prisma.itinerary.findMany({
    where: {
      updatedAt: { lt: thirtyDaysAgo },
      days: { none: {} },
      flightBookings: { none: {} },
    },
    select: { id: true, chatHistory: true },
  });
  const abandonedIds = candidates
    .filter((itinerary) => {
      const history = itinerary.chatHistory;
      return !Array.isArray(history) || history.length <= 2;
    })
    .map((itinerary) => itinerary.id);

  const itineraries = abandonedIds.length
    ? await prisma.itinerary.deleteMany({ where: { id: { in: abandonedIds } } })
    : { count: 0 };

  return {
    adventureViewsDeleted: views.count,
    readNotificationsDeleted: notifications.count,
    emptyItinerariesDeleted: itineraries.count,
  };
}
