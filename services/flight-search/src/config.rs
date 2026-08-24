//! Provider configuration, read from the environment per request — env vars
//! can change between Cloud Run revisions sharing a warm container (same
//! rationale as the TS aggregator).

pub const AMADEUS_DEFAULT_BASE_URL: &str = "https://test.api.amadeus.com";
pub const SKYSCANNER_DEFAULT_BASE_URL: &str = "https://partners.api.skyscanner.net/apiservices";

#[derive(Debug, Clone)]
pub struct AmadeusConfig {
    pub client_id: String,
    pub client_secret: String,
    pub base_url: String,
}

impl AmadeusConfig {
    /// `None` unless both `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` are
    /// set to non-empty values.
    pub fn from_env() -> Option<Self> {
        Some(Self {
            client_id: env_nonempty("AMADEUS_CLIENT_ID")?,
            client_secret: env_nonempty("AMADEUS_CLIENT_SECRET")?,
            base_url: env_or("AMADEUS_BASE_URL", AMADEUS_DEFAULT_BASE_URL),
        })
    }
}

#[derive(Debug, Clone)]
pub struct SkyscannerConfig {
    pub api_key: String,
    pub base_url: String,
    pub affiliate_id: Option<String>,
}

impl SkyscannerConfig {
    /// `None` unless `SKYSCANNER_API_KEY` is set to a non-empty value.
    pub fn from_env() -> Option<Self> {
        Some(Self {
            api_key: env_nonempty("SKYSCANNER_API_KEY")?,
            base_url: env_or("SKYSCANNER_BASE_URL", SKYSCANNER_DEFAULT_BASE_URL),
            affiliate_id: env_nonempty("SKYSCANNER_AFFILIATE_ID"),
        })
    }
}

fn env_nonempty(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .filter(|value| !value.trim().is_empty())
}

fn env_or(key: &str, default: &str) -> String {
    env_nonempty(key).unwrap_or_else(|| default.to_string())
}
