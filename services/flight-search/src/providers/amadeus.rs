//! Amadeus flight-offers adapter.
//!
//! Fetching (OAuth2 client-credentials token + flight-offers search) is kept
//! separate from the pure normalisation functions so tests can cover the
//! mapping with fixture JSON alone.

use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::Deserialize;
use serde_json::Value;
use tokio::sync::Mutex;

use crate::config::AmadeusConfig;
use crate::error::ProviderError;
use crate::models::{FlightOffer, FlightSearch};
use crate::providers::send_with_retry;

/// In-process OAuth2 token cache. Tokens are refreshed 60s before expiry,
/// matching the TS adapter.
#[derive(Clone, Default)]
pub struct TokenCache {
    inner: Arc<Mutex<Option<CachedToken>>>,
}

struct CachedToken {
    token: String,
    expires_at: Instant,
}

async fn get_access_token(
    client: &reqwest::Client,
    config: &AmadeusConfig,
    cache: &TokenCache,
) -> Result<String, ProviderError> {
    if let Some(cached) = cache.inner.lock().await.as_ref() {
        if Instant::now() < cached.expires_at {
            return Ok(cached.token.clone());
        }
    }

    let url = format!("{}/v1/security/oauth2/token", config.base_url);
    let form = [
        ("grant_type", "client_credentials"),
        ("client_id", config.client_id.as_str()),
        ("client_secret", config.client_secret.as_str()),
    ];
    let response = send_with_retry(|| client.post(&url).form(&form)).await?;
    if !response.status().is_success() {
        return Err(ProviderError::AmadeusAuth(response.status().as_u16()));
    }

    let body: Value = response.json().await?;
    let Some(token) = body.get("access_token").and_then(Value::as_str) else {
        return Err(ProviderError::Malformed(
            "amadeus token response missing access_token",
        ));
    };
    let expires_in = body.get("expires_in").and_then(Value::as_u64).unwrap_or(0);
    let expires_at = Instant::now() + Duration::from_secs(expires_in.saturating_sub(60));
    *cache.inner.lock().await = Some(CachedToken {
        token: token.to_string(),
        expires_at,
    });
    Ok(token.to_string())
}

/// Search Amadeus flight offers for a validated request.
pub async fn search(
    client: &reqwest::Client,
    config: &AmadeusConfig,
    tokens: &TokenCache,
    search: &FlightSearch,
) -> Result<Vec<FlightOffer>, ProviderError> {
    let token = get_access_token(client, config, tokens).await?;
    let params = build_search_params(search);
    let url = format!("{}/v2/shopping/flight-offers", config.base_url);

    let response = send_with_retry(|| client.get(&url).query(&params).bearer_auth(&token)).await?;
    if !response.status().is_success() {
        tracing::error!("amadeus search failed: {}", response.status());
        return Ok(Vec::new());
    }

    let raw: Value = response.json().await?;
    Ok(normalize_response(&raw, search))
}

/// Build the flight-offers query parameters. `travelClass` is the cabin class
/// uppercased with the underscore preserved (`PREMIUM_ECONOMY`).
pub fn build_search_params(search: &FlightSearch) -> Vec<(String, String)> {
    let mut params = vec![
        ("originLocationCode".to_string(), search.origin.clone()),
        (
            "destinationLocationCode".to_string(),
            search.destination.clone(),
        ),
        ("departureDate".to_string(), search.departure_date.clone()),
        ("adults".to_string(), search.passengers.to_string()),
        (
            "travelClass".to_string(),
            search.cabin_class.amadeus_travel_class().to_string(),
        ),
        ("max".to_string(), "20".to_string()),
        ("currencyCode".to_string(), "GBP".to_string()),
    ];
    if let Some(return_date) = &search.return_date {
        params.push(("returnDate".to_string(), return_date.clone()));
    }
    params
}

#[derive(Debug, Deserialize)]
struct AmadeusResponse {
    data: Option<Vec<AmadeusOffer>>,
}

#[derive(Debug, Deserialize)]
struct AmadeusOffer {
    id: String,
    itineraries: Vec<AmadeusItinerary>,
    price: AmadeusPrice,
}

#[derive(Debug, Deserialize)]
struct AmadeusItinerary {
    duration: String,
    segments: Vec<AmadeusSegment>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AmadeusSegment {
    carrier_code: String,
    number: String,
    departure: AmadeusEndpoint,
    arrival: AmadeusEndpoint,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AmadeusEndpoint {
    iata_code: String,
    at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AmadeusPrice {
    grand_total: String,
}

/// Pure normalisation: a raw Amadeus flight-offers response in, normalised
/// offers out. Offers with no usable outbound itinerary are skipped.
pub fn normalize_response(raw: &Value, search: &FlightSearch) -> Vec<FlightOffer> {
    let parsed = match AmadeusResponse::deserialize(raw) {
        Ok(parsed) => parsed,
        Err(err) => {
            tracing::warn!("amadeus: unparseable response: {err}");
            return Vec::new();
        }
    };

    let mut offers = Vec::new();
    for offer in parsed.data.unwrap_or_default() {
        let Some(outbound) = offer.itineraries.first() else {
            continue;
        };
        let (Some(first), Some(last)) = (outbound.segments.first(), outbound.segments.last())
        else {
            continue;
        };

        let price_gbp =
            (offer.price.grand_total.parse::<f64>().unwrap_or(0.0) * 100.0).round() as i64;
        let mut flight_offer = FlightOffer {
            id: format!("amadeus-{}", offer.id),
            provider: "amadeus".to_string(),
            provider_ref: offer.id.clone(),
            airline: first.carrier_code.clone(),
            airline_logo: None,
            flight_number: format!("{}{}", first.carrier_code, first.number),
            origin: first.departure.iata_code.clone(),
            destination: last.arrival.iata_code.clone(),
            departure_at: first.departure.at.clone(),
            arrival_at: last.arrival.at.clone(),
            duration_minutes: parse_duration(&outbound.duration),
            stops: (outbound.segments.len() - 1) as u32,
            stop_cities: outbound.segments[..outbound.segments.len() - 1]
                .iter()
                .map(|segment| segment.arrival.iata_code.clone())
                .collect(),
            return_departure_at: None,
            return_arrival_at: None,
            return_duration_minutes: None,
            return_stops: None,
            price_gbp,
            currency: "GBP".to_string(),
            cabin_class: search.cabin_class.as_str().to_string(),
            deep_link: String::new(),
            baggage_included: true,
        };

        // Round trips: price.grandTotal covers both legs, so surface the
        // return itinerary instead of silently discarding it.
        if let Some(return_itinerary) = offer.itineraries.get(1) {
            if let (Some(return_first), Some(return_last)) = (
                return_itinerary.segments.first(),
                return_itinerary.segments.last(),
            ) {
                flight_offer.return_departure_at = Some(return_first.departure.at.clone());
                flight_offer.return_arrival_at = Some(return_last.arrival.at.clone());
                flight_offer.return_duration_minutes =
                    Some(parse_duration(&return_itinerary.duration));
                flight_offer.return_stops = Some((return_itinerary.segments.len() - 1) as u32);
            }
        }

        offers.push(flight_offer);
    }
    offers
}

/// Parse an ISO-8601 duration like `PT7H30M` into minutes. Mirrors the TS
/// regex `/PT(?:(\d+)H)?(?:(\d+)M)?/` — unrecognised input yields 0.
pub fn parse_duration(iso: &str) -> u32 {
    let Some(pos) = iso.find("PT") else {
        return 0;
    };
    let rest = &iso[pos + 2..];

    let (first_number, rest) = take_number(rest);
    let Some(first_number) = first_number else {
        return 0;
    };
    if let Some(rest) = rest.strip_prefix('M') {
        let _ = rest;
        return first_number;
    }
    let Some(rest) = rest.strip_prefix('H') else {
        return 0;
    };
    let hours = first_number;

    let (minutes, rest) = take_number(rest);
    let minutes = match (minutes, rest.strip_prefix('M')) {
        (Some(minutes), Some(_)) => minutes,
        _ => 0,
    };
    hours * 60 + minutes
}

fn take_number(s: &str) -> (Option<u32>, &str) {
    let end = s.find(|c: char| !c.is_ascii_digit()).unwrap_or(s.len());
    if end == 0 {
        return (None, s);
    }
    (s[..end].parse().ok(), &s[end..])
}
