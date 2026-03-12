"use client";

import { CommentForm } from "@/components/adventures/comment-form";
import { timeAgo } from "@/lib/utils";
import type { CommentWithUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CommentSectionProps {
  adventureId: string;
  comments: CommentWithUser[];
  currentUserId: string | null;
}

export function CommentSection({ adventureId, comments, currentUserId }: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  if (comments.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No comments yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id}>
          <div className="flex items-start gap-3">
            {comment.user.avatarUrl && (
              <Image
                src={comment.user.avatarUrl}
                alt={comment.user.name ?? ""}
                width={28}
                height={28}
                className="shrink-0 border border-stone-700"
              />
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-mono text-xs text-stone-300 hover:text-amber-500 transition-colors"
                >
                  {comment.user.name}
                </Link>
                <span className="font-mono text-xs text-stone-700">
                  {timeAgo(new Date(comment.createdAt))}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-stone-400">{comment.body}</p>
              {currentUserId && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="mt-1.5 font-mono text-xs text-stone-600 hover:text-amber-500 transition-colors"
                >
                  {replyingTo === comment.id ? "Cancel" : "Reply"}
                </button>
              )}
            </div>
          </div>

          {/* Replies */}
          {((comment.replies && comment.replies.length > 0) || replyingTo === comment.id) && (
            <div className="ml-10 mt-4 space-y-4 border-l border-stone-800 pl-4">
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  {reply.user.avatarUrl && (
                    <Image
                      src={reply.user.avatarUrl}
                      alt={reply.user.name ?? ""}
                      width={22}
                      height={22}
                      className="shrink-0 border border-stone-700"
                    />
                  )}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/profile/${reply.user.id}`}
                        className="font-mono text-xs text-stone-300 hover:text-amber-500 transition-colors"
                      >
                        {reply.user.name}
                      </Link>
                      <span className="font-mono text-xs text-stone-700">
                        {timeAgo(new Date(reply.createdAt))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-stone-400">{reply.body}</p>
                  </div>
                </div>
              ))}
              {replyingTo === comment.id && (
                <CommentForm
                  adventureId={adventureId}
                  parentId={comment.id}
                  placeholder="Write a reply…"
                  onCancel={() => setReplyingTo(null)}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
