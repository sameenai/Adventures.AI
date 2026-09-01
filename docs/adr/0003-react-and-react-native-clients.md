# ADR-0003 — React on the web, React Native on mobile

**Status:** accepted · **Date:** 2026-09-01

## Context

The product has no mobile client. Its users are people planning and doing expeditions —
the moments that matter (logging a summit, reading tomorrow's route with no signal)
happen on a phone, in a place with bad connectivity. A responsive website cannot do
offline storage, push, or background sync well.

## Decision

Two clients, one contract:

- **`apps/web`** — React 19 with Vite, TanStack Router and TanStack Query.
- **`apps/mobile`** — React Native via Expo.

Both consume `packages/api-client`, generated from the Rust core's OpenAPI document.
No hand-written `fetch` calls in either client.

Shared code is split deliberately:

- `packages/api-client` — generated. Never edited.
- `packages/core` — business rules that must agree across clients: formatting, unit
  conversion, difficulty and season logic, validation mirroring the server's.
- `packages/tokens` — design tokens (colour, type scale, spacing) consumed by both.

**UI components are not shared.** Each platform gets primitives built for it, over
shared tokens and shared headless hooks.

## What we gave up

**A single cross-platform UI layer.** React Native Web would let one component tree
serve both. It was rejected because it makes the web surface worse — heavier, less
accessible, further from the platform — to save duplication in the thinnest layer of
the stack. Sharing tokens and logic captures most of the benefit; sharing rendered
components captures the rest at the cost of both surfaces being slightly wrong.

**Next.js conveniences** — image optimisation, file-system routing, server actions.
Each now has an explicit replacement rather than a framework default.

## Consequences

- Mobile becomes a first-class surface rather than a responsive afterthought.
- Two UI implementations to maintain. Accepted; bounded to presentation only.
- The public SEO surface is **not** covered by this decision — see ADR-0004.
