"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useState } from "react";

/**
 * Data rights self-service: export everything as JSON, or permanently delete
 * the account (typed confirmation required).
 */
export function AccountDangerZone() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/user/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (res.status === 204) {
        await signOut({ callbackUrl: "/" });
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Deletion failed. Please try again.");
    } catch {
      setError("Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-10 border border-stone-800">
      <div className="border-b border-stone-800 bg-stone-900/40 px-4 py-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-stone-300">Your data</h2>
      </div>

      <div className="space-y-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-300">Export your data</p>
            <p className="mt-1 text-xs text-stone-500">
              Download everything Basecamper holds about you as JSON.
            </p>
          </div>
          <a
            href="/api/user/me/export"
            download
            className="border border-stone-700 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-300 transition-colors hover:border-amber-500 hover:text-amber-500"
          >
            Download
          </a>
        </div>

        <form onSubmit={handleDelete} className="border-t border-red-950 pt-5">
          <p className="text-sm text-red-400">Delete account</p>
          <p className="mt-1 text-xs text-stone-500">
            Permanently deletes your account, adventures, comments, votes, itineraries and chat
            history, and your billing record. This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              aria-label="Type DELETE to confirm account deletion"
              className="border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-xs text-stone-100 placeholder:text-stone-600 focus:border-red-500 focus:outline-none"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={confirmText !== "DELETE" || deleting}
              className="border-red-800 text-red-400 hover:border-red-500 hover:text-red-300"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
          {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
