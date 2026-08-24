# ---- Build stage -----------------------------------------------------------
FROM rust:1-slim AS builder
WORKDIR /app

# Cache dependency compilation: build once with a dummy source tree so the
# dependency layer survives source-only changes.
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src \
    && echo 'fn main() {}' > src/main.rs \
    && touch src/lib.rs \
    && cargo build --release --locked \
    && rm -rf src \
       target/release/flight-search* \
       target/release/deps/flight_search* \
       target/release/.fingerprint/flight-search*

COPY src ./src
RUN cargo build --release --locked

# ---- Runtime stage ---------------------------------------------------------
# rustls means no OpenSSL requirement; distroless cc is enough.
FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=builder /app/target/release/flight-search /usr/local/bin/flight-search

# The service binds 0.0.0.0:$PORT (default 8080) — Cloud Run compatible.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/flight-search"]
