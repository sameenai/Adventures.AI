import Link from "next/link";

interface ApiKeyCalloutProps {
  title: string;
  description: string;
  className?: string;
}

export function ApiKeyCallout({ title, description, className = "" }: ApiKeyCalloutProps) {
  return (
    <div className={`border border-amber-500/60 bg-amber-500/5 p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-amber-500">{title}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">{description}</p>
        </div>
        <Link
          href="/profile/edit#api-key"
          className="shrink-0 border border-amber-500 bg-amber-500 px-4 py-2 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
        >
          Add API Key
        </Link>
      </div>
    </div>
  );
}
