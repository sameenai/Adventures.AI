// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null), toString: () => "" }),
  useTransition: () => [false, (fn: () => void) => fn()],
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

afterEach(cleanup);

// ---------------------------------------------------------------------------
// ViewCounter
// ---------------------------------------------------------------------------
import { ViewCounter } from "@/components/adventures/view-counter";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ViewCounter", () => {
  afterEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it("renders nothing when not author", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 10 }),
    });
    const { container } = render(<ViewCounter adventureId="adv-1" isAuthor={false} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("shows view count to author after fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 7 }),
    });
    render(<ViewCounter adventureId="adv-1" isAuthor={true} />);
    await waitFor(() => screen.getByText("7 views"));
    expect(screen.getByText("7 views")).toBeTruthy();
  });

  it("shows singular 'view' for count of 1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1 }),
    });
    render(<ViewCounter adventureId="adv-1" isAuthor={true} />);
    await waitFor(() => screen.getByText("1 view"));
    expect(screen.getByText("1 view")).toBeTruthy();
  });

  it("posts to the view endpoint with fingerprint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 3 }),
    });
    render(<ViewCounter adventureId="adv-42" isAuthor={false} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/adventures/adv-42/view");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.fingerprint).toContain("adv-42");
  });
});

// ---------------------------------------------------------------------------
// ExportButton
// ---------------------------------------------------------------------------
import { ExportButton } from "@/components/itinerary/export-button";

describe("ExportButton", () => {
  it("renders an export button", () => {
    render(
      <ExportButton
        title="Nepal Trek"
        description="A great adventure"
        days={[]}
        travellers={2}
        budget={2000}
        status="PLANNING"
      />,
    );
    expect(screen.getByText("Export .md")).toBeTruthy();
  });

  it("triggers a download on click", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:url");
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = createElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: click });
      }
      return el;
    });

    const days = [
      {
        dayNumber: 1,
        title: "Arrival",
        description: "Fly in",
        activities: [{ time: "09:00", activity: "Land", location: "KTM", notes: "Collect bags" }],
      },
    ];

    render(
      <ExportButton
        title="Nepal Trek"
        description={null}
        days={days}
        travellers={1}
        budget={null}
        status="DRAFT"
      />,
    );

    fireEvent.click(screen.getByText("Export .md"));
    expect(click).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ManageAdventureActions — publish toggle
// ---------------------------------------------------------------------------
import { ManageAdventureActions } from "@/components/profile/manage-adventure-actions";

describe("ManageAdventureActions publish toggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Publish button when adventure is a draft", () => {
    render(<ManageAdventureActions adventureId="adv-1" published={false} />);
    expect(screen.getByText("Publish")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("shows Unpublish button when adventure is published", () => {
    render(<ManageAdventureActions adventureId="adv-1" published={true} />);
    expect(screen.getByText("Unpublish")).toBeTruthy();
    expect(screen.queryByText("Draft")).toBeNull();
  });

  it("calls publish API on toggle click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "adv-1", published: true }),
    });
    render(<ManageAdventureActions adventureId="adv-1" published={false} />);
    fireEvent.click(screen.getByText("Publish"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/adventures/adv-1/publish",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
