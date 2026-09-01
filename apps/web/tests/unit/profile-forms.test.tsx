// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// OpenAiKeyForm
// ---------------------------------------------------------------------------
import { OpenAiKeyForm } from "@/app/(dashboard)/profile/edit/openai-key-form";

describe("OpenAiKeyForm — no key saved", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders password input and Save Key button when no key", () => {
    render(<OpenAiKeyForm initialHasKey={false} initialHint={null} />);
    expect(screen.getByPlaceholderText("sk-...")).toBeTruthy();
    expect(screen.getByRole("button", { name: /save key/i })).toBeTruthy();
  });

  it("Save Key button is disabled until at least 20 chars typed", () => {
    render(<OpenAiKeyForm initialHasKey={false} initialHint={null} />);
    const btn = screen.getByRole("button", { name: /save key/i });
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-short" },
    });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-aaaaaaaaaaaaaaaaaaaaaa" },
    });
    expect(btn).not.toBeDisabled();
  });

  it("saves key and shows hint on success", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ hasKey: true, hint: "sk-proj…xyz4" }),
    });
    render(<OpenAiKeyForm initialHasKey={false} initialHint={null} />);
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-aaaaaaaaaaaaaaaaaaaaaa" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save key/i }));
    await waitFor(() => expect(screen.getByText("sk-proj…xyz4")).toBeTruthy());
    expect(screen.getByText(/key saved/i)).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/openai-key",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows error message on failed save", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Key is too short" }),
    });
    render(<OpenAiKeyForm initialHasKey={false} initialHint={null} />);
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-aaaaaaaaaaaaaaaaaaaaaa" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save key/i }));
    await waitFor(() => expect(screen.getByText("Key is too short")).toBeTruthy());
  });

  it("shows generic error when fetch throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    render(<OpenAiKeyForm initialHasKey={false} initialHint={null} />);
    fireEvent.change(screen.getByPlaceholderText("sk-..."), {
      target: { value: "sk-aaaaaaaaaaaaaaaaaaaaaa" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save key/i }));
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeTruthy());
  });
});

describe("OpenAiKeyForm — key already saved", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows hint and Remove Key button when key is present", () => {
    render(<OpenAiKeyForm initialHasKey={true} initialHint="sk-proj…xyz4" />);
    expect(screen.getByText("sk-proj…xyz4")).toBeTruthy();
    expect(screen.getByRole("button", { name: /remove key/i })).toBeTruthy();
    expect(screen.queryByPlaceholderText("sk-...")).toBeNull();
  });

  it("removes key and shows success message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ hasKey: false, hint: null }),
    });
    render(<OpenAiKeyForm initialHasKey={true} initialHint="sk-proj…xyz4" />);
    fireEvent.click(screen.getByRole("button", { name: /remove key/i }));
    await waitFor(() => expect(screen.getByText(/using shared quota/i)).toBeTruthy());
    expect(screen.getByPlaceholderText("sk-...")).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/openai-key",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows error when removal fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    render(<OpenAiKeyForm initialHasKey={true} initialHint="sk-proj…xyz4" />);
    fireEvent.click(screen.getByRole("button", { name: /remove key/i }));
    await waitFor(() => expect(screen.getByText(/failed to remove key/i)).toBeTruthy());
  });

  it("shows generic error when remove throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    render(<OpenAiKeyForm initialHasKey={true} initialHint="sk-proj…xyz4" />);
    fireEvent.click(screen.getByRole("button", { name: /remove key/i }));
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeTruthy());
  });
});
