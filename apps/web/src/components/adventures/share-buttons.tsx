"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-stone-600">Share</span>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-200"
        aria-label="Share on X"
      >
        {/* X (Twitter) icon */}
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 border border-stone-800 px-3 py-1.5 font-mono text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-200"
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 fill-none stroke-current stroke-2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 fill-none stroke-current stroke-2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
