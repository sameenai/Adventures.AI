import { openai } from "@/lib/ai/openai";
import { ITINERARY_SYSTEM_PROMPT, buildUserContextPrompt } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { chatMessageSchema } from "@/lib/validators/chat";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const allowed = await rateLimit(
    `chat:${session.user.id}`,
    RATE_LIMITS.chat.limit,
    RATE_LIMITS.chat.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = chatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, itineraryId, preferences } = parsed.data;

  let chatHistory: Array<{ role: string; content: string }> = [];
  if (itineraryId) {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId, userId: session.user.id },
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

  // Stream a mock response when OpenAI is not configured
  if (!process.env.OPENAI_API_KEY) {
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
        if (itineraryId) {
          await prisma.itinerary.update({
            where: { id: itineraryId },
            data: {
              chatHistory: [
                ...chatHistory,
                { role: "user", content: message },
                { role: "assistant", content: fullContent.trim() },
              ],
            },
          });
        }
        controller.close();
      },
    });
    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools: chatTools,
    stream: true,
  });

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }

        // Persist chat history
        if (itineraryId) {
          const updatedHistory = [
            ...chatHistory,
            { role: "user", content: message },
            { role: "assistant", content: fullContent },
          ];
          await prisma.itinerary.update({
            where: { id: itineraryId },
            data: { chatHistory: updatedHistory },
          });
        }
      } catch (error) {
        logger.error("Streaming error", error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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

*Note: AI trip planner running in demo mode. Connect an OpenAI API key for personalised, real-time itinerary generation.*`;
}
