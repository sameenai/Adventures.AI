use flight_search::models::CabinClass;
use flight_search::validate::validate_search;
use serde_json::json;

#[test]
fn accepts_minimal_body_and_applies_defaults() {
    let body = json!({
        "origin": "LHR",
        "destination": "JFK",
        "departureDate": "2026-09-01"
    });
    let search = validate_search(&body).expect("valid");
    assert_eq!(search.origin, "LHR");
    assert_eq!(search.destination, "JFK");
    assert_eq!(search.departure_date, "2026-09-01");
    assert_eq!(search.return_date, None);
    assert_eq!(search.passengers, 1);
    assert_eq!(search.cabin_class, CabinClass::Economy);
}

#[test]
fn accepts_full_body() {
    let body = json!({
        "origin": "LHR",
        "destination": "JFK",
        "departureDate": "2026-09-01",
        "returnDate": "2026-09-15",
        "passengers": 9,
        "cabinClass": "premium_economy"
    });
    let search = validate_search(&body).expect("valid");
    assert_eq!(search.return_date.as_deref(), Some("2026-09-15"));
    assert_eq!(search.passengers, 9);
    assert_eq!(search.cabin_class, CabinClass::PremiumEconomy);
}

#[test]
fn rejects_bad_iata_codes() {
    for origin in [
        json!("lhr"),
        json!("LH"),
        json!("LHRX"),
        json!("LH1"),
        json!(3),
    ] {
        let body = json!({
            "origin": origin,
            "destination": "JFK",
            "departureDate": "2026-09-01"
        });
        let issues = validate_search(&body).expect_err("invalid");
        assert!(
            issues.iter().any(|issue| issue.field == "origin"),
            "{origin:?}"
        );
        assert!(issues
            .iter()
            .any(|issue| issue.message == "Must be a valid IATA code"));
    }
}

#[test]
fn rejects_missing_fields() {
    let issues = validate_search(&json!({})).expect_err("invalid");
    let fields: Vec<_> = issues.iter().map(|issue| issue.field).collect();
    assert!(fields.contains(&"origin"));
    assert!(fields.contains(&"destination"));
    assert!(fields.contains(&"departureDate"));
}

#[test]
fn rejects_bad_dates() {
    for date in [
        "01-08-2026",
        "2026/09/01",
        "2026-9-1",
        "2026-09-01T10:00",
        "tomorrow",
    ] {
        let body = json!({
            "origin": "LHR",
            "destination": "JFK",
            "departureDate": date
        });
        let issues = validate_search(&body).expect_err("invalid");
        assert!(
            issues.iter().any(|issue| issue.field == "departureDate"),
            "{date}"
        );
    }
}

#[test]
fn rejects_bad_return_date_when_present() {
    let body = json!({
        "origin": "LHR",
        "destination": "JFK",
        "departureDate": "2026-09-01",
        "returnDate": "next week"
    });
    let issues = validate_search(&body).expect_err("invalid");
    assert!(issues.iter().any(|issue| issue.field == "returnDate"));
}

#[test]
fn rejects_out_of_range_or_non_integer_passengers() {
    for passengers in [json!(0), json!(10), json!(-1), json!(2.5), json!("2")] {
        let body = json!({
            "origin": "LHR",
            "destination": "JFK",
            "departureDate": "2026-09-01",
            "passengers": passengers
        });
        let issues = validate_search(&body).expect_err("invalid");
        assert!(
            issues.iter().any(|issue| issue.field == "passengers"),
            "{passengers:?}"
        );
    }
}

#[test]
fn rejects_unknown_cabin_class() {
    let body = json!({
        "origin": "LHR",
        "destination": "JFK",
        "departureDate": "2026-09-01",
        "cabinClass": "luxury"
    });
    let issues = validate_search(&body).expect_err("invalid");
    assert!(issues.iter().any(|issue| issue.field == "cabinClass"));
}

#[test]
fn rejects_non_object_body() {
    let issues = validate_search(&json!([1, 2, 3])).expect_err("invalid");
    assert_eq!(issues[0].field, "body");
}
