import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.d.ts",
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx",
        // Infrastructure singletons and type-only files — no testable logic
        "src/types/**",
        "src/lib/db/prisma.ts",
        "src/lib/auth/config.ts",
        "src/lib/ai/openai.ts",
        "src/lib/ai/tools.ts",
        "src/lib/flights/types.ts",
        "src/middleware.ts",
        "src/app/providers.tsx",
        "src/app/api/auth/**",
        "src/app/api/webhooks/**",
        // Pure presentation components — no business logic, Next.js render-only
        "src/components/shared/footer.tsx",
        "src/components/shared/navbar.tsx",
        "src/components/shared/seo-head.tsx",
        "src/components/adventures/adventure-card.tsx",
        "src/components/adventures/adventure-grid.tsx",
        "src/components/chat/chat-window.tsx",
        "src/components/flights/booking-cta.tsx",
        "src/components/flights/flight-comparison.tsx",
        "src/components/itinerary/day-card.tsx",
        "src/components/itinerary/itinerary-timeline.tsx",
        "src/components/itinerary/map-view.tsx",
        "src/components/profile/adventure-history.tsx",
        "src/components/profile/profile-header.tsx",
        // Leaflet map components — require DOM APIs unavailable in jsdom
        "src/components/explore/**",
        "src/components/itinerary/leaflet-map.tsx",
        // Startup env validation — side-effect module, no exported functions to test
        "src/lib/env.ts",
        // Large multi-section form pages — covered by e2e
        "src/app/(dashboard)/adventures/**/adventure-edit-form.tsx",
        "src/app/(dashboard)/profile/edit/profile-edit-form.tsx",
        // Pure skeleton/loading UI — no logic
        "src/app/**/loading.tsx",
        // Not-found page — pure static markup, no logic
        "src/app/not-found.tsx",
        // Pure presentation — no logic, only renders links
        "src/components/profile/social-links.tsx",
      ],
    },
    setupFiles: ["tests/fixtures/setup.ts"],
  },
});
