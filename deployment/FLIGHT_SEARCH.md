# SerpApi flight search

The flight adapter and dedicated quota have been deployed to the owner's separate
Supabase project `xuvilqwfeiwfoigcvrsb`. The private key was saved in Supabase secrets after owner approval. A live search
for BER–LIS, 10–15 December 2026, two adults, returned nine priced offers (HTTP 200). No API key is stored in source files.

The frontend calls `search-flights` with the existing public AI gateway JWT.
Legacy JWT verification stays enabled. Allowed browser origin defaults to
`https://wjlmaggie-sudo.github.io`; optional origins must be explicitly listed in
`FLIGHT_ALLOWED_ORIGINS`. Origin checks alone do not authenticate callers.

Apply only `20261024160000_flight_search_quota.sql` to the function project, not
historical trip/account migrations. Its service-only atomic counter limits requests
to 200 per UTC calendar month. This is a shared pilot allowance, not per-user
abuse protection. It counts failures conservatively and is separate from SerpApi's
billing-cycle counter. SerpApi's free account allowance is the final provider limit.
No paid upgrade, automatic renewal, or payment method is configured by this change.

Store `SERPAPI_API_KEY` only in Supabase Edge Function secrets. Never add it to a
`VITE_` variable, commit, URL displayed to users, or frontend build. Public build
configuration: `VITE_FLIGHT_SEARCH_URL` and the existing `VITE_AI_GATEWAY_KEY`.
The original accounts/trips backend remains unchanged.

Searches run only on an explicit button press. Airport codes and passenger age
categories are confirmed in the form; no city-to-airport guessing or extra paid
lookup calls. Infants use their own seat; lap-infant searches are unsupported.
Identical requests share an in-flight request and a ten-minute memory cache.
SerpApi may also serve its own cached results. Each upstream search uses one
request; there is no automatic return-flight or booking-option lookup.

Results show actual provider prices, outbound segments, local airport timestamps,
source/retrieval times and a Google Flights link. The first-stage round-trip search
has not selected the return leg, so these offers cannot be saved as confirmed
quotes or used to update trip budgets. Users choose return flights and verify the
full price, baggage and availability on Google Flights. The existing entered-quote
flow remains available. Simulated comparison cards are collapsed and labeled.

Validation: new adapter tests cover invalid dates and parties, route matching,
incomplete offers, caching/concurrent requests, quota failures, provider errors and
secret redaction. Type checking and a production build passed. The first full suite
run passed 149/151 tests; two existing guest-planner tests failed following a timeout.
All nine tests in that planner file passed when rerun in isolation. New flight and
journey tests passed (nine tests). Live provider verification passed. Publishing is performed after the source checks.

Official provider documentation: https://serpapi.com/google-flights-api
