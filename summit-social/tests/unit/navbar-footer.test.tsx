// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
  signOut: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/components/shared/notification-bell", () => ({
  NotificationBell: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

afterEach(() => {
  cleanup();
  mockPathname = "/";
});

describe("Navbar", () => {
  it("includes a Pro link in the nav links", () => {
    render(<Navbar />);
    const proLinks = screen.getAllByRole("link", { name: "Pro" });
    expect(proLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of proLinks) {
      expect(link).toHaveAttribute("href", "/pro");
    }
  });

  it("marks the matching link active with aria-current and amber styling", () => {
    mockPathname = "/adventures/adv-123";
    render(<Navbar />);
    const explore = screen.getByRole("link", { name: "Explore" });
    expect(explore).toHaveAttribute("aria-current", "page");
    expect(explore.className).toContain("text-amber-500");
    // A sibling link is not active
    const map = screen.getByRole("link", { name: "Map" });
    expect(map).not.toHaveAttribute("aria-current");
    expect(map.className).not.toContain("text-amber-500");
  });

  it("marks an exact path match active", () => {
    mockPathname = "/pro";
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Pro" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark any nav link active on the home path", () => {
    mockPathname = "/";
    render(<Navbar />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("does not treat /itineraries as active for the /itinerary link", () => {
    mockPathname = "/itineraries";
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "My Trips" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Plan" })).not.toHaveAttribute("aria-current");
  });

  it("applies active state in the mobile menu too", () => {
    mockPathname = "/pro";
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    const mobileNav = document.getElementById("mobile-nav");
    expect(mobileNav).not.toBeNull();
    const proLink = within(mobileNav as HTMLElement).getByRole("link", { name: "Pro" });
    expect(proLink).toHaveAttribute("aria-current", "page");
    expect(proLink.className).toContain("text-amber-500");
  });
});

describe("Footer", () => {
  it("includes a Pricing link to /pro", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pro");
  });

  it("keeps the Privacy and Terms links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});
