import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
          isError
            ? "bg-red-950/30 border border-red-800/50 text-red-300"
            : isUser
              ? "bg-amber-500/10 border border-amber-500/30 text-stone-100"
              : "bg-stone-800/60 border border-stone-700/50 text-stone-300",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-mono text-xs text-red-400 underline underline-offset-2 transition-colors hover:text-red-300"
          >
            Try again
          </button>
        )}
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
