interface SocialLinksProps {
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
}

export function SocialLinks({ instagramUrl, twitterUrl, websiteUrl }: SocialLinksProps) {
  const links = [
    instagramUrl && { label: "Instagram", href: instagramUrl },
    twitterUrl && { label: "Twitter", href: twitterUrl },
    websiteUrl && { label: "Website", href: websiteUrl },
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
