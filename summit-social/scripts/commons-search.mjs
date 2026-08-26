#!/usr/bin/env node
/**
 * Content-ops helper: search Wikimedia Commons for cover-photo candidates.
 *
 *   node scripts/commons-search.mjs "torres del paine towers" [limit]
 *
 * Prints JSON candidates: { title, width, height, url (1600px thumb),
 * license, artist, sourceUrl }. Filters to real photographs — bitmap files
 * large enough for the hero (width >= 1200), skipping maps/diagrams/flags/
 * charts by title, and non-reusable licenses. The chosen url/license/artist/
 * sourceUrl feed an adventure's coverImageUrl + imageAttribution.
 *
 * Read-only against the public API; used at content-authoring time, never at
 * runtime.
 */

const query = process.argv[2];
const limit = Math.min(Number(process.argv[3] ?? 10), 20);
if (!query) {
  console.error('usage: node scripts/commons-search.mjs "<query>" [limit]');
  process.exit(1);
}

const BLOCKED_TITLE = /map|diagram|chart|logo|flag|coat of arms|locator|\.svg$|\.png$|\.gif$|graph|plan\b|screenshot/i;
const ALLOWED_LICENSE = /^(cc0|cc[ -]by(?:[ -]sa)?(?:[ -]\d\.\d)?|public domain|pd)/i;

const params = new URLSearchParams({
  action: "query",
  generator: "search",
  gsrsearch: `${query} filetype:bitmap`,
  gsrnamespace: "6",
  gsrlimit: String(limit * 2),
  prop: "imageinfo",
  iiprop: "url|size|extmetadata",
  iiurlwidth: "1600",
  format: "json",
  maxlag: "5",
});

const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
  headers: { "User-Agent": "BasecamperContentOps/1.0 (catalog curation; run by maintainers)" },
});
if (!res.ok) {
  console.error(`commons api ${res.status}`);
  process.exit(2);
}
const data = await res.json();

const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, "").trim();

const candidates = Object.values(data.query?.pages ?? {})
  .map((p) => {
    const ii = p.imageinfo?.[0];
    if (!ii) return null;
    const meta = ii.extmetadata ?? {};
    return {
      title: p.title,
      width: ii.width,
      height: ii.height,
      url: (ii.thumburl ?? "").split("?")[0],
      license: strip(meta.LicenseShortName?.value),
      artist: strip(meta.Artist?.value).slice(0, 80),
      sourceUrl: ii.descriptionurl,
      description: strip(meta.ImageDescription?.value).slice(0, 160),
    };
  })
  .filter(
    (c) =>
      c &&
      c.width >= 1200 &&
      c.url &&
      !BLOCKED_TITLE.test(c.title) &&
      c.artist &&
      ALLOWED_LICENSE.test(c.license),
  )
  .sort((a, b) => (b.width >= b.height ? 1 : 0) - (a.width >= a.height ? 1 : 0))
  .slice(0, limit);

console.log(JSON.stringify(candidates, null, 1));
