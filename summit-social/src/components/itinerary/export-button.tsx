"use client";

interface Activity {
  time?: string;
  activity?: string;
  location?: string;
  notes?: string;
}

interface Day {
  dayNumber: number;
  title: string;
  description?: string | null;
  activities: unknown;
}

interface ExportButtonProps {
  title: string;
  description?: string | null;
  days: Day[];
  travellers: number;
  budget?: number | null;
  status: string;
}

function buildMarkdown({
  title,
  description,
  days,
  travellers,
  budget,
  status,
}: ExportButtonProps): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  if (description) {
    lines.push(description);
    lines.push("");
  }

  const meta: string[] = [];
  meta.push(`${days.length} ${days.length === 1 ? "day" : "days"}`);
  if (travellers > 1) meta.push(`${travellers} travellers`);
  if (budget) meta.push(`~£${budget.toLocaleString()} budget`);
  meta.push(status.toLowerCase());
  lines.push(`**${meta.join(" · ")}**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const day of days) {
    lines.push(`## Day ${day.dayNumber}: ${day.title}`);
    if (day.description) {
      lines.push("");
      lines.push(day.description);
    }
    const activities = Array.isArray(day.activities) ? (day.activities as Activity[]) : [];
    if (activities.length > 0) {
      lines.push("");
      for (const act of activities) {
        const time = act.time ? `**${act.time}** ` : "";
        const loc = act.location ? ` · ${act.location}` : "";
        const notes = act.notes ? `\n  > ${act.notes}` : "";
        lines.push(`- ${time}${act.activity ?? ""}${loc}${notes}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function ExportButton(props: ExportButtonProps) {
  const handleExport = () => {
    const md = buildMarkdown(props);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${props.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="border border-stone-700 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
    >
      Export .md
    </button>
  );
}
