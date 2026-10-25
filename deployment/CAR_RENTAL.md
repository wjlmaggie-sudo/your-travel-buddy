# Car rental search — Scrappa free-tier adapter

The website has a separate Car Rental section for guests and saved trips. It reuses trip dates and destination, lets the traveler confirm an airport pickup, and requires actual driver age and country of residence because these affect rental prices. It searches one car with return to the same airport. No demo inventory, reservation or payment is created.

## Provider and activation

Scrappa advertises 500 free monthly credits after email verification, no payment card required:
- https://scrappa.co/pricing
- https://scrappa.co/apis/rentalcars-api
- https://scrappa.co/docs/rentalcars-api/rentalcars_search

This is an independent Rentalcars.com data service, not an official supplier API. Account verification and a private `SCRAPPA_API_KEY` in Supabase Edge Function secrets are required. Do not commit the key or use a VITE variable for it. Keep the account on the free allowance; do not buy credits, enable topups or attach payment details without separate user authorization. Free access and endpoint availability are controlled by the provider and can change.

Apply `supabase/migrations/20261025193000_car_search_quota.sql` and deploy `supabase/functions/search-cars/index.ts` to project `xuvilqwfeiwfoigcvrsb`, retaining JWT verification. The frontend derives its car endpoint from the same Supabase project URL as live hotel search. The legacy public anon JWT already used by flight/hotel searches is not the provider secret.

The service-only atomic quota permits at most 400 upstream attempts per UTC month, independently of flight/hotel quotas. All attempted searches count, including failures. Cache hits bypass the quota. This cap is below the advertised allowance but any usage elsewhere on the same provider account also consumes provider credits. The adapter stops on provider errors or payment challenges; it cannot purchase credits and does not retry or switch to demo data.

## Data and budget behavior

Requests use `pickup_location` (IATA airport), pickup/return dates and local times, `drivers_age`, `cor`, currency and price sorting. Normalization verifies provider-returned dates, airport, driver age, market and currency. Invalid offers, wrong currencies and cars with too few seats are excluded. It returns up to 12 cheapest valid offers; the UI displays up to six. These are advertised prices, not guaranteed inventory or confirmed bookings.

Selected whole-rental cost is an additional budget line. Local transport remains separate for fuel, parking and other travel, avoiding silently replacing an estimate. Changing destination, travel dates, traveler count or currency invalidates the selection. Guest selections remain in tab-session storage; explicit account-save uses existing journey metadata. PDF export includes selected rental details and cost.

The API's documented search response does not provide a verified offer-specific booking URL. The website therefore links to the provider's search homepage and explicitly says that the exact car/price is not preselected. No invented booking URLs or images are displayed. Optional insurance, excess, child seats, cancellation conditions, taxes and additional charges must be confirmed with the provider. Unknown deposits are shown as not supplied, never zero.

## Verification

Focused tests cover date validation, driver-specific pricing mismatches, currency and seat filtering, origin/activation gates, quota exhaustion, caching, private header handling, payment-error handling and budget/session-schema behavior. Activation is complete only after a real response is validated through the deployed function; mocked tests do not prove live access.
