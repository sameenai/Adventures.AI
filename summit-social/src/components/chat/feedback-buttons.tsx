"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { useRef, useState } from "react";

/**
 * Unobtrusive thumbs on an assistant reply. Fire-and-forget: the POST carries
 * the reply's index in the itinerary's stored chatHistory plus (on a thumbs
 * down) an optional one-line comment; every failure is silent — feedback is a
 * courtesy signal, never a chat error.
 */

type Rating = "UP" | "DOWN";

interface FeedbackButtonsProps {
  itineraryId: string;
  message: ChatMessage;
}

type StoredChatEntry = { role?: unknown; content?: unknown };

/** Resumed sessions render messages with ids of the form `${itineraryId}-${historyIndex}`. */
function parseHistoryIndex(itineraryId: string, messageId: string): number | null {
  const prefix = `${itineraryId}-`;
  if (!messageId.startsWith(prefix)) return null;
  const suffix = messageId.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return null;
  return Number(suffix);
}

/**
 * Live-streamed messages carry random ids, so their history index is resolved
 * at click time by finding the reply in the persisted chatHistory (searching
 * from the end — the freshest occurrence is the one just rated). Tool-call
 * plumbing between visible messages means the index cannot be counted
 * client-side.
 */
async function resolveHistoryIndex(
  itineraryId: string,
  message: ChatMessage,
): Promise<number | null> {
  const parsed = parseHistoryIndex(itineraryId, message.id);
  if (parsed !== null) return parsed;
  try {
    const res = await fetch(`/api/itineraries/${itineraryId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { chatHistory?: unknown };
    const history = Array.isArray(data.chatHistory) ? data.chatHistory : [];
    const target = message.content.trim();
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i] as StoredChatEntry | null;
      if (!entry || typeof entry !== "object") continue;
      if (entry.role !== "assistant" || typeof entry.content !== "string") continue;
      if (entry.content.trim() === target) return i;
    }
    return null;
  } catch {
    return null;
  }
}

export function FeedbackButtons({ itineraryId, message }: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<Rating | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const indexRef = useRef<number | null>(null);

  const submit = async (rating: Rating, commentText?: string): Promise<void> => {
    try {
      if (indexRef.current === null) {
        indexRef.current = await resolveHistoryIndex(itineraryId, message);
      }
      const messageIndex = indexRef.current;
      if (messageIndex === null) return;
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId,
          messageIndex,
          rating,
          ...(commentText ? { comment: commentText } : {}),
        }),
      });
    } catch {
      // Silent by design — a failed rating must never disturb the conversation.
    }
  };

  const handleRate = (rating: Rating): void => {
    setSelected(rating);
    setShowComment(rating === "DOWN" && !commentSent);
    void submit(rating);
  };

  const handleCommentSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    setCommentSent(true);
    setShowComment(false);
    void submit("DOWN", trimmed.slice(0, 500));
  };

  return (
    <div className="mt-1 flex flex-col items-start gap-1 pl-1">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Good response"
          aria-pressed={selected === "UP"}
          onClick={() => handleRate("UP")}
          className={cn(
            "p-1 transition-colors",
            selected === "UP" ? "text-amber-500" : "text-stone-600 hover:text-stone-400",
          )}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
            />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Bad response"
          aria-pressed={selected === "DOWN"}
          onClick={() => handleRate("DOWN")}
          className={cn(
            "p-1 transition-colors",
            selected === "DOWN" ? "text-amber-500" : "text-stone-600 hover:text-stone-400",
          )}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54"
            />
          </svg>
        </button>
        {commentSent && (
          <span className="pl-1 font-mono text-[10px] text-stone-600">Thanks — noted.</span>
        )}
      </div>
      {showComment && (
        <form onSubmit={handleCommentSubmit} className="flex w-full max-w-sm gap-1">
          <input
            type="text"
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went wrong? (optional)"
            aria-label="Feedback comment"
            className="flex-1 border border-stone-800 bg-stone-900 px-2 py-1 font-mono text-xs text-stone-300 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className="border border-stone-700 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:border-amber-500 hover:text-amber-500 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
