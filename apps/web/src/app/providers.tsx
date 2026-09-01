"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      // next-themes injects an inline anti-FOUC script; without the request's
      // CSP nonce the strict-dynamic policy blocks it (wrong initial theme).
      nonce={nonce}
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
