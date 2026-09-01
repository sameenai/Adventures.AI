# M2 — Catalogue in Rust, React on the web

**Goal.** The highest-traffic read path served by Rust, and the first React client
consuming it through the generated contract.

## Why the catalogue first

It is the safest possible real domain: read-only, cacheable, no user data, no money,
and it carries the most traffic — so any performance claim about Rust is proven or
disproven immediately. If the extraction is wrong, the worst case is a browse page
falling back to the existing implementation.

## Scope

- **`catalog` service** — list, detail, search, filters, geo viewport, leaderboard,
  trending. Keyset pagination preserved exactly; the `(voteCount desc, id)` index is
  the contract.
- **Strangler switch.** The Next.js routes proxy to Rust behind `CATALOG_SERVICE_URL`
  and fall back in-process on any failure, exactly as flights already do.
- **`apps/web`** — React 19 + Vite + TanStack Router and Query against `packages/api-client`.
  Ships the authenticated application only.
- **Public SEO surface** stays server-rendered — see [ADR-0004](../../adr/0004-public-seo-surface.md).
  This is the constraint that shapes the whole client split, and it is not negotiable
  for a discovery product with 1,000 indexable pages.

## Exit criteria

- [ ] Catalogue reads served by Rust for 100% of traffic, fallback unused for 7 days
- [ ] `apps/web` reaches feature parity for browse, detail, search, map, leaderboard
- [ ] Adventure detail pages remain server-rendered and indexable; no regression in crawlable URLs
- [ ] p95 catalogue list latency at or below the current TypeScript implementation
- [ ] Photo attribution renders wherever an image renders

## Risks

**SEO regression is the programme's biggest single risk.** A discovery product that
stops being crawlable loses its acquisition channel, and the damage is slow and
hard to attribute. Mitigation: the public surface never becomes a client-rendered
SPA, and a crawl check runs in CI comparing indexable URLs before and after.

## Features

`DISC-001` · `DISC-002` · `DISC-003` · `DISC-005` · `DISC-006` · `DISC-007` · `TRIP-002` · `TRIP-005` · `CONT-001` · `CONT-003`
