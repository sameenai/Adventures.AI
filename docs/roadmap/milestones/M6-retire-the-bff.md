# M6 — Retire the TypeScript backend

**Goal.** Delete the Next.js API layer. This is where the complexity actually
finishes moving to the backend, and where the debt is paid rather than accumulated.

## Why this milestone must happen

A strangler migration that never removes the strangled system is just two systems.
Every milestone up to here has *added* a Rust implementation while leaving the
TypeScript one in place as a fallback. M6 is the milestone that collects.

If M6 keeps slipping, the programme has failed even if every other milestone
shipped — that is the honest failure mode of this pattern and it should be said out
loud rather than discovered in a year.

## Scope

- **Delete** `apps/web/src/app/api/**` and `apps/web/src/lib/**` server code
  once each route has been served by Rust with the fallback unused for 7 days.
- **Retire the fallbacks.** The `*_SERVICE_URL` opt-in flags and their in-process
  fallbacks come out; the Rust services become the only implementation.
- **`apps/web/` becomes `apps/legacy-web/`** or is deleted outright if
  `apps/web` plus the SEO surface fully covers it.
- **Jobs move in-process.** The secret-gated `/api/jobs/[job]` endpoints become a
  tokio scheduler inside the Rust core; `JobRun` records continue unchanged.
- **Media moves out of Postgres.** See `DEBT-004` — cover images become object
  storage behind a CDN, with the database keeping only metadata.
- **Prisma retires.** `sqlx` migrations become the single migration path; the
  existing migration history is preserved, not squashed.

## Exit criteria

- [ ] No TypeScript file makes a database query
- [ ] No `*_SERVICE_URL` fallback remains in any code path
- [ ] Cover images served from object storage; `CoverImage.data` dropped
- [ ] One migration tool, one migration history
- [ ] Total dependency count down, not up, versus M0

## Risks

**Never finishing.** Mitigated by making each removal a milestone exit criterion
rather than a follow-up ticket, and by the 7-day fallback-unused rule being a
measurement rather than an opinion.

## Features

`RET-001` · `RET-002` · `RET-004` · `CONT-002` · `CONT-004` · `PLAT-004`
