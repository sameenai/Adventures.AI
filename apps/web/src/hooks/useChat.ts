"use client";

import type { ChatMessage } from "@/types";
import { useCallback, useState } from "react";

interface UseChatOptions {
  itineraryId?: string;
  initialMessages?: ChatMessage[];
}

export function useChat({ itineraryId, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  // Set when the server answers 402 UPGRADE_REQUIRED — the UI renders a real
  // upsell (link to /pro) instead of a markdown error bubble.
  const [limitReached, setLimitReached] = useState(false);
  const [creditsLimit, setCreditsLimit] = useState<number | undefined>(undefined);
  // Tracks the active itinerary for this session — may be assigned by the server on first message
  const [activeItineraryId, setActiveItineraryId] = useState<string | undefined>(itineraryId);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            itineraryId: activeItineraryId,
          }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            creditsLimit?: number;
          };
          if (response.status === 402 && errData.code === "UPGRADE_REQUIRED") {
            // Structured state, not a transcript message — the chat window
            // renders a real upsell banner with a working link.
            setLimitReached(true);
            if (typeof errData.creditsLimit === "number") {
              setCreditsLimit(errData.creditsLimit);
            }
            return;
          }
          throw new Error(errData.error ?? `Chat request failed (${response.status})`);
        }

        // Capture the itinerary ID the server created or resolved for this session
        const returnedId = response.headers.get("X-Itinerary-Id");
        if (returnedId && !activeItineraryId) {
          setActiveItineraryId(returnedId);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";
        const assistantId = crypto.randomUUID();

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: assistantContent } : msg,
            ),
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Something went wrong. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: errorMessage,
            createdAt: new Date().toISOString(),
            isError: true,
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [activeItineraryId],
  );

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isStreaming,
    limitReached,
    creditsLimit,
    itineraryId: activeItineraryId,
  };
}
