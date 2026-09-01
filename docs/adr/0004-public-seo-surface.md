# ADR-0004 — The public surface stays server-rendered

**Status:** accepted · **Date:** 2026-09-01

## Context

This is the one place where "the front end becomes entirely React and React Native"
needs qualifying, and the qualification is important enough to record on its own.

Basecamper is a **discovery** product. Its catalogue is 1,000 adventure pages across
143 countries — a thousand indexable, linkable, shareable landing pages, each with
substantial unique content. Those pages are the acquisition channel. Today Next.js
server-renders them and they are crawlable.

A client-rendered single-page application serves a near-empty HTML shell and fills it
with JavaScript. Search crawlers do execute JavaScript, but they do it slowly, with a
budget, and inconsistently across engines and social scrapers. Link previews on
messaging apps generally do not execute it at all — which matters for a product people
share.

The failure mode is nasty: nothing breaks, traffic decays over weeks, and by the time
it is visible it is hard to attribute to the migration.

## Decision

Split by audience, not by technology:

| Surface | Who | Rendering |
| --- | --- | --- |
| Public catalogue — adventure pages, profiles, landing | Anonymous visitors, crawlers, social scrapers | **Server-rendered HTML** with JSON-LD structured data and Open Graph tags |
| The application — planner, social, account, booking | Signed-in users | **React SPA** (`apps/web`) |
| Mobile | Signed-in users | **React Native** (`apps/mobile`) |

The public surface is rendered by the Rust core using a templating layer
(`askama` or `minijinja`), reading from the same `catalog` service the SPA uses. It is
mostly static, cacheable at the edge, and carries almost no JavaScript — which makes
it faster than what exists today, not slower.

A crawl check runs in CI: the set of indexable URLs before and after a change must not
shrink unexpectedly.

## What we gave up

**A single rendering model.** There are now two ways a page can reach a user. The
boundary is drawn where it is cheapest to defend — signed-out versus signed-in — and
it is a boundary the product already has.

**Sharing components between the public pages and the app.** The public pages are
templates in Rust, not React. They are simple enough (a hero, prose, a gear list, a
map) that this costs little, and it keeps the acquisition surface free of the client
bundle entirely.

## Consequences

- The acquisition channel is protected by construction rather than by hoping crawlers keep up.
- Public pages get faster: no hydration, no client bundle, edge-cacheable.
- Two rendering paths for a small number of page types. Documented, bounded, tested.
- If measurement later shows crawlers handle the SPA fine, this ADR can be superseded —
  but the burden of proof sits with removing the server-rendered surface, not keeping it.
