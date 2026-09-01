# Technical debt register

Debt with an owner, a trigger and a milestone. Items without those three things are
complaints, not debt, and do not belong here.

## Findings from the September 2026 sweep

The sweep was mechanical — unreferenced components, unused library exports, uncalled
API routes, declared-but-unimported dependencies, environment variables plumbed but
never read — then every hit was verified by hand.

**The codebase is unusually clean.** 51 components, 42 API routes and roughly 4,100
lines of shared library code produced three genuine items. Most of what the scan
flagged was module-internal usage it could not see. That is worth stating plainly:
there is no dead-code problem here to fix, and the re-platform should not be sold on
one.

| ID | Item | Severity | Trigger | Milestone |
| --- | --- | --- | --- | --- |
| `DEBT-001` | Three unused constants: `PAGINATION_DEFAULT_LIMIT`, `PAGINATION_MAX_LIMIT`, `UPLOAD_MAX_SIZE_BYTES` | trivial | Delete on sight | M0 |
| `DEBT-002` | `@stripe/stripe-js` declared but never imported — checkout is redirect-based and does not need the client SDK | low | Removes a dependency and its supply-chain surface | M0 |
| `DEBT-003` | `NEXT_PUBLIC_MAPBOX_TOKEN` plumbed through `Dockerfile` and `.env.example` but read nowhere; the map uses Leaflet with OSM tiles | low | Dead build-arg wiring; misleads anyone configuring an environment | M0 |
| `DEBT-004` | Cover images stored as `bytea` in Postgres | **high** | Any of: database > 20 GB, backup/restore time over an hour, or image traffic affecting query latency | M6 |
| `DEBT-005` | Feed is fan-out-on-read | low | Feed p95 over 300 ms, or a user following more than ~500 accounts | after M3, on evidence |
| `DEBT-006` | Catalogue search is SQL `LIKE` | medium | Search p95 over 200 ms, or measurable relevance complaints | M2 |
| `DEBT-007` | Two migration tools during the transition (Prisma and sqlx) | medium | Inherent to the migration; ends when the last TypeScript query goes | M6 |
| `DEBT-008` | Two implementations of every migrated domain while a fallback stands | medium | Fallback unused in production for 7 days | M6 |

## The two that actually matter

**`DEBT-004` — images in Postgres.** PR #119 put cover images in a `bytea` column to
stop Wikimedia rate-limiting breaking images in production. That was the right call
for a live incident: it is simple, it removed a third-party dependency from the
render path, and it shipped. It is also not where binaries belong at scale — blobs
inflate backups and WAL, and serving them consumes database connections that queries
need. The fix is object storage behind a CDN with the database keeping metadata, and
it is scheduled rather than urgent because the current size is small and the triggers
above will fire long before it hurts.

**`DEBT-008` — two implementations.** This is the debt the strangler pattern *creates*
on purpose, and it is only virtuous if it is paid. Every milestone up to M6 adds a
Rust implementation while keeping the TypeScript one as a fallback. M6 is the
collection, which is why its exit criteria are removals rather than additions.

If M6 slips repeatedly, the programme has failed even if everything else shipped.
That is the honest failure mode of this pattern and it is written here so it is
noticed early rather than discovered in a year.

## Debt this register deliberately does not carry

Things that look like debt and are not:

- **The denormalised `voteCount`.** A deliberate trade for the default sort, with a
  compound index behind it and a real-database race test. Correct as built.
- **`unsafe-inline` on styles in the CSP.** Scripts carry nonces; styles cannot,
  because Tailwind and Next's style tags do not. Injection becomes execution in
  scripts, not styles. Considered and accepted.
- **The `withApi()` exceptions.** Streaming chat and the Stripe webhook stay
  hand-rolled because their lifecycles genuinely do not fit a JSON envelope. Forcing
  them in would make the abstraction lie.

## Reviewing this register

Every milestone exit includes a debt review: close what the milestone paid, re-check
whether any trigger has fired, and add anything the milestone knowingly took on. Debt
taken on deliberately is fine; debt taken on silently is how a codebase rots.
