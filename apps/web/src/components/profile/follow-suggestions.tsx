"use client";

import { Avatar } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface Suggestion {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  _count: { adventures: number };
}

interface FollowSuggestionsProps {
  category?: string;
}

export function FollowSuggestions({ category }: FollowSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = category
      ? `/api/users/suggestions?category=${encodeURIComponent(category)}`
      : "/api/users/suggestions";

    fetch(url)
      .then((r) => r.json())
      .then((data: Suggestion[]) => setSuggestions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const handleFollow = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
    if (res.ok) {
      setFollowing((prev) => new Set([...prev, userId]));
    }
  };

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
        People to Follow
      </h2>
      <ul className="space-y-3">
        {suggestions.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3">
            <a href={`/profile/${user.id}`} className="flex items-center gap-3 min-w-0 group">
              <div className="relative h-8 w-8 shrink-0 rounded-full bg-stone-800 overflow-hidden">
                <Avatar
                  src={user.avatarUrl}
                  name={user.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-stone-200 group-hover:text-amber-500 transition-colors truncate">
                  {user.name ?? "Anonymous"}
                </p>
                <p className="font-mono text-[10px] text-stone-600">
                  {user._count.adventures} adventure{user._count.adventures !== 1 ? "s" : ""}
                </p>
              </div>
            </a>
            <button
              type="button"
              onClick={() => handleFollow(user.id)}
              disabled={following.has(user.id)}
              className="shrink-0 border border-stone-700 px-2.5 py-1 font-display text-xs uppercase tracking-widest text-stone-400 hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {following.has(user.id) ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
