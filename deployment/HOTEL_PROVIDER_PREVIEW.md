# Hotel provider preview — 23 October 2026

This update prepares a **Nuitee Connect / LiteAPI hotel sandbox**, not live bookings.
The owner-authorized sandbox account and private backend credential are configured.
The `search-hotels` function and 20-request daily quota are deployed in Supabase
project `xuvilqwfeiwfoigcvrsb`. A guest API test on 23 October 2026 returned three
hotel previews successfully. This is a real provider connection with **test prices**,
not verified production offers. Flights remain demonstrations;
car-rental integration is still pending a suitable provider agreement. The existing
free planner, guest sessions, saved trips, quotes, budget and PDF exports remain usable.

## What this version supports

- Hotels shows a connection-pending card and an external Booking.com search when unconfigured.
- After setup, guests can explicitly request up to three sandbox hotel previews within
  the accommodation allowance. No requests run automatically on load or navigation.
- Search specifies city, destination country, lead guest nationality, dates, currency
  and adult travelers. Rooms hold two adults, with a separate room for an odd traveler.
- The adapter uses the whole-offer `offerRetailRate`, validates occupancy and currency,
  and accepts both documented array totals and the object totals observed in the sandbox.
  Requests require a sandbox credential matching the observed `sand_` UUID format.
  An explicit production flag is rejected. When the upstream sandbox omits its flag,
  provenance comes from the verified server-side sandbox credential and sandbox-only mode.
- Sandbox offers cannot be booked, selected as real quotes, saved or exported to PDF.
  They are only held in component memory. Editing criteria clears stale results.
- A service-only database counter limits all guests together to 20 upstream requests
  per UTC day, including failed provider requests. Database errors block searches.
  This is a small testing allowance, not a production fair-use or spending guarantee.

## Owner setup, when ready

1. Create a Nuitee Connect account and obtain a **sandbox** key. Do not activate
   production, add payment details or buy credits for this prototype. Confirm current
   sandbox terms and the intended compare-and-redirect use case with the provider.
2. Choose the Supabase project that will host only this function. It can be the owner's
   `xuvilqwfeiwfoigcvrsb` project without migrating the original account/trip backend.
   **Do not change `VITE_SUPABASE_URL`, the existing public key or the main project ID.**
3. Apply only `supabase/migrations/20261023120000_hotel_preview_quota.sql` in that
   project's SQL editor. Do not run all historical migrations against a new backend.
4. In that project's Edge Function secrets, add:
   - `NUITEE_SANDBOX_API_KEY`: private sandbox key, never a `VITE_` variable.
   - `HOTEL_SEARCH_MODE`: `sandbox`. Any other value disables provider requests.
   - `HOTEL_ALLOWED_ORIGINS`: `https://wjlmaggie-sudo.github.io` (no trailing slash).
     Optional development origins must be listed explicitly, comma separated.
   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function.
5. Deploy `search-hotels` using the Supabase CLI, explicitly targeting the chosen
   project: `supabase functions deploy search-hotels --project-ref PROJECT_REF --no-verify-jwt`.
   Its import map is in the function's `deno.json`. Do not deploy/enable paid AI functions.
6. Set the **public endpoint**, not the provider key, in the frontend build:
   `VITE_HOTEL_SEARCH_URL=https://PROJECT_REF.supabase.co/functions/v1/search-hotels`.
   Pass this optional value through the Pages build workflow/environment and rebuild.
   It does not replace the main Supabase backend. Missing configuration is safe.
7. Verify an allowed-origin guest request, unavailable/invalid searches, the quota,
   and provider sandbox response against the real account. A deployed endpoint
   does not by itself prove provider credentials work.

To disable, remove the frontend endpoint and rebuild, or change `HOTEL_SEARCH_MODE`
away from `sandbox` in Supabase. Do not raise the SQL quota to work around failures.

## Before any production launch

Provider account approval, permitted display/storage/export rules, checkout ownership,
fees, production credentials, real price/cancellation/tax handling and booking flow
must be confirmed. This endpoint deliberately does **not** have a production mode.
Origin restrictions do not authenticate users; non-browser callers can spoof Origin.
The atomic global quota is the hard request bound for this small public sandbox.
Add appropriate per-user abuse controls before broader access. This update neither
activates live flights nor implements car rental, payment, reservations or live AI.

Official contract used for the adapter:
[Hotel rates API](https://docs.liteapi.travel/reference/post_hotels-rates).
Provider sandbox verification succeeded. Production integration remains unimplemented.
