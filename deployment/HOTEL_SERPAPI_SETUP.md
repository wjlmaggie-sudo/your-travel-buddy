# Real hotel search through SerpApi

Deployed 24 October 2026 to Supabase project `xuvilqwfeiwfoigcvrsb` as
`search-hotels-live`. A live test returned 12 Berlin hotel results for two adults,
20–22 November 2026, in EUR. First returned whole-stay totals were EUR 97, 122
and 144; tax inclusion was not confirmed. These are advertised search prices,
not guaranteed availability or confirmed bookings.

The existing `SERPAPI_API_KEY` secret serves both hotels and flights. It remains
server-side. No bank details, payment method, paid upgrade or Nuitee production
activation was performed. Public build configuration:

- `VITE_HOTEL_SEARCH_URL=https://xuvilqwfeiwfoigcvrsb.supabase.co/functions/v1/search-hotels-live`
- `VITE_HOTEL_SEARCH_MODE=serpapi`
- Existing `VITE_AI_GATEWAY_KEY` public legacy anon JWT, for the same gateway.

JWT verification stays enabled. The existing hotel origin allowlist applies.
The service-only `claim_flight_search` counter is intentionally reused: hotels
and flights together are limited to 200 upstream requests per UTC calendar month.
No new migration is needed if the flight search quota migration is already applied.
The provider's 250-search free plan is the final account-wide limit, including
manual searches and other integrations. UTC month boundaries and provider billing
resets can differ. This is a bounded pilot, not per-user abuse protection.

The guided flow searches automatically when Hotels opens. Identical concurrent requests share
one upstream call, and completed results are cached in server memory for ten
minutes. SerpApi may also return cached results. The app displays source and
retrieval times, uses only returned whole-stay `total_rate` amounts, prefers
`extracted_after_taxes_fees`, and labels unknown tax inclusion. Missing whole-stay
prices are excluded; nightly prices are never multiplied into invented totals.
Budget filtering happens locally, so adjusting the allowance does not spend
another provider request. Selected advertised prices can be saved as planning estimates, never as confirmed
bookings or guaranteed prices. See GUIDED_TRAVEL_FLOW.md.

This is a one-room search for 1–6 adults, with exact child ages when available,
and stays of 1–29 nights. Child age ranges are not converted into guessed ages:
the external family search remains available. Larger groups must use an external
search. Property website links are not offer-specific checkout links. Google
Hotels comparison links describe the requested dates and guests; users must
confirm those details, room capacity, tax, cancellation terms and the final price
on the booking website. No payment, reservation or prebooking endpoint is called.

Dashboard deployments use a single generated entry file made from the checked-in
shared module and function entry, with pinned npm imports. CLI deployments use the
checked-in `deno.json` and shared module directly. Do not replace the existing
accounts/trips backend or run historical migrations on the hotel function project.

Validation: adapter, client and UI tests cover whole-stay totals, mismatched
searches, exact child occupancy, safe links and secret redaction, quota failures,
caching, automatic step entry, selections, budget filtering and stale results. TypeScript and the
production Pages build passed. The deployed API returned HTTP 200 from an
allowed-origin request with the existing public gateway JWT.

Official references:

- https://serpapi.com/google-hotels-api
- https://serpapi.com/pricing

The earlier Nuitee production setup document describes an alternative that was
not activated. Its sandbox endpoint remains available but is not used by the
SerpApi frontend configuration.

## Room count integration

The Hotels section displays a suggested room setup based on group size. The room-count selector has been removed at the owner’s request. Existing saved room counts remain intact. The current Google Hotels
adapter supports a single-room lookup. For multiple requested rooms, the app
keeps that selection in the journey and PDF, suppresses single-room offers and
provides a Booking.com search for all requested rooms and travelers. It never
multiplies a single-room advertised price into a verified multi-room total. The
Nuitee sandbox adapter supports evenly distributed adult multi-room test requests;
this is separate from the active SerpApi live search.
