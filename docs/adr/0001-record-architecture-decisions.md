# ADR-0001 — Record architecture decisions

**Status:** accepted · **Date:** 2026-09-01

## Context

The programme this repository is entering replaces most of its stack. Decisions of
that size get re-litigated every few months unless the reasoning is written down —
and the expensive part is never the decision, it is rediscovering why the obvious
alternative was rejected.

## Decision

Every architecturally significant decision gets a numbered file here. A decision is
significant if reversing it later would be expensive: choice of language, runtime,
data store, client architecture, or any contract between services.

Format: context, decision, consequences, and — mandatory — **what we gave up**. An
ADR that lists only benefits is marketing, not a record.

ADRs are immutable once accepted. A changed mind is a new ADR that supersedes the
old one, so the history of the reasoning survives.

## Consequences

Writing them costs time at the moment of decision, which is exactly when the
reasoning is cheapest to capture and most likely to be wrong if left implicit.
