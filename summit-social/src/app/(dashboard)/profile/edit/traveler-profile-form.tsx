"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, DIFFICULTIES } from "@/lib/constants";
import { useEffect, useState } from "react";

interface TravelerProfileState {
  homeAirport: string;
  cadenceMonths: number;
  maxDifficulty: string;
  preferredCategories: string[];
  budgetBandPence: string; // pounds in the input, converted on save
  typicalDurationDays: string;
  emailOptIn: boolean;
}

/**
 * Stated travel preferences — the cadence engine's highest-quality input:
 * "I'm up for a trip every N months, this is my style and ceiling."
 */
export function TravelerProfileForm() {
  const [state, setState] = useState<TravelerProfileState>({
    homeAirport: "",
    cadenceMonths: 6,
    maxDifficulty: "",
    preferredCategories: [],
    budgetBandPence: "",
    typicalDurationDays: "",
    emailOptIn: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "loading",
  );

  useEffect(() => {
    fetch("/api/user/traveler-profile")
      .then((r) => r.json())
      .then((data: { profile: Record<string, unknown> | null; emailOptIn?: boolean }) => {
        const p = data.profile;
        setState((s) => ({
          ...s,
          emailOptIn: data.emailOptIn ?? false,
          ...(p
            ? {
                homeAirport: (p.homeAirport as string) ?? "",
                cadenceMonths: (p.cadenceMonths as number) ?? 6,
                maxDifficulty: (p.maxDifficulty as string) ?? "",
                preferredCategories: (p.preferredCategories as string[]) ?? [],
                budgetBandPence: p.budgetBandPence
                  ? String((p.budgetBandPence as number) / 100)
                  : "",
                typicalDurationDays: p.typicalDurationDays ? String(p.typicalDurationDays) : "",
              }
            : {}),
        }));
        setStatus("idle");
      })
      .catch(() => setStatus("idle"));
  }, []);

  function toggleCategory(value: string) {
    setState((s) => ({
      ...s,
      preferredCategories: s.preferredCategories.includes(value)
        ? s.preferredCategories.filter((c) => c !== value)
        : [...s.preferredCategories, value],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/user/traveler-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeAirport: state.homeAirport ? state.homeAirport.toUpperCase() : null,
          cadenceMonths: state.cadenceMonths,
          maxDifficulty: state.maxDifficulty || null,
          preferredCategories: state.preferredCategories,
          budgetBandPence: state.budgetBandPence
            ? Math.round(Number(state.budgetBandPence) * 100)
            : null,
          typicalDurationDays: state.typicalDurationDays ? Number(state.typicalDurationDays) : null,
          emailOptIn: state.emailOptIn,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={save} className="mt-10 border border-stone-800">
      <div className="border-b border-stone-800 bg-stone-900/40 px-4 py-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-stone-300">
          Travel cadence & style
        </h2>
        <p className="mt-1 font-mono text-[10px] text-stone-600">
          Powers &ldquo;your next trip&rdquo; picks — see /next-trip
        </p>
      </div>

      <div className="space-y-5 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-xs text-stone-500">
              I travel every … months
            </span>
            <input
              type="number"
              min={1}
              max={24}
              value={state.cadenceMonths}
              onChange={(e) => setState((s) => ({ ...s, cadenceMonths: Number(e.target.value) }))}
              className="w-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            />
          </label>
          <Input
            label="Home airport (IATA)"
            value={state.homeAirport}
            maxLength={3}
            placeholder="LHR"
            onChange={(e) => setState((s) => ({ ...s, homeAirport: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-xs text-stone-500">Difficulty ceiling</span>
            <select
              value={state.maxDifficulty}
              onChange={(e) => setState((s) => ({ ...s, maxDifficulty: e.target.value }))}
              className="w-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="">No ceiling</option>
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Typical budget (£ per trip)"
            type="number"
            value={state.budgetBandPence}
            placeholder="2500"
            onChange={(e) => setState((s) => ({ ...s, budgetBandPence: e.target.value }))}
          />
        </div>

        <div>
          <span className="mb-2 block font-mono text-xs text-stone-500">What you're into</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCategory(c.value)}
                aria-pressed={state.preferredCategories.includes(c.value)}
                className={`border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  state.preferredCategories.includes(c.value)
                    ? "border-amber-500 text-amber-500"
                    : "border-stone-700 text-stone-500 hover:border-stone-500"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border border-stone-800 bg-stone-900/40 p-3">
          <input
            type="checkbox"
            checked={state.emailOptIn}
            onChange={(e) => setState((s) => ({ ...s, emailOptIn: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-amber-500"
          />
          <span>
            <span className="block text-sm text-stone-300">Email me when my trip window opens</span>
            <span className="mt-0.5 block font-mono text-[10px] text-stone-600">
              One email per travel window with your picks — unsubscribe any time
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === "saving" || status === "loading"}>
            {status === "saving" ? "Saving…" : "Save preferences"}
          </Button>
          {status === "saved" && <span className="font-mono text-xs text-emerald-400">Saved</span>}
          {status === "error" && (
            <span className="font-mono text-xs text-red-400">Save failed — check the fields</span>
          )}
        </div>
      </div>
    </form>
  );
}
