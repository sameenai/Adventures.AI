# Roadmap

The plan of record for re-platforming Basecamper onto a Rust core with React and
React Native clients. Three files do the work:

| File | What it is |
| --- | --- |
| [`features.json`](./features.json) | Every feature in the product, its status today, and where it lands in the target architecture. Hand-edited. |
| [`BOARD.md`](./BOARD.md) | The delivery board. **Generated** — run `npm run roadmap` after editing the registry. |
| [`milestones/`](./milestones) | One file per milestone: goal, scope, exit criteria, risks. |
| [`tech-debt.md`](./tech-debt.md) | Debt register with owners and trigger conditions. |

Architecture decisions live in [`../adr/`](../adr). The target design is in
[`../architecture/target-architecture.md`](../architecture/target-architecture.md).
Testing — including the agentic tiers — is in [`../testing-strategy.md`](../testing-strategy.md).

## Why the registry is machine-checked

A roadmap in a repository rots the moment it stops matching the code, and a rotted
roadmap is worse than none: people trust it and are wrong.

So `npm run roadmap:check` runs in CI and fails if any feature marked `live` or
`partial` names a route or page that does not exist. Delete an endpoint without
updating the registry and the build breaks. Claim something ships when it does
not and the build breaks the same way. `BOARD.md` is regenerated and compared,
so the rendered view can never drift from the data either.

This is the same discipline the repository already applies to its documentation
(`tests/unit/docs-drift.test.ts`) and its catalogue (`tests/unit/catalog-quality.test.ts`).

## Working the roadmap

**Adding a feature.** Add an entry to `features.json` with status `planned`, an
area, a target service and a milestone. Run `npm run roadmap` to regenerate the
board. Commit both.

**Shipping a feature.** Change its status to `live` and fill in `today` with the
routes and pages that now exist. The check will verify you are telling the truth.

**Removing a feature.** Set status to `deprecated` and say in `notes` when and how
it goes. Delete the entry only once the code is gone.

**Moving a milestone.** Milestone files are the unit of planning; features point at
them by id. Renaming a milestone file means updating every feature that references it —
the check will list them for you.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `live` | Shipped and reachable by a user today. |
| `partial` | Reachable but incomplete against its target definition. |
| `planned` | Not built. Sequenced to a milestone. |
| `deprecated` | Exists in code but is being removed. Must name its removal milestone. |

`partial` is deliberately available. The honest state of a migration is mostly
partial, and a board that only offers done/not-done forces people to lie in one
direction or the other.

## Sequencing principle

Nothing in this programme is a rewrite. Every milestone moves one bounded domain
behind an interface the callers already use, with the previous implementation
still in place as a fallback, exactly as the flight-search extraction already
works today (`FLIGHT_SERVICE_URL`).

The order is chosen so that the **riskiest thing is never first**: reads before
writes, anonymous before authenticated, free before paid. Identity and money move
late, when the pattern is proven and boring.
