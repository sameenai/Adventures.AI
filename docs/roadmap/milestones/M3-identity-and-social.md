# M3 — Identity and the social graph

**Goal.** Move authentication and every user-owned write into Rust.

## Why this is the hard one

Everything before this was reads and anonymous traffic. This milestone owns
sessions, and a mistake logs out every user at once. It is deliberately third: by
now the substrate, the deploy pattern and the client contract are all proven, so
the only new risk is the domain itself.

## Scope

- **`identity` service** — Google OAuth, session issuance, profile, data export and
  deletion. Sessions must remain valid across the cutover: Rust validates the
  existing NextAuth JWTs during a dual-read window before issuing its own.
- **`social` service** — votes, comments, reactions, bookmarks, collections, follows,
  trip logs, the activity feed.
- **User-submitted adventures** move with the catalogue write path.
- **Race behaviour ports with the code.** The vote-concurrency test in
  `tests/db/concurrency.db.test.ts` has a Rust equivalent before the cutover, not after.

## Exit criteria

- [ ] Existing sessions survive the cutover — verified against a real pre-cutover token
- [ ] Every social write served by Rust with fallback unused for 7 days
- [ ] Vote races under concurrency produce a consistent counter, proven against real Postgres
- [ ] Data export and deletion verified end to end — regulatory, cannot regress
- [ ] Rate-limit stance preserved per route

## Risks

**Session invalidation.** Mitigated by the dual-read window and by keeping the
signing secret shared across both implementations until the window closes.

**Denormalised `voteCount` drift.** Two implementations writing the same counter is
the classic double-increment bug. Only one implementation owns writes at any moment;
the switch is per-route and atomic, never gradual.

## Features

`PLAN-002` · `PLAN-003` · `PLAN-004` · `TRIP-003` · `SOC-001` · `SOC-002` · `SOC-003` · `SOC-004` · `SOC-005` · `SOC-006` · `SOC-007` · `SOC-008` · `SOC-009` · `SOC-010` · `ACCT-001` · `ACCT-002` · `ACCT-004`
