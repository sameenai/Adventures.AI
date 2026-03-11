"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  disabled?: boolean;
}

export function FollowButton({ userId, isFollowing, disabled }: FollowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  const toggle = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowing(!following);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <a
        href="/login"
        className="border border-stone-700 px-4 py-1.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
      >
        Follow
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-1.5 font-display text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
        following
          ? "border border-stone-700 text-stone-400 hover:border-red-800 hover:text-red-400"
          : "border border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      }`}
    >
      {loading ? "…" : following ? "Following" : "Follow"}
    </button>
  );
}
