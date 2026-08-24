interface SocialLinksProps {
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
}

/** Render-time defence in depth: only http(s) URLs may become links. */
function safeHref(url?: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export function SocialLinks({ instagramUrl, twitterUrl, websiteUrl }: SocialLinksProps) {
  const links = [
    safeHref(instagramUrl) && { label: "Instagram", href: safeHref(instagramUrl) },
    safeHref(twitterUrl) && { label: "Twitter", href: safeHref(twitterUrl) },
    safeHref(websiteUrl) && { label: "Website", href: safeHref(websiteUrl) },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  if (links.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-amber-500 hover:text-amber-400"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
