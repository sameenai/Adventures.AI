"use client";

import { CommentForm } from "@/components/adventures/comment-form";
import { Modal } from "@/components/ui/modal";
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

function CommentBody({
  comment,
  adventureId,
  currentUserId,
  onDeleted,
}: {
  comment: CommentWithUser;
  adventureId: string;
  currentUserId: string | null;
  onDeleted: (id: string) => void;
}) {
  const [replyingTo, setReplyingTo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [body, setBody] = useState(comment.body);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reacted, setReacted] = useState(comment.viewerReacted ?? false);
  const [reactionCount, setReactionCount] = useState(comment._count?.reactions ?? 0);
  const [reacting, setReacting] = useState(false);

  const isOwner = currentUserId === comment.userId;

  const handleReact = async () => {
    if (!currentUserId) return;
    setReacting(true);
    const res = await fetch(`/api/adventures/${adventureId}/comments/${comment.id}/react`, {
      method: "POST",
    });
    if (res.ok) {
      const data = (await res.json()) as { reacted: boolean; count: number };
      setReacted(data.reacted);
      setReactionCount(data.count);
    }
    setReacting(false);
  };

  const handleSave = async () => {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed === body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/adventures/${adventureId}/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });
    if (res.ok) {
      setBody(trimmed);
      setEditing(false);
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    setConfirmingDelete(false);
    setDeleting(true);
    const res = await fetch(`/api/adventures/${adventureId}/comments/${comment.id}`, {
      method: "DELETE",
    });
    if (res.ok) onDeleted(comment.id);
    setDeleting(false);
  };

  return (
    <div>
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
              className="font-mono text-xs text-stone-300 transition-colors hover:text-amber-500"
            >
              {comment.user.name}
            </Link>
            <span className="font-mono text-xs text-stone-700">
              {timeAgo(new Date(comment.createdAt))}
            </span>
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                aria-label="Edit comment"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="w-full border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="border border-amber-500 px-2.5 py-1 font-display text-xs uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
                >
                  {saving ? "…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditBody(body);
                  }}
                  className="font-mono text-xs text-stone-600 transition-colors hover:text-stone-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-stone-400">{body}</p>
          )}

          <div className="mt-1.5 flex items-center gap-3" aria-live="polite">
            <button
              type="button"
              onClick={handleReact}
              disabled={!currentUserId || reacting}
              aria-label={`React with thumbs up${reactionCount > 0 ? `, ${reactionCount} reactions` : ""}`}
              className={`flex items-center gap-1 font-mono text-xs transition-colors disabled:cursor-not-allowed ${reacted ? "text-amber-500" : "text-stone-600 hover:text-amber-500"}`}
            >
              <span aria-hidden="true">👍</span>
              {reactionCount > 0 && <span>{reactionCount}</span>}
            </button>
            {currentUserId && !editing && (
              <button
                type="button"
                onClick={() => setReplyingTo((v) => !v)}
                className="font-mono text-xs text-stone-600 transition-colors hover:text-amber-500"
              >
                {replyingTo ? "Cancel" : "Reply"}
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-mono text-xs text-stone-600 transition-colors hover:text-stone-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={deleting}
                  className="font-mono text-xs text-stone-600 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  {deleting ? "…" : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {((comment.replies && comment.replies.length > 0) || replyingTo) && (
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
                    className="font-mono text-xs text-stone-300 transition-colors hover:text-amber-500"
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
          {replyingTo && (
            <CommentForm
              adventureId={adventureId}
              parentId={comment.id}
              placeholder="Write a reply…"
              onCancel={() => setReplyingTo(false)}
            />
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete comment"
      >
        <p className="text-sm text-stone-400">
          Are you sure you want to delete this comment? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="border border-stone-700 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:text-stone-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="border border-red-700 bg-red-950/40 px-4 py-2 font-display text-xs uppercase tracking-widest text-red-400 transition-colors hover:bg-red-900/40"
          >
            Delete comment
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function CommentSection({ adventureId, comments, currentUserId }: CommentSectionProps) {
  const [visible, setVisible] = useState(comments);

  const handleDeleted = (id: string) => {
    setVisible((prev) => prev.filter((c) => c.id !== id));
  };

  if (visible.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No comments yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {visible.map((comment) => (
        <CommentBody
          key={comment.id}
          comment={comment}
          adventureId={adventureId}
          currentUserId={currentUserId}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
