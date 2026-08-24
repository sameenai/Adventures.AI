# flight-search

The first Rust backend service for Basecamper, extracted from the Next.js
monolith as the start of a strangler-pattern migration. It is a drop-in
implementation of the flight search that currently lives in
`summit-social/src/lib/flights/` (Amadeus + Skyscanner adapters and the
aggregator), exposed as a small Axum HTTP service.

## The strangler plan

- **Next.js stays the web/BFF layer.** Pages, auth, sessions, Stripe, the AI
  chat, and the Postgres data model stay in `summit-social/`. Its API routes
  keep owning validation-at-the-edge, auth, rate limiting, and caching.
- **Bounded backend domains move to Rust services**, one at a time, behind the
  existing TypeScript interfaces so nothing upstream has to change while a
  domain migrates.
- **Flight search is first** because it is the ideal strangler seed: stateless,
  latency-sensitive, pure API orchestration (two upstream providers, fan-out,
  normalise, merge) with no database access and a small, well-tested contract.

### How the Next.js layer opts in

The aggregator (`summit-social/src/lib/flights/aggregator.ts`) gains an opt-in
env var:

- `FLIGHT_SERVICE_URL` unset → current in-process TS adapters run (no change).
- `FLIGHT_SERVICE_URL=https://flight-search-...run.app` → the aggregator POSTs
  the validated search to `${FLIGHT_SERVICE_URL}/v1/flights/search` and returns
  the offers verbatim. Redis caching, demo/mock offers, and rate limiting stay
  in the Next.js layer — this service deliberately implements none of them, and
  returns `providersUnavailable: true` instead of mock data so the BFF decides
  what demo mode looks like.

Offer objects are a field-for-field mirror of the TS `FlightOffer` type
(camelCase, `priceGBP` in pence), so the proxy step is a passthrough.

## API

### `POST /v1/flights/search`

Request body:

```json
{
  "origin": "LHR",
  "destination": "JFK",
  "departureDate": "2026-09-01",
  "returnDate": "2026-09-15",
  "passengers": 2,
  "cabinClass": "premium_economy"
}
```

- `origin` / `destination`: exactly three uppercase A-Z letters (IATA)
- `departureDate` / `returnDate`: `YYYY-MM-DD` (`returnDate` optional)
- `passengers`: integer 1–9, default 1
- `cabinClass`: `economy` | `premium_economy` | `business` | `first`,
  default `economy`

Invalid input returns `422` with
`{"error": "validation_error", "issues": [{"field": ..., "message": ...}]}`.

Response:

```json
{
  "offers": [ { "id": "amadeus-1", "provider": "amadeus", "priceGBP": 45000, "...": "..." } ],
  "cached": false,
  "searchedAt": "2026-08-24T12:00:00Z",
  "providersUnavailable": true
}
```

`providersUnavailable` appears (as `true`) only when no provider is
configured; `offers` is then empty. Configured providers are queried
concurrently; results are merged, sorted by `priceGBP` ascending, and capped
at 20. Every upstream call has an 8s timeout and one retry on connect error
or 5xx.

### `GET /healthz`

`200 {"status":"ok"}` — liveness probe.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `8080` | Listen port (binds `0.0.0.0`) |
| `AMADEUS_CLIENT_ID` | no | — | Amadeus OAuth2 client id (provider enabled only when id + secret set) |
| `AMADEUS_CLIENT_SECRET` | no | — | Amadeus OAuth2 client secret |
| `AMADEUS_BASE_URL` | no | `https://test.api.amadeus.com` | Amadeus API base URL |
| `SKYSCANNER_API_KEY` | no | — | Skyscanner API key (provider enabled only when set) |
| `SKYSCANNER_BASE_URL` | no | `https://partners.api.skyscanner.net/apiservices` | Skyscanner API base URL |
| `SKYSCANNER_AFFILIATE_ID` | no | — | Appended to deep links as `associateid=` when set |

Access tokens for Amadeus (OAuth2 client-credentials) are cached in-process
and refreshed 60 seconds before expiry.

## Running locally

```bash
cd services/flight-search
cargo run                      # http://localhost:8080

# With providers:
AMADEUS_CLIENT_ID=... AMADEUS_CLIENT_SECRET=... SKYSCANNER_API_KEY=... cargo run

curl localhost:8080/healthz
curl -s localhost:8080/v1/flights/search \
  -H 'content-type: application/json' \
  -d '{"origin":"LHR","destination":"JFK","departureDate":"2026-09-01"}'
```

## Tests and quality gates

```bash
cargo test                                  # unit + integration tests (no network)
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo build --release
```

Provider response parsing/normalisation is pure (raw provider JSON in,
`Vec<FlightOffer>` out) and covered by fixture files under `tests/fixtures/`
— an Amadeus round-trip response and a Skyscanner create-incomplete /
poll-complete pair.

## Docker

```bash
docker build -t flight-search .
docker run --rm -p 8080:8080 flight-search
```

Multi-stage build: `rust:1-slim` builder → `gcr.io/distroless/cc` runtime
(rustls, so no OpenSSL in the image).
