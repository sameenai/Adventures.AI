"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * First-party page-view beacon. No cookies, no third-party script, nothing
 * persisted on the device; the server keys anonymous views on a salted hash
 * that rotates daily. Browsers signalling Do-Not-Track or Global Privacy
 * Control are respected by never sending at all.
 */
export function PageViewPing() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    // Dynamic segments stay un-identifying: /adventures/abc123 → /adventures/[id]
    const path = pathname.replace(/\/[a-z0-9]{20,}/gi, "/[id]").slice(0, 200);
    const body = JSON.stringify({ name: "page_view", path });
    try {
      if (
        !navigator.sendBeacon?.(
          "/api/analytics/collect",
          new Blob([body], { type: "application/json" }),
        )
      ) {
        void fetch("/api/analytics/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      // Telemetry must never surface to the user.
    }
  }, [pathname]);

  return null;
}
