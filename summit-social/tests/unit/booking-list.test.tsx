// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BookingList } from "@/components/flights/booking-list";
import type { BookingListItem } from "@/components/flights/booking-list";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function makeBooking(overrides: Partial<BookingListItem> = {}): BookingListItem {
  return {
    id: "bk-1",
    status: "SELECTED",
    origin: "LHR",
    destination: "KTM",
    airline: "Qatar Airways",
    flightNumber: "QR-101",
    departureAt: "2026-10-04T08:30:00.000Z",
    priceGBP: 640,
    ...overrides,
  };
}

function stubFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("BookingList", () => {
  it("renders nothing for an empty list", () => {
    const { container } = render(<BookingList bookings={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders route, schedule, price, and status per row", () => {
    render(
      <BookingList
        bookings={[
          makeBooking(),
          makeBooking({ id: "bk-2", status: "TICKETED", origin: "LGW", destination: "GVA" }),
        ]}
      />,
    );
    expect(screen.getByText(/LHR → KTM/)).toBeTruthy();
    expect(screen.getAllByText(/departs 2026-10-04 08:30 UTC/)).toHaveLength(2);
    expect(screen.getByText("saved")).toBeTruthy();
    expect(screen.getByText("ticketed")).toBeTruthy();
  });

  it("offers confirm-and-pay only for payable states", () => {
    render(
      <BookingList
        bookings={[
          makeBooking({ id: "a", status: "SELECTED" }),
          makeBooking({ id: "b", status: "PRICE_CONFIRMED" }),
          makeBooking({ id: "c", status: "PAID" }),
          makeBooking({ id: "d", status: "CANCELLED" }),
        ]}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Confirm fare & pay" })).toHaveLength(2);
  });

  it("anchors a reprice failure to the row instead of navigating", async () => {
    const fetchMock = stubFetch(
      async () => new Response(JSON.stringify({ error: "Fare no longer available" }), { status: 409 }),
    );
    render(<BookingList bookings={[makeBooking()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm fare & pay" }));

    expect(await screen.findByText("Fare no longer available")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/bookings/bk-1/reprice");
  });

  it("notes a network failure and re-enables the row", async () => {
    stubFetch(async () => {
      throw new Error("offline");
    });
    render(<BookingList bookings={[makeBooking()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm fare & pay" }));

    expect(await screen.findByText("Network error — try again")).toBeTruthy();
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Confirm fare & pay" }) as HTMLButtonElement).disabled,
      ).toBe(false),
    );
  });

  it("surfaces a fare change, then hands off to Stripe checkout", async () => {
    const assignMock = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, assign: assignMock },
      writable: true,
      configurable: true,
    });
    stubFetch(async (url) => {
      if (String(url).endsWith("/reprice")) {
        return new Response(
          JSON.stringify({ priceChanged: true, booking: { priceGBP: 702 } }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ url: "https://checkout.stripe.test/s/1" }), {
        status: 200,
      });
    });
    render(<BookingList bookings={[makeBooking()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm fare & pay" }));

    await waitFor(() =>
      expect(assignMock).toHaveBeenCalledWith("https://checkout.stripe.test/s/1"),
    );
    expect(screen.getByText(/Fare updated to/)).toBeTruthy();
    Object.defineProperty(window, "location", { value: original, configurable: true });
  });

  it("notes a checkout failure after a clean reprice", async () => {
    stubFetch(async (url) => {
      if (String(url).endsWith("/reprice")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Payments unavailable" }), { status: 503 });
    });
    render(<BookingList bookings={[makeBooking()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm fare & pay" }));

    expect(await screen.findByText("Payments unavailable")).toBeTruthy();
  });
});
