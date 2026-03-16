"use client";

import { useState } from "react";

interface OpenAiKeyFormProps {
  initialHasKey: boolean;
  initialHint: string | null;
}

export function OpenAiKeyForm({ initialHasKey, initialHint }: OpenAiKeyFormProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [hint, setHint] = useState(initialHint);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save key.");
        return;
      }

      setHasKey(true);
      setHint(data.hint);
      setKeyInput("");
      setSuccess("Key saved — your conversations will now use your quota.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/openai-key", { method: "DELETE" });

      if (!res.ok) {
        setError("Failed to remove key.");
        return;
      }

      setHasKey(false);
      setHint(null);
      setSuccess("Key removed — using shared quota.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="border border-stone-800 p-5 space-y-4">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.3em] text-stone-400">
          AI Trip Planner — OpenAI API Key
        </p>
        <p className="mt-1.5 font-mono text-xs leading-relaxed text-stone-600">
          Add your own key to use GPT-4o directly for trip planning using your own quota. Your key
          is stored privately and never shared.{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-500 transition-colors"
          >
            Get a key →
          </a>
        </p>
      </div>

      {hasKey ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs text-stone-400">{hint}</span>
            <span className="font-mono text-xs text-stone-600">active</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="font-display text-xs uppercase tracking-widest text-stone-500 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {removing ? "Removing…" : "Remove Key"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex items-start gap-3">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            disabled={saving || keyInput.trim().length < 20}
            className="shrink-0 border border-amber-500 bg-amber-500 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Key"}
          </button>
        </form>
      )}

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      {success && <p className="font-mono text-xs text-emerald-500">{success}</p>}
    </div>
  );
}
