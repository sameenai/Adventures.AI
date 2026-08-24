//! Merge logic shared by the search handler: offers from all configured
//! providers are combined, sorted by price ascending, and capped.

use crate::models::FlightOffer;

/// Maximum offers returned by a search (and by each provider adapter).
pub const MAX_OFFERS: usize = 20;

/// Merge two providers' offers: concatenate, sort by `priceGBP` ascending
/// (stable, so provider order breaks ties), cap at `MAX_OFFERS`.
pub fn merge_offers(
    mut offers: Vec<FlightOffer>,
    more_offers: Vec<FlightOffer>,
) -> Vec<FlightOffer> {
    offers.extend(more_offers);
    offers.sort_by_key(|offer| offer.price_gbp);
    offers.truncate(MAX_OFFERS);
    offers
}
