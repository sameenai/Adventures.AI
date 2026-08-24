use flight_search::aggregator::{merge_offers, MAX_OFFERS};
use flight_search::models::FlightOffer;

fn offer(id: &str, provider: &str, price_gbp: i64) -> FlightOffer {
    FlightOffer {
        id: id.to_string(),
        provider: provider.to_string(),
        provider_ref: id.to_string(),
        airline: "BA".to_string(),
        airline_logo: None,
        flight_number: "BA117".to_string(),
        origin: "LHR".to_string(),
        destination: "JFK".to_string(),
        departure_at: "2025-08-01T10:00:00".to_string(),
        arrival_at: "2025-08-01T17:30:00".to_string(),
        duration_minutes: 450,
        stops: 0,
        stop_cities: Vec::new(),
        return_departure_at: None,
        return_arrival_at: None,
        return_duration_minutes: None,
        return_stops: None,
        price_gbp,
        currency: "GBP".to_string(),
        cabin_class: "economy".to_string(),
        deep_link: String::new(),
        baggage_included: true,
    }
}

#[test]
fn merges_and_sorts_by_price_ascending() {
    let amadeus = vec![
        offer("a-1", "amadeus", 45_000),
        offer("a-2", "amadeus", 20_000),
    ];
    let skyscanner = vec![
        offer("s-1", "skyscanner", 38_000),
        offer("s-2", "skyscanner", 21_000),
    ];

    let merged = merge_offers(amadeus, skyscanner);
    let ids: Vec<_> = merged.iter().map(|o| o.id.as_str()).collect();
    assert_eq!(ids, ["a-2", "s-2", "s-1", "a-1"]);
    assert!(merged.windows(2).all(|w| w[0].price_gbp <= w[1].price_gbp));
}

#[test]
fn caps_merged_offers_at_twenty_keeping_the_cheapest() {
    let amadeus: Vec<_> = (0..15)
        .map(|i| offer(&format!("a-{i}"), "amadeus", 10_000 + i * 1_000))
        .collect();
    let skyscanner: Vec<_> = (0..15)
        .map(|i| offer(&format!("s-{i}"), "skyscanner", 10_500 + i * 1_000))
        .collect();

    let merged = merge_offers(amadeus, skyscanner);
    assert_eq!(merged.len(), MAX_OFFERS);
    // Cheapest first, and everything kept is cheaper than everything dropped:
    // the 20 cheapest of the 30 offers end at 19_500.
    assert_eq!(merged[0].price_gbp, 10_000);
    assert_eq!(merged[MAX_OFFERS - 1].price_gbp, 19_500);
}

#[test]
fn handles_empty_and_one_sided_inputs() {
    assert!(merge_offers(Vec::new(), Vec::new()).is_empty());

    let only_amadeus = merge_offers(vec![offer("a-1", "amadeus", 1_000)], Vec::new());
    assert_eq!(only_amadeus.len(), 1);

    let only_sky = merge_offers(Vec::new(), vec![offer("s-1", "skyscanner", 1_000)]);
    assert_eq!(only_sky.len(), 1);
}

#[test]
fn stable_sort_preserves_provider_order_on_price_ties() {
    let merged = merge_offers(
        vec![offer("a-1", "amadeus", 5_000)],
        vec![offer("s-1", "skyscanner", 5_000)],
    );
    assert_eq!(merged[0].id, "a-1");
    assert_eq!(merged[1].id, "s-1");
}
