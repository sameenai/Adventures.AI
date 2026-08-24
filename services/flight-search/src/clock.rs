//! Minimal UTC RFC 3339 formatting — avoids pulling a full date/time crate
//! for the single `searchedAt` timestamp this service emits.

use std::time::{SystemTime, UNIX_EPOCH};

/// The current time as an RFC 3339 UTC timestamp, e.g. `2026-08-24T12:34:56Z`.
pub fn now_rfc3339() -> String {
    let unix_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format_rfc3339(unix_secs)
}

/// Format a unix timestamp (seconds) as RFC 3339 UTC.
pub fn format_rfc3339(unix_secs: u64) -> String {
    let days = (unix_secs / 86_400) as i64;
    let secs_of_day = unix_secs % 86_400;
    let (year, month, day) = civil_from_days(days);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}Z",
        secs_of_day / 3_600,
        (secs_of_day % 3_600) / 60,
        secs_of_day % 60
    )
}

/// Days-since-epoch to (year, month, day). Howard Hinnant's `civil_from_days`.
fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    (if month <= 2 { year + 1 } else { year }, month, day)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_epoch() {
        assert_eq!(format_rfc3339(0), "1970-01-01T00:00:00Z");
    }

    #[test]
    fn formats_known_timestamps() {
        assert_eq!(format_rfc3339(86_400), "1970-01-02T00:00:00Z");
        assert_eq!(format_rfc3339(1_704_067_200), "2024-01-01T00:00:00Z");
        // Leap-year day: 2024-02-29T12:00:00Z
        assert_eq!(format_rfc3339(1_709_208_000), "2024-02-29T12:00:00Z");
    }

    #[test]
    fn now_has_rfc3339_shape() {
        let now = now_rfc3339();
        assert_eq!(now.len(), 20);
        assert!(now.ends_with('Z'));
        assert_eq!(&now[4..5], "-");
        assert_eq!(&now[10..11], "T");
    }
}
