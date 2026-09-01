import { track } from "@/lib/analytics/track";
import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/db/redis";
import { viewerKey } from "@/lib/privacy/viewer";
import { getClientIp } from "@/lib/request";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

/**
 * The client analytics beacon. Deliberately minimal: an allowlisted event
 * name and a path — no free-form payloads, no device fingerprinting, no
 * cookies. Anonymous senders are keyed by the same daily-rotating salted
 * hash as view counting; browsers with Do-Not-Track/GPC are honoured by the
 * client never sending, and dropped here as defence in depth.
 * Unauthenticated by design (page views happen logged-out), so it stays
 * hand-rolled rather than using the withApi envelope.
 */
const collectSchema = z.object({
  name: z.enum(["page_view"]),
  path: z
    .string()
    .max(200)
    .regex(/^\/[a-zA-Z0-9/_[\]-]*$/, "route paths only — no query strings"),
});

export async function POST(request: NextRequest) {
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  const rl = await rateLimit(
    `analytics:${getClientIp(request)}`,
    RATE_LIMITS.analyticsCollect.limit,
    RATE_LIMITS.analyticsCollect.windowSeconds,
  );
  if (!rl.allowed) {
    return new NextResponse(null, { status: 204 }); // never make the client retry telemetry
  }

  const body = await request.json().catch(() => null);
  const parsed = collectSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  track(parsed.data.name, {
    userId,
    anonId: userId ? null : viewerKey(request, null),
    props: { path: parsed.data.path },
  });

  return new NextResponse(null, { status: 204 });
}
