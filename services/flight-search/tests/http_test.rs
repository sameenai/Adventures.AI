use axum::body::{to_bytes, Body};
use axum::http::{header, Request, StatusCode};
use flight_search::app;
use serde_json::{json, Value};
use tower::ServiceExt;

async fn body_json(response: axum::response::Response) -> Value {
    let bytes = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("read body");
    serde_json::from_slice(&bytes).expect("json body")
}

fn search_request(body: &Value) -> Request<Body> {
    Request::builder()
        .method("POST")
        .uri("/v1/flights/search")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(body.to_string()))
        .expect("request")
}

#[tokio::test]
async fn healthz_returns_ok() {
    let response = app()
        .oneshot(
            Request::builder()
                .uri("/healthz")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(body_json(response).await, json!({ "status": "ok" }));
}

#[tokio::test]
async fn search_reports_providers_unavailable_when_no_provider_configured() {
    // The test environment configures no providers; make that explicit so the
    // assertion cannot be broken by ambient credentials.
    for key in [
        "AMADEUS_CLIENT_ID",
        "AMADEUS_CLIENT_SECRET",
        "SKYSCANNER_API_KEY",
    ] {
        std::env::remove_var(key);
    }

    let response = app()
        .oneshot(search_request(&json!({
            "origin": "LHR",
            "destination": "JFK",
            "departureDate": "2026-09-01"
        })))
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["offers"], json!([]));
    assert_eq!(body["cached"], json!(false));
    assert_eq!(body["providersUnavailable"], json!(true));

    let searched_at = body["searchedAt"].as_str().expect("searchedAt string");
    assert_eq!(searched_at.len(), 20);
    assert!(searched_at.ends_with('Z'));
    assert_eq!(&searched_at[10..11], "T");
}

#[tokio::test]
async fn search_rejects_invalid_body_with_422_json_error() {
    let response = app()
        .oneshot(search_request(&json!({
            "origin": "lhr",
            "destination": "JFK",
            "departureDate": "01-09-2026",
            "passengers": 12
        })))
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let body = body_json(response).await;
    assert_eq!(body["error"], json!("validation_error"));

    let issues = body["issues"].as_array().expect("issues array");
    let fields: Vec<_> = issues
        .iter()
        .map(|issue| issue["field"].as_str().unwrap_or_default())
        .collect();
    assert!(fields.contains(&"origin"));
    assert!(fields.contains(&"departureDate"));
    assert!(fields.contains(&"passengers"));
}

#[tokio::test]
async fn search_applies_defaults_before_validation_passes() {
    // Valid minimal body: passengers/cabinClass defaults must not trip
    // validation. (Provider env is absent, so the response is the
    // providers-unavailable shape rather than an upstream call.)
    let response = app()
        .oneshot(search_request(&json!({
            "origin": "EDI",
            "destination": "CDG",
            "departureDate": "2026-10-10"
        })))
        .await
        .expect("response");

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn unknown_route_is_404() {
    let response = app()
        .oneshot(
            Request::builder()
                .uri("/v1/flights/nope")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
