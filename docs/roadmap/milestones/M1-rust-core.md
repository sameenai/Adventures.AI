# M1 — Rust core, standing up

**Goal.** A production Rust service that owns the platform substrate — health,
logging, rate limiting — and proves the deployment story end to end.

## Why this shape

The flight service already proves Rust can serve production traffic here. What it
does not prove is Rust owning *stateful* concerns: a Postgres pool, a Redis
connection, request identity, the fail-closed limiter. M1 moves exactly those,
and nothing else, so that when a real domain arrives in M2 the substrate is boring.

## Scope

- **`services/api`** — Axum, `sqlx` against the existing Postgres (no schema change),
  `fred` or `redis-rs` against the existing Redis.
- **Tower middleware replacing `withApi()`** — request id, structured logging with the
  same secret-scrubbing rules, and the rate limiter *including its per-route stance*:
  fail-closed on cost-bearing routes, fail-open elsewhere. This is a behavioural
  contract, not an implementation detail; it gets its own tests.
- **`/health`** served from Rust, reporting Postgres and Redis independently.
- **Deploy** — the service ships as a second Cloud Run service behind the same
  canary-and-smoke pattern the app already uses.

## Exit criteria

- [ ] `services/api` serves `/health` in production with Postgres and Redis checks
- [ ] Rate limiter parity proven by a test suite ported from `tests/unit/redis.test.ts`, including the fail-closed cases
- [ ] Log output passes the same scrubbing assertions as the TypeScript logger
- [ ] p99 latency for `/health` under 50 ms

## Risks

**Connection-pool sizing under Cloud Run.** Each instance holds a pool; scale-out
multiplies it. Set `max_connections` from an env var and load-test to the ceiling
before M2 puts real traffic on it.

## Features

`TRIP-001` · `PLAT-001` · `PLAT-002` · `PLAT-005`
