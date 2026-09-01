# ADR-0005 — Shared packages, and what does not get shared

**Status:** accepted · **Date:** 2026-09-01

## Context

A stated goal is components that can be leveraged for future products. The failure
mode of that goal is well known: a `common` or `shared` package that accumulates
everything, is depended on by everything, and can be changed by nobody.

## Decision

Sharing is allowed only along three seams, each with a rule for what belongs:

**`packages/api-client`** — generated from OpenAPI, never hand-edited. If it is wrong,
the server annotation is wrong.

**`packages/core`** — logic that must produce *identical results* on every client:
currency and distance formatting, season and hemisphere rules, difficulty ordering,
validation mirroring the server. The test: if web and mobile disagreeing would be a
bug, it belongs here. If they could reasonably differ, it does not.

**`packages/tokens`** — colour, type scale, spacing, motion. Consumed by both clients;
renders differently on each.

Everything else stays in its application until it has been **needed twice**. A second
real consumer is the entry fee for extraction; anticipated reuse is not.

Backend reuse follows the same rule but is judged per domain. `identity`, `billing`,
`media`, `notify` and `evals` are general enough that a second product would want them.
`catalog`, `cadence` and `flights` are Basecamper. Extraction happens in M7 and only
against a real second consumer.

## What we gave up

**Speed of reuse.** Waiting for a second consumer means the first product sometimes
writes something twice. That is cheaper than the alternative: an abstraction shaped
entirely by its only caller, which the second caller then has to fight.

## Consequences

- No `shared` or `common` package. Every package has a stated remit and a rule for entry.
- Extraction is a milestone with an exit criterion, not an aspiration.
- Duplication is tolerated deliberately and briefly, rather than removed prematurely.
