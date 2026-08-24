//! Skyscanner live-search adapter.
//!
//! Fetching (create + poll session flow) is kept separate from the pure
//! normalisation functions so tests can cover the mapping with fixture JSON.

use std::collections::BTreeMap;
use std::time::Duration;

use serde::Deserialize;
use serde_json::{json, Value};

use crate::aggregator::MAX_OFFERS;
use crate::config::SkyscannerConfig;
use crate::error::ProviderError;
use crate::models::{FlightOffer, FlightSearch};
use crate::providers::send_with_retry;

const MAX_POLL_ATTEMPTS: usize = 3;
const POLL_DELAY: Duration = Duration::from_secs(1);

/// Search Skyscanner live prices for a validated request.
///
/// `live/search/create` is session-based: the first response is usually
/// `RESULT_STATUS_INCOMPLETE` with few or no itineraries, so the session is
/// polled until it completes (or we run out of attempts).
pub async fn search(
    client: &reqwest::Client,
    config: &SkyscannerConfig,
    search: &FlightSearch,
) -> Result<Vec<FlightOffer>, ProviderError> {
    let body = build_create_body(search);
    let create_url = format!("{}/v3/flights/live/search/create", config.base_url);

    let response = send_with_retry(|| {
        client
            .post(&create_url)
            .header("x-api-key", &config.api_key)
            .json(&body)
    })
    .await?;
    if !response.status().is_success() {
        tracing::error!("skyscanner search failed: {}", response.status());
        return Ok(Vec::new());
    }

    let mut data: Value = response.json().await?;
    let session_token = data
        .get("sessionToken")
        .and_then(Value::as_str)
        .map(str::to_owned);

    if let Some(session_token) = session_token {
        let poll_url = format!(
            "{}/v3/flights/live/search/poll/{session_token}",
            config.base_url
        );
        for _ in 0..MAX_POLL_ATTEMPTS {
            if is_complete(&data) {
                break;
            }
            tokio::time::sleep(POLL_DELAY).await;
            let poll_response =
                send_with_retry(|| client.post(&poll_url).header("x-api-key", &config.api_key))
                    .await?;
            if !poll_response.status().is_success() {
                tracing::warn!("skyscanner poll failed: {}", poll_response.status());
                break;
            }
            data = poll_response.json().await?;
        }
    }

    Ok(normalize_response(
        &data,
        search,
        config.affiliate_id.as_deref(),
    ))
}

/// True when the session response reports `RESULT_STATUS_COMPLETE`.
pub fn is_complete(raw: &Value) -> bool {
    raw.pointer("/content/status").and_then(Value::as_str) == Some("RESULT_STATUS_COMPLETE")
}

/// Build the `live/search/create` request body.
pub fn build_create_body(search: &FlightSearch) -> Value {
    let mut query_legs = vec![json!({
        "originPlaceId": { "iata": search.origin },
        "destinationPlaceId": { "iata": search.destination },
        "date": date_parts(&search.departure_date),
    })];
    if let Some(return_date) = &search.return_date {
        query_legs.push(json!({
            "originPlaceId": { "iata": search.destination },
            "destinationPlaceId": { "iata": search.origin },
            "date": date_parts(return_date),
        }));
    }
    json!({
        "query": {
            "market": "UK",
            "locale": "en-GB",
            "currency": "GBP",
            "queryLegs": query_legs,
            "cabinClass": search.cabin_class.skyscanner_cabin_class(),
            "adults": search.passengers,
        }
    })
}

fn date_parts(date: &str) -> Value {
    let mut parts = date
        .splitn(3, '-')
        .map(|part| part.parse::<u32>().unwrap_or(0));
    json!({
        "year": parts.next().unwrap_or(0),
        "month": parts.next().unwrap_or(0),
        "day": parts.next().unwrap_or(0),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkyscannerResponse {
    content: Option<SkyscannerContent>,
}

#[derive(Debug, Deserialize)]
struct SkyscannerContent {
    results: Option<SkyscannerResults>,
}

#[derive(Debug, Deserialize)]
struct SkyscannerResults {
    #[serde(default)]
    itineraries: BTreeMap<String, SkyscannerItinerary>,
    #[serde(default)]
    legs: BTreeMap<String, SkyscannerLeg>,
    #[serde(default)]
    carriers: BTreeMap<String, SkyscannerCarrier>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkyscannerItinerary {
    #[serde(default)]
    pricing_options: Vec<PricingOption>,
    #[serde(default)]
    leg_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PricingOption {
    #[serde(default)]
    price: PriceAmount,
    #[serde(default)]
    items: Vec<PricingItem>,
}

#[derive(Debug, Default, Deserialize)]
struct PriceAmount {
    amount: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PricingItem {
    deep_link: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SkyscannerLeg {
    departure_date_time: SkyscannerDateTime,
    arrival_date_time: SkyscannerDateTime,
    duration_in_minutes: u32,
    stop_count: u32,
    #[serde(default)]
    operating_carrier_ids: Vec<String>,
    #[serde(default)]
    marketing_carrier_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct SkyscannerDateTime {
    year: i64,
    month: u32,
    day: u32,
    hour: u32,
    minute: u32,
}

#[derive(Debug, Deserialize)]
struct SkyscannerCarrier {
    name: Option<String>,
}

fn to_iso_date_time(dt: &SkyscannerDateTime) -> String {
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:00",
        dt.year, dt.month, dt.day, dt.hour, dt.minute
    )
}

fn airline_name(
    leg: &SkyscannerLeg,
    carriers: &BTreeMap<String, SkyscannerCarrier>,
) -> Option<String> {
    let carrier_id = leg
        .operating_carrier_ids
        .first()
        .or_else(|| leg.marketing_carrier_ids.first())?;
    carriers.get(carrier_id).and_then(|c| c.name.clone())
}

/// Append `associateid=<affiliate>` to a deep link when an affiliate id is
/// configured. Empty URLs pass through untouched.
pub fn append_affiliate_id(url: &str, affiliate_id: Option<&str>) -> String {
    let Some(affiliate_id) = affiliate_id.filter(|id| !id.is_empty()) else {
        return url.to_string();
    };
    if url.is_empty() {
        return url.to_string();
    }
    let separator = if url.contains('?') { '&' } else { '?' };
    format!(
        "{url}{separator}associateid={}",
        percent_encode(affiliate_id)
    )
}

fn percent_encode(s: &str) -> String {
    use std::fmt::Write as _;
    let mut out = String::with_capacity(s.len());
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char);
            }
            _ => {
                let _ = write!(out, "%{byte:02X}");
            }
        }
    }
    out
}

/// Pure normalisation: a raw Skyscanner session response in, normalised offers
/// out. Itineraries whose legs or carriers cannot be resolved are skipped
/// rather than emitted with placeholder values. Capped at `MAX_OFFERS`.
pub fn normalize_response(
    raw: &Value,
    search: &FlightSearch,
    affiliate_id: Option<&str>,
) -> Vec<FlightOffer> {
    let parsed = match SkyscannerResponse::deserialize(raw) {
        Ok(parsed) => parsed,
        Err(err) => {
            tracing::warn!("skyscanner: unparseable response: {err}");
            return Vec::new();
        }
    };
    let Some(results) = parsed.content.and_then(|content| content.results) else {
        return Vec::new();
    };

    let mut offers = Vec::new();
    for (id, itinerary) in &results.itineraries {
        if offers.len() >= MAX_OFFERS {
            break;
        }

        let Some(outbound_leg) = itinerary
            .leg_ids
            .first()
            .and_then(|leg_id| results.legs.get(leg_id))
        else {
            continue;
        };
        let Some(airline) = airline_name(outbound_leg, &results.carriers) else {
            continue;
        };

        let pricing = itinerary.pricing_options.first();
        let price_gbp = pricing
            .and_then(|p| p.price.amount.as_deref())
            .and_then(|amount| amount.parse::<f64>().ok())
            .map(|amount| (amount * 100.0).round() as i64)
            .unwrap_or(0);
        let deep_link = pricing
            .and_then(|p| p.items.first())
            .and_then(|item| item.deep_link.clone())
            .unwrap_or_default();

        let mut offer = FlightOffer {
            id: format!("skyscanner-{id}"),
            provider: "skyscanner".to_string(),
            provider_ref: id.clone(),
            airline,
            airline_logo: None,
            flight_number: String::new(),
            origin: search.origin.clone(),
            destination: search.destination.clone(),
            departure_at: to_iso_date_time(&outbound_leg.departure_date_time),
            arrival_at: to_iso_date_time(&outbound_leg.arrival_date_time),
            duration_minutes: outbound_leg.duration_in_minutes,
            stops: outbound_leg.stop_count,
            stop_cities: Vec::new(),
            return_departure_at: None,
            return_arrival_at: None,
            return_duration_minutes: None,
            return_stops: None,
            price_gbp,
            currency: "GBP".to_string(),
            cabin_class: search.cabin_class.as_str().to_string(),
            deep_link: append_affiliate_id(&deep_link, affiliate_id),
            baggage_included: false,
        };

        if let Some(return_leg_id) = itinerary.leg_ids.get(1) {
            let Some(return_leg) = results.legs.get(return_leg_id) else {
                continue;
            };
            offer.return_departure_at = Some(to_iso_date_time(&return_leg.departure_date_time));
            offer.return_arrival_at = Some(to_iso_date_time(&return_leg.arrival_date_time));
            offer.return_duration_minutes = Some(return_leg.duration_in_minutes);
            offer.return_stops = Some(return_leg.stop_count);
        }

        offers.push(offer);
    }
    offers
}
