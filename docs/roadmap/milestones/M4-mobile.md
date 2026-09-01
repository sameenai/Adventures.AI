# M4 — React Native

**Goal.** A native client that makes the product genuinely mobile, not a website in
a shell.

## Why now and not earlier

A mobile client against an unstable API is wasted work — every contract change costs
two implementations. By M4 the contract is generated and the read and write paths are
settled, so the app is built once.

## Scope

- **`apps/mobile`** — React Native via Expo, consuming the same `packages/api-client`
  as the web app. Shared business logic lives in `packages/core`; UI primitives are
  per-platform over shared design tokens (see [ADR-0005](../../adr/0005-shared-packages.md)).
- **Offline-first itineraries.** The capability that only mobile can offer: an
  expedition has no signal, and a plan you cannot open in the field is not a plan.
  Local cache with background sync and explicit conflict rules.
- **Push notifications** for the cadence nudge — a nudge belongs on a phone, not
  in an inbox.
- **Field trip logging** — mark an adventure done where it happens.
- **Native map** for explore.

## Exit criteria

- [ ] iOS and Android builds in TestFlight and Play internal testing
- [ ] Itineraries readable with the device in airplane mode
- [ ] Push delivery verified for the cadence nudge
- [ ] Cold start under 2 s on a mid-range Android device
- [ ] Mobile E2E suite green in CI (Maestro)

## Risks

**App-store billing rules.** Selling a subscription inside the app may require
store billing and its revenue share. Decide before building the paywall: either
web-only checkout (with the app linking out where policy permits) or store billing
with Stripe reserved for web. This is a commercial decision, not an engineering one —
it needs an answer before M5.

**Two clients, one team.** Shared logic reduces this but does not remove it. The
answer is the generated client plus `packages/core`, not a cross-platform UI layer
that makes both surfaces mediocre.

## Features

`DISC-004` · `PLAN-007` · `RET-003` · `RET-005` · `PLAT-003`
