import { track } from "@/lib/analytics/track";
import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { chatFeedbackSchema } from "@/lib/validators/chat";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Thumbs on an assistant reply — the input side of the AI quality loop.
 *
 * The rating is stored WITH a snapshot of the conversation up to and including
 * the rated reply, so a bad answer stays reproducible even after the chat
 * continues or the itinerary is deleted. DOWN-rated rows are later exported as
 * eval candidate transcripts by `npm run eval:candidates`.
 *
 * One row per (user, itinerary, messageIndex), enforced by a compound unique
 * constraint: re-rating upserts on the triple. The update overwrites rating,
 * comment and transcript, and clears exportedAt so a re-rated reply is picked
 * up again by the eval-candidate export.
 */

type StoredChatEntry = { role?: unknown; content?: unknown };

function isAssistantReply(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const { role, content } = entry as StoredChatEntry;
  // Tool-call plumbing entries are role "assistant" with null content — they
  // carry no user-visible reply and cannot be rated.
  return role === "assistant" && typeof content === "string" && content.length > 0;
}

export const POST = withApi(
  { rateLimit: { name: "feedback" }, schema: chatFeedbackSchema },
  async ({ userId, body }) => {
    const { itineraryId, messageIndex, rating, comment } = body;

    // Ownership: the itinerary must belong to the caller (404 otherwise, same
    // shape as every other not-yours resource — no existence oracle).
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId, userId },
      select: { chatHistory: true },
    });
    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const history = Array.isArray(itinerary.chatHistory) ? itinerary.chatHistory : [];
    if (messageIndex >= history.length || !isAssistantReply(history[messageIndex])) {
      return NextResponse.json(
        {
          error: "messageIndex does not reference an assistant reply in this conversation",
          code: "INVALID_MESSAGE_INDEX",
        },
        { status: 400 },
      );
    }

    // Snapshot everything up to and including the rated reply.
    const transcript = history.slice(0, messageIndex + 1) as Prisma.InputJsonValue;

    const feedback = await prisma.messageFeedback.upsert({
      where: { userId_itineraryId_messageIndex: { userId, itineraryId, messageIndex } },
      update: { rating, comment: comment ?? null, transcript, exportedAt: null },
      create: { userId, itineraryId, messageIndex, rating, comment: comment ?? null, transcript },
    });

    track("feedback_submitted", { userId, props: { rating } });

    return NextResponse.json(
      {
        feedback: {
          id: feedback.id,
          rating: feedback.rating,
          messageIndex: feedback.messageIndex,
        },
      },
      { status: 201 },
    );
  },
);
