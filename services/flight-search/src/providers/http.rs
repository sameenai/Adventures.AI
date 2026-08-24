//! Shared HTTP helper mirroring the TS `fetchWithRetry`: every call carries an
//! 8s timeout (set on the shared `reqwest::Client`), with one retry on a
//! transport error (connect/timeout) or a 5xx response.

/// Send a request, retrying once on a transport error or a 5xx response.
/// The second attempt's outcome is returned as-is, matching the TS helper.
pub async fn send_with_retry<F>(build: F) -> Result<reqwest::Response, reqwest::Error>
where
    F: Fn() -> reqwest::RequestBuilder,
{
    match build().send().await {
        Ok(response) if response.status().is_server_error() => build().send().await,
        Ok(response) => Ok(response),
        Err(_) => build().send().await,
    }
}
