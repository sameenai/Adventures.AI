// @vitest-environment jsdom
import { UpgradeButton } from "@/app/(dashboard)/pro/upgrade-button";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const assignMock = vi.fn();
const originalLocation = window.location;

describe("UpgradeButton", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    assignMock.mockClear();
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, assign: assignMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("renders the upgrade button", () => {
    render(<UpgradeButton />);
    expect(screen.getByRole("button", { name: /upgrade to pro/i })).toBeTruthy();
  });

  it("POSTs to the checkout API with a JSON Accept header and navigates to the URL", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/sess_123" }),
    });
    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to pro/i }));

    await waitFor(() =>
      expect(assignMock).toHaveBeenCalledWith("https://checkout.stripe.com/sess_123"),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/checkout",
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json" },
      }),
    );
    // Stays in the loading state while the browser navigates
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the API error message when checkout fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Already on Pro plan" }),
    });
    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Already on Pro plan");
    expect(assignMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("shows a generic message when the response has no usable body", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("bad json");
      },
    });
    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Could not start checkout");
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows a generic message when fetch throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("Could not start checkout");
    expect(assignMock).not.toHaveBeenCalled();
  });
});
