import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cn, formatDuration, formatPrice, monthName, pluralise, timeAgo, truncate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("filters falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatPrice", () => {
  it("formats pence to pounds", () => {
    expect(formatPrice(15000)).toBe("£150");
    expect(formatPrice(0)).toBe("£0");
  });

  it("rounds down fractional pence", () => {
    expect(formatPrice(99)).toBe("£1");
  });

  it("formats large amounts", () => {
    expect(formatPrice(1000000)).toBe("£10,000");
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes together", () => {
    expect(formatDuration(135)).toBe("2h 15m");
  });

  it("omits minutes when zero", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("omits hours when zero", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(1)).toBe("1m");
  });

  it("handles zero minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});

describe("pluralise", () => {
  it("uses singular for count of 1", () => {
    expect(pluralise(1, "day")).toBe("1 day");
  });

  it("uses plural for count other than 1", () => {
    expect(pluralise(5, "day")).toBe("5 days");
    expect(pluralise(0, "day")).toBe("0 days");
  });

  it("uses custom plural when provided", () => {
    expect(pluralise(2, "person", "people")).toBe("2 people");
    expect(pluralise(1, "person", "people")).toBe("1 person");
  });
});

describe("truncate", () => {
  it("truncates strings longer than maxLength", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });

  it("returns string unchanged when within maxLength", () => {
    expect(truncate("Short", 10)).toBe("Short");
    expect(truncate("Exact", 5)).toBe("Exact");
  });

  it("handles edge case of maxLength=3 (just ellipsis)", () => {
    expect(truncate("Hello", 3)).toBe("...");
  });
});

describe("monthName", () => {
  it("returns short month names for all months", () => {
    // Use the actual locale output to avoid platform differences (e.g. en-GB returns "Sept" not "Sep")
    for (let i = 1; i <= 12; i++) {
      const expected = new Date(2024, i - 1).toLocaleString("en-GB", { month: "short" });
      expect(monthName(i)).toBe(expected);
    }
  });

  it("returns Jan for month 1 and Dec for month 12", () => {
    expect(monthName(1)).toBe("Jan");
    expect(monthName(12)).toBe("Dec");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for very recent dates", () => {
    expect(timeAgo(new Date("2025-06-15T11:59:55Z"))).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(timeAgo(new Date("2025-06-15T11:55:00Z"))).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(timeAgo(new Date("2025-06-15T09:00:00Z"))).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(timeAgo(new Date("2025-06-12T12:00:00Z"))).toBe("3d ago");
  });

  it("returns weeks ago", () => {
    expect(timeAgo(new Date("2025-06-01T12:00:00Z"))).toBe("2w ago");
  });

  it("returns months ago", () => {
    expect(timeAgo(new Date("2025-03-15T12:00:00Z"))).toBe("3mo ago");
  });

  it("returns years ago", () => {
    expect(timeAgo(new Date("2023-06-15T12:00:00Z"))).toBe("2y ago");
  });
});

// ---------------------------------------------------------------------------
// getClientIp (lib/request.ts)
// ---------------------------------------------------------------------------
import { getClientIp } from "@/lib/request";
import { NextRequest } from "next/server";

describe("getClientIp", () => {
  const withXff = (value?: string) =>
    new NextRequest("http://localhost/api/test", {
      headers: value ? { "x-forwarded-for": value } : {},
    });

  it("returns unknown when the header is absent", () => {
    expect(getClientIp(withXff())).toBe("unknown");
  });

  it("uses the LAST hop — the one appended by the trusted proxy", () => {
    expect(getClientIp(withXff("1.2.3.4, 5.6.7.8"))).toBe("5.6.7.8");
  });

  it("cannot be spoofed by a client-supplied leading entry", () => {
    expect(getClientIp(withXff("evil-fake-ip, 9.9.9.9"))).toBe("9.9.9.9");
  });

  it("handles a single-hop header", () => {
    expect(getClientIp(withXff("8.8.4.4"))).toBe("8.8.4.4");
  });
});
