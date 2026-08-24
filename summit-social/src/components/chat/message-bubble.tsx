import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

// Dark-theme styling for assistant markdown. Links open in a new tab with
// rel="noopener noreferrer"; rehype-sanitize strips anything dangerous first.
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mb-2 font-display text-sm uppercase tracking-widest text-stone-100">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 font-display text-sm uppercase tracking-widest text-stone-100">
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1 font-display text-xs uppercase tracking-widest text-stone-200">
      {children}
    </h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-1 font-display text-xs uppercase tracking-widest text-stone-200">
      {children}
    </h6>
  ),
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-stone-100">{children}</strong>,
  em: ({ children }) => <em className="text-stone-400">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-500 underline underline-offset-2 transition-colors hover:text-amber-400"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-stone-900/80 px-1 py-0.5 font-mono text-xs text-amber-300">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto border border-stone-700/50 bg-stone-900/80 p-3 last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-amber-500/50 pl-3 text-stone-400 last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-stone-700" />,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse font-mono text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-stone-700 px-2 py-1 text-left text-stone-100">{children}</th>
  ),
  td: ({ children }) => <td className="border border-stone-700 px-2 py-1">{children}</td>,
};

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
        {isUser || isError ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
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
