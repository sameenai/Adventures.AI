# Basecamper

**The adventure-travel platform Booking.com can't be.** Discover 1,000 curated expeditions across
7 continents, plan trips with an AI agent that searches real catalogs and live fares, save and pay
for flights, and get told when you're due your next adventure — based on your own travel rhythm.

**Live at [basecamper.ai](https://basecamper.ai)**

## Repository map

| Path | What it is |
|------|-----------|
| `summit-social/` | The main product: a Next.js 15 full-stack app (web UI + API + AI agent + payments). **Start with [`summit-social/README.md`](summit-social/README.md)** — the complete codebase guide: architecture, data model, full API surface, testing, env matrix. |
| `services/flight-search/` | Rust (Axum) flight-search service — the first strangler-pattern backend extraction. Opt-in via `FLIGHT_SERVICE_URL`; falls back in-process on any failure. See [`services/flight-search/README.md`](services/flight-search/README.md). |
| `summit-social/evals/` | The AI eval harness: golden replays, adversarial teeth-checks, deterministic graders, and a prompt-surface hash gate. See [`summit-social/evals/README.md`](summit-social/evals/README.md). |
| `docs/roadmap/` | **The plan of record.** Feature registry, generated delivery board, milestones and the debt register. Start at [`docs/roadmap/README.md`](docs/roadmap/README.md). |
| `docs/adr/` | Architecture decisions, including the move to a Rust core and React/React Native clients. |
| `docs/architecture/` | [Target architecture](docs/architecture/target-architecture.md) — where the platform is going and why. |
| `docs/testing-strategy.md` | Every test tier, including the AI eval and agentic QA tiers. |
| `RUNBOOK.md` | Production operations: deploy, secrets matrix, scheduled jobs, incident playbook. |
| `CLAUDE.md` | Working conventions for AI-assisted development (commit style, hooks, workflow, resilience rules). |
| `.github/workflows/` | CI (`ci.yml`), gated Cloud Run deploy (`deploy.yml`), weekly live evals (`evals-live.yml`). |

## Quick start

**No Docker required** — local dev uses Homebrew-managed services.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `brew install node` |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Redis | 7 | `brew install redis` |

```bash
cd summit-social
make setup    # install deps, start Postgres/Redis, create DB, migrate, seed
make run      # start everything + the Next.js dev server at http://localhost:3000
```

Sign in with the **local dev login** (any email, password `dev` — creates the account on the fly;
seeded users `alex@`, `maya@`, `james@basecamper.ai` also work). Dev login is enabled by
`ENABLE_DEV_LOGIN=true` locally and compile-gated out of production, where Google OAuth is the
way in. `npm run db:studio` opens Prisma Studio at http://localhost:5555.

Everything external is optional locally and degrades gracefully: without `OPENAI_API_KEY` the
planner streams a demo itinerary; without flight-provider keys you get clearly-mock offers;
without `STRIPE_SECRET_KEY` pay routes return 503; without `RESEND_API_KEY` emails are recorded
(`EmailLog`) but not sent. The full commands reference and environment matrix live in
[`summit-social/README.md`](summit-social/README.md) §9–10.

## The product in one paragraph

A user browses the **adventure catalog** (deduplicated, price-audited, seasonal metadata),
bookmarks a bucket list, and asks the **AI planner** for a trip. The agent searches the catalog and
live fares, builds a day-by-day itinerary, and can **stage a chosen flight** on the trip — the user
then confirms the re-validated fare and **pays through Stripe**, flipping the itinerary to BOOKED
with a confirmation email. Marking trips "✓ I did this" anchors the **travel-cadence engine**,
which recommends the next seasonal window from the user's own signals and — with consent — emails
"your next trip window opens in March". Community features (votes, comments, collections, follows)
feed the same taste profile.

## Engineering posture

- **Tests gate everything**: 1,100+ mocked unit/integration tests with coverage thresholds, a
  real-Postgres/Redis tier, Playwright e2e on desktop **and** mobile viewports with accessibility
  and performance gates, Rust `fmt`/`clippy`/`test`, and an AI eval regression suite — all on
  every PR.
- **Honesty by construction**: the AI cannot claim a booking it didn't make (eval-graded), mock
  data never masquerades as real, rate limits fail closed on cost-bearing routes (chat, flights,
  checkout) while reads fail open behind a circuit breaker.
- **Docs stay true**: `tests/unit/docs-drift.test.ts` fails CI when an API route, data model,
  chat tool, npm script, or env var exists that the READMEs don't document.

See [`summit-social/README.md`](summit-social/README.md) for the full architecture, data model,
API surface, and testing guide.
