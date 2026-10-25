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

The guided flow searches automatically when Flights opens. Departure and destination
are inherited, editable city/airport comboboxes. Selecting a suggestion or submitting
Update flights runs a new route search; typing alone uses the local airport directory.
See `GUIDED_TRAVEL_FLOW.md` for ranking, selection, family ages and step behavior.

Clients and backend share identical in-flight requests and use ten-minute memory
caches. Each upstream search uses one request; there is no automatic return-flight
or booking-option lookup. Results include real advertised prices and a Google Flights
link. A user can save a selected search estimate to the planning budget. It remains
unbooked and unconfirmed; return flight, baggage and final fare are checked on the
provider website. Simulated comparison and manual quote controls are removed.

Official provider documentation: https://serpapi.com/google-flights-api

## Connection details

Flight tickets display each outbound connection airport and provider layover minutes,
with overnight and airport-change warnings. Expanded details show every segment’s
flight number, local times and duration. The adapter preserves SerpApi `layovers`;
older single-stop responses can recover waiting time from total duration minus leg
durations. Missing individual waits on older multi-stop responses are labeled unavailable.
Airport-local timestamps are never subtracted across time zones to invent durations.
