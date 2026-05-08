import { ItineraryDaySchema } from "@/lib/ai/parser";
import { ITINERARY_SYSTEM_PROMPT, buildUserContextPrompt } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import { authOptions } from "@/lib/auth/config";
import { PLANS, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { chatMessageSchema } from "@/lib/validators/chat";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionAssistantMessageParam } from "openai/resources/chat/completions";

type AccumulatedToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

const STREAMING_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/** Persist a create_itinerary_day tool call result to the DB. */
async function persistItineraryDay(args: unknown, itineraryId: string): Promise<void> {
  const parsed = ItineraryDaySchema.safeParse(args);
  if (!parsed.success) return;

  const { dayNumber, title, description, activities } = parsed.data;

  const existing = await prisma.itineraryDay.findFirst({
    where: { itineraryId, dayNumber },
    select: { id: true },
  });

  if (existing) {
    await prisma.itineraryDay.update({
      where: { id: existing.id },
      data: { title, description, activities },
    });
  } else {
    await prisma.itineraryDay.create({
      data: { itineraryId, dayNumber, title, description, activities },
    });
  }
}

/** Handle search_adventures tool call — query the DB and return relevant adventures. */
async function handleSearchAdventures(args: unknown): Promise<string> {
  try {
    const a = args as {
      query?: string;
      category?: string;
      continent?: string;
      difficulty?: string;
      maxDuration?: number;
    };

    const results = await prisma.adventure.findMany({
      where: {
        published: true,
        ...(a.category && { category: a.category as never }),
        ...(a.continent && { continent: a.continent }),
        ...(a.difficulty && { difficulty: a.difficulty as never }),
        ...(a.maxDuration && { durationDays: { lte: a.maxDuration } }),
        ...(a.query && {
          OR: [
            { title: { contains: a.query, mode: "insensitive" as const } },
            { description: { contains: a.query, mode: "insensitive" as const } },
            { location: { contains: a.query, mode: "insensitive" as const } },
          ],
        }),
      },
      take: 5,
      orderBy: { voteCount: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        country: true,
        category: true,
        difficulty: true,
        durationDays: true,
        description: true,
      },
    });

    return JSON.stringify({ success: true, results });
  } catch {
    return JSON.stringify({ success: false, results: [] });
  }
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
  const resolvedApiKey = userRecord?.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;

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

  // On the first message of a new session, check and consume an AI credit.
  // Pro users and BYOK users are exempt from the monthly limit.
  const isByok = Boolean(userRecord?.openAiApiKey);
  const isPro = userRecord?.plan === "PRO";
  if (!incomingItineraryId && !isPro && !isByok) {
    const limit = PLANS.FREE.aiCreditsPerMonth;
    // Reset counter if we've rolled into a new calendar month
    const resetAt = userRecord?.aiCreditsResetAt ?? new Date();
    const now = new Date();
    const sameMonth =
      resetAt.getUTCFullYear() === now.getUTCFullYear() &&
      resetAt.getUTCMonth() === now.getUTCMonth();
    const creditsUsed = sameMonth ? (userRecord?.aiCreditsUsed ?? 0) : 0;

    if (creditsUsed >= limit) {
      return NextResponse.json(
        {
          error: "Monthly AI session limit reached",
          code: "UPGRADE_REQUIRED",
          creditsUsed,
          creditsLimit: limit,
        },
        { status: 402 },
      );
    }

    // Increment credit usage (reset counter if new month)
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiCreditsUsed: sameMonth ? creditsUsed + 1 : 1,
        aiCreditsResetAt: sameMonth ? undefined : now,
      },
    });
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

  // Load existing chat history.
  let chatHistory: Array<{ role: string; content: string }> = [];
  if (incomingItineraryId) {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: incomingItineraryId, userId },
      select: { chatHistory: true },
    });
    if (itinerary?.chatHistory) {
      chatHistory = itinerary.chatHistory as Array<{ role: string; content: string }>;
    }
  }

  const systemPrompt = ITINERARY_SYSTEM_PROMPT + buildUserContextPrompt(preferences ?? {});

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...chatHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const encoder = new TextEncoder();
  // Return the itinerary ID in a response header so the client can use it in subsequent messages.
  const responseHeaders = { ...STREAMING_HEADERS, "X-Itinerary-Id": activeItineraryId };

  // Stream a mock response when no API key is available.
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
        await prisma.itinerary.update({
          where: { id: activeItineraryId },
          data: {
            chatHistory: [
              ...chatHistory,
              { role: "user", content: message },
              { role: "assistant", content: fullContent.trim() },
            ],
          },
        });
        controller.close();
      },
    });
    return new NextResponse(readable, { headers: responseHeaders });
  }

  const openaiClient = new OpenAI({ apiKey: resolvedApiKey });

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";

      try {
        const stream = await openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools: chatTools,
          stream: true,
        });

        // Accumulate tool call deltas; index → partial call
        const toolCallsMap = new Map<number, AccumulatedToolCall>();
        let finishReason: string | null = null;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

          if (delta?.content) {
            fullContent += delta.content;
            controller.enqueue(encoder.encode(delta.content));
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const existing = toolCallsMap.get(tc.index) ?? {
                id: "",
                function: { name: "", arguments: "" },
              };
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.function.name += tc.function.name;
              if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
              toolCallsMap.set(tc.index, existing);
            }
          }
        }

        // Process tool calls if the model requested them
        if (finishReason === "tool_calls" && toolCallsMap.size > 0) {
          const toolCalls = Array.from(toolCallsMap.values());
          const toolResults: Array<{ role: "tool"; content: string; tool_call_id: string }> = [];

          for (const tc of toolCalls) {
            let resultContent: string;

            if (tc.function.name === "create_itinerary_day") {
              try {
                const args = JSON.parse(tc.function.arguments) as unknown;
                await persistItineraryDay(args, activeItineraryId);
                resultContent = JSON.stringify({ success: true });
              } catch (err) {
                logger.error("create_itinerary_day failed", err);
                resultContent = JSON.stringify({ success: false, error: "Failed to save day" });
              }
            } else if (tc.function.name === "search_adventures") {
              const args = JSON.parse(tc.function.arguments) as unknown;
              resultContent = await handleSearchAdventures(args);
            } else {
              resultContent = JSON.stringify({ success: true, results: [] });
            }

            toolResults.push({ role: "tool", content: resultContent, tool_call_id: tc.id });
          }

          // Second streaming call with tool results injected
          const assistantMsg: ChatCompletionAssistantMessageParam = {
            role: "assistant",
            content: null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
          };
          const followUpMessages = [...messages, assistantMsg, ...toolResults];

          const followUpStream = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages: followUpMessages,
            stream: true,
          });

          for await (const chunk of followUpStream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }
        }

        // Persist chat history
        await prisma.itinerary.update({
          where: { id: activeItineraryId },
          data: {
            chatHistory: [
              ...chatHistory,
              { role: "user", content: message },
              { role: "assistant", content: fullContent },
            ],
          },
        });
      } catch (error) {
        logger.error("Streaming error", error);
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

To search for flights, just tell me your departure airport and travel dates. I can also refine any day in this itinerary — just ask!

*Note: AI trip planner running in demo mode. Add your OpenAI API key in profile settings for full personalised generation.*`;
}
