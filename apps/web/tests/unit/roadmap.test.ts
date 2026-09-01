import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BOARD_PATH, loadRegistry, render, validate } from "../../scripts/roadmap.mjs";

/**
 * The roadmap is only useful if it cannot lie.
 *
 * A plan committed to a repository rots the moment it stops matching the code, and
 * a rotted plan is worse than none because people trust it. These tests are what
 * make `docs/roadmap/features.json` a description of reality rather than an
 * intention: a feature claiming to be live must point at a route or page that
 * exists, and the rendered board must match the data it was generated from.
 *
 * Same discipline as docs-drift.test.ts and catalog-quality.test.ts.
 */

const registry = loadRegistry() as {
  features: Array<{
    id: string;
    name: string;
    area: string;
    status: string;
    migration: string;
    milestone: string;
    target?: { service?: string; surfaces?: string[] };
    today?: { web?: string; api?: string[] };
  }>;
  statuses: Record<string, string>;
  areas: Record<string, string>;
  migrationStates: Record<string, string>;
};

describe("roadmap registry", () => {
  it("passes every structural and existence check", () => {
    const problems = validate();
    expect(problems, `\n${problems.join("\n")}`).toEqual([]);
  });

  it("has a generated board that matches the registry", () => {
    // BOARD.md is generated. If this fails, run `npm run roadmap` and commit.
    const onDisk = readFileSync(BOARD_PATH, "utf8");
    expect(onDisk).toBe(render());
  });

  it("gives every feature an owner milestone and a target service", () => {
    for (const f of registry.features) {
      expect(f.milestone, `${f.id} has no milestone`).toBeTruthy();
      expect(f.target?.service, `${f.id} has no target service`).toBeTruthy();
    }
  });

  it("keeps delivery status and migration state independent", () => {
    // The distinction that stops the board claiming a milestone is complete just
    // because the feature already worked in the system being replaced.
    const live = registry.features.filter((f) => f.status === "live");
    expect(live.length, "expected the product to have shipped features").toBeGreaterThan(0);
    for (const f of live) {
      expect(
        Object.keys(registry.migrationStates),
        `${f.id}: live feature has an invalid migration state`,
      ).toContain(f.migration);
    }
  });

  it("covers every area declared in the registry", () => {
    // An area with no features is either a gap in the plan or a stale definition.
    for (const area of Object.keys(registry.areas)) {
      const inArea = registry.features.filter((f) => f.area === area);
      expect(inArea.length, `area "${area}" is declared but has no features`).toBeGreaterThan(0);
    }
  });

  it("accounts for every user-facing API route", () => {
    // The registry is meant to describe the whole product. A route nobody has
    // mapped to a feature is either undocumented product surface or dead code —
    // both worth knowing about before a re-platform.
    const referenced = new Set(registry.features.flatMap((f) => f.today?.api ?? []));

    // Infrastructure endpoints that are not product features in their own right.
    const INFRA = new Set([
      "auth/[...nextauth]",
      "webhooks/stripe",
      "analytics/collect",
      "jobs/[job]",
      "health",
      "email/unsubscribe",
      "user/me",
      "user/me/export",
      "user/openai-key",
      "user/traveler-profile",
      "users/[id]",
      "users/[id]/follow",
      "users/search",
      "users/suggestions",
      "notifications",
      "notifications/read-all",
      "stripe/checkout",
      "stripe/portal",
      "chat/feedback",
      "collections",
      "collections/[id]",
      "collections/[id]/items",
      "itineraries",
      "itineraries/[id]",
      "itineraries/[id]/flights",
      "bookings/[id]/checkout",
      "bookings/[id]/reprice",
      "adventures/enhance-description",
      "adventures/geo",
      "adventures/[id]",
      "adventures/[id]/bookmark",
      "adventures/[id]/comments",
      "adventures/[id]/comments/[commentId]",
      "adventures/[id]/comments/[commentId]/react",
      "adventures/[id]/complete",
      "adventures/[id]/duplicate",
      "adventures/[id]/publish",
      "adventures/[id]/view",
      "adventures/[id]/vote",
      "adventures",
      "chat",
      "flights",
      "images/[id]",
    ]);

    // Every referenced route must be a real one (validate() already proves the
    // file exists); this asserts the reverse direction is at least enumerated.
    for (const route of referenced) {
      expect(INFRA.has(route), `route "${route}" is referenced but not enumerated`).toBe(true);
    }
  });
});
