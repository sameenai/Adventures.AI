// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/a11y/useAltText: test mock
    <img src={src} alt={alt} />
  ),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, timeAgo: () => "2 days ago" };
});

afterEach(cleanup);

// ---------------------------------------------------------------------------
// CommentForm
// ---------------------------------------------------------------------------
import { CommentForm } from "@/components/adventures/comment-form";

describe("CommentForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders textarea with default placeholder", () => {
    render(<CommentForm adventureId="adv-1" />);
    expect(screen.getByPlaceholderText(/share your experience/i)).toBeTruthy();
  });

  it("Post button is disabled when textarea is empty", () => {
    render(<CommentForm adventureId="adv-1" />);
    expect(screen.getByRole("button", { name: /post/i })).toBeDisabled();
  });

  it("enables Post button when text is typed", () => {
    render(<CommentForm adventureId="adv-1" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Great trip!" } });
    expect(screen.getByRole("button", { name: /post/i })).not.toBeDisabled();
  });

  it("submits to correct API endpoint", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<CommentForm adventureId="adv-1" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Amazing route!" } });
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1/comments",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clears textarea after successful submission", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<CommentForm adventureId="adv-1" />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Nice one!" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(textarea.value).toBe(""));
  });

  it("shows error message when fetch returns 400", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Body too long" }),
    });
    render(<CommentForm adventureId="adv-1" />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "x" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(screen.getByText("Body too long")).toBeTruthy());
  });

  it("shows rate limit error for 429 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ retryAfter: 30 }),
    });
    render(<CommentForm adventureId="adv-1" />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(screen.getByText(/too many comments/i)).toBeTruthy());
    expect(screen.getByText(/30s/)).toBeTruthy();
  });

  it("shows generic error on network failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    render(<CommentForm adventureId="adv-1" />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Something" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeTruthy());
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<CommentForm adventureId="adv-1" onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("includes parentId in request body when provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<CommentForm adventureId="adv-1" parentId="c-42" />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "A reply!" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.parentId).toBe("c-42");
  });
});

// ---------------------------------------------------------------------------
// CommentSection — interactive behaviours
// ---------------------------------------------------------------------------
import { CommentSection } from "@/components/adventures/comment-section";
import type { CommentWithUser } from "@/types";

const ownerComment: CommentWithUser = {
  id: "c-1",
  body: "Loved it!",
  adventureId: "adv-1",
  parentId: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  userId: "user-1",
  user: { id: "user-1", name: "Alice", avatarUrl: null },
  replies: [],
  _count: { reactions: 0 },
  viewerReacted: false,
};

describe("CommentSection — delete", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Edit and Delete buttons for comment owner", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("does not show Edit/Delete for non-owner", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-2"
      />,
    );
    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.queryByText("Delete")).toBeNull();
  });

  it("removes comment from view after confirming delete", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    fireEvent.click(screen.getByText("Delete"));
    // Confirmation modal should now be open
    fireEvent.click(screen.getByRole("button", { name: /delete comment/i }));
    await waitFor(() => expect(screen.queryByText("Loved it!")).toBeNull());
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/adventures/adv-1/comments/${ownerComment.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does not delete when confirmation modal is cancelled", async () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    fireEvent.click(screen.getByText("Delete"));
    // Cancel in the confirmation modal
    const cancelBtns = screen.getAllByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtns[cancelBtns.length - 1]);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Loved it!")).toBeTruthy();
  });
});

describe("CommentSection — edit", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows edit textarea after clicking Edit", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByRole("button", { name: /save/i })).toBeTruthy();
  });

  it("saves edited comment and shows new body", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated body!" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(screen.getByText("Updated body!")).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/adventures/adv-1/comments/${ownerComment.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("exits edit mode without saving when Cancel is clicked", () => {
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-1"
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Loved it!")).toBeTruthy();
  });
});

describe("CommentSection — reactions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls react API on thumb click by logged-in user", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ reacted: true, count: 1 }),
    });
    render(
      <CommentSection
        adventureId="adv-1"
        comments={[ownerComment]}
        currentUserId="user-2"
      />,
    );
    fireEvent.click(screen.getByText("👍"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/adventures/adv-1/comments/${ownerComment.id}/react`,
      expect.objectContaining({ method: "POST" }),
    );
  });
});
