"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import type { ChatMessage } from "@/types";
import { useRef, useEffect } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatWindowProps {
  itineraryId?: string;
  initialMessages?: ChatMessage[];
}

export function ChatWindow({ itineraryId, initialMessages = [] }: ChatWindowProps) {
  const { messages, input, setInput, sendMessage, isStreaming } = useChat({
    itineraryId,
    initialMessages,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <h3 className="text-lg font-semibold text-gray-900">Plan your next adventure</h3>
              <p className="mt-2 text-sm text-gray-500">
                Tell me where you want to go, when, your budget, and I&apos;ll create a detailed
                itinerary for you.
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
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your dream adventure..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-summit-500 focus:outline-none focus:ring-1 focus:ring-summit-500"
            disabled={isStreaming}
          />
          <Button type="submit" disabled={!input.trim() || isStreaming} loading={isStreaming}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
