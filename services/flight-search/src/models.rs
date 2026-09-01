use serde::{Deserialize, Serialize};

/// Cabin classes accepted by the search API (mirrors the Zod enum in
/// `apps/web/src/lib/validators/flight.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CabinClass {
    Economy,
    PremiumEconomy,
    Business,
    First,
}

impl CabinClass {
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "economy" => Some(Self::Economy),
            "premium_economy" => Some(Self::PremiumEconomy),
            "business" => Some(Self::Business),
            "first" => Some(Self::First),
            _ => None,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Economy => "economy",
            Self::PremiumEconomy => "premium_economy",
            Self::Business => "business",
            Self::First => "first",
        }
    }

    /// Amadeus `travelClass` value: uppercased with the underscore preserved
    /// (`PREMIUM_ECONOMY`, never `PREMIUM ECONOMY`).
    pub fn amadeus_travel_class(self) -> &'static str {
        match self {
            Self::Economy => "ECONOMY",
            Self::PremiumEconomy => "PREMIUM_ECONOMY",
            Self::Business => "BUSINESS",
            Self::First => "FIRST",
        }
    }

    /// Skyscanner `cabinClass` enum value.
    pub fn skyscanner_cabin_class(self) -> &'static str {
        match self {
            Self::Economy => "CABIN_CLASS_ECONOMY",
            Self::PremiumEconomy => "CABIN_CLASS_PREMIUM_ECONOMY",
            Self::Business => "CABIN_CLASS_BUSINESS",
            Self::First => "CABIN_CLASS_FIRST",
        }
    }
}

/// A validated flight search (mirrors the TS `FlightSearch` type).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FlightSearch {
    pub origin: String,
    pub destination: String,
    pub departure_date: String,
    pub return_date: Option<String>,
    pub passengers: u32,
    pub cabin_class: CabinClass,
}

/// A normalised flight offer (field-for-field mirror of the TS `FlightOffer`
/// type so the Next.js layer can proxy responses verbatim).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlightOffer {
    pub id: String,
    pub provider: String,
    pub provider_ref: String,
    pub airline: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub airline_logo: Option<String>,
    pub flight_number: String,
    pub origin: String,
    pub destination: String,
    pub departure_at: String,
    pub arrival_at: String,
    pub duration_minutes: u32,
    pub stops: u32,
    pub stop_cities: Vec<String>,
    /// Return leg (round trips only) — the offer price covers both legs.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_departure_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_arrival_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_duration_minutes: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_stops: Option<u32>,
    /// Price in pence (GBP minor units), as in the TS implementation.
    #[serde(rename = "priceGBP")]
    pub price_gbp: i64,
    pub currency: String,
    pub cabin_class: String,
    pub deep_link: String,
    pub baggage_included: bool,
}

/// Response body for `POST /v1/flights/search`.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResponse {
    pub offers: Vec<FlightOffer>,
    pub cached: bool,
    pub searched_at: String,
    /// True when no flight providers are configured. Demo/mock offers are the
    /// Next.js layer's concern — this service never fabricates flights.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub providers_unavailable: Option<bool>,
}
