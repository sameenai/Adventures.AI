"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string | null;
    bio: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    websiteUrl: string | null;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [instagramUrl, setInstagramUrl] = useState(user.instagramUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(user.twitterUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, instagramUrl, twitterUrl, websiteUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save profile.");
        return;
      }

      dirtyRef.current = false;
      router.push(`/profile/${user.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block font-display text-xs uppercase tracking-widest text-stone-400 mb-1.5"
        >
          Display Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            dirtyRef.current = true;
            setName(e.target.value);
          }}
          maxLength={100}
          className="w-full border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Your name"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block font-display text-xs uppercase tracking-widest text-stone-400 mb-1.5"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => {
            dirtyRef.current = true;
            setBio(e.target.value);
          }}
          maxLength={500}
          rows={4}
          className="w-full border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
          placeholder="A short bio about yourself…"
        />
        <p className="mt-1 font-mono text-xs text-stone-600">{bio.length}/500</p>
      </div>

      <div className="space-y-4">
        <p className="font-display text-xs uppercase tracking-widest text-stone-500">
          Social Links
        </p>
        <div>
          <label htmlFor="instagram" className="block font-mono text-xs text-stone-600 mb-1">
            Instagram URL
          </label>
          <input
            id="instagram"
            type="url"
            name="instagramUrl"
            autoComplete="url"
            value={instagramUrl}
            onChange={(e) => {
              dirtyRef.current = true;
              setInstagramUrl(e.target.value);
            }}
            className="w-full border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="https://instagram.com/yourhandle"
          />
        </div>
        <div>
          <label htmlFor="twitter" className="block font-mono text-xs text-stone-600 mb-1">
            Twitter / X URL
          </label>
          <input
            id="twitter"
            type="url"
            name="twitterUrl"
            autoComplete="url"
            value={twitterUrl}
            onChange={(e) => {
              dirtyRef.current = true;
              setTwitterUrl(e.target.value);
            }}
            className="w-full border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="https://x.com/yourhandle"
          />
        </div>
        <div>
          <label htmlFor="website" className="block font-mono text-xs text-stone-600 mb-1">
            Website URL
          </label>
          <input
            id="website"
            type="url"
            name="websiteUrl"
            autoComplete="url"
            value={websiteUrl}
            onChange={(e) => {
              dirtyRef.current = true;
              setWebsiteUrl(e.target.value);
            }}
            className="w-full border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="https://yoursite.com"
          />
        </div>
      </div>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="border border-amber-500 bg-amber-500 px-6 py-2.5 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <a
          href={`/profile/${user.id}`}
          className="font-display text-xs uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
