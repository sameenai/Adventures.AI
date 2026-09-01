# ADR-0006 — Checkout is web-only, through Stripe

**Status:** accepted · **Date:** 2026-09-01

## Context

[M4](../roadmap/milestones/M4-mobile.md) introduces a React Native client, which
raises a question the web-only product never had to answer: how does someone pay?

Apple and Google require their own in-app purchase systems for digital goods and
subscriptions sold inside an app, and take a platform commission on them. Stripe
is not permitted for that flow. The alternatives are:

1. **Store billing in the app** — build and maintain a second payment integration,
   a second entitlement source of truth, a second refund and dunning path, and
   accept the commission on every mobile subscription.
2. **Web-only checkout** — subscriptions are purchased on the web. The app reads
   entitlement and never sells.

## Decision

**Checkout is web-only, through Stripe.** The mobile app never presents a purchase
flow and never contains a price.

Concretely:

- Stripe Checkout and the customer portal stay on the web surface only.
- The mobile client reads subscription state from the `billing` service like any
  other piece of account state, and renders Pro features accordingly.
- Where a person on mobile hits a Pro-gated feature, the app explains what Pro is
  and that it is managed from their account on the web. It does not link straight
  to a purchase page, does not show a price, and does not use language that reads
  as a call to buy — the store rules on steering are specific and change, so the
  copy stays informational and is reviewed before each submission.
- Entitlement has exactly one source of truth: the Stripe subscription, reconciled
  through the existing webhook ledger.

## What we gave up

**Conversion on mobile.** Someone who discovers Pro on their phone has to finish on
the web. That is real friction and it will cost some sign-ups. It is accepted
deliberately: the commission is a permanent margin cost on every subscription,
while the friction applies only to the subset who both discover and decide on
mobile, and can be softened with an email or a saved link.

**A native-feeling upgrade moment.** Upgrading is the one flow that will feel like
it leaves the app, because it does.

## Consequences

- One payment integration, one entitlement model, one refund path. The `billing`
  service stays general enough to reuse (ADR-0005) precisely because it has no
  platform-specific branch.
- M4 loses the paywall from its scope. M5 keeps Stripe unchanged rather than
  growing a second implementation.
- App-store review risk concentrates in one place — the wording of the Pro
  explainer screen — rather than in a payment integration.
- If the commercial calculus changes (a large enough share of demand proves to be
  mobile-first), this is superseded by a new ADR, and the cost of reversing is
  building the store integration then rather than now.
