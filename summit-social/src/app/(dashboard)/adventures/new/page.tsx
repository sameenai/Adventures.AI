"use client";

import { Button } from "@/components/ui/button";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim().toLowerCase();
    if (t && !value.includes(t) && value.length < 10) {
      onChange([...value, t]);
      setDraft("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. high-altitude"
          maxLength={50}
          className="flex-1 border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="border border-stone-700 px-3 py-2 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 border border-stone-700 px-2 py-0.5 font-mono text-xs text-stone-400"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-stone-600 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ListItem = { id: string; text: string };

function ListInput({
  value,
  onChange,
  placeholder,
  max = 20,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<ListItem[]>(() =>
    value.map((text) => ({ id: crypto.randomUUID(), text })),
  );

  const add = () => {
    const t = draft.trim();
    if (t && items.length < max) {
      const newItems = [...items, { id: crypto.randomUUID(), text: t }];
      setItems(newItems);
      onChange(newItems.map((i) => i.text));
      setDraft("");
    }
  };

  const remove = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    setItems(newItems);
    onChange(newItems.map((i) => i.text));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="border border-stone-700 px-3 py-2 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map(({ id, text }) => (
            <li
              key={id}
              className="flex items-center justify-between border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-400"
            >
              <span>{text}</span>
              <button
                type="button"
                onClick={() => remove(id)}
                className="text-stone-600 hover:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NewAdventurePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    country: "",
    continent: "Europe" as string,
    category: "TREKKING" as string,
    difficulty: "MODERATE" as string,
    durationDays: 7,
    coverImageUrl: "",
    albumUrl: "",
    albumPlatform: "" as string,
    estimatedCost: "" as string | number,
    gpxTrackUrl: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    highlights: [] as string[],
    gear: [] as string[],
    bestMonths: [] as number[],
    tags: [] as string[],
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleMonth = (m: number) =>
    set(
      "bestMonths",
      form.bestMonths.includes(m)
        ? form.bestMonths.filter((x) => x !== m)
        : [...form.bestMonths, m],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      durationDays: Number(form.durationDays),
      estimatedCost: form.estimatedCost !== "" ? Number(form.estimatedCost) : undefined,
      latitude: form.latitude !== "" ? Number(form.latitude) : undefined,
      longitude: form.longitude !== "" ? Number(form.longitude) : undefined,
      albumUrl: form.albumUrl || undefined,
      albumPlatform: form.albumPlatform || undefined,
      gpxTrackUrl: form.gpxTrackUrl || undefined,
    };

    try {
      const res = await fetch("/api/adventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit adventure.");
        return;
      }

      router.push(`/adventures/${data.id}?submitted=1`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const field =
    "border border-stone-700 bg-stone-900 px-3 py-2 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none w-full";
  const labelCls = "block font-display text-xs uppercase tracking-[0.25em] text-stone-500 mb-1.5";
  const groupLabel = "font-display text-xs uppercase tracking-[0.25em] text-stone-500 mb-1.5 block";
  const section = "space-y-5 border border-stone-800 p-5";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Community
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Share Adventure
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Your submission will be reviewed before going live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className={section}>
          <h2 className="font-display text-xs uppercase tracking-widest text-amber-500">
            Basic Info
          </h2>

          <div>
            <label htmlFor="title" className={labelCls}>
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Torres del Paine W Trek"
              className={field}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelCls}>
              Description *
            </label>
            <textarea
              id="description"
              required
              minLength={10}
              maxLength={10000}
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A detailed description of the adventure…"
              className={`${field} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className={labelCls}>
                Location *
              </label>
              <input
                id="location"
                type="text"
                required
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Torres del Paine"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelCls}>
                Country *
              </label>
              <input
                id="country"
                type="text"
                required
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Chile"
                className={field}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="continent" className={labelCls}>
                Continent *
              </label>
              <select
                id="continent"
                value={form.continent}
                onChange={(e) => set("continent", e.target.value)}
                className={field}
              >
                {CONTINENTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="category" className={labelCls}>
                Category *
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={field}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="difficulty" className={labelCls}>
                Difficulty *
              </label>
              <select
                id="difficulty"
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className={field}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="durationDays" className={labelCls}>
                Duration (days) *
              </label>
              <input
                id="durationDays"
                type="number"
                required
                min={1}
                max={365}
                value={form.durationDays}
                onChange={(e) => set("durationDays", Number(e.target.value))}
                className={field}
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className={section}>
          <h2 className="font-display text-xs uppercase tracking-widest text-amber-500">Media</h2>

          <div>
            <label htmlFor="coverImageUrl" className={labelCls}>
              Cover Image URL *
            </label>
            <input
              id="coverImageUrl"
              type="url"
              required
              value={form.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              placeholder="https://images.unsplash.com/…"
              className={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="albumUrl" className={labelCls}>
                Album URL
              </label>
              <input
                id="albumUrl"
                type="url"
                value={form.albumUrl}
                onChange={(e) => set("albumUrl", e.target.value)}
                placeholder="https://photos.google.com/…"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="albumPlatform" className={labelCls}>
                Album Platform
              </label>
              <select
                id="albumPlatform"
                value={form.albumPlatform}
                onChange={(e) => set("albumPlatform", e.target.value)}
                className={field}
              >
                <option value="">None</option>
                <option value="google_photos">Google Photos</option>
                <option value="instagram">Instagram</option>
                <option value="flickr">Flickr</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="gpxTrackUrl" className={labelCls}>
              GPX Track URL
            </label>
            <input
              id="gpxTrackUrl"
              type="url"
              value={form.gpxTrackUrl}
              onChange={(e) => set("gpxTrackUrl", e.target.value)}
              placeholder="https://…/track.gpx"
              className={field}
            />
          </div>
        </div>

        {/* Details */}
        <div className={section}>
          <h2 className="font-display text-xs uppercase tracking-widest text-amber-500">Details</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="estimatedCost" className={labelCls}>
                Est. Cost (£)
              </label>
              <input
                id="estimatedCost"
                type="number"
                min={0}
                value={form.estimatedCost}
                onChange={(e) => set("estimatedCost", e.target.value)}
                placeholder="2500"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="latitude" className={labelCls}>
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                placeholder="-51.0"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="longitude" className={labelCls}>
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                placeholder="-73.0"
                className={field}
              />
            </div>
          </div>

          <div>
            <p className={groupLabel}>Best Months</p>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_NAMES.map((name, i) => {
                const m = i + 1;
                const active = form.bestMonths.includes(m);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`px-2 py-1 font-mono text-xs transition-colors ${active ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "border border-stone-800 text-stone-600 hover:text-stone-400"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={groupLabel}>Highlights</p>
            <ListInput
              value={form.highlights}
              onChange={(v) => set("highlights", v)}
              placeholder="Stunning views of the Torres"
            />
          </div>

          <div>
            <p className={groupLabel}>Gear List</p>
            <ListInput
              value={form.gear}
              onChange={(v) => set("gear", v)}
              placeholder="4-season sleeping bag"
              max={50}
            />
          </div>

          <div>
            <p className={groupLabel}>Tags</p>
            <TagInput value={form.tags} onChange={(v) => set("tags", v)} />
          </div>
        </div>

        {error && (
          <p className="border border-red-900 bg-red-950/40 px-4 py-3 font-mono text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit for Review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
