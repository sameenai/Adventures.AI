import "@/styles/globals.css";
import "@/lib/env";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Space_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

// Every document must render at request time: the CSP script nonce is minted
// per request in src/middleware.ts and Next can only stamp it on its inline
// bootstrap scripts during SSR. A statically prerendered page would ship
// nonce-less scripts that the strict-dynamic policy blocks outright (dead
// login/signup). scripts/check-csp-prerender.mjs enforces this in CI.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: "#faf9f7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Minted per request by src/middleware.ts; next-themes needs it for its
  // inline anti-FOUC script (Next stamps its own scripts automatically).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-ink focus:font-display focus:text-xs focus:uppercase focus:tracking-widest"
        >
          Skip to main content
        </a>
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
