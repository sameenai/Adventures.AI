# Basecamper

AI-powered expedition planning and social discovery platform. Discover world-class adventure routes, plan trips with an AI assistant, compare flights across providers, and share your journeys with a community of serious adventurers.

**Live at [basecamper.ai](https://basecamper.ai)**

---

## Repository Structure

```
.
├── summit-social/              # Next.js 15 full-stack web application
├── services/flight-search/     # Rust (Axum) flight-search microservice
├── .github/workflows/          # CI (lint, test, deploy) + eval pipelines
└── CLAUDE.md                   # AI coding assistant instructions
```

| Service | Language | Purpose |
|---------|----------|---------|
| `summit-social/` | TypeScript | Main app — UI, API, AI chat, payments |
| `services/flight-search/` | Rust | Amadeus + Skyscanner flight aggregation (strangler extraction) |

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | `brew install node` |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Redis | 7 | `brew install redis` |

**No Docker required.** Local dev uses Homebrew-managed services.

### Setup

```bash
cd summit-social
make setup    # Install deps, start Postgres/Redis, create DB, migrate, seed
make run      # Start dev server at http://localhost:3000
```

### Local Sign-In

No OAuth keys needed. On the login page, use the **Local Dev** form:
- **Email**: any address (creates account on the fly)
- **Password**: `dev`

Seeded users: `alex@basecamper.ai`, `maya@basecamper.ai`, `james@basecamper.ai`

---

## Environment Variables

`make setup` generates `.env` from `.env.example` automatically.

### Required

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://summit:summit@localhost:5432/summitsocial` | Postgres connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis for caching + rate limiting |
| `NEXTAUTH_SECRET` | Auto-generated | Session encryption key |
| `NEXTAUTH_URL` | `http://localhost:3000` | Canonical app URL |

### Optional (graceful degradation when absent)

| Variable | Fallback |
|----------|----------|
| `OPENAI_API_KEY` | Streams mock itinerary response |
| `AMADEUS_CLIENT_ID/SECRET` | Returns mock flight offers |
| `SKYSCANNER_API_KEY` | Returns mock flight offers |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth button hidden; use local dev login |
| `GITHUB_CLIENT_ID/SECRET` | OAuth button hidden; use local dev login |
| `STRIPE_SECRET_KEY` | Pro upgrade disabled |
| `ENCRYPTION_KEY` | BYOK key storage disabled |

---

## Commands Reference

All commands run from `summit-social/`.

### Development

```bash
make run              # Start Postgres + Redis + Next.js dev server
npm run dev           # Dev server only (requires services running)
npm run db:studio     # Prisma Studio at http://localhost:5555
npm run db:migrate    # Run pending migrations
npm run db:seed       # Seed sample data (1000 adventures, 3 users)
```

### Testing

```bash
npm run test:unit          # Vitest unit tests (tests/unit/) — no services needed
npm run test:integration   # Vitest integration tests (tests/integration/)
npm run test:db            # Real-service tier: live Postgres + Redis
npm run test:e2e           # Playwright e2e — desktop + mobile viewports
npm run eval               # AI eval regression suite (offline replay)
npm run eval:live          # AI evals against live model (requires OPENAI_API_KEY)
npx vitest run --coverage  # Full suite with v8 coverage
```

### Lint & Format

```bash
npm run lint          # Biome check + TypeScript type check
npm run lint:fix      # Auto-fix
npm run format        # Biome format
```

### Deploy

```bash
make deploy-gcp       # Cloud Build → migrate → deploy to Cloud Run
```

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC, Streaming) |
| Database | PostgreSQL 16 via Prisma ORM |
| Cache / Rate limiting | Redis 7 via ioredis (circuit breaker, fail-open) |
| Auth | NextAuth v4 (Google, GitHub, Credentials for dev) |
| AI | OpenAI GPT-4o (streaming chat + tool calling) |
| Payments | Stripe (subscriptions, webhooks) |
| Flights | Amadeus + Skyscanner aggregation |
| Linter / Formatter | Biome |
| Unit / Integration | Vitest |
| E2E | Playwright (desktop + mobile) |
| AI Evals | Custom replay + live grading framework |
| Styling | Tailwind CSS v4 (amber/stone dark theme) |
| Fonts | Cormorant Garamond (display), Inter (body), Space Mono (code) |

### Directory Layout

```
summit-social/src/
├── app/
│   ├── (auth)/                 # Login, signup (unauthenticated)
│   ├── (dashboard)/            # Main app pages with nav/footer
│   │   ├── adventures/         # Browse, filter, detail, create
│   │   ├── itinerary/          # AI chat planner
│   │   ├── leaderboard/        # Top adventurers
│   │   ├── explore/            # Map view
│   │   ├── flights/            # Flight search
│   │   ├── collections/        # User collections
│   │   ├── next-trip/          # Cadence-driven suggestions
│   │   └── profile/            # User profiles, settings
│   └── api/                    # API routes (Zod-validated, rate-limited)
├── components/
│   ├── ui/                     # Primitives (Button, Card, Input, Modal)
│   ├── shared/                 # Navbar, Footer
│   ├── adventures/             # AdventureCard, VoteButton, BookmarkButton
│   ├── chat/                   # ChatWindow, MessageBubble
│   └── flights/                # FlightCard, SearchForm
├── hooks/                      # useChat, useFlightSearch, useVote, useInfiniteScroll
├── lib/
│   ├── ai/                     # OpenAI client, prompts, tools, chat-service
│   ├── auth/                   # NextAuth config
│   ├── db/                     # Prisma client, Redis (circuit breaker + rate limiter)
│   ├── flights/                # Amadeus + Skyscanner adapters, aggregator
│   ├── validators/             # Zod schemas for all API inputs
│   ├── jobs/                   # Scheduled jobs (retention, cadence)
│   ├── personalization/        # Taste profile aggregation
│   ├── adventures/             # Query builders (cursor pagination, filters)
│   ├── env.ts                  # Startup env validation (fail-fast)
│   ├── logger.ts               # Structured logging
│   └── constants.ts            # App-wide constants, categories, difficulties
└── middleware.ts               # Request logging, auth checks
```

### Key Data Flows

| Flow | Path |
|------|------|
| **Adventures** | RSC pages → Prisma queries → Redis cache → rendered cards |
| **AI Chat** | Client SSE → `/api/chat` → OpenAI streaming + tool calling → `Itinerary.chatHistory` |
| **Flights** | `/api/flights` → Amadeus + Skyscanner in parallel → Redis cache (15 min) |
| **Cadence** | Scheduled job → taste profile aggregation → personalized "Next Trip" suggestions |
| **Votes** | Optimistic UI → `/api/adventures/[id]/vote` → atomic Vote row + denormalized count |

### API Routes

All routes use Zod validation + `getServerSession` auth. Mutating endpoints are rate-limited via Redis.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/adventures` | GET | Cursor-paginated list with filters |
| `/api/adventures/[id]` | GET/PATCH/DELETE | Adventure CRUD |
| `/api/adventures/[id]/vote` | POST | Toggle vote |
| `/api/adventures/[id]/bookmark` | POST | Toggle bookmark |
| `/api/chat` | POST | Streaming AI itinerary planner |
| `/api/flights` | GET | Aggregated flight search |
| `/api/itineraries/[id]` | GET/PATCH | Itinerary management |
| `/api/user/openai-key` | GET/PUT/DELETE | BYOK key storage (encrypted) |
| `/api/webhooks/stripe` | POST | Subscription events |
| `/api/jobs/[job]` | POST | Secret-gated scheduled jobs |

---

## Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| **User** | email, name, bio, avatarUrl, tier | Adventures, Votes, Bookmarks, Itineraries, Collections |
| **Adventure** | title, location, country, category, difficulty, durationDays, voteCount | User (author), Votes, Comments, Tags, Bookmarks |
| **Itinerary** | title, destination, chatHistory (JSON), status | User, ItineraryDays, FlightBookings |
| **ItineraryDay** | dayNumber, title, description, activities | Itinerary |
| **Vote** | userId + adventureId (unique) | User, Adventure |
| **Comment** | content, parentId (threaded) | User, Adventure |
| **Tag** | name (unique) | Adventures (many-to-many) |
| **Collection** | name, description | User, Adventures |
| **FlightBooking** | origin, destination, outboundDate, provider | Itinerary |
| **TasteProfile** | userId, preferredCategories, climate, pace | User |
| **Notification** | type, title, read | User |

---

## Testing Strategy

| Tier | Scope | External Services | Speed |
|------|-------|------------------|-------|
| **Unit** (`tests/unit/`) | Components, hooks, validators, utils, parsers | All mocked | ~5s |
| **Integration** (`tests/integration/`) | API routes end-to-end, auth flows | Prisma + Redis mocked | ~15s |
| **DB** (`tests/db/`) | Pagination, concurrency, rate-limit windows | Live Postgres + Redis | ~30s |
| **E2E** (`tests/e2e/`) | User journeys, a11y, performance | Running app + DB | ~60s |
| **Evals** (`evals/`) | AI response quality, grounding, tool use | Replay or live OpenAI | ~120s |

**Coverage target: 95%+ statements.**

Key patterns:
- Unit/integration tests need NO running services — everything is mocked
- `vi.mock("@/lib/db/prisma")` for database, `vi.mock("@/lib/db/redis")` for cache
- Component tests use `// @vitest-environment jsdom` docblock
- Playwright runs desktop (Chrome) + mobile (Pixel 7) viewports
- AI evals replay saved transcripts for deterministic regression, or hit live model for drift detection

---

## Deployment

### Production: GCP Cloud Run

| Resource | Value |
|----------|-------|
| Project | `basecamp-494710` |
| Region | `europe-west2` |
| Service | `basecamper` |
| URL | https://basecamper.ai |
| Database | Cloud SQL PostgreSQL (private IP) |
| Secrets | GCP Secret Manager |

```bash
cd summit-social
make deploy-gcp
```

This command:
1. Builds `:latest` app image via Cloud Build
2. Builds `:migrate` image for database migrations
3. Runs `migrate-db` Cloud Run job
4. Deploys new revision to `basecamper` service

### Resilience Requirements

- Redis: 1s connect/command timeout, circuit breaker at 3 failures, fail-open for reads
- All optional services: graceful degradation when unreachable — never hang or crash
- Pages must render meaningful content in <2 seconds
- Placeholder env values ("placeholder", "") treated as unset — no startup crashes

---

## Contributing

### Git Workflow

1. `git checkout -b <branch-name>` from `main`
2. Make changes, commit (Conventional Commits enforced by hook)
3. `npm run test:unit && npm run test:integration` — must pass
4. `gh pr create` — squash merge, delete branch
5. `make deploy-gcp` after merge

### Commit Format

```
<type>(<scope>): <description>
```

Types: `feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `style` · `perf` · `ci` · `build` · `revert`

### Code Style

- Biome: double quotes, 2-space indent, 100-char width
- `import type` for type-only imports
- No `any` types
- No comments unless the "why" is non-obvious
- Path alias `@/` → `src/`

### Git Hooks (automated)

| Hook | Action |
|------|--------|
| pre-commit | Biome auto-fix + `tsc --noEmit` |
| commit-msg | commitlint (Conventional Commits) |
| pre-push | Unit + integration tests |

Do not bypass with `--no-verify`.
