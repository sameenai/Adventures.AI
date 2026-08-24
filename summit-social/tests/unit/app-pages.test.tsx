// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// DashboardError (src/app/(dashboard)/error.tsx)
// ---------------------------------------------------------------------------
import DashboardError from "@/app/(dashboard)/error";

describe("DashboardError", () => {
  it("renders the error message", () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("Database connection failed")} reset={reset} />);
    expect(screen.getByText("Database connection failed")).toBeTruthy();
  });

  it("calls reset when Try Again is clicked", () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("oops")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows fallback text when error has no message", () => {
    const reset = vi.fn();
    const err = new Error("");
    render(<DashboardError error={err} reset={reset} />);
    expect(screen.getByText(/unexpected error occurred/i)).toBeTruthy();
  });

  it("logs the error to console on mount", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("log me");
    render(<DashboardError error={err} reset={vi.fn()} />);
    expect(spy).toHaveBeenCalledWith(err);
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// GlobalError (src/app/global-error.tsx)
// ---------------------------------------------------------------------------
import GlobalError from "@/app/global-error";

describe("GlobalError", () => {
  it("renders 'Basecamper is unavailable' heading", () => {
    render(<GlobalError error={new Error("fatal")} reset={vi.fn()} />);
    expect(screen.getByText(/basecamper is unavailable/i)).toBeTruthy();
  });

  it("renders Try Again button and calls reset on click", () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error("fatal")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("shows digest reference when error has a digest", () => {
    const err = Object.assign(new Error("fatal"), { digest: "abc123" });
    render(<GlobalError error={err} reset={vi.fn()} />);
    expect(screen.getByText(/abc123/)).toBeTruthy();
  });

  it("does not show reference block when no digest", () => {
    render(<GlobalError error={new Error("fatal")} reset={vi.fn()} />);
    expect(screen.queryByText(/reference:/i)).toBeNull();
  });

  it("logs the error to console on mount", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    render(<GlobalError error={err} reset={vi.fn()} />);
    expect(spy).toHaveBeenCalledWith(err);
    spy.mockRestore();
  });
});
