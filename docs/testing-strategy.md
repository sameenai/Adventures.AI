# Testing strategy

What guarantees the product is fast, secure, correct and pleasant — across a Rust
core, two clients and an AI assistant.

The organising principle: **every tier answers a question no other tier can.** A tier
that only re-proves what a cheaper tier already proved is deleted.

## Tiers

| Tier | Runs | Answers |
| --- | --- | --- |
| Rust unit | every commit | Does this function do what it says? |
| Rust property (`proptest`) | every commit | Does it hold for inputs nobody thought to write down? |
| Rust integration (`sqlx::test`) | every commit | Does the SQL do what it claims against real Postgres? |
| Contract (OpenAPI fuzz) | every commit | Does the server obey its own published schema? |
| TypeScript unit (Vitest) | every commit | Do the clients' pure functions and hooks behave? |
| Web E2E (Playwright) | every PR | Can a person get through, on desktop and mobile viewports? |
| Mobile E2E (Maestro) | every PR | Same, on a real device runtime. |
| AI evals | every PR | Is the assistant still good? |
| Agentic QA | every PR | What did we forget to test? |
| Load (k6) | nightly + pre-release | Does it hold at the budget? |
| Security | every PR | Is anything known-vulnerable or leaking? |

## What carries over unchanged

The existing suite is strong and most of it survives the re-platform:

- **Real-services tier.** Vote races, keyset cursors, limiter windows against live
  Postgres and Redis. These become `sqlx::test` cases. **They port with the code, not
  after it** — a migrated domain arrives with its race test already passing.
- **AI eval harness.** Nine deterministic graders, 22 golden transcripts that must keep
  passing, 9 adversarial transcripts that must keep **failing**, and a surface hash that
  invalidates recordings when prompts, tools or the model change.
- **Non-obvious gates.** Bundle budgets, docs drift, catalogue quality, supply-chain
  audit. Each catches a class of failure ordinary assertions miss.
- **The coverage ratchet.** Raise as coverage rises; never lower to make a PR pass.

## Property-based testing, new in the Rust core

Rust's type system removes a class of bug outright; `proptest` attacks what remains.
Highest-value targets, all places where a wrong answer is expensive:

- **Money.** Repricing, currency conversion, entitlements. No arithmetic path may
  produce a negative or overflowed charge for any input.
- **Pagination.** For any page size and any cursor, the union of pages equals the full
  set exactly once — no gaps, no repeats. This is the invariant keyset pagination
  exists to provide and the one hardest to hold by inspection.
- **Retirement salvage.** For any arrangement of user rows across a duplicate and its
  keeper, no row is lost and no unique constraint is violated.
- **Rate limiting.** For any request sequence, the count never exceeds the limit, and
  a fail-closed route never admits a request while the limiter is unreachable.

## Contract testing

The OpenAPI document is generated from the handlers, so it cannot describe endpoints
that do not exist. The remaining risk is the reverse — a handler that violates its own
schema on some path. A schema-driven fuzzer (schemathesis or equivalent) generates
requests from the spec and asserts every response validates against it.

This is what makes the generated client trustworthy, and therefore what makes a
second product cheap.

## AI and agentic tiers

Three distinct things, often conflated:

### 1. Evals — is the assistant good?

The existing harness, pointed at the Rust endpoint. Deterministic graders over a
golden dataset. The adversarial transcripts are the part worth protecting: they must
keep failing, which is a test of whether the graders still have teeth.

### 2. Agentic QA — what did we forget?

An agent is given a goal against a seeded, running application — *"plan a two-week
trek in Nepal under £2,000 and save it"* — and drives the real UI to achieve it. It is
not scripted, so it explores paths no one wrote a test for.

It does not judge subjectively. It asserts machine-checkable things:

- no unhandled exception, no console error, no 5xx
- no request over its latency budget
- no accessibility violation (axe, WCAG 2 A/AA)
- no layout shift over threshold, no element unreachable by keyboard
- the stated goal is actually achieved

**Findings become deterministic tests.** An agentic run that finds a bug produces a
Playwright case that reproduces it, and *that* case is what guards the fix. The agent
finds; the deterministic test holds the line. Agentic runs are never themselves a
required check — they are non-deterministic, and a flaky required check trains people
to ignore CI.

### 3. Agentic review — is the change sound?

Automated review on every PR, with findings verified before they are reported. The
repository already applies this discipline; it continues.

## Performance as a gate

Budgets from [target architecture](./architecture/target-architecture.md) are enforced,
not aspirational:

- **Rust** — `criterion` benches on hot paths; a regression over threshold fails.
- **API** — k6 profiles asserting p95 and error rate against the budget.
- **Web** — Lighthouse CI on the public surface; bundle budgets per route.
- **Mobile** — cold start measured on a mid-range device in CI.

A budget that does not fail the build is a wish.

## Security

- `cargo deny` and `cargo audit` for Rust; the existing `audit-gate.mjs` for npm, where
  the allowlist stays a ledger with reasons rather than a mute button.
- Secret scanning in CI.
- The scrubber has its own tests — secrets must never reach logs, including from
  third-party error objects whose shapes we do not control.
- Authorisation tests per endpoint: every authenticated route is proven to reject an
  anonymous caller and a caller who owns nothing. This is generated from the OpenAPI
  document, so a new endpoint cannot forget it.

## What "delightful" is tested as

Delight resists assertion, but its absence does not:

- interaction to next paint within budget on both clients
- no layout shift on image load — the catalogue is image-heavy, and this is the most
  common way a beautiful page feels cheap
- offline itinerary access verified with the device in airplane mode
- every interactive element keyboard-reachable with a visible focus state
- error states asserted to name what went wrong and what to do next, never a bare
  "something went wrong"

The last one is a copy standard enforced by test, because error text is where products
most often stop respecting the person using them.
