// @vitest-environment jsdom
// Leaflet needs a window even to be imported, and the map itself cannot run
// under jsdom — so the failure-notice behavior is covered here through the
// extracted pure function the component consults after every viewport fetch.
import { describe, expect, it } from "vitest";

import { geoFetchStatus } from "@/components/explore/explore-map-inner";

describe("geoFetchStatus", () => {
  it("clears the notice on success", () => {
    expect(geoFetchStatus({ ok: true })).toBeNull();
  });

  it("names the rate limit on a 429 so waiting reads as the fix", () => {
    expect(geoFetchStatus({ ok: false, httpStatus: 429 })).toBe(
      "Map data paused — too many requests, try again in a minute",
    );
  });

  it("shows the generic notice for other http failures", () => {
    expect(geoFetchStatus({ ok: false, httpStatus: 500 })).toBe("Map data unavailable");
    expect(geoFetchStatus({ ok: false, httpStatus: 400 })).toBe("Map data unavailable");
  });

  it("shows the generic notice for network failures (no http status)", () => {
    expect(geoFetchStatus({ ok: false, httpStatus: null })).toBe("Map data unavailable");
  });
});
