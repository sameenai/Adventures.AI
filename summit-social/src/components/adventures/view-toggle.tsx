"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ViewToggleProps {
  current: "grid" | "list";
}

export function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(view: "grid" | "list") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(`/adventures${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setView("grid")}
        aria-label="Grid view"
        className={`p-1.5 transition-colors ${current === "grid" ? "text-amber-500" : "text-stone-600 hover:text-stone-400"}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="1" y="1" width="6" height="6" rx="0.5" />
          <rect x="9" y="1" width="6" height="6" rx="0.5" />
          <rect x="1" y="9" width="6" height="6" rx="0.5" />
          <rect x="9" y="9" width="6" height="6" rx="0.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        aria-label="List view"
        className={`p-1.5 transition-colors ${current === "list" ? "text-amber-500" : "text-stone-600 hover:text-stone-400"}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="1" y="2" width="14" height="3" rx="0.5" />
          <rect x="1" y="6.5" width="14" height="3" rx="0.5" />
          <rect x="1" y="11" width="14" height="3" rx="0.5" />
        </svg>
      </button>
    </div>
  );
}
