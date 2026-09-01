/**
 * Content-Security-Policy with per-request script nonces. `strict-dynamic`
 * lets the nonced Next.js bootstrap load its own chunks while everything
 * else — injected tags included — is refused, which is the actual XSS
 * defence `unsafe-inline` never gave us. Styles keep `unsafe-inline`
 * (Tailwind and Next's style tags don't carry nonces); scripts are where
 * injection becomes execution.
 *
 * Dev keeps `unsafe-eval` because React Refresh needs it; production never
 * ships it.
 */
export function buildCsp(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com https://upload.wikimedia.org https://api.dicebear.com https://unpkg.com https://*.tile.openstreetmap.org https://api.mapbox.com https://events.mapbox.com",
    "connect-src 'self' https://api.stripe.com https://api.mapbox.com https://events.mapbox.com https://*.tile.openstreetmap.org",
    "worker-src blob:",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
