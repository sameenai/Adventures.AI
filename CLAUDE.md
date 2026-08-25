# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Guidelines

When receiving a short or ambiguous request (e.g. a single word like "tui"), ask for clarification before taking action. Do not create files or start large tasks without understanding the intent.

## Project

**Basecamper** (basecamper.ai) — An automated tour and itinerary builder with social features. The main application lives in `summit-social/`, a Next.js 15 full-stack app.

All commands below should be run from `summit-social/`.

## Commands

### Development
```bash
# Prerequisites (macOS): brew install postgresql redis
make setup          # First-time setup: install deps, start Postgres/Redis, migrate DB, seed
make run            # Start Postgres/Redis + Next.js dev server
npm run dev         # Dev server only (requires Postgres + Redis already running)
```

### Testing
Unit and integration tests run **without any external services** — Prisma, Redis, OpenAI, and all external APIs are mocked at the module level. No Docker or running processes needed.

```bash
npm run test:unit          # Vitest unit tests (tests/unit/)
npm run test:integration   # Vitest integration tests (tests/integration/)
npm run test:db            # Real-services tier: live Postgres + Redis (races, cursors, limiter windows)
npx vitest run --coverage  # Full suite with v8 coverage report
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright e2e journeys, desktop + mobile viewports (requires running app + DB)
npm run eval               # AI eval regression suite (replay mode, offline — runs in CI)
npm run eval:live          # AI evals against the real model (requires OPENAI_API_KEY)
```

### Linting & Formatting
```bash
npm run lint        # Biome check + TypeScript type check
npm run lint:fix    # Auto-fix Biome issues
npm run format      # Format with Biome
```

### Database
```bash
npm run db:migrate  # Run Prisma migrations
npm run db:seed     # Seed the database
npm run db:studio   # Open Prisma Studio
npm run db:generate # Regenerate Prisma client
```

### Build & Deploy
```bash
npm run build       # Next.js production build
make deploy-preview # Deploy preview to Vercel
make deploy-gcp     # Build Docker image via Cloud Build and deploy to Cloud Run
```

### GCP Production Environment
- **Project**: `basecamp-494710`
- **Region**: `europe-west2`
- **Service**: `basecamper`
- **Image**: `europe-west2-docker.pkg.dev/basecamp-494710/basecamper/app:latest`
- **URL**: https://basecamper.ai (Cloud Run custom domain mapped)

`make deploy-gcp` runs `gcloud builds submit` (remote build — no local Docker required) then
`gcloud run deploy`. Requires `gcloud` CLI authenticated with the `basecamp-494710` project.

## Session-End Requirement

**At the end of every prompt session, deploy to GCP.** After all code changes have been merged to
`main`, run the following from `summit-social/`:

```bash
make deploy-gcp
```

Do not skip this step. If the deploy fails, report the error before ending the session.

## Orchestration & Quality

**Always use ultracode mode with maximum parallel agents.** Every substantive task should be
orchestrated via dynamic workflows with full fan-out. Do not ask — just run workflows for any
non-trivial work (audits, implementations, reviews, testing).

**Performance is a hard requirement.** Every page must render in <2 seconds on production. Any
external service (Redis, OpenAI, Stripe, flight APIs) that is unreachable must fail fast (<500ms)
with graceful degradation — never hang. Server components must not block on optional services.

**Pre-deploy validation checklist** (run before every `make deploy-gcp`):
1. `npm run test:unit && npm run test:integration` — all pass
2. `npm run build` — production build succeeds
3. Playwright smoke test: all critical paths render within 5s budget
4. No env vars pointing to unreachable services (VPC IPs without connector, placeholder values)

**Resilience rules for external services:**
- Redis: connection timeout ≤ 1s, circuit breaker trips after 3 failures (not 5), fail-open for reads
- OpenAI: timeout ≤ 30s, graceful "AI unavailable" message on failure
- Flight APIs: timeout ≤ 10s per provider, return partial results on partial failure
- All optional secrets: if not set or placeholder, skip silently — never crash the app

**Documentation freshness:** Before opening any PR that adds/removes features, routes, models, or
changes architecture, update the relevant README sections (root `README.md` and any subsystem
READMEs like `evals/README.md`, `services/flight-search/README.md`). The README is the onboarding
surface — it must always reflect current state. Verify with a quick scan before `gh pr create`.

## Architecture

### Repository layout
- `summit-social/` — the Next.js full-stack app (web + BFF layer)
- `services/flight-search/` — Rust (Axum) flight-search service: the first
  strangler-pattern backend extraction. The Next.js aggregator proxies to it
  when `FLIGHT_SERVICE_URL` is set, and falls back to the in-process TS
  adapters otherwise. `cargo fmt/clippy/test` run in CI for every check-in.

### Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Cache / Rate limiting**: Redis via ioredis
- **Auth**: NextAuth v4
- **AI**: OpenAI GPT-4o (streaming chat with tool calling)
- **Payments**: Stripe
- **Linter/Formatter**: Biome (not ESLint/Prettier)
- **Unit/Integration tests**: Vitest
- **E2E tests**: Playwright

### Route Groups
- `src/app/(auth)/` — Login and signup pages (unauthenticated)
- `src/app/(dashboard)/` — Main app pages with Navbar/Footer layout

### API Routes (`src/app/api/`)
All routes validate input with Zod schemas from `src/lib/validators/` and use `getServerSession` for auth. Rate limiting is applied via Redis on mutating endpoints.

Key routes:
- `api/chat` — Streaming OpenAI response; persists conversation history to `Itinerary.chatHistory` (JSON field)
- `api/adventures` — Cursor-based paginated list; sorted by `voteCount` (default), `newest`, or `duration`
- `api/flights` — Aggregates results from Amadeus and Skyscanner via `src/lib/flights/aggregator.ts`
- `api/webhooks/stripe` — Stripe webhook handler

### Shared Library (`src/lib/`)
- `ai/` — OpenAI client, system prompts, tool definitions, response parser
- `auth/config.ts` — NextAuth configuration
- `db/prisma.ts` — Prisma client singleton
- `db/redis.ts` — Redis client + `rateLimit()` helper
- `flights/` — Amadeus and Skyscanner adapters + aggregator
- `validators/` — Zod schemas for all API inputs
- `jobs/` — scheduled jobs (retention, cadence-scan) run via secret-gated `/api/jobs/[job]`
- `personalization/` — taste profile aggregation for the cadence engine
- `constants.ts` — Rate limit configs and other app-wide constants

### Data Model Highlights
- `Adventure` — User-submitted adventures with category, difficulty, geo data, votes, comments, tags
- `Itinerary` — AI-assisted trip plan with `chatHistory: Json`, linked `ItineraryDay[]` and `FlightBooking[]`
- `Vote` — Unique per (user, adventure); `voteCount` is a denormalized int on `Adventure`
- `Comment` — Threaded via self-referencing `parentId`

### Code Style
- Double quotes, 2-space indent, 100-char line width (Biome)
- `import type` required for type-only imports (`useImportType: error`)
- No `any` types (`noExplicitAny: error`)
- Path alias `@/` maps to `src/`

### Infrastructure
Local dev uses **Homebrew-managed Postgres and Redis** — no Docker required:
- `brew install postgresql redis` (one-time)
- `make setup` creates the `summit` role, `summitsocial` database, runs migrations and seeds
- `make run` / `npm run dev` starts services and the Next.js dev server

`docker-compose.optional.yml` exists as an alternative for CI or Docker-preference workflows.

Unit and integration tests mock all external services (Prisma, Redis, OpenAI, flight APIs) — no running processes needed for `npm run test:unit` or `npm run test:integration`.

## Git Workflow

**Never commit directly to `main`.** All changes must go through a branch → commit → PR flow:

1. `git checkout -b <branch-name>` from `main`
2. Make changes and commit on the branch
3. Push and open a PR via `gh pr create`
4. Merge the PR — never push directly to `main`

**Commits must be small and modular.** Each commit should represent one logical, self-contained change that is easy to review, test, and revert independently. Prefer more smaller commits over a single large one.

**Every commit message must follow Conventional Commits** — enforced automatically by the `commit-msg` hook:

```
<type>(<optional scope>): <short description in lower-case>

[optional body]
```

Allowed types: `feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `style` · `perf` · `ci` · `build` · `revert`

Examples:
- `feat(auth): add google oauth sign-in`
- `fix(flights): handle null body in skyscanner response`
- `test(chat): cover null-body reader edge case`
- `chore(deps): bump openai to 4.86.0`

**Git hooks run automatically** (Husky + lint-staged + commitlint):
- **pre-commit**: Biome auto-fix on staged `src/**/*.{ts,tsx}` files + `tsc --noEmit`
- **commit-msg**: commitlint enforces Conventional Commits format
- **pre-push**: `npm run test:unit && npm run test:integration` — push is blocked if tests fail

Do not bypass hooks with `--no-verify`. Fix the underlying issue instead.

**Run tests before opening a PR.** All unit and integration tests must pass locally (`npm run test:unit` and `npm run test:integration`) before a PR is created. New code must include tests, and overall coverage must remain high (target 95%+).

**After merging a PR**, delete the remote branch and sync local main: `gh pr merge <number> --squash --delete-branch && git checkout main && git pull`. Never push directly to `main` and then try to create a PR — always create a feature branch first.
