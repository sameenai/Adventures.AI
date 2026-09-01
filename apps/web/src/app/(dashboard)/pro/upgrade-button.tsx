"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }
      // Keep the loading state while the browser navigates to Stripe.
      window.location.assign(data.url);
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button type="button" className="w-full" loading={loading} onClick={upgrade}>
        {loading ? "Redirecting…" : "Upgrade to Pro"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 font-mono text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
