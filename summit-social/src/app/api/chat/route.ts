import { authOptions } from "@/lib/auth/config";
import { openai } from "@/lib/ai/openai";
import { ITINERARY_SYSTEM_PROMPT, buildUserContextPrompt } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
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
    return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMITED" }, { status: 429 });
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

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools: chatTools,
    stream: true,
  });

  const encoder = new TextEncoder();
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
        console.error("Streaming error:", error);
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
