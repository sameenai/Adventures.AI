// @vitest-environment jsdom
import { SaveMenu } from "@/components/adventures/save-menu";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

const collectionsPayload = [
  { id: "col-1", name: "Alps 2026" },
  { id: "col-2", name: "Rainy Day Ideas" },
];

function mockFetch() {
  const fn = vi.fn();
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("SaveMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the saved confirmation and the add-to-collection prompt", () => {
    mockFetch();
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    expect(screen.getByText("Saved to bucket list")).toBeTruthy();
    expect(screen.getByRole("button", { name: /add to collection\?/i })).toBeTruthy();
  });

  it("calls onClose when dismissed", () => {
    mockFetch();
    const onClose = vi.fn();
    render(<SaveMenu adventureId="adv-1" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("fetches and lists collections when the prompt is clicked", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue({ ok: true, json: async () => collectionsPayload });
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add to collection\?/i }));
    await waitFor(() => expect(screen.getByText("Alps 2026")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith("/api/collections");
    expect(screen.getByText("Rainy Day Ideas")).toBeTruthy();
  });

  it("shows an empty state when the user has no collections", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add to collection\?/i }));
    await waitFor(() => expect(screen.getByText(/no collections yet/i)).toBeTruthy());
  });

  it("POSTs the adventure to the chosen collection and confirms", async () => {
    const fetchMock = mockFetch();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => collectionsPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add to collection\?/i }));
    await waitFor(() => expect(screen.getByText("Alps 2026")).toBeTruthy());
    fireEvent.click(screen.getByText("Alps 2026"));
    await waitFor(() => expect(screen.getByText(/added to/i)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/collections/col-1/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ adventureId: "adv-1" }),
      }),
    );
    expect(screen.getByText("Alps 2026")).toBeTruthy();
  });

  it("shows an error state with retry when loading collections fails", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add to collection\?/i }));
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeTruthy());

    // Retry succeeds
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => collectionsPayload });
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Alps 2026")).toBeTruthy());
  });

  it("shows an error state when adding to a collection fails", async () => {
    const fetchMock = mockFetch();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => collectionsPayload })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    render(<SaveMenu adventureId="adv-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add to collection\?/i }));
    await waitFor(() => expect(screen.getByText("Alps 2026")).toBeTruthy());
    fireEvent.click(screen.getByText("Alps 2026"));
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeTruthy());
  });
});
