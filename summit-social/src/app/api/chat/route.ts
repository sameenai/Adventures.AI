import { runAgentLoop, sanitizeStoredHistory } from "@/lib/ai/chat-service";
import { CHAT_MODEL } from "@/lib/ai/model";
import { ITINERARY_SYSTEM_PROMPT, buildUserContextPrompt } from "@/lib/ai/prompts";
import { chatToolExecutors } from "@/lib/ai/tool-executors";
import { chatTools } from "@/lib/ai/tools";
import { authOptions } from "@/lib/auth/config";
import { CHAT_HISTORY_MAX_MESSAGES, PLANS, RATE_LIMITS } from "@/lib/constants";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { chatMessageSchema } from "@/lib/validators/chat";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";

const STREAMING_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/** Demo mode fabricates output — it must never masquerade as the product in production. */
function demoModeAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { allowed, retryAfter } = await rateLimit(
    `chat:${session.user.id}`,
    RATE_LIMITS.chat.limit,
    RATE_LIMITS.chat.windowSeconds,
    { failClosed: true },
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // Fetch user record: key, plan, and credit state
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openAiApiKey: true, plan: true, aiCreditsUsed: true, aiCreditsResetAt: true },
  });
  const storedKey = userRecord?.openAiApiKey;
  const resolvedApiKey =
    (storedKey ? decrypt(storedKey) : null) ?? process.env.OPENAI_API_KEY ?? null;

  const body = await request.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, itineraryId: incomingItineraryId, preferences } = parsed.data;
  const userId = session.user.id;

  // Misconfiguration must fail loudly in production, not stream canned text.
  if (!resolvedApiKey && !demoModeAllowed()) {
    logger.error("Chat requested but no OpenAI key is configured in production");
    return NextResponse.json(
      { error: "AI planning is temporarily unavailable", code: "AI_UNCONFIGURED" },
      { status: 503 },
    );
  }

  // Ownership check: a request-supplied itineraryId must belong to the caller
  // before it is used as a write target (itinerary days, chat history).
  let storedHistory: unknown = [];
  if (incomingItineraryId) {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: incomingItineraryId, userId },
      select: { chatHistory: true },
    });
    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    storedHistory = itinerary.chatHistory;
  }
  const chatHistory = sanitizeStoredHistory(storedHistory).slice(-CHAT_HISTORY_MAX_MESSAGES);

  // Every message on the platform key consumes one AI credit for free users.
  // Metering per message (not per new session) closes the resume bypass where
  // any request carrying an itineraryId ran unmetered GPT-4o on the platform
  // key. Pro and BYOK users are exempt, and demo-mode responses (no API key
  // available at all) are free — never charge a credit for canned output.
  const isByok = Boolean(userRecord?.openAiApiKey);
  const isPro = userRecord?.plan === "PRO";
  let creditCharged = false;
  if (resolvedApiKey && !isPro && !isByok) {
    const limit = PLANS.FREE.aiMessagesPerMonth;
    const now = new Date();
    const resetAt = userRecord?.aiCreditsResetAt ?? now;
    const sameMonth =
      resetAt.getUTCFullYear() === now.getUTCFullYear() &&
      resetAt.getUTCMonth() === now.getUTCMonth();
    if (!sameMonth) {
      // Calendar month rolled over: reset before metering. Racing requests
      // both writing zero is harmless.
      await prisma.user.update({
        where: { id: userId },
        data: { aiCreditsUsed: 0, aiCreditsResetAt: now },
      });
    }

    // Conditional atomic increment: concurrent requests cannot exceed the cap
    // and the counter can never be clobbered by a stale read.
    const charged = await prisma.user.updateMany({
      where: { id: userId, aiCreditsUsed: { lt: limit } },
      data: { aiCreditsUsed: { increment: 1 } },
    });
    if (charged.count === 0) {
      return NextResponse.json(
        {
          error: "Monthly AI message limit reached",
          code: "UPGRADE_REQUIRED",
          creditsLimit: limit,
        },
        { status: 402 },
      );
    }
    creditCharged = true;
  }

  // Ensure an itinerary record always exists so we can persist chat history from message 1.
  let activeItineraryId = incomingItineraryId;
  if (!activeItineraryId) {
    const title = message.length > 80 ? `${message.slice(0, 77)}…` : message;
    const created = await prisma.itinerary.create({
      data: { title, chatHistory: [], userId },
    });
    activeItineraryId = created.id;
  }
  const itineraryId = activeItineraryId;

  const systemPrompt = ITINERARY_SYSTEM_PROMPT + buildUserContextPrompt(preferences ?? {});
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...chatHistory,
    { role: "user" as const, content: message },
  ];

  const encoder = new TextEncoder();
  // Return the itinerary ID in a response header so the client can use it in subsequent messages.
  const responseHeaders = { ...STREAMING_HEADERS, "X-Itinerary-Id": itineraryId };

  // Stream a mock response when no API key is available (dev/demo only).
  if (!resolvedApiKey) {
    const mockText = buildMockResponse(message);
    const readable = new ReadableStream({
      async start(controller) {
        const words = mockText.split(" ");
        let fullContent = "";
        for (const word of words) {
          const token = `${word} `;
          fullContent += token;
          controller.enqueue(encoder.encode(token));
          await new Promise<void>((r) => setTimeout(r, 18));
        }
        const mockHistory = [
          ...chatHistory,
          { role: "user", content: message },
          { role: "assistant", content: fullContent.trim() },
        ].slice(-CHAT_HISTORY_MAX_MESSAGES);
        await prisma.itinerary.update({
          where: { id: itineraryId, userId },
          data: { chatHistory: JSON.parse(JSON.stringify(mockHistory)) },
        });
        controller.close();
      },
    });
    return new NextResponse(readable, { headers: responseHeaders });
  }

  const openaiClient = new OpenAI({ apiKey: resolvedApiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const { transcript } = await runAgentLoop({
          client: openaiClient,
          model: CHAT_MODEL,
          messages,
          tools: chatTools,
          executors: chatToolExecutors,
          ctx: { userId, itineraryId, client: openaiClient },
          onToken: (token) => controller.enqueue(encoder.encode(token)),
        });

        // Persist the FULL exchange including tool calls/results so the model
        // keeps its own context (which flights it found, which days it wrote)
        // on the next turn. Capped to prevent unbounded JSON growth.
        const updatedHistory = [
          ...chatHistory,
          { role: "user", content: message },
          ...transcript,
        ].slice(-CHAT_HISTORY_MAX_MESSAGES);
        await prisma.itinerary.update({
          where: { id: itineraryId, userId },
          data: { chatHistory: JSON.parse(JSON.stringify(updatedHistory)) },
        });
      } catch (error) {
        logger.error("Streaming error", error);
        if (creditCharged) {
          // The user paid a credit for a response they never received.
          await prisma.user
            .updateMany({
              where: { id: userId, aiCreditsUsed: { gt: 0 } },
              data: { aiCreditsUsed: { decrement: 1 } },
            })
            .catch((refundErr) => logger.error("Credit refund failed", refundErr));
        }
        const errMsg =
          error instanceof Error && error.message.toLowerCase().includes("api key")
            ? "\n\n⚠️ Invalid OpenAI API key. Please update it in your profile settings."
            : "\n\n⚠️ Something went wrong connecting to the AI. Please try again.";
        controller.enqueue(encoder.encode(errMsg));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, { headers: responseHeaders });
}

function buildMockResponse(message: string): string {
  const lower = message.toLowerCase();
  const dest = lower.includes("nepal")
    ? "Nepal"
    : lower.includes("patagonia")
      ? "Patagonia"
      : lower.includes("kilimanjaro")
        ? "Tanzania"
        : lower.includes("iceland")
          ? "Iceland"
          : lower.includes("peru")
            ? "Peru"
            : "your destination";

  return `Great choice! Here's a suggested itinerary for ${dest}:

**Day 1 — Arrival & Orientation**
Arrive and transfer to your accommodation. Spend the afternoon acclimatising and checking your gear. Evening briefing with your guide.

**Day 2 — Acclimatisation Hike**
Short hike to a nearby viewpoint (3–4 hours). Excellent chance to assess fitness and spot wildlife. Return to base by early afternoon.

**Day 3 — Main Trail Begins**
Early start at 06:00. Trek through the primary zone, covering approximately 14 km. Stunning scenery and your first real taste of the terrain. Camp at altitude.

**Day 4 — High Camp**
A challenging 8-hour push to high camp. Elevation gain of ~900 m. Pace yourself — hydration is critical. Clear skies typical in the afternoon.

**Day 5 — Summit Day**
02:30 wake-up, summit attempt by headtorch. Aim to reach the top by sunrise. Descend to base camp by midday. Celebration dinner.

**Estimated budget:** £1,800–£2,400 per person including permits, guides, and accommodation.

*Note: AI trip planner running in demo mode. Add an OpenAI API key to enable full personalised generation.*`;
}
