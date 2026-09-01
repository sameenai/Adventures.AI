/**
 * k6 smoke profile for the two hottest paths. Run manually or from a nightly
 * job against a non-production target:
 *
 *   k6 run tests/load/k6-smoke.js -e BASE_URL=http://localhost:3000
 *
 * Budgets are deliberately loose smoke thresholds — they catch collapses
 * (N+1 regressions, lost indexes), not micro-regressions.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 25 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:list}": ["p(95)<800"],
    "http_req_duration{endpoint:detail}": ["p(95)<800"],
  },
};

export default function () {
  const list = http.get(`${BASE_URL}/api/adventures?limit=20&sortBy=votes`, {
    tags: { endpoint: "list" },
  });
  check(list, {
    "list 200": (r) => r.status === 200,
    "list has items": (r) => (r.json("items") || []).length > 0,
  });

  const items = list.json("items") || [];
  if (items.length > 0) {
    const id = items[Math.floor(Math.random() * items.length)].id;
    const detail = http.get(`${BASE_URL}/api/adventures/${id}`, {
      tags: { endpoint: "detail" },
    });
    check(detail, { "detail 200": (r) => r.status === 200 });
  }

  sleep(1);
}
