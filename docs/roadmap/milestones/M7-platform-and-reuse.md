# M7 — Platform, reuse and agentic quality

**Goal.** Turn what was built for one product into what the next product starts from.

## Why this is a milestone and not a hope

"Reusable components" that were never actually reused are a story, not an asset.
This milestone has one honest test: a second product can be stood up from these
packages without copying code out of Basecamper.

## Scope

- **Extract the genuinely general.** Candidates, each judged on whether it is
  Basecamper-specific or not:
  - `identity` — OAuth, sessions, profile, export and deletion. General.
  - `billing` — Stripe checkout, portal, webhook ledger, entitlements. General.
  - `media` — upload, storage, transformation, licence attribution. General.
  - `notify` — email, push, in-app, unsubscribe tokens. General.
  - `evals` — the AI grading harness. General, and the most differentiated thing here.
  - `catalog`, `cadence`, `flights` — Basecamper-specific. These stay.
- **Agentic QA in CI** (`PLAT-007`). An agent drives the running application with
  a goal rather than a script, and anything it breaks becomes a deterministic
  regression test. See [testing strategy](../../testing-strategy.md).
- **Performance budgets as gates** — Rust `criterion` benches, k6 profiles, Lighthouse
  CI on the public surface, per-route bundle budgets on both clients.

## Exit criteria

- [ ] Each extracted package has its own README, tests and version, and no import back into Basecamper code
- [ ] A second product skeleton boots with identity, billing and notify from these packages
- [ ] Agentic QA runs on every PR; its findings land as deterministic tests
- [ ] Performance budgets fail the build when exceeded, on both clients

## Risks

**Premature abstraction.** Extracting before a second consumer exists produces a
library shaped entirely by its first caller. The rule: nothing is extracted until it
has been needed twice, and the second product skeleton is what proves it.

## Features

`PLAT-007`
