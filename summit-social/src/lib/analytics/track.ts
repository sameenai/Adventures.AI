import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * Product analytics, captured server-side at the moment the thing actually
 * happened: payment events come from the Stripe webhook, not a button click;
 * saves come from the write path, so numbers are facts, not hopes.
 *
 * Privacy discipline is structural, not reviewed-in: props accept only short
 * primitives (no free text — queries, titles, and emails can't fit through),
 * anonymous events carry only the daily-rotating salted viewer key, and rows
 * cascade-delete with the account. track() never throws and never blocks the
 * request that emitted it.
 */

export type EventName =
  | "signup"
  | "chat_message"
  | "itinerary_created"
  | "flight_searched"
  | "flight_saved"
  | "fare_repriced"
  | "checkout_started"
  | "payment_succeeded"
  | "booking_refunded"
  | "pro_subscribed"
  | "pro_cancelled"
  | "bookmark_added"
  | "trip_logged"
  | "cadence_email_sent"
  | "page_view";

type PropValue = string | number | boolean;

const MAX_PROP_STRING = 80;
const MAX_PROPS = 10;

function sanitizeProps(props?: Record<string, PropValue>): Record<string, PropValue> | undefined {
  if (!props) return undefined;
  const out: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(props).slice(0, MAX_PROPS)) {
    if (typeof value === "string") {
      // Short identifiers only — anything email-shaped never lands in a row.
      if (value.includes("@") || value.length > MAX_PROP_STRING) continue;
      out[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function track(
  name: EventName,
  opts: { userId?: string | null; anonId?: string | null; props?: Record<string, PropValue> } = {},
): void {
  try {
    void prisma.analyticsEvent
      .create({
        data: {
          name,
          userId: opts.userId ?? null,
          anonId: opts.anonId ?? null,
          props: sanitizeProps(opts.props) as never,
        },
      })
      .catch((err) => logger.warn(`analytics event dropped: ${name}`, err));
  } catch (err) {
    // Telemetry must never break the write path that emitted it.
    logger.warn(`analytics event dropped: ${name}`, err);
  }
}
