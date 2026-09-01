# M5 — Money and the assistant

**Goal.** The two domains where being wrong is most expensive.

## Scope

- **`billing` service** — Stripe via `async-stripe`. Checkout, portal, webhooks,
  booking checkout and repricing. Webhook idempotency keeps the `StripeEvent` ledger:
  a redelivered event must stay a no-op.
- **`assistant` service** — streaming chat over SSE, six tools, tool execution with
  direct database access instead of HTTP round-trips through its own API.
- **Evals move with the code.** The harness in `evals/` — nine graders, 22 golden and
  9 adversarial transcripts, the surface hash — runs against the Rust endpoint and
  stays a required check. The adversarial transcripts must keep *failing*.

## Exit criteria

- [ ] Aggregate eval score at or above the current baseline, on the same dataset
- [ ] Adversarial transcripts still fail — graders have not lost their teeth
- [ ] Stripe webhook replay proven idempotent against a real database
- [ ] Repricing before payment verified: a stale fare cannot reach a charge
- [ ] Streaming latency to first token at or below current

## Risks

**Silent assistant regression.** A port that compiles and answers plausibly can
still be worse. The eval gate is the control, and it is why the harness moves in the
same milestone as the code rather than after it.

**Double-charging.** The `StripeEvent` ledger is the guard. Its test moves first.

## Features

`PLAN-001` · `PLAN-005` · `PLAN-006` · `TRIP-004` · `ACCT-003` · `ACCT-005`
