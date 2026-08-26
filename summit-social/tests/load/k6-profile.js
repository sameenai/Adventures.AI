/**
 * k6 load profile with hard thresholds — the documented load bar for a
 * deployed environment. Unlike k6-smoke.js (hot-path collapse detector),
 * this ramp covers the public pages AND the API surface behind them, and
 * FAILS the run (non-zero exit) when the global p95 or error-rate budget
 * is blown — so it can gate a deploy from a shell script or a manual check.
 *
 * How to run against a deployed URL:
 *
 *   k6 run -e BASE_URL=https://basecamper.ai tests/load/k6-profile.js
 *
 * (defaults to http://localhost:3000 for a local production build; not wired
 * into CI because it needs a running target.)
 *
 * Budgets: p95 < 800ms across every request, error rate < 1%.
 */
import { check, sleep } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    profile: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "1m", target: 15 },
        { duration: "1m", target: 25 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const home = http.get(`${BASE_URL}/`, { tags: { endpoint: "home" } });
  check(home, { "home 200": (r) => r.status === 200 });

  const adventuresPage = http.get(`${BASE_URL}/adventures`, {
    tags: { endpoint: "adventures-page" },
  });
  check(adventuresPage, { "adventures page 200": (r) => r.status === 200 });

  const adventuresApi = http.get(`${BASE_URL}/api/adventures?limit=20&sortBy=votes`, {
    tags: { endpoint: "adventures-api" },
  });
  check(adventuresApi, {
    "adventures api 200": (r) => r.status === 200,
    "adventures api has items": (r) => (r.json("items") || []).length > 0,
  });

  const health = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: "health" } });
  check(health, { "health 200": (r) => r.status === 200 });

  sleep(1);
}
