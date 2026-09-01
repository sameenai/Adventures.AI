# Target architecture

Where Basecamper is going, and why each piece is where it is. Decisions are recorded
in [`../adr/`](../adr); this document is the shape they add up to.

## The shape

```
                        ┌───────────────────────────────┐
   crawlers, shares ───▶│  public surface  (Rust, SSR)  │──┐
                        └───────────────────────────────┘  │
                        ┌───────────────────────────────┐  │
   signed-in web    ───▶│  apps/web      React + Vite   │──┤
                        └───────────────────────────────┘  │   generated
                        ┌───────────────────────────────┐  │   OpenAPI client
   phones           ───▶│  apps/mobile   React Native   │──┤
                        └───────────────────────────────┘  │
                                                           ▼
                        ┌──────────────────────────────────────────────┐
                        │            services/api  (Rust, Axum)        │
                        │  gateway · identity · catalog · social       │
                        │  planning · assistant · flights · billing    │
                        │  media · notify · cadence · jobs             │
                        └──────────────────────────────────────────────┘
                                    │                    │
                           ┌────────▼────────┐  ┌────────▼────────┐
                           │   PostgreSQL    │  │      Redis      │
                           └─────────────────┘  └─────────────────┘
```

Three clients, one backend, one contract between them. Postgres and Redis are
unchanged from today — they were already right.

## Repository layout

```
basecamperai/
├── apps/
│   ├── web/              React 19 + Vite + TanStack Router/Query
│   ├── mobile/           React Native (Expo)
│   └── legacy-web/       the current Next.js app, until M6 removes it
├── services/
│   ├── api/              the Rust core
│   └── flight-search/    already extracted; folds in as a crate at M6
├── packages/
│   ├── api-client/       generated from OpenAPI — never hand-edited
│   ├── core/             logic that must agree across clients
│   └── tokens/           design tokens
├── db/
│   └── migrations/       sqlx migrations (Prisma's history preserved)
└── docs/
    ├── adr/              architecture decisions
    ├── architecture/     this document
    └── roadmap/          features, board, milestones, debt
```

## The Rust core, by module

Modules inside one deployable, not separate services. They are separated so the
seams are visible and a module *could* be split later under real load — splitting
before that is cost without benefit.

| Module | Owns | Reusable beyond Basecamper? |
| --- | --- | --- |
| `gateway` | Request id, logging, scrubbing, rate limiting, health | yes |
| `identity` | OAuth, sessions, profile, export, deletion | yes |
| `billing` | Stripe checkout, portal, webhook ledger, entitlements | yes |
| `media` | Storage, transformation, licence attribution | yes |
| `notify` | Email, push, in-app, unsubscribe tokens | yes |
| `catalog` | Adventures, search, geo, leaderboard, trending | no |
| `social` | Votes, comments, bookmarks, collections, follows, feed | mostly |
| `planning` | Itineraries, days, saved flights, export | no |
| `assistant` | Streaming chat, tools, evals | harness yes, tools no |
| `flights` | Provider fan-out, normalisation, caching | no |
| `cadence` | Taste profile, overdue detection, recommendations | no |
| `jobs` | Scheduler, retention, job records | yes |

The "reusable" column is the M7 extraction list, and it is a judgement to be
re-tested against a real second product — not a promise.

## The contract

`utoipa` annotations on the Rust handlers emit an OpenAPI document. The TypeScript
client is generated from it in CI and committed; a generated diff that is not in the
commit fails the build.

This is the load-bearing decision for "one backend, many products". It means:

- No hand-written `fetch` in any client, so no client-side drift from the server.
- A new client — a partner integration, an internal tool, a second product — starts
  from a typed client rather than from documentation.
- Breaking changes are visible as a diff in a generated file during review.

## Why complexity belongs in the backend

Every rule that must hold regardless of client lives in Rust: repricing before a
charge, rate-limit stance, entitlement checks, attribution requirements, retention
windows. A client is then a rendering of state plus intent, which is what makes
three clients affordable.

The current architecture cannot offer this — the rules live in a layer whose job is
rendering a website, so a second client would have to reimplement them or proxy
through the first.

## Performance posture

| Surface | Budget | Enforced by |
| --- | --- | --- |
| Public page, first contentful paint | < 1.0 s | Lighthouse CI |
| Application route, interactive | < 2.0 s | Lighthouse CI + bundle budgets |
| API read, p95 | < 100 ms | k6 profile, gate in CI |
| API write, p95 | < 250 ms | k6 profile |
| Mobile cold start | < 2.0 s | device test in CI |
| Any external dependency | fail fast, degrade | circuit breakers, existing rule |

The existing resilience rules carry over unchanged: Redis connect and command
timeouts at 1 s with a circuit breaker at 3 failures, OpenAI capped, flight providers
returning partial results rather than failing whole.

## What does not change

- **PostgreSQL** as the system of record.
- **Redis** for cache and rate limiting.
- **Cloud Run** with the canary-and-smoke deploy, and rollback by traffic split.
- **The catalogue as data**, held to CI-enforced invariants.
- **The eval harness** as a required check on assistant quality.
- **Alerts as code** in `ops/alerts/`.

A re-platform is a good moment to change everything, and a bad reason to.
