import Image from "next/image";

/**
 * Does this URL point at a vector image?
 *
 * Only the URL is available at render time — these are server components, so
 * there is no `onError` to fall back from — and the answer has to be good
 * enough to route the request correctly. Both forms we serve are covered: a
 * `.svg` extension, and a trailing `/svg` path segment (DiceBear puts the
 * format there). A wrong guess degrades rather than breaks: a missed vector
 * renders as it does today, and a raster mistaken for one is simply served
 * unresized.
 */
export function isVectorImage(src: string): boolean {
  const path = src.split(/[?#]/)[0];
  return /(\.svg|\/svg)$/i.test(path);
}

type Common = {
  /** Nothing renders when this is absent, which is what every call site wants. */
  src: string | null | undefined;
  name: string | null;
  className?: string;
};

type AvatarProps = Common & ({ size: number } | { fill: true; sizes: string });

/**
 * A user's avatar.
 *
 * The one thing this centralises beyond markup: the image optimizer is a raster
 * resizer, and with `dangerouslyAllowSVG` off — where it belongs, since
 * `remotePatterns` covers hosts that serve user-uploaded SVG — it rejects a
 * vector outright with a 400 rather than passing it through. Our default
 * avatars are DiceBear SVG, so routing them through it turned every one into a
 * broken image. Serving those straight from source loses nothing: there is no
 * smaller version of a vector for the optimizer to produce.
 */
export function Avatar(props: AvatarProps) {
  const { src, name, className } = props;
  if (!src) return null;

  const shared = {
    src,
    alt: name ?? "",
    className,
    unoptimized: isVectorImage(src),
  };

  return "size" in props ? (
    <Image {...shared} width={props.size} height={props.size} />
  ) : (
    <Image {...shared} fill sizes={props.sizes} />
  );
}
