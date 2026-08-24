/// Errors surfaced by provider adapters. A provider error never fails the
/// whole search — the aggregator logs it and continues with the other
/// provider's offers, mirroring `Promise.allSettled` in the TS aggregator.
#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("provider http request failed: {0}")]
    Http(#[from] reqwest::Error),
    #[error("amadeus auth failed: {0}")]
    AmadeusAuth(u16),
    #[error("malformed provider response: {0}")]
    Malformed(&'static str),
}
