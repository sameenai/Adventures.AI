"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage } from "@/types";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatWindowProps {
  itineraryId?: string;
  initialMessages?: ChatMessage[];
  initialPrompt?: string;
}

export function ChatWindow({ itineraryId, initialMessages = [], initialPrompt }: ChatWindowProps) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isStreaming,
    itineraryId: activeItineraryId,
  } = useChat({
    itineraryId,
    initialMessages,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptSentRef = useRef(false);

  // Auto-send a pre-filled prompt exactly once on mount (e.g. from "Plan this trip" CTA).
  const initialPromptRef = useRef(initialPrompt);
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    const prompt = initialPromptRef.current;
    if (prompt && !promptSentRef.current) {
      promptSentRef.current = true;
      sendMessageRef.current(prompt);
    }
  }, []);

  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex h-full flex-col bg-stone-950">
      {/* Session header — shows itinerary link once a conversation is underway */}
      {activeItineraryId && (
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900/60 px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-600">
            Session active
          </span>
          <Link
            href={`/itinerary/${activeItineraryId}`}
            className="font-display text-[10px] uppercase tracking-widest text-amber-500 transition-colors hover:text-amber-400"
          >
            View itinerary →
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm text-center">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-stone-600 mb-3">
                AI Trip Planner
              </p>
              <h3 className="font-display text-xl uppercase tracking-widest text-stone-300">
                Plan your expedition
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Tell me where you want to go, when, your budget, and I&apos;ll build a detailed
                day-by-day itinerary.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {[
                  "2 weeks trekking in Nepal, budget £3,000",
                  "Solo cycling the Camino de Santiago in June",
                  "Family safari in Tanzania, 10 days",
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => sendMessage(ex)}
                    className="border border-stone-800 px-3 py-2 text-left font-mono text-xs text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-300"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-stone-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="message"
            aria-label="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 2 weeks trekking in Nepal, budget £3,000…"
            className="flex-1 border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            loading={isStreaming}
            size="sm"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
