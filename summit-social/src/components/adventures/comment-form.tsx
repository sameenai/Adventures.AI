"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommentFormProps {
  adventureId: string;
  parentId?: string;
  placeholder?: string;
  onCancel?: () => void;
}

export function CommentForm({
  adventureId,
  parentId,
  placeholder = "Share your experience or ask a question…",
  onCancel,
}: CommentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/adventures/${adventureId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), parentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429 && data.retryAfter) {
          setError(`Too many comments. Try again in ${data.retryAfter}s.`);
        } else {
          setError(data.error ?? "Failed to post comment.");
        }
        return;
      }

      setBody("");
      router.refresh();
      onCancel?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        name="body"
        aria-label="Comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        className="w-full border border-stone-700 bg-stone-900 px-4 py-3 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
        disabled={isSubmitting}
      />
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!body.trim() || isSubmitting}
          className="border border-amber-500 bg-amber-500 px-4 py-1.5 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
