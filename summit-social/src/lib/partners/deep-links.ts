// Pure helpers that build pre-filled partner deep links for an adventure.
// No fabricated data: links only carry what we actually know (location,
// country, best-season departure date), and the Skyscanner link is omitted
// entirely unless the caller supplies a real origin airport code.

const FALLBACK_DAYS_OUT = 60;

export interface PartnerLinkAdventure {
  location: string;
  country: string;
  bestMonths: number[];
  durationDays: number;
}

export interface PartnerLinkOptions {
  /** IATA code of the traveller's departure airport, when actually known. */
  origin?: string;
  /** Traveller count; defaults to 1. */
  pax?: number;
  /** Departure override; defaults to nextBestDeparture(adventure.bestMonths). */
  departure?: Date;
}

export interface PartnerLink {
  label: string;
  href: string;
  note: string;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Skyscanner path dates are yymmdd. */
function skyscannerDate(date: Date): string {
  return isoDate(date).slice(2).replaceAll("-", "");
}

/**
 * First day of the next occurrence of the soonest best month, strictly after
 * `from`. When no best months are known, fall back to 60 days out.
 */
export function nextBestDeparture(bestMonths: number[], from: Date = new Date()): Date {
  const validMonths = bestMonths.filter((m) => Number.isInteger(m) && m >= 1 && m <= 12);
  if (validMonths.length === 0) {
    return new Date(from.getFullYear(), from.getMonth(), from.getDate() + FALLBACK_DAYS_OUT);
  }

  const candidateFor = (month: number): Date => {
    const thisYear = new Date(from.getFullYear(), month - 1, 1);
    return thisYear > from ? thisYear : new Date(from.getFullYear() + 1, month - 1, 1);
  };

  let soonest = candidateFor(validMonths[0]);
  for (const month of validMonths.slice(1)) {
    const candidate = candidateFor(month);
    if (candidate < soonest) soonest = candidate;
  }
  return soonest;
}

/** Human-readable departure ("1 March 2027") for honest prefill labelling. */
export function formatDepartureLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Pre-filled partner search links for an adventure. Every URL carries the
 * best-season departure date where the partner supports one; everything
 * user-controlled is URI-encoded.
 */
export function partnerLinks(
  adventure: PartnerLinkAdventure,
  opts: PartnerLinkOptions = {},
): PartnerLink[] {
  const departure = opts.departure ?? nextBestDeparture(adventure.bestMonths);
  const date = isoDate(departure);
  const destination = encodeURIComponent(`${adventure.location} ${adventure.country}`);
  const links: PartnerLink[] = [];

  // Flights need a real origin airport — never fabricate one. Without an
  // origin the Skyscanner link is omitted rather than guessed.
  if (opts.origin) {
    const origin = opts.origin.trim();
    links.push({
      label: "Flights — Explore",
      href: `https://www.skyscanner.net/transport/flights/${encodeURIComponent(origin.toLowerCase())}/everywhere/${skyscannerDate(departure)}/`,
      note: `Everywhere search from ${origin.toUpperCase()} via Skyscanner`,
    });
  }

  links.push(
    {
      label: "Activities",
      href: `https://www.getyourguide.com/s/?q=${destination}&date_from=${date}`,
      note: `Day trips & local activities in ${adventure.location} via GetYourGuide`,
    },
    {
      label: "Guided Tours",
      href: `https://www.viator.com/searchResults/all?text=${destination}`,
      note: "Tour operators & guided experiences via Viator",
    },
    {
      label: "Flights",
      href: `https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(adventure.location)}%20on%20${date}`,
      note: `Flights to ${adventure.location} via Google Flights`,
    },
  );

  return links;
}

/**
 * Fill an operator's booking URL template: `{date}` becomes YYYY-MM-DD and
 * `{pax}` the traveller count. Returns the filled URL only when it parses as
 * http(s) — anything else (javascript:, data:, relative paths) returns null.
 */
export function operatorBookingUrl(template: string, departure: Date, pax: number): string | null {
  const filled = template
    .replaceAll("{date}", isoDate(departure))
    .replaceAll("{pax}", String(Math.max(1, Math.trunc(pax))));
  try {
    const url = new URL(filled);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return filled;
}
