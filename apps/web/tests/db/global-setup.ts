import { execSync } from "node:child_process";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://summit:summit@localhost:5432/summitsocial_test";

export default function setup() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? "db-test-secret-0123456789abcdef";
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Bring the test database to the exact state every deploy goes through.
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
