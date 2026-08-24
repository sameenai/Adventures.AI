import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Real-services test tier: unlike the default suite (everything mocked),
 * these tests run against a live Postgres and Redis to validate what mocks
 * structurally cannot — actual query semantics, cursor pagination, unique
 * violations under concurrency, JSON round-trips, and limiter windows.
 *
 * Run with: npm run test:db  (requires local Postgres + Redis, see README)
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    globalSetup: ["tests/db/global-setup.ts"],
    // DB tests share tables — no parallel files.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
