//! Basecamper flight-search service.
//!
//! Mirrors the semantics of `apps/web/src/lib/flights/` (Amadeus + Skyscanner
//! adapters and the aggregator) so the Next.js layer can proxy to it verbatim.

pub mod aggregator;
pub mod clock;
pub mod config;
pub mod error;
pub mod models;
pub mod providers;
pub mod routes;
pub mod validate;

pub use routes::app;
