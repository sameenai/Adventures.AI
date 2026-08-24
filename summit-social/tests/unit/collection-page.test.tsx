// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    collection: { findUnique: vi.fn() },
    vote: { findMany: vi.fn().mockResolvedValue([]) },
    bookmark: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const notFoundError = new Error("NEXT_NOT_FOUND");
const redirectError = new Error("NEXT_REDIRECT");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
  redirect: vi.fn(() => {
    throw redirectError;
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/adventures/adventure-card", () => ({
  AdventureCard: ({
    adventure,
    hasBookmarked,
  }: {
    adventure: { id: string; title: string };
    hasBookmarked?: boolean;
  }) => (
    <div data-testid={`card-${adventure.id}`} data-bookmarked={hasBookmarked}>
      {adventure.title}
    </div>
  ),
}));

import CollectionPage from "@/app/(dashboard)/collections/[id]/page";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.collection.findUnique as ReturnType<typeof vi.fn>;
const mockVoteFindMany = prisma.vote.findMany as ReturnType<typeof vi.fn>;
const mockBookmarkFindMany = prisma.bookmark.findMany as ReturnType<typeof vi.fn>;

function makeItem(id: string, title: string) {
  return {
    adventureId: id,
    adventure: { id, title },
  };
}

const pageProps = { params: Promise.resolve({ id: "col-1" }) };

describe("CollectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoteFindMany.mockResolvedValue([]);
    mockBookmarkFindMany.mockResolvedValue([]);
  });
  afterEach(cleanup);

  it("redirects to /login when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(CollectionPage(pageProps)).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("calls notFound when the collection does not exist or belongs to another user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue(null);

    await expect(CollectionPage(pageProps)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    // Ownership is enforced in the query itself: a non-owner gets a 404
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "col-1", userId: "user-1" },
      }),
    );
  });

  it("renders the collection name, item count, and adventure cards", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "col-1",
      name: "Alpine Dreams",
      userId: "user-1",
      items: [makeItem("adv-1", "Nepal Trek"), makeItem("adv-2", "Patagonia Expedition")],
    });
    mockBookmarkFindMany.mockResolvedValue([{ adventureId: "adv-1" }]);

    render(await CollectionPage(pageProps));

    expect(screen.getByText("Alpine Dreams")).toBeTruthy();
    expect(screen.getByText("2 adventures")).toBeTruthy();
    expect(screen.getByText("Nepal Trek")).toBeTruthy();
    expect(screen.getByText("Patagonia Expedition")).toBeTruthy();
    expect(screen.getByTestId("card-adv-1")).toHaveAttribute("data-bookmarked", "true");
    expect(screen.getByTestId("card-adv-2")).toHaveAttribute("data-bookmarked", "false");
  });

  it("renders an empty state when the collection has no items", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "col-1",
      name: "Empty Shelf",
      userId: "user-1",
      items: [],
    });

    render(await CollectionPage(pageProps));

    expect(screen.getByText("Empty Shelf")).toBeTruthy();
    expect(screen.getByText(/no adventures in this collection yet/i)).toBeTruthy();
    expect(screen.getByText(/nothing here yet/i)).toBeTruthy();
  });
});
