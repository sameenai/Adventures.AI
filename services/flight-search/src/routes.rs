use std::sync::Arc;
use std::time::Duration;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde_json::{json, Value};

use crate::aggregator::merge_offers;
use crate::clock::now_rfc3339;
use crate::config::{AmadeusConfig, SkyscannerConfig};
use crate::models::SearchResponse;
use crate::providers::amadeus::{self, TokenCache};
use crate::providers::skyscanner;
use crate::validate::validate_search;

/// Every provider HTTP call carries an 8s timeout (see `send_with_retry` for
/// the retry policy).
const HTTP_TIMEOUT: Duration = Duration::from_secs(8);

pub struct AppState {
    pub http: reqwest::Client,
    pub amadeus_tokens: TokenCache,
}

impl AppState {
    pub fn new() -> Self {
        let http = reqwest::Client::builder()
            .timeout(HTTP_TIMEOUT)
            .build()
            .expect("reqwest client");
        Self {
            http,
            amadeus_tokens: TokenCache::default(),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Build the service router.
pub fn app() -> Router {
    Router::new()
        .route("/healthz", get(healthz))
        .route("/v1/flights/search", post(search_flights))
        .with_state(Arc::new(AppState::new()))
}

async fn healthz() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

async fn search_flights(State(state): State<Arc<AppState>>, Json(body): Json<Value>) -> Response {
    let search = match validate_search(&body) {
        Ok(search) => search,
        Err(issues) => {
            return (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(json!({ "error": "validation_error", "issues": issues })),
            )
                .into_response();
        }
    };

    // Provider config is read per request — env vars can change between Cloud
    // Run revisions sharing a warm container.
    let amadeus_config = AmadeusConfig::from_env();
    let skyscanner_config = SkyscannerConfig::from_env();

    if amadeus_config.is_none() && skyscanner_config.is_none() {
        // No mock data in this service — the Next.js layer owns demo mode.
        tracing::error!("no flight providers configured — returning empty result");
        return Json(SearchResponse {
            offers: Vec::new(),
            cached: false,
            searched_at: now_rfc3339(),
            providers_unavailable: Some(true),
        })
        .into_response();
    }

    let amadeus_offers = async {
        match &amadeus_config {
            Some(config) => amadeus::search(&state.http, config, &state.amadeus_tokens, &search)
                .await
                .unwrap_or_else(|err| {
                    tracing::error!("amadeus search failed: {err}");
                    Vec::new()
                }),
            None => Vec::new(),
        }
    };
    let skyscanner_offers = async {
        match &skyscanner_config {
            Some(config) => skyscanner::search(&state.http, config, &search)
                .await
                .unwrap_or_else(|err| {
                    tracing::error!("skyscanner search failed: {err}");
                    Vec::new()
                }),
            None => Vec::new(),
        }
    };
    let (amadeus_offers, skyscanner_offers) = tokio::join!(amadeus_offers, skyscanner_offers);

    Json(SearchResponse {
        offers: merge_offers(amadeus_offers, skyscanner_offers),
        cached: false,
        searched_at: now_rfc3339(),
        providers_unavailable: None,
    })
    .into_response()
}
