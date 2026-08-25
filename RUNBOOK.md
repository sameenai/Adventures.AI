# Basecamper Runbook

Operational reference for running Basecamper in production. The app is a
Next.js 15 monolith (`summit-social/`) on Cloud Run with Postgres + Redis,
plus a Rust flight-search service (`services/flight-search/`) behind the
strangler pattern.

## Architecture at a glance

- **Web + API**: Next.js (App Router) — one Cloud Run service (`basecamper`).
- **Database**: PostgreSQL via Prisma. Migrations in `summit-social/prisma/migrations`.
- **Cache / rate limiting**: Redis (ioredis). Rate limits are atomic (Lua);
  cost-bearing routes (chat, flight search, checkout) **fail closed** when
  Redis is down — expect 429s, not free traffic, during a Redis outage.
- **AI**: OpenAI GPT-4o agent loop (`src/lib/ai/`). Demo mode answers without
  a key; per-user monthly credits are metered atomically.
- **Payments**: Stripe — Pro subscription (checkout + billing portal) and
  one-off flight payments (`kind=flight_booking` checkout sessions). All
  state changes land via the signed webhook with an idempotency ledger
  (`StripeEvent`).
- **Email**: Resend over HTTPS (`src/lib/email/`). Unset `RESEND_API_KEY`
  means sends are recorded as `SKIPPED` in `EmailLog` — the audit answer to
  "why did nothing arrive".
- **Flight search**: in-process Amadeus/Skyscanner adapters, or the Rust
  service when `FLIGHT_SERVICE_URL` is set (falls back in-process on any
  failure — enabling it can never take flight search down).

## Environments & secrets

Required in production (see `summit-social/.env.example` for the full list):

| Variable | Purpose | Absent ⇒ |
|---|---|---|
| `DATABASE_URL` | Postgres | app down |
| `REDIS_URL` | rate limits, cache | cost-bearing routes deny (fail closed) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | sessions, signed links | app down |
| `GOOGLE_CLIENT_ID/SECRET` | sign-in | no login |
| `OPENAI_API_KEY` | AI planner | demo-mode responses only |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_PRICE_ID` | billing | 503 on pay routes |
| `RESEND_API_KEY` / `EMAIL_FROM` | transactional email | EmailLog `SKIPPED`, nothing sent |
| `AMADEUS_CLIENT_ID/SECRET`, `SKYSCANNER_API_KEY` | real fares | mock offers in dev/demo; empty + `providersUnavailable` in prod |
| `JOBS_SECRET` | scheduled-job auth | jobs endpoint refuses |
| `ENCRYPTION_KEY` | BYOK key storage | key saves refuse (503), never plaintext |

`ENABLE_DEV_LOGIN` must **never** be set outside local dev.

## Deploy

- Manual: `cd summit-social && make deploy-gcp` (Cloud Build → Cloud Run,
  project `basecamp-494710`, region `europe-west2`).
- CI: `.github/workflows/deploy.yml` deploys `main` with SHA-tagged images
  once `GCP_WIF_PROVIDER` / `GCP_DEPLOY_SA` repo variables are set. It is a
  **canary flow**: the new revision starts with zero traffic behind the
  `canary` tag URL, gets smoke-tested there (health + critical pages inside
  a 5s budget), and only then is promoted to live traffic. A failed smoke
  leaves production on the previous revision.
- Rollback: `make rollback` finds the revision currently receiving traffic,
  walks the most recent revisions newest-first, and routes 100% of traffic
  to the first other one whose Ready condition is True — it verifies
  readiness per revision, so it never rolls back onto a broken revision
  (`make rollback REVISION=<name>` skips detection and uses that revision).
- Migrations: `npx prisma migrate deploy` runs against the production DB
  before traffic shifts. Never `db push`, never edit applied migrations.
- Rust service: build/deploy separately (`services/flight-search/Dockerfile`),
  then set `FLIGHT_SERVICE_URL` on the main service. Roll back by unsetting
  the variable — the in-process adapters take over immediately.

## Scheduled jobs

`POST /api/jobs/{job}` with header `x-jobs-secret: $JOBS_SECRET`.
Provision Cloud Scheduler: nightly `cadence-scan`, daily `retention`.
Every run writes a `JobRun` row (status, stats) — the first place to look
when "no emails went out last night". Cadence emails go only to users with
`marketingConsent=true` and carry one-tap unsubscribe links.

## Health & monitoring

- `GET /api/health` — liveness (DB + Redis checks).
- Cloud Run request logs are structured; the app logger scrubs secrets and
  PII (emails, API keys) before anything reaches Cloud Logging.
- **Errors**: `reportError()` emits GCP Error Reporting-shaped entries — Cloud
  Run ingests them automatically, so errors are grouped/counted/alertable in
  the console with no agent. Every API error response carries an
  `x-request-id`; search logs by `requestId` to trace one failure end to end.
- **Product analytics**: SQL over `AnalyticsEvent` — e.g. funnel:
  `SELECT name, count(*) FROM "AnalyticsEvent" WHERE "createdAt" > now() - interval '7 days' GROUP BY 1;`
  Signed-in rows cascade-delete with the account; anonymous rows carry only
  the daily-rotating salted key. The client beacon honours DNT/GPC.
- **Latency**: enveloped routes and the hand-rolled `/api/adventures/geo`
  route log each request in production with the Cloud Logging `httpRequest`
  shape (method, status, latency) plus `route` and `requestId` — Logs
  Explorer renders it natively; build log-based metrics on `route` for
  per-route p95 on those paths. The streaming chat route and the Stripe
  webhook are observed via Cloud Run's own request logs and `reportError()`.
- **Alerts as code**: `summit-social/ops/alerts/*.json` is the source of
  truth — 5xx rate, p95 latency over the 2s budget, ERROR-log spikes, and
  uptime on `/api/health`. `make alerts-setup` upserts the policies and
  provisions the uptime check; attach notification channels once in the
  console — they survive re-runs because the target captures each policy's
  channels before the update and re-attaches them after. Edit the JSON,
  re-run the target, done.
- Watch: 5xx rate on `/api/chat` (OpenAI incidents), 429 spikes (Redis
  down ⇒ fail-closed), `EmailLog.status=FAILED` counts, `JobRun` failures,
  Stripe webhook 4xx (signature/secret drift).

## Payments incidents

- **Webhook failing**: Stripe retries with backoff; the `StripeEvent`
  ledger makes replays no-ops. Fix the cause, then let retries drain.
- **User paid but booking not `PAID`**: check the webhook logs for that
  event id, then the booking's `stripePaymentIntentId`. The transition is
  guarded — replaying the event is safe.
- **Refunds**: refund in the Stripe dashboard; `charge.refunded` walks the
  booking to `REFUNDED` automatically.

## Backups & data

- Enable Cloud SQL automated daily backups + PITR (operational setting, not
  in code). Redis is disposable — only rate-limit windows and caches.
- Account deletion cascades (bookings, email log, cadence rows included);
  data export lives at `/api/user/export`.
- Retention windows (enforced by the daily `retention` job, mirrored in
  `/privacy`): `AdventureView` rows are deleted after 90 days.
  Read `Notification` rows are deleted after 90 days.
  Abandoned empty `Itinerary` rows are deleted after 30 days.
  `AnalyticsEvent` rows are deleted after 180 days.
  `EmailLog` rows are deleted after 365 days.
  `SearchEvent` rows are deleted after 365 days.
  `MessageFeedback` UP ratings are deleted after 90 days, DOWN ratings after
  365 days (DOWN feeds the eval suite, so it keeps the longer window).

## CI gates (every PR)

Biome + tsc · 1,100+ mocked unit/integration tests with coverage thresholds
(88/86/89/88) · AI eval replay gate (19 goldens + adversarial teeth-check +
prompt-surface hash) · production build · real-Postgres/Redis tier
(migrations, schema-drift check, seed, concurrency) · Rust fmt/clippy/test ·
Playwright e2e, desktop + mobile. Do not merge red; do not lower thresholds
to pass.
