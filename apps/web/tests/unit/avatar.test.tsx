// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The mock surfaces `unoptimized` as an attribute: it is the whole point of
// this component, and a passthrough that swallowed it would leave the bug this
// fixes untestable.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    unoptimized,
    width,
    fill,
    sizes,
  }: {
    src: string;
    alt: string;
    unoptimized?: boolean;
    width?: number;
    fill?: boolean;
    sizes?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      data-unoptimized={String(Boolean(unoptimized))}
      data-width={width === undefined ? "" : String(width)}
      data-fill={String(Boolean(fill))}
      data-sizes={sizes ?? ""}
    />
  ),
}));

import { Avatar, isVectorImage } from "@/components/ui/avatar";

afterEach(cleanup);

describe("isVectorImage", () => {
  it.each([
    ["https://api.dicebear.com/9.x/adventurer/svg?seed=Alex", true],
    ["https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo.svg", true],
    ["https://cdn.example.com/a.SVG", true],
    ["https://api.dicebear.com/9.x/adventurer/svg#frag", true],
    ["https://lh3.googleusercontent.com/a/ACg8oc=s96-c", false],
    ["/api/images/seed-adventure-41", false],
    ["https://upload.wikimedia.org/w/thumb.php?f=x.svg&w=64", false],
    // "svgomething" is not the format segment — the test pins that we match a
    // whole segment rather than a prefix.
    ["https://example.com/svgallery/portrait.jpg", false],
  ])("%s -> %s", (url, expected) => {
    expect(isVectorImage(url)).toBe(expected);
  });
});

describe("Avatar", () => {
  it("renders nothing without a source, so call sites need no guard", () => {
    const { container } = render(<Avatar src={null} name="Alex" size={32} />);
    expect(container.innerHTML).toBe("");
  });

  it("bypasses the optimizer for a vector source", () => {
    // Regression guard for a real outage: every default avatar is DiceBear SVG,
    // and the optimizer answers a vector with a 400 rather than passing it
    // through, so all of them rendered as broken images.
    render(
      <Avatar src="https://api.dicebear.com/9.x/adventurer/svg?seed=Alex" name="Alex" size={32} />,
    );
    expect(screen.getByAltText("Alex").getAttribute("data-unoptimized")).toBe("true");
  });

  it("keeps optimizing a raster source", () => {
    render(<Avatar src="https://lh3.googleusercontent.com/a/ACg8oc=s96-c" name="Maya" size={32} />);
    expect(screen.getByAltText("Maya").getAttribute("data-unoptimized")).toBe("false");
  });

  it("renders a fixed-size avatar at the requested size", () => {
    render(<Avatar src="/avatar.png" name="Alex" size={40} className="border" />);
    const img = screen.getByAltText("Alex");
    expect(img.getAttribute("data-width")).toBe("40");
    expect(img.getAttribute("data-fill")).toBe("false");
  });

  it("renders a fill avatar with its sizes hint", () => {
    render(<Avatar src="/avatar.png" name="Alex" fill sizes="40px" className="object-cover" />);
    const img = screen.getByAltText("Alex");
    expect(img.getAttribute("data-fill")).toBe("true");
    expect(img.getAttribute("data-sizes")).toBe("40px");
  });

  it("falls back to empty alt text for an unnamed user", () => {
    const { container } = render(<Avatar src="/avatar.png" name={null} size={24} />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });
});
