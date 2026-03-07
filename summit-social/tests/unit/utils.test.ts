import { describe, expect, it } from "vitest";
import { formatDuration, formatPrice, monthName, pluralise, truncate } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats pence to pounds", () => {
    expect(formatPrice(15000)).toBe("£150");
    expect(formatPrice(99)).toBe("£1");
    expect(formatPrice(0)).toBe("£0");
  });
});

describe("formatDuration", () => {
  it("formats minutes to hours and minutes", () => {
    expect(formatDuration(135)).toBe("2h 15m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(45)).toBe("45m");
  });
});

describe("pluralise", () => {
  it("handles singular and plural", () => {
    expect(pluralise(1, "day")).toBe("1 day");
    expect(pluralise(5, "day")).toBe("5 days");
    expect(pluralise(2, "person", "people")).toBe("2 people");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
    expect(truncate("Short", 10)).toBe("Short");
  });
});

describe("monthName", () => {
  it("returns short month names", () => {
    expect(monthName(1)).toBe("Jan");
    expect(monthName(12)).toBe("Dec");
  });
});
