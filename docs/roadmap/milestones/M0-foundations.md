# M0 — Foundations

**Goal.** Put the monorepo shape, the API contract and the CI matrix in place
without changing a single line of behaviour.

## Why first

Every later milestone assumes three things exist: somewhere for Rust services and
JavaScript apps to live side by side, a machine-readable contract between them, and
a CI that runs both toolchains. Building those while also moving a domain would
confuse "the extraction is wrong" with "the scaffolding is wrong".

## Scope

- **Monorepo layout.** `apps/` for clients, `services/` for Rust, `packages/` for
  shared TypeScript. `apps/web/` stays exactly where it is and keeps serving
  production throughout; it moves to `apps/legacy-web/` only in M6.
- **API contract.** `utoipa` annotations on the existing Rust flight service emit an
  OpenAPI document. A generated TypeScript client is published as
  `packages/api-client`. No hand-written `fetch` calls in any new client code, ever.
- **CI matrix.** One workflow runs the Node jobs and the Rust jobs. Rust gains
  `cargo deny` alongside the existing `fmt`, `clippy` and `test`.
- **Roadmap tooling.** `npm run roadmap:check` becomes a required check.

## Exit criteria

- [ ] `packages/api-client` is generated from OpenAPI, published to the workspace, and consumed by at least one call in the existing web app
- [ ] CI runs Node and Rust jobs from one workflow, both required
- [ ] `npm run roadmap:check` is a required status check
- [ ] Production behaviour is byte-identical — no user-visible change

## Risks

**Generated-client drift.** If the generator runs manually, it will fall behind.
Generation happens in CI and the result is committed; a diff in the generated
client that is not in the commit fails the build.

## Features

`PLAT-006`
