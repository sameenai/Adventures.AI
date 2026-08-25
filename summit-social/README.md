# Summit Social — the Basecamper application

The full-stack Next.js 15 app behind [basecamper.ai](https://basecamper.ai): catalog, community,
AI trip planner, flight booking rail, payments, and the travel-cadence retention engine.

This document is the codebase guide. It is **enforced**: `tests/unit/docs-drift.test.ts` fails CI
whenever an API route, Prisma model, chat tool, npm script, or environment variable exists that
this file (or the runbook) doesn't mention — so what you read here is what the code does.

- Product operations (deploy, secrets, incidents): [`../RUNBOOK.md`](../RUNBOOK.md)
- AI eval harness details: [`evals/README.md`](evals/README.md)
- Rust flight-search service: [`../services/flight-search/README.md`](../services/flight-search/README.md)

---

## 1. The product

Four user journeys, one loop:

1. **Discover** — browse/filter/search 789 curated adventures (`/adventures`, `/explore` map,
   `/feed`, `/leaderboard`), vote, comment, follow, bookmark a bucket list, group saves into
   collections.
2. **Plan** — the AI planner (`/itinerary`) is a real agent: it searches the catalog and live
   fares, checks seasonal weather, suggests gear, and writes a day-by-day itinerary you can
   resume any time (`/itineraries`).
3. **Book** — the agent stages a chosen flight on the trip; the user confirms the re-validated
   fare and pays via Stripe. Payment flips the itinerary to BOOKED and sends a confirmation
   email. Direct-operator and pre-filled partner links cover lodging/activities.
4. **Return** — "✓ I did this" logs trips; the cadence engine watches each user's travel rhythm
   and recommends the next seasonal window (`/next-trip`), by email when consented.

Monetization: **Pro subscription** (`/pro`, Stripe Checkout + Billing Portal) gating AI credit
volume, plus one-off flight payments. Free users get metered monthly AI credits.

## 2. Directory map

```
summit-social/
├── src/app/
│   ├── (auth)/              # login, signup (Google OAuth; dev login outside production)
│   ├── (dashboard)/         # all product pages: adventures, explore, feed, flights,
│   │                        #   itinerary (planner), itineraries, bookmarks, collections,
│   │                        #   leaderboard, users, profile, next-trip, pro, admin,
│   │                        #   privacy, terms, unsubscribed
│   └── api/                 # route handlers — full surface in §4
├── src/components/          # ui/ primitives + feature components (adventures/, chat/,
│                            #   flights/, billing/, itinerary/, explore/, profile/, shared/)
├── src/lib/
│   ├── ai/                  # agent loop (chat-service), tools, executors, prompts, parser
│   ├── api/                 # withApi() shared route envelope (auth→limit→validate→handle)
│   ├── auth/                # NextAuth config
│   ├── billing/             # Stripe customer helper, flight-booking payment transitions
│   ├── db/                  # Prisma singleton, Redis client + atomic Lua rate limiter
│   ├── email/               # Resend adapter, templates, signed unsubscribe tokens
│   ├── flights/             # Amadeus + Skyscanner adapters, aggregator (+ Rust service proxy)
│   ├── jobs/                # cadence-scan, retention (run via /api/jobs/[job])
│   ├── partners/            # pre-filled affiliate deep links, operator booking URLs
│   ├── personalization/     # taste profile aggregation
│   └── validators/          # Zod schemas for every API input
├── prisma/                  # schema, migrations, canonical adventures.json, data-driven seed
├── evals/                   # AI eval harness (see evals/README.md)
└── tests/                   # unit/ + integration/ (mocked) · db/ (real services) · e2e/ · load/
```

## 3. Data model (Prisma / PostgreSQL)

**Identity & social** — `User` (plan, AI credits, Stripe ids, marketing consent, terms
acceptance), `Follow`, `Notification`.

**Catalog** — `Adventure` (category, difficulty, geo, `bestMonths` seasonality, denormalized
`voteCount`/`viewCount`, optional `Operator`), `Tag`, `Vote` (unique per user×adventure),
`Comment` (threaded via `parentId`) + `CommentReaction`, `Bookmark` (the bucket list),
`Collection`/`CollectionItem`, `AdventureView` (salted daily-rotating viewer hash),
`Operator` (who actually runs it; `bookingUrlTemplate` with `{date}`/`{pax}`).

**Planning & booking** — `Itinerary` (AI `chatHistory` JSON; status
`DRAFT → PLANNING → BOOKED → COMPLETED`, event-driven), `ItineraryDay`, `FlightBooking`
(state machine `SELECTED → PRICE_CONFIRMED → PAID → TICKETED`, terminal
`CANCELLED`/`REFUNDED`; passengers/segments JSON, Stripe payment-intent ref).

**Retention & cadence** — `TravelerProfile` (cadence months, budget band, difficulty ceiling,
home airport), `TripEvent` (the "last trip" anchor: `MARKED_DONE` today, booking sources later),
`SearchEvent` (demand capture from chat + catalog), `CadenceRecommendation` (idempotent per
user×adventure×window, `PENDING → SENT → …` with CTR feedback).

**AI quality** — `MessageFeedback` (thumbs up/down on assistant chat messages with optional
comment and the conversation transcript captured verbatim — the AI quality loop's raw material;
`exportedAt` marks rows already promoted into eval candidates, so the feedback → eval-case
pipeline never double-exports; cascade-deletes with the user).

**Ops & audit** — `StripeEvent` (webhook idempotency ledger), `EmailLog` (every send attempt:
SENT/FAILED/SKIPPED), `JobRun` (scheduled-job observability), `AnalyticsEvent` (product analytics:
one row per funnel event, captured server-side where the thing actually happened — payment via the
webhook, not a button click; signed-in rows cascade-delete with the account, anonymous rows carry
only the daily-rotating salted viewer key; props are short primitives, never free text).

The daily `retention` job trims the audit surfaces on a published schedule (mirrored in
`/privacy` and RUNBOOK.md): views/read notifications after 90 days, empty itineraries after 30,
`AnalyticsEvent` after 180, `EmailLog` and `SearchEvent` after 365, and `MessageFeedback` UP after
90 / DOWN after 365 (DOWN feeds the evals, so it keeps the longer window).

## 4. API surface

All JSON routes speak one envelope (`{ error, code, … }` on failure; Zod-validated input;
per-user rate limits, fail-closed on cost-bearing routes). New routes use `withApi()` from
`src/lib/api/handler.ts`; streaming chat and the Stripe webhook stay hand-rolled by design.

| Area | Routes |
|------|--------|
| Catalog | `/api/adventures` (cursor-paginated list) · `/api/adventures/[id]` · `/api/adventures/[id]/vote` · `/api/adventures/[id]/bookmark` · `/api/adventures/[id]/comments` · `/api/adventures/[id]/comments/[commentId]` · `/api/adventures/[id]/comments/[commentId]/react` · `/api/adventures/[id]/view` · `/api/adventures/[id]/publish` · `/api/adventures/[id]/duplicate` · `/api/adventures/enhance-description` (AI rewrite) |
| Trip log & cadence | `/api/adventures/[id]/complete` (✓ I did this) · `/api/user/traveler-profile` (preferences + email opt-in) |
| AI planner | `/api/chat` (streaming agent loop, credit-metered) |
| Flights & booking | `/api/flights` (aggregated search) · `/api/itineraries/[id]/flights` (save an offer) · `/api/bookings/[id]/reprice` (fare re-validation) · `/api/bookings/[id]/checkout` (Stripe payment) |
| Itineraries | `/api/itineraries` · `/api/itineraries/[id]` |
| Collections | `/api/collections` · `/api/collections/[id]` · `/api/collections/[id]/items` |
| Social | `/api/users/[id]` · `/api/users/[id]/follow` · `/api/users/search` · `/api/users/suggestions` · `/api/notifications` · `/api/notifications/read-all` |
| Account | `/api/user/me` (profile + GDPR delete) · `/api/user/me/export` (data export) · `/api/user/openai-key` (BYOK, encrypted at rest) · `/api/auth/[...nextauth]` |
| Billing | `/api/stripe/checkout` (Pro subscription) · `/api/stripe/portal` (manage/cancel) · `/api/webhooks/stripe` (signed, idempotent) |
| Email | `/api/email/unsubscribe` (HMAC-signed one-tap link) |
| Analytics | `/api/analytics/collect` (first-party page-view beacon: allowlisted names only, no cookies, DNT/GPC honoured, anonymous senders keyed by the rotating salted hash) |
| Ops | `/api/health` (db + redis component status) · `/api/jobs/[job]` (secret-gated: cadence-scan, retention) |

## 5. The AI agent

`src/lib/ai/chat-service.ts` runs a real agent loop (max 6 tool rounds, tool messages persisted
to `Itinerary.chatHistory`, honest tool failures). Six tools, all with real executors
(`src/lib/ai/tool-executors.ts`):

`search_adventures` (also captures demand as `SearchEvent`) · `search_flights` (live
aggregator) · `save_flight` (stages a booking; **payment is deliberately human** — the agent may
never claim booked/paid, enforced by the `bookingHonesty` eval grader) · `create_itinerary_day` ·
`suggest_gear` · `get_weather_forecast` (Open-Meteo historical normals).

Credits are metered atomically per message with refund-on-failure; demo mode (no
`OPENAI_API_KEY`, or `DEMO_MODE=true`) streams canned content and never burns credits.

**Quality is a tested surface**: `evals/` replays 22 golden transcripts through 9 deterministic
graders (schema, geography, budget, groundedness, booking honesty, tool discipline, safety…) —
including tool-failure resilience cases where a flight search, weather lookup or save_flight
fails and the assistant must degrade honestly —
keeps 9 deliberately-flawed adversarial transcripts failing (teeth-check), and hashes the entire
prompt/tool/model surface — any change forces a live re-certification (`npm run eval:live`)
before the replay baseline is trusted again. CI runs `npm run eval` on every PR.

## 6. The booking rail

```
search_flights → save_flight / “save” in UI     (FlightBooking SELECTED, itinerary → PLANNING)
     → POST /api/bookings/[id]/reprice          (fare re-checked: confirmed at CURRENT price,
                                                 409 FARE_GONE if vanished, 503 if unverifiable)
     → POST /api/bookings/[id]/checkout          (Stripe Checkout, amount = verified price)
     → webhook checkout.session.completed        (PAID + itinerary → BOOKED + email; replay-safe)
     → charge.refunded                           (→ REFUNDED)
```

Real ticket issuance (`PAID → TICKETED`) awaits a commercial decision (Amadeus production /
consolidator + ATOL posture) — the state machine is already in place. Partner links
(`src/lib/partners/`) are pre-filled with the next best-season date and honestly labelled.

## 7. Email & consent

`src/lib/email/` sends via Resend over plain HTTPS. No `RESEND_API_KEY` ⇒ sends are recorded as
SKIPPED in `EmailLog`, never a crash. Marketing mail (trip-due) goes **only** to users with
`marketingConsent` (opt-in lives in the traveler-profile form) and always carries an HMAC-signed
one-tap unsubscribe. Booking confirmations are transactional. Templates escape every user string.

## 8. Observability & product analytics

Errors are reported without an agent or vendor: `reportError()` (in `src/lib/logger.ts`) emits
GCP Error Reporting-shaped log entries that Cloud Run ingests automatically — grouped, counted,
alertable. The shared route envelope stamps every request with an `x-request-id` (accepted or
generated) and includes it in error responses and reports, so one failure traces across log lines.
In production the envelope also logs every request in the Cloud Logging `httpRequest` shape
(method, status, latency) with `route` + `requestId`, so per-route p95 is a log-based metric away.
`/api/health` reports db + redis component status. Alert policies live as code in
`ops/alerts/*.json` (5xx rate, p95 latency, error-log spikes, uptime) — `make alerts-setup`
upserts them; see RUNBOOK.md for triage.

Product analytics is server-side-first (`src/lib/analytics/track.ts`): funnel events — signup,
chat_message, itinerary_created, flight_searched, flight_saved, fare_repriced, checkout_started,
payment_succeeded, booking_refunded, pro_subscribed, pro_cancelled, bookmark_added, trip_logged,
cadence_email_sent — are captured at the write path or webhook where they become true. The one
client signal is a page_view beacon (`PageViewPing`): no cookies, no fingerprinting, DNT/GPC
respected, dynamic path segments normalised before sending. Query with SQL over `AnalyticsEvent`.

## 9. Security & privacy posture

Google OAuth (email-verified upsert) with JWT sessions; dev login is compile-time gated out of
production. Zod on every input; scheme-allowlisted URLs; ownership checked before every write
(IDOR regression tests from the attacker's perspective). Atomic Lua rate limiting fails closed
on cost-bearing routes. BYOK OpenAI keys encrypted at rest (save refuses without
`ENCRYPTION_KEY`). Strict CSP with per-request script nonces + `strict-dynamic` (no
`unsafe-inline`/`unsafe-eval` scripts in production), emitted by `src/middleware.ts` from
`src/lib/security/csp.ts`. Logger scrubs secrets and PII.
GDPR: click-wrap terms stamping, account deletion cascade, JSON export, salted rotating view
hashes, retention jobs. Legal pages at `/privacy` and `/terms` name every processor.

## 10. Testing

| Tier | Command | What it proves |
|------|---------|----------------|
| Unit + integration (mocked) | `npm run test:unit` · `npm run test:integration` · `npm run test` · `npm run test:watch` | 1,100+ tests, no services needed; coverage thresholds 88/86/89/88 enforced via `npx vitest run --coverage` |
| Real services | `npm run test:db` | keyset-cursor semantics, vote/credit races, limiter windows against live Postgres + Redis |
| AI evals | `npm run eval` (replay, CI) · `npm run eval:live` (real model + judge) | agent quality can't regress; surface hash forces re-certification |
| E2E | `npm run test:e2e` | 16 journeys × desktop + Pixel 7 mobile, incl. sign-in→plan→save→log-trip and an axe WCAG 2A/AA gate |
| Load | `tests/load/k6-smoke.js` | smoke throughput baseline |
| Docs | part of `test:unit` (`docs-drift.test.ts`) | this README + runbook stay true to the code |

CI (`.github/workflows/ci.yml`) runs lint+types, mocked tests with coverage, eval replay,
production build, the real-services tier (migrations + schema-drift check + full seed), Rust
gates, and e2e on every PR. Never merge red; never lower a threshold to pass.

## 11. Commands & environment

Dev: `npm run dev` (server only) · `make setup` / `make run` (with services) · `npm run build` ·
`npm run start` · `npm run lint` / `npm run lint:fix` / `npm run format`.
Database: `npm run db:migrate` · `npm run db:seed` · `npm run db:studio` · `npm run db:generate`.
(`postinstall` regenerates the Prisma client; `prepare` installs husky hooks.)

Environment (see `.env.example`; full production matrix in the runbook): `DATABASE_URL`,
`REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
`ENABLE_DEV_LOGIN` (never in production), `ADMIN_EMAILS`, `OPENAI_API_KEY`,
`AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET`/`AMADEUS_BASE_URL`,
`SKYSCANNER_API_KEY`/`SKYSCANNER_BASE_URL`/`SKYSCANNER_AFFILIATE_ID`, `FLIGHT_SERVICE_URL`
(Rust service opt-in), `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRO_PRICE_ID`,
`ENCRYPTION_KEY`, `JOBS_SECRET`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `RESEND_API_KEY`/`EMAIL_FROM`,
`DEMO_MODE`.

Deploy: `make deploy-gcp` (Cloud Build → Cloud Run) or the WIF-gated `deploy.yml` workflow, which
canaries (no-traffic revision → smoke → promote). Ops: `make rollback` (previous revision in
seconds), `make alerts-setup` (monitoring policies from `ops/alerts/`), `make scheduler-setup`
(jobs) — incident playbooks in [`../RUNBOOK.md`](../RUNBOOK.md).

## 12. Keeping this document honest

Change the code, change the docs — **in the same PR**. `tests/unit/docs-drift.test.ts` asserts
every API route directory, Prisma model, chat tool, npm script, and `.env.example` variable is
mentioned here (or in the runbook, for ops-only concerns). If your PR adds one and CI goes red on
docs-drift, the fix is a sentence in this file, not a skip.
