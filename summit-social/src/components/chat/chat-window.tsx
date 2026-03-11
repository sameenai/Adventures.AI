"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage } from "@/types";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatWindowProps {
  itineraryId?: string;
  initialMessages?: ChatMessage[];
  initialPrompt?: string;
}

export function ChatWindow({ itineraryId, initialMessages = [], initialPrompt }: ChatWindowProps) {
  const { messages, input, setInput, sendMessage, isStreaming } = useChat({
    itineraryId,
    initialMessages,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptSentRef = useRef(false);

  // Auto-send a pre-filled prompt exactly once on mount (e.g. from "Plan this trip" CTA).
  // Capturing values in the ref at declaration time so the effect can safely run
  // with an empty dependency array without the linter complaining.
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 2 weeks trekking in Nepal, budget £3000..."
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
