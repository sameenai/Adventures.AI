use flight_search::models::{CabinClass, FlightSearch};
use flight_search::providers::skyscanner::{
    append_affiliate_id, build_create_body, is_complete, normalize_response,
};
use serde_json::{json, Value};

const CREATE_INCOMPLETE_FIXTURE: &str = include_str!("fixtures/skyscanner_create_incomplete.json");
const POLL_COMPLETE_FIXTURE: &str = include_str!("fixtures/skyscanner_poll_complete.json");

fn base_search() -> FlightSearch {
    FlightSearch {
        origin: "LHR".to_string(),
        destination: "JFK".to_string(),
        departure_date: "2025-08-01".to_string(),
        return_date: Some("2025-08-15".to_string()),
        passengers: 1,
        cabin_class: CabinClass::Economy,
    }
}

#[test]
fn create_response_is_incomplete_and_poll_response_is_complete() {
    let create: Value = serde_json::from_str(CREATE_INCOMPLETE_FIXTURE).expect("fixture json");
    let poll: Value = serde_json::from_str(POLL_COMPLETE_FIXTURE).expect("fixture json");

    assert!(!is_complete(&create));
    assert!(is_complete(&poll));
    assert_eq!(create["sessionToken"], json!("sess-1"));
    assert!(normalize_response(&create, &base_search(), None).is_empty());
}

#[test]
fn normalises_complete_poll_response_with_real_carriers_and_iso_datetimes() {
    let raw: Value = serde_json::from_str(POLL_COMPLETE_FIXTURE).expect("fixture json");
    let offers = normalize_response(&raw, &base_search(), None);

    // itin-missing-leg and itin-missing-carrier are unresolvable and skipped.
    assert_eq!(offers.len(), 2);
    assert_eq!(offers[0].id, "skyscanner-itin-1");
    assert_eq!(offers[1].id, "skyscanner-itin-rt");

    let one_way = &offers[0];
    assert_eq!(one_way.provider, "skyscanner");
    assert_eq!(one_way.provider_ref, "itin-1");
    assert_eq!(one_way.airline, "British Airways");
    assert_eq!(one_way.flight_number, "");
    assert_eq!(one_way.origin, "LHR");
    assert_eq!(one_way.destination, "JFK");
    assert_eq!(one_way.departure_at, "2025-08-01T10:30:00");
    assert_eq!(one_way.arrival_at, "2025-08-01T18:45:00");
    assert_eq!(one_way.duration_minutes, 495);
    assert_eq!(one_way.stops, 1);
    assert_eq!(one_way.price_gbp, 38_000);
    assert_eq!(one_way.currency, "GBP");
    assert_eq!(one_way.cabin_class, "economy");
    assert_eq!(one_way.deep_link, "https://skyscanner.com/link");
    assert!(!one_way.baggage_included);
    assert_eq!(one_way.return_departure_at, None);

    let round_trip = &offers[1];
    assert_eq!(round_trip.airline, "Emirates");
    assert_eq!(round_trip.departure_at, "2025-08-01T09:00:00");
    assert_eq!(round_trip.arrival_at, "2025-08-01T17:00:00");
    assert_eq!(round_trip.stops, 0);
    assert_eq!(round_trip.price_gbp, 50_000);
    assert_eq!(
        round_trip.return_departure_at.as_deref(),
        Some("2025-08-15T20:05:00")
    );
    assert_eq!(
        round_trip.return_arrival_at.as_deref(),
        Some("2025-08-16T08:30:00")
    );
    assert_eq!(round_trip.return_duration_minutes, Some(445));
    assert_eq!(round_trip.return_stops, Some(1));
}

#[test]
fn appends_affiliate_id_to_deep_links_when_configured() {
    let raw: Value = serde_json::from_str(POLL_COMPLETE_FIXTURE).expect("fixture json");
    let offers = normalize_response(&raw, &base_search(), Some("bc-42"));

    assert_eq!(
        offers[0].deep_link,
        "https://skyscanner.com/link?associateid=bc-42"
    );
    // Existing query string gets '&', and the id is percent-encoded.
    assert_eq!(
        append_affiliate_id("https://skyscanner.com/rt-link?foo=1", Some("aff id/1")),
        "https://skyscanner.com/rt-link?foo=1&associateid=aff%20id%2F1"
    );
    assert_eq!(append_affiliate_id("", Some("bc-42")), "");
    assert_eq!(
        append_affiliate_id("https://x.example", None),
        "https://x.example"
    );
}

#[test]
fn skips_itinerary_with_unresolvable_return_leg() {
    let raw = json!({
        "content": {
            "status": "RESULT_STATUS_COMPLETE",
            "results": {
                "itineraries": {
                    "itin-broken-return": {
                        "legIds": ["leg-1", "no-such-return-leg"],
                        "pricingOptions": [{ "price": { "amount": "300.00" }, "items": [] }]
                    }
                },
                "legs": {
                    "leg-1": {
                        "departureDateTime": { "year": 2025, "month": 8, "day": 1, "hour": 9, "minute": 0 },
                        "arrivalDateTime": { "year": 2025, "month": 8, "day": 1, "hour": 12, "minute": 0 },
                        "durationInMinutes": 180,
                        "stopCount": 0,
                        "operatingCarrierIds": ["c1"]
                    }
                },
                "carriers": { "c1": { "name": "British Airways" } }
            }
        }
    });
    assert!(normalize_response(&raw, &base_search(), None).is_empty());
}

#[test]
fn uses_zero_price_and_empty_deep_link_when_pricing_missing() {
    let raw = json!({
        "content": {
            "status": "RESULT_STATUS_COMPLETE",
            "results": {
                "itineraries": {
                    "itin-no-price": {
                        "legIds": ["leg-1"],
                        "pricingOptions": [{ "price": {}, "items": [] }]
                    }
                },
                "legs": {
                    "leg-1": {
                        "departureDateTime": { "year": 2025, "month": 8, "day": 1, "hour": 9, "minute": 0 },
                        "arrivalDateTime": { "year": 2025, "month": 8, "day": 1, "hour": 12, "minute": 0 },
                        "durationInMinutes": 180,
                        "stopCount": 0,
                        "operatingCarrierIds": ["c1"]
                    }
                },
                "carriers": { "c1": { "name": "British Airways" } }
            }
        }
    });
    let offers = normalize_response(&raw, &base_search(), Some("bc-42"));
    assert_eq!(offers.len(), 1);
    assert_eq!(offers[0].price_gbp, 0);
    assert_eq!(offers[0].deep_link, "");
}

#[test]
fn caps_normalised_offers_at_twenty() {
    let mut raw: Value = serde_json::from_str(POLL_COMPLETE_FIXTURE).expect("fixture json");
    let itineraries = raw
        .pointer_mut("/content/results/itineraries")
        .and_then(Value::as_object_mut)
        .expect("itineraries object");
    itineraries.clear();
    for i in 0..25 {
        itineraries.insert(
            format!("itin-{i:02}"),
            json!({
                "legIds": ["leg-1"],
                "pricingOptions": [{ "price": { "amount": "100.00" }, "items": [{ "deepLink": "" }] }]
            }),
        );
    }

    let offers = normalize_response(&raw, &base_search(), None);
    assert_eq!(offers.len(), 20);
}

#[test]
fn builds_create_body_with_return_leg_and_cabin_class() {
    let mut search = base_search();
    search.cabin_class = CabinClass::PremiumEconomy;
    search.passengers = 3;
    let body = build_create_body(&search);

    assert_eq!(body["query"]["market"], json!("UK"));
    assert_eq!(body["query"]["locale"], json!("en-GB"));
    assert_eq!(body["query"]["currency"], json!("GBP"));
    assert_eq!(body["query"]["adults"], json!(3));
    assert_eq!(
        body["query"]["cabinClass"],
        json!("CABIN_CLASS_PREMIUM_ECONOMY")
    );

    let legs = body["query"]["queryLegs"].as_array().expect("legs array");
    assert_eq!(legs.len(), 2);
    assert_eq!(legs[0]["originPlaceId"]["iata"], json!("LHR"));
    assert_eq!(legs[0]["destinationPlaceId"]["iata"], json!("JFK"));
    assert_eq!(
        legs[0]["date"],
        json!({ "year": 2025, "month": 8, "day": 1 })
    );
    // Return leg swaps origin and destination.
    assert_eq!(legs[1]["originPlaceId"]["iata"], json!("JFK"));
    assert_eq!(legs[1]["destinationPlaceId"]["iata"], json!("LHR"));
    assert_eq!(
        legs[1]["date"],
        json!({ "year": 2025, "month": 8, "day": 15 })
    );
}

#[test]
fn builds_one_leg_body_for_one_way() {
    let mut search = base_search();
    search.return_date = None;
    let body = build_create_body(&search);
    assert_eq!(body["query"]["queryLegs"].as_array().map(Vec::len), Some(1));
    assert_eq!(body["query"]["cabinClass"], json!("CABIN_CLASS_ECONOMY"));
}
