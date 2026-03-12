"use client";

import { Button } from "@/components/ui/button";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import type { Adventure, Tag } from "@prisma/client";
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

interface AdventureEditFormProps {
  adventure: Adventure & { tags: Pick<Tag, "name">[] };
}

export function AdventureEditForm({ adventure }: AdventureEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: adventure.title,
    description: adventure.description,
    location: adventure.location,
    country: adventure.country,
    continent: adventure.continent,
    category: adventure.category as string,
    difficulty: adventure.difficulty as string,
    durationDays: adventure.durationDays,
    coverImageUrl: adventure.coverImageUrl,
    albumUrl: adventure.albumUrl ?? "",
    albumPlatform: (adventure.albumPlatform ?? "") as string,
    estimatedCost: adventure.estimatedCost ?? ("" as string | number),
    gpxTrackUrl: adventure.gpxTrackUrl ?? "",
    latitude: adventure.latitude ?? ("" as string | number),
    longitude: adventure.longitude ?? ("" as string | number),
    highlights: adventure.highlights as string[],
    gear: adventure.gear as string[],
    bestMonths: adventure.bestMonths as number[],
    tags: adventure.tags.map((t) => t.name),
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
      const res = await fetch(`/api/adventures/${adventure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save changes.");
        return;
      }
      router.push(`/adventures/${adventure.id}`);
      router.refresh();
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
  const sectionCls = "space-y-5 border border-stone-800 p-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className={sectionCls}>
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
      <div className={sectionCls}>
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
            className={field}
          />
        </div>
      </div>

      {/* Details */}
      <div className={sectionCls}>
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
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
