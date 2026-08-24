use flight_search::models::{CabinClass, FlightSearch};
use flight_search::providers::amadeus::{build_search_params, normalize_response, parse_duration};
use serde_json::Value;

const ROUND_TRIP_FIXTURE: &str = include_str!("fixtures/amadeus_round_trip.json");

fn round_trip_search() -> FlightSearch {
    FlightSearch {
        origin: "LHR".to_string(),
        destination: "JFK".to_string(),
        departure_date: "2025-08-01".to_string(),
        return_date: Some("2025-08-15".to_string()),
        passengers: 2,
        cabin_class: CabinClass::PremiumEconomy,
    }
}

#[test]
fn normalises_round_trip_fixture_with_both_legs() {
    let raw: Value = serde_json::from_str(ROUND_TRIP_FIXTURE).expect("fixture json");
    let search = round_trip_search();

    let offers = normalize_response(&raw, &search);
    assert_eq!(offers.len(), 1);
    let offer = &offers[0];

    // Outbound leg
    assert_eq!(offer.id, "amadeus-rt-1");
    assert_eq!(offer.provider, "amadeus");
    assert_eq!(offer.provider_ref, "rt-1");
    assert_eq!(offer.airline, "BA");
    assert_eq!(offer.flight_number, "BA117");
    assert_eq!(offer.origin, "LHR");
    assert_eq!(offer.destination, "JFK");
    assert_eq!(offer.departure_at, "2025-08-01T10:00:00");
    assert_eq!(offer.arrival_at, "2025-08-01T17:30:00");
    assert_eq!(offer.duration_minutes, 450);
    assert_eq!(offer.stops, 0);
    assert!(offer.stop_cities.is_empty());

    // Return leg from itineraries[1]
    assert_eq!(
        offer.return_departure_at.as_deref(),
        Some("2025-08-15T18:00:00")
    );
    assert_eq!(
        offer.return_arrival_at.as_deref(),
        Some("2025-08-16T08:15:00")
    );
    assert_eq!(offer.return_duration_minutes, Some(555));
    assert_eq!(offer.return_stops, Some(1));

    // Price parsed from grandTotal ("820.00" GBP -> 82000 pence)
    assert_eq!(offer.price_gbp, 82_000);
    assert_eq!(offer.currency, "GBP");
    assert_eq!(offer.cabin_class, "premium_economy");
    assert_eq!(offer.deep_link, "");
    assert!(offer.baggage_included);
}

#[test]
fn serialises_offer_with_expected_camel_case_fields() {
    let raw: Value = serde_json::from_str(ROUND_TRIP_FIXTURE).expect("fixture json");
    let offers = normalize_response(&raw, &round_trip_search());
    let json = serde_json::to_value(&offers[0]).expect("serialise");

    for key in [
        "id",
        "provider",
        "providerRef",
        "airline",
        "flightNumber",
        "origin",
        "destination",
        "departureAt",
        "arrivalAt",
        "durationMinutes",
        "stops",
        "stopCities",
        "returnDepartureAt",
        "returnArrivalAt",
        "returnDurationMinutes",
        "returnStops",
        "priceGBP",
        "currency",
        "cabinClass",
        "deepLink",
        "baggageIncluded",
    ] {
        assert!(json.get(key).is_some(), "missing field {key}");
    }
    // Unset optional fields are omitted, not null
    assert!(json.get("airlineLogo").is_none());
}

#[test]
fn builds_premium_economy_travel_class_with_underscore() {
    let params = build_search_params(&round_trip_search());
    let get = |key: &str| {
        params
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    };

    assert_eq!(get("travelClass"), Some("PREMIUM_ECONOMY"));
    assert_eq!(get("originLocationCode"), Some("LHR"));
    assert_eq!(get("destinationLocationCode"), Some("JFK"));
    assert_eq!(get("departureDate"), Some("2025-08-01"));
    assert_eq!(get("returnDate"), Some("2025-08-15"));
    assert_eq!(get("adults"), Some("2"));
    assert_eq!(get("max"), Some("20"));
    assert_eq!(get("currencyCode"), Some("GBP"));
}

#[test]
fn omits_return_date_param_for_one_way() {
    let mut search = round_trip_search();
    search.return_date = None;
    let params = build_search_params(&search);
    assert!(!params.iter().any(|(k, _)| k == "returnDate"));
}

#[test]
fn parses_iso_durations() {
    assert_eq!(parse_duration("PT7H30M"), 450);
    assert_eq!(parse_duration("PT2H"), 120);
    assert_eq!(parse_duration("PT45M"), 45);
    assert_eq!(parse_duration("PT12H00M"), 720);
    assert_eq!(parse_duration("INVALID"), 0);
    assert_eq!(parse_duration("PT"), 0);
}

#[test]
fn returns_empty_for_null_or_missing_data() {
    let search = round_trip_search();
    assert!(normalize_response(&serde_json::json!({ "data": null }), &search).is_empty());
    assert!(normalize_response(&serde_json::json!({}), &search).is_empty());
}
