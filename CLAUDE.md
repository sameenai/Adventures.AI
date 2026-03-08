# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Adventures.AI** — An automated tour and itinerary builder with social features. The main application lives in `summit-social/`, a Next.js 15 full-stack app.

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
npx vitest run --coverage  # Full suite with v8 coverage report
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright e2e tests (requires running app + DB)
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
```

## Architecture

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

**Run tests before opening a PR.** All unit and integration tests must pass locally (`npm run test:unit` and `npm run test:integration`) before a PR is created. New code must include tests, and overall coverage must remain high (target 95%+).
