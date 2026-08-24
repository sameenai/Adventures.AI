import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

/**
 * The one route envelope: auth → rate limit → validate → handle, with the
 * error shape every existing route already speaks ({ error, code, ... }).
 * Kills the per-route copies of this boilerplate; routes keep only their
 * actual behavior. Streaming and webhook routes (chat, stripe webhook) stay
 * hand-rolled — their lifecycles don't fit a JSON envelope.
 */

export interface ApiContext<TBody> {
  request: NextRequest;
  /** Authenticated user id; present because auth defaults to required. */
  userId: string;
  /** Parsed request body when a schema was given; otherwise undefined. */
  body: TBody;
  /** Resolved dynamic route params ({} for static routes). */
  params: Record<string, string>;
}

export interface ApiOptions<TBody> {
  /** Rate limit applied per user. failClosed for cost-bearing routes. */
  rateLimit?: {
    name: keyof typeof RATE_LIMITS;
    /** Redis key prefix; defaults to the limit name. */
    prefix?: string;
    failClosed?: boolean;
  };
  /** Zod schema for the JSON body; failures return 400 VALIDATION_ERROR. */
  schema?: ZodType<TBody>;
}

type RouteContext = { params: Promise<Record<string, string>> };

export function withApi<TBody = undefined>(
  options: ApiOptions<TBody>,
  handler: (ctx: ApiContext<TBody>) => Promise<NextResponse>,
  // Next's route type check requires the context param to be non-optional on
  // dynamic routes, so the declared signature requires it; the implementation
  // tolerates its absence (static routes, direct test calls).
): (request: NextRequest, route: RouteContext) => Promise<NextResponse> {
  return async (request: NextRequest, route?: RouteContext) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      }
      const userId = session.user.id;

      if (options.rateLimit) {
        const config = RATE_LIMITS[options.rateLimit.name];
        const rl = await rateLimit(
          `${options.rateLimit.prefix ?? options.rateLimit.name}:${userId}`,
          config.limit,
          config.windowSeconds,
          options.rateLimit.failClosed ? { failClosed: true } : undefined,
        );
        if (!rl.allowed) {
          return NextResponse.json(
            { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
            { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
          );
        }
      }

      let body = undefined as TBody;
      if (options.schema) {
        const raw = await request.json().catch(() => null);
        const parsed = options.schema.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        body = parsed.data;
      }

      const params = route ? await route.params : {};
      return await handler({ request, userId, body, params });
    } catch (err) {
      logger.error(`Unhandled API error on ${request.nextUrl.pathname}`, err);
      return NextResponse.json({ error: "Internal error", code: "INTERNAL" }, { status: 500 });
    }
  };
}
