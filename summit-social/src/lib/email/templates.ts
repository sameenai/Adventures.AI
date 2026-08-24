/**
 * Transactional email templates. Inline styles only (email clients ignore
 * stylesheets); every user-controlled string is HTML-escaped before
 * interpolation. Marketing mail (trip-due) always carries the one-tap
 * unsubscribe link; booking confirmations are transactional.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const WRAP_TOP = `<div style="background:#0c0a09;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#d6d3d1;">
<div style="max-width:560px;margin:0 auto;">
<p style="letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;font-size:14px;font-weight:bold;margin:0 0 24px;">Basecamper</p>`;

const WRAP_BOTTOM = "</div></div>";

function footer(unsubscribeUrl?: string): string {
  const unsub = unsubscribeUrl
    ? `<p style="font-size:11px;color:#57534e;margin:24px 0 0;">You're receiving this because you turned on trip reminders. <a href="${unsubscribeUrl}" style="color:#78716c;">Unsubscribe with one tap</a>.</p>`
    : "";
  return `<hr style="border:none;border-top:1px solid #292524;margin:32px 0 0;" />${unsub}<p style="font-size:11px;color:#57534e;margin:8px 0 0;">Basecamper · basecamper.ai</p>`;
}

export interface TripDueRecommendation {
  title: string;
  location: string;
  country: string;
  url: string;
}

export function tripDueEmail(input: {
  name: string | null;
  monthLabel: string;
  recommendations: TripDueRecommendation[];
  nextTripUrl: string;
  unsubscribeUrl: string;
}): EmailContent {
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}` : "Hi";
  const items = input.recommendations
    .map(
      (r) =>
        `<li style="margin:0 0 12px;"><a href="${r.url}" style="color:#f59e0b;font-size:15px;">${escapeHtml(
          r.title,
        )}</a><br /><span style="color:#a8a29e;font-size:13px;">${escapeHtml(r.location)} · ${escapeHtml(
          r.country,
        )}</span></li>`,
    )
    .join("");

  const textItems = input.recommendations
    .map((r) => `- ${r.title} (${r.location}, ${r.country}) → ${r.url}`)
    .join("\n");

  return {
    subject: `Your next trip window opens in ${input.monthLabel}`,
    html: `${WRAP_TOP}
<h1 style="font-size:22px;color:#fafaf9;margin:0 0 8px;">Your next adventure window opens in ${escapeHtml(input.monthLabel)}</h1>
<p style="font-size:14px;line-height:1.6;margin:0 0 24px;">${greeting} — based on your travel rhythm and what you've saved, it's time to start planning. These fit the season:</p>
<ul style="list-style:none;padding:0;margin:0 0 24px;">${items}</ul>
<p style="margin:0 0 8px;"><a href="${input.nextTripUrl}" style="display:inline-block;background:#f59e0b;color:#1c1917;padding:12px 24px;font-size:14px;font-weight:bold;text-decoration:none;">Plan your next trip</a></p>
${footer(input.unsubscribeUrl)}${WRAP_BOTTOM}`,
    text: `Your next adventure window opens in ${input.monthLabel}\n\n${greeting} — based on your travel rhythm and what you've saved, these fit the season:\n\n${textItems}\n\nPlan your next trip: ${input.nextTripUrl}\n\nUnsubscribe: ${input.unsubscribeUrl}`,
  };
}

export function bookingConfirmedEmail(input: {
  name: string | null;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: Date;
  priceGBP: number;
  itineraryUrl: string;
}): EmailContent {
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}` : "Hi";
  const when = input.departureAt.toISOString().slice(0, 16).replace("T", " at ");
  const price = `£${(input.priceGBP / 100).toFixed(2)}`;
  const route = `${escapeHtml(input.origin)} → ${escapeHtml(input.destination)}`;

  return {
    subject: `Payment received — ${input.origin} → ${input.destination} on ${escapeHtml(input.airline)}`,
    html: `${WRAP_TOP}
<h1 style="font-size:22px;color:#fafaf9;margin:0 0 8px;">Payment received</h1>
<p style="font-size:14px;line-height:1.6;margin:0 0 24px;">${greeting} — your payment for this flight is confirmed:</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px;">
<tr><td style="padding:6px 0;color:#a8a29e;">Route</td><td style="padding:6px 0;color:#fafaf9;">${route}</td></tr>
<tr><td style="padding:6px 0;color:#a8a29e;">Flight</td><td style="padding:6px 0;color:#fafaf9;">${escapeHtml(input.airline)} ${escapeHtml(input.flightNumber)}</td></tr>
<tr><td style="padding:6px 0;color:#a8a29e;">Departs</td><td style="padding:6px 0;color:#fafaf9;">${when} UTC</td></tr>
<tr><td style="padding:6px 0;color:#a8a29e;">Amount</td><td style="padding:6px 0;color:#fafaf9;">${price}</td></tr>
</table>
<p style="font-size:13px;color:#a8a29e;line-height:1.6;margin:0 0 24px;">Ticketing is completed by the airline or agent; you'll be contacted if anything else is needed. Your itinerary has been updated.</p>
<p style="margin:0 0 8px;"><a href="${input.itineraryUrl}" style="display:inline-block;background:#f59e0b;color:#1c1917;padding:12px 24px;font-size:14px;font-weight:bold;text-decoration:none;">View your trip</a></p>
${footer()}${WRAP_BOTTOM}`,
    text: `Payment received\n\n${greeting} — your payment for this flight is confirmed:\n\nRoute: ${input.origin} → ${input.destination}\nFlight: ${input.airline} ${input.flightNumber}\nDeparts: ${when} UTC\nAmount: ${price}\n\nTicketing is completed by the airline or agent; you'll be contacted if anything else is needed.\n\nView your trip: ${input.itineraryUrl}`,
  };
}
