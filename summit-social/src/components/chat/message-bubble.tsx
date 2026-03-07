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
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-summit-600 text-white"
            : "bg-gray-100 text-gray-900",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div key={`${tc.name}-${i}`} className="rounded bg-gray-200/50 px-2 py-1 text-xs text-gray-600">
                Used: {tc.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
