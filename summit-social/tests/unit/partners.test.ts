import {
  formatDepartureLabel,
  nextBestDeparture,
  operatorBookingUrl,
  partnerLinks,
} from "@/lib/partners/deep-links";
import { describe, expect, it } from "vitest";

const adventure = {
  location: "Torres del Paine",
  country: "Chile",
  bestMonths: [11, 12, 1, 2],
  durationDays: 8,
};

describe("nextBestDeparture", () => {
  it("returns the 1st of the soonest upcoming best month", () => {
    // From 24 Aug 2026, best months Mar + Oct → Oct 1 2026 is soonest.
    const from = new Date(2026, 7, 24);
    const result = nextBestDeparture([3, 10], from);
    expect(result.getTime()).toBe(new Date(2026, 9, 1).getTime());
  });

  it("wraps December into January of the next year", () => {
    // Mid-December, only January is a best month → Jan 1 next year.
    const from = new Date(2026, 11, 15);
    const result = nextBestDeparture([1], from);
    expect(result.getTime()).toBe(new Date(2027, 0, 1).getTime());
  });

  it("rolls a best month whose 1st has already passed into next year", () => {
    // Mid-December with December as the only best month → Dec 1 next year.
    const from = new Date(2026, 11, 15);
    const result = nextBestDeparture([12], from);
    expect(result.getTime()).toBe(new Date(2027, 11, 1).getTime());
  });

  it("falls back to 60 days out when bestMonths is empty", () => {
    const from = new Date(2026, 0, 1);
    const result = nextBestDeparture([], from);
    expect(result.getTime()).toBe(new Date(2026, 0, 61).getTime());
  });

  it("ignores out-of-range month values", () => {
    const from = new Date(2026, 0, 1);
    const result = nextBestDeparture([0, 13, -5], from);
    expect(result.getTime()).toBe(new Date(2026, 0, 61).getTime());
  });
});

describe("formatDepartureLabel", () => {
  it("renders a human-readable date", () => {
    expect(formatDepartureLabel(new Date(2027, 2, 1))).toBe("1 March 2027");
  });
});

describe("partnerLinks", () => {
  const departure = new Date(2027, 2, 1); // 1 March 2027

  it("builds GetYourGuide, Viator, and Google Flights links with the departure date", () => {
    const links = partnerLinks(adventure, { departure });
    const hrefs = links.map((l) => l.href);
    expect(hrefs).toContain(
      "https://www.getyourguide.com/s/?q=Torres%20del%20Paine%20Chile&date_from=2027-03-01",
    );
    expect(hrefs).toContain(
      "https://www.viator.com/searchResults/all?text=Torres%20del%20Paine%20Chile",
    );
    expect(hrefs).toContain(
      "https://www.google.com/travel/flights?q=flights%20to%20Torres%20del%20Paine%20on%202027-03-01",
    );
  });

  it("omits the Skyscanner link when no origin is known", () => {
    const links = partnerLinks(adventure, { departure });
    expect(links).toHaveLength(3);
    expect(links.some((l) => l.href.includes("skyscanner"))).toBe(false);
  });

  it("includes a Skyscanner everywhere search when an origin is provided", () => {
    const links = partnerLinks(adventure, { departure, origin: "LHR" });
    const skyscanner = links.find((l) => l.href.includes("skyscanner"));
    expect(skyscanner?.href).toBe(
      "https://www.skyscanner.net/transport/flights/lhr/everywhere/270301/",
    );
    expect(skyscanner?.note).toContain("LHR");
  });

  it("URI-encodes special characters in location and country", () => {
    const links = partnerLinks(
      { location: "Sóller & Sa Calobra", country: "Spain", bestMonths: [], durationDays: 3 },
      { departure },
    );
    const gyg = links.find((l) => l.href.includes("getyourguide"));
    expect(gyg?.href).toBe(
      "https://www.getyourguide.com/s/?q=S%C3%B3ller%20%26%20Sa%20Calobra%20Spain&date_from=2027-03-01",
    );
    const google = links.find((l) => l.href.includes("google"));
    expect(google?.href).toBe(
      "https://www.google.com/travel/flights?q=flights%20to%20S%C3%B3ller%20%26%20Sa%20Calobra%20on%202027-03-01",
    );
  });

  it("derives the departure from bestMonths when none is given", () => {
    const links = partnerLinks(adventure);
    const gyg = links.find((l) => l.href.includes("getyourguide"));
    const dateFrom = gyg?.href.split("date_from=")[1];
    expect(dateFrom).toMatch(/^\d{4}-\d{2}-01$/);
    const month = Number(dateFrom?.split("-")[1]);
    expect(adventure.bestMonths).toContain(month);
  });
});

describe("operatorBookingUrl", () => {
  const departure = new Date(2027, 2, 1);

  it("fills {date} and {pax} placeholders", () => {
    const url = operatorBookingUrl(
      "https://booking.example.com/tour?start={date}&travellers={pax}",
      departure,
      2,
    );
    expect(url).toBe("https://booking.example.com/tour?start=2027-03-01&travellers=2");
  });

  it("replaces every occurrence of a placeholder", () => {
    const url = operatorBookingUrl(
      "https://example.com/{date}/book?d={date}&n={pax}&max={pax}",
      departure,
      4,
    );
    expect(url).toBe("https://example.com/2027-03-01/book?d=2027-03-01&n=4&max=4");
  });

  it("passes through a plain http(s) url with no placeholders", () => {
    expect(operatorBookingUrl("https://example.com/book", departure, 1)).toBe(
      "https://example.com/book",
    );
  });

  it("rejects a javascript: template", () => {
    expect(operatorBookingUrl("javascript:alert(1)", departure, 1)).toBeNull();
    expect(operatorBookingUrl("javascript:alert('{date}')", departure, 1)).toBeNull();
  });

  it("rejects non-http schemes and unparseable templates", () => {
    expect(operatorBookingUrl("data:text/html,hi", departure, 1)).toBeNull();
    expect(operatorBookingUrl("/relative/path?d={date}", departure, 1)).toBeNull();
    expect(operatorBookingUrl("not a url at all", departure, 1)).toBeNull();
  });

  it("clamps pax to at least 1", () => {
    expect(operatorBookingUrl("https://example.com/?n={pax}", departure, 0)).toBe(
      "https://example.com/?n=1",
    );
  });
});
