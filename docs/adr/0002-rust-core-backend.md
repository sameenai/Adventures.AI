# ADR-0002 — A Rust core carries the backend complexity

**Status:** accepted · **Date:** 2026-09-01

## Context

Today the backend is Next.js API routes: 42 of them, sharing a `withApi()` envelope,
talking to Postgres through Prisma and Redis through ioredis. It works and it is
well-tested. But the product's complexity — the cadence engine, the assistant's tool
execution, flight aggregation, repricing before payment — sits in a layer whose
primary job is rendering a website, and it can only ever serve one kind of client.

One Rust service already runs in production (`services/flight-search`) and has proven
the deployment story.

## Decision

The backend becomes a Rust core. Axum for HTTP, `sqlx` against Postgres with
compile-time-checked queries, `redis-rs`/`fred` for cache and rate limiting,
`async-stripe` for payments, `utoipa` to emit OpenAPI.

Postgres and Redis are unchanged. They were already the right choices and switching
them would add risk for nothing.

Migration follows the strangler pattern already working for flights: each domain is
served by Rust behind an opt-in URL with the previous implementation as fallback, and
the fallback is removed only once it has gone unused in production for a week.

## What we gave up

**Rust is not the standard choice for this shape of product**, and it is worth being
plain about that. Go or a Node service would each hire more easily and iterate faster
on CRUD. Rust wins on three things that matter here — a type system that makes
illegal states unrepresentable in money and booking code, predictable latency with no
GC pauses, and compile-time-verified SQL — and it costs slower iteration on the
boring 80% of endpoints. That trade is accepted deliberately, not assumed.

**Prisma's ergonomics.** `sqlx` is closer to SQL and further from a model layer.
Migrations become SQL files rather than a schema DSL.

**One language across the stack.** Contributors now need both. The generated client
is what stops that becoming two hand-maintained definitions of every type.

## Consequences

- Business logic lives in one place and serves web, mobile and any future client equally.
- The API contract becomes an artefact rather than an implicit agreement.
- Compile-time SQL checking moves a class of runtime error to build time.
- Hiring and onboarding get harder. Documented here so it is a known cost.
