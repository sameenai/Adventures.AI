import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-amber-500/10 border border-amber-500/30 text-stone-100"
            : "bg-stone-800/60 border border-stone-700/50 text-stone-300",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div
                key={`${tc.name}-${i}`}
                className="border border-stone-700 px-2 py-1 font-mono text-xs text-stone-500"
              >
                ↳ {tc.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
