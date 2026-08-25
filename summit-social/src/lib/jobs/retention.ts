import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Retention windows, in days. These are the schedule published in /privacy
 * and RUNBOOK.md — change them together or the published policy is a lie.
 */
export const ADVENTURE_VIEW_RETENTION_DAYS = 90;
export const READ_NOTIFICATION_RETENTION_DAYS = 90;
export const EMPTY_ITINERARY_RETENTION_DAYS = 30;
export const ANALYTICS_EVENT_RETENTION_DAYS = 180;
export const EMAIL_LOG_RETENTION_DAYS = 365;
export const SEARCH_EVENT_RETENTION_DAYS = 365;
/** Thumbs-up feedback is a counter once read — short window. */
export const FEEDBACK_UP_RETENTION_DAYS = 90;
/** Thumbs-down feedback feeds the eval suite — kept longer than UP. */
export const FEEDBACK_DOWN_RETENTION_DAYS = 365;

export interface RetentionStats {
  adventureViewsDeleted: number;
  readNotificationsDeleted: number;
  emptyItinerariesDeleted: number;
  analyticsEventsDeleted: number;
  emailLogsDeleted: number;
  searchEventsDeleted: number;
  feedbackUpDeleted: number;
  feedbackDownDeleted: number;
}

/**
 * Storage-limitation pass (UK GDPR Art 5(1)(e)) — the retention schedule
 * published in /privacy is enforced here:
 *  - adventure view records older than 90 days
 *  - read notifications older than 90 days
 *  - auto-created itineraries that never became trips (no days, at most the
 *    opening exchange in chat history) older than 30 days
 *  - product analytics events older than 180 days
 *  - email send log entries older than 365 days
 *  - search/demand events older than 365 days
 *  - message feedback: UP after 90 days, DOWN after 365 (DOWN is the eval
 *    suite's raw material, so it earns the longer window)
 */
export async function runRetention(now = new Date()): Promise<RetentionStats> {
  const cutoff = (days: number) => new Date(now.getTime() - days * DAY_MS);

  const views = await prisma.adventureView.deleteMany({
    where: { createdAt: { lt: cutoff(ADVENTURE_VIEW_RETENTION_DAYS) } },
  });

  const notifications = await prisma.notification.deleteMany({
    where: { read: true, createdAt: { lt: cutoff(READ_NOTIFICATION_RETENTION_DAYS) } },
  });

  // Abandoned planner sessions: never got itinerary days and the chat never
  // progressed past the opening exchange. Anything a user actually built is
  // kept until they delete it themselves.
  const candidates = await prisma.itinerary.findMany({
    where: {
      updatedAt: { lt: cutoff(EMPTY_ITINERARY_RETENTION_DAYS) },
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

  const analyticsEvents = await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: cutoff(ANALYTICS_EVENT_RETENTION_DAYS) } },
  });

  const emailLogs = await prisma.emailLog.deleteMany({
    where: { createdAt: { lt: cutoff(EMAIL_LOG_RETENTION_DAYS) } },
  });

  const searchEvents = await prisma.searchEvent.deleteMany({
    where: { createdAt: { lt: cutoff(SEARCH_EVENT_RETENTION_DAYS) } },
  });

  const feedbackUp = await prisma.messageFeedback.deleteMany({
    where: { rating: "UP", createdAt: { lt: cutoff(FEEDBACK_UP_RETENTION_DAYS) } },
  });

  const feedbackDown = await prisma.messageFeedback.deleteMany({
    where: { rating: "DOWN", createdAt: { lt: cutoff(FEEDBACK_DOWN_RETENTION_DAYS) } },
  });

  return {
    adventureViewsDeleted: views.count,
    readNotificationsDeleted: notifications.count,
    emptyItinerariesDeleted: itineraries.count,
    analyticsEventsDeleted: analyticsEvents.count,
    emailLogsDeleted: emailLogs.count,
    searchEventsDeleted: searchEvents.count,
    feedbackUpDeleted: feedbackUp.count,
    feedbackDownDeleted: feedbackDown.count,
  };
}
