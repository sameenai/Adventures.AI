//! Request validation, mirroring `flightSearchSchema` in
//! `apps/web/src/lib/validators/flight.ts`.

use serde::Serialize;
use serde_json::{Map, Value};

use crate::models::{CabinClass, FlightSearch};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ValidationIssue {
    pub field: &'static str,
    pub message: String,
}

impl ValidationIssue {
    fn new(field: &'static str, message: impl Into<String>) -> Self {
        Self {
            field,
            message: message.into(),
        }
    }
}

/// Validate a raw JSON body into a `FlightSearch`.
///
/// Rules (identical to the Zod schema):
/// - `origin`/`destination`: exactly three uppercase A-Z characters
/// - `departureDate`/`returnDate`: `YYYY-MM-DD` (`returnDate` optional)
/// - `passengers`: integer 1-9, default 1
/// - `cabinClass`: economy | premium_economy | business | first, default economy
pub fn validate_search(body: &Value) -> Result<FlightSearch, Vec<ValidationIssue>> {
    let Some(obj) = body.as_object() else {
        return Err(vec![ValidationIssue::new(
            "body",
            "request body must be a JSON object",
        )]);
    };

    let mut issues = Vec::new();
    let origin = iata_field(obj, "origin", &mut issues);
    let destination = iata_field(obj, "destination", &mut issues);
    let departure_date = date_field(obj, "departureDate", true, &mut issues);
    let return_date = date_field(obj, "returnDate", false, &mut issues);
    let passengers = passengers_field(obj, &mut issues);
    let cabin_class = cabin_class_field(obj, &mut issues);

    if !issues.is_empty() {
        return Err(issues);
    }

    Ok(FlightSearch {
        origin: origin.unwrap(),
        destination: destination.unwrap(),
        departure_date: departure_date.unwrap(),
        return_date,
        passengers,
        cabin_class,
    })
}

fn iata_field(
    obj: &Map<String, Value>,
    field: &'static str,
    issues: &mut Vec<ValidationIssue>,
) -> Option<String> {
    match obj.get(field) {
        Some(Value::String(code)) if is_iata(code) => Some(code.clone()),
        Some(_) => {
            issues.push(ValidationIssue::new(field, "Must be a valid IATA code"));
            None
        }
        None => {
            issues.push(ValidationIssue::new(field, "is required"));
            None
        }
    }
}

fn date_field(
    obj: &Map<String, Value>,
    field: &'static str,
    required: bool,
    issues: &mut Vec<ValidationIssue>,
) -> Option<String> {
    match obj.get(field) {
        Some(Value::String(date)) if is_date(date) => Some(date.clone()),
        Some(_) => {
            issues.push(ValidationIssue::new(field, "must match YYYY-MM-DD"));
            None
        }
        None => {
            if required {
                issues.push(ValidationIssue::new(field, "is required"));
            }
            None
        }
    }
}

fn passengers_field(obj: &Map<String, Value>, issues: &mut Vec<ValidationIssue>) -> u32 {
    let Some(value) = obj.get("passengers") else {
        return 1;
    };
    if let Some(n) = value.as_f64() {
        if n.fract() == 0.0 && (1.0..=9.0).contains(&n) {
            return n as u32;
        }
    }
    issues.push(ValidationIssue::new(
        "passengers",
        "must be an integer between 1 and 9",
    ));
    1
}

fn cabin_class_field(obj: &Map<String, Value>, issues: &mut Vec<ValidationIssue>) -> CabinClass {
    let Some(value) = obj.get("cabinClass") else {
        return CabinClass::Economy;
    };
    if let Some(cabin) = value.as_str().and_then(CabinClass::parse) {
        return cabin;
    }
    issues.push(ValidationIssue::new(
        "cabinClass",
        "must be one of economy, premium_economy, business, first",
    ));
    CabinClass::Economy
}

fn is_iata(code: &str) -> bool {
    code.len() == 3 && code.bytes().all(|b| b.is_ascii_uppercase())
}

fn is_date(date: &str) -> bool {
    let bytes = date.as_bytes();
    bytes.len() == 10
        && bytes.iter().enumerate().all(|(i, b)| match i {
            4 | 7 => *b == b'-',
            _ => b.is_ascii_digit(),
        })
}
