# Live AI and accommodation comparison

GitHub Pages serves the frontend. Trips and sign-in remain in the original
Lovable backend (`secqnjmhobdbpalktkcb`). The separate AI function is deployed in
owner-managed Supabase project `xuvilqwfeiwfoigcvrsb`; it verifies the original
account using `TRAVEL_AUTH_URL` and `TRAVEL_AUTH_ANON_KEY` (public auth config).
No trip-table migration or account migration is required for this connection.

## AI deployment

The function and `20261017180000_ai_usage.sql` were deployed through the owner's
Supabase dashboard on 17 October 2026. The owner saved `OPENAI_API_KEY` on 17 October 2026. The live provider test
now reaches OpenAI but returns HTTP 429 with `credit_balance_exhausted`.
The API organization has no prepaid credit remaining; the owner must add credit
in OpenAI billing before a successful generation can be verified. No credit
purchase or payment was made during this test.

1. Add `OPENAI_API_KEY` in **Edge Functions → Secrets**. Never put it in GitHub
   source, browser code, a `VITE_` variable, or chat. The provider account needs
   API access and available billing credit; a ChatGPT subscription is separate.
2. Optional backend secret `OPENAI_MODEL` defaults to `gpt-5.4-mini`. Output uses
   the Responses API with strict JSON schema; storage is disabled.
3. Keep the original auth project's public URL and anon/publishable key in
   `TRAVEL_AUTH_URL` / `TRAVEL_AUTH_ANON_KEY`. These have already been configured.
   They do not grant administration or database access beyond the existing user.
4. Keep legacy gateway JWT verification enabled. The browser sends the AI
   project's public **legacy anon JWT** as `Authorization` and `apikey`; it sends
   the signed-in travel account token in `x-travel-authorization`. The handler
   verifies that user with the original Auth server on every request. A gateway
   anon key alone cannot generate plans.
5. Build Pages with `VITE_AI_FUNCTIONS_URL` and `VITE_AI_GATEWAY_KEY` in the ignored
   local `.env` (or matching GitHub Actions secrets if enabling workflow builds).
   These are public endpoint/gateway values. The current local build is configured.
6. Sign in on the published site, open a trip and choose **Suggest my whole trip**.
   Confirm a full AI plan appears. Provider credit exhaustion, spending/usage caps
   and temporary rate limits have distinct, sanitized messages. If setup/provider access fails, the exact error
   and an explicitly labeled template fallback are shown instead.

Each authenticated account can claim at most **20 requests per UTC day**, enforced
atomically by the database. Provider failures after claiming count toward this
limit. Only `service_role` can execute the claim function; there are no browser
policies on its usage table. Set additional provider/project spending limits in
OpenAI to control total cost across accounts. No extra paid plan was purchased.

For subsequent source changes, run `node scripts/prepare-ai-editor.mjs` and paste
its output into the dashboard's **generate-trip-ideas** code editor, or deploy the
source with Supabase CLI. The dashboard bundle is generated from committed source.
Do not remove input/auth/quota checks. The native Lovable server build retains its
existing Lovable provider integration; Pages uses the separate endpoint.

## Accommodation prices and choices

Booking.com in this chat can look up availability for a specific request. That
connector is not an API credential for the public website. Embedding live prices
requires an approved Booking.com Demand API partner account, API token and
Affiliate ID. Hostelworld similarly offers a partner API; its access is not
configured. No scraping or unauthenticated price service is claimed.

The website provides date/occupancy/currency-specific Booking.com searches,
Hostelworld and hotel comparison links, plus named Lisbon properties. Rates inside
the site are not live provider quotes. A traveler can enter a current quote, choose
that stay, and recalculate the trip. Whole-stay, room/night and bed/person/night
pricing have separate multipliers; extras are explicit. A five-day trip has four
nights. One-day trips have no accommodation allowance. Chosen quotes are scoped
to destination, dates, travelers and currency, so changed trips cannot silently
reuse a mismatched quote. No FX conversion is guessed.

A selected quote is kept in the public planner draft and, when signed in, in the
user's Auth metadata under `travel_stays`, keyed by trip ID. This is planning data,
not an expense or a confirmed booking. It replaces the stay allowance; the rest
is divided exactly into daily non-accommodation limits. AI receives that same
whole-stay amount and is told to report shortfalls instead of inventing prices.

## Distances and admission

Suggested stop legs use a haversine straight-line distance. Rough walking times
assume a 30% detour at 4 km/h. They are not routed journeys, live ETAs, public
transport schedules or quoted taxi fares. Directions open the actual route in
Google Maps. Edited activities do not reroute the suggested guide preview.

Lisbon admission information and transport tariffs link to official operators,
show their verification date, distinguish free/paid/unverified access, and flag
known weekday closures. Belém Tower opening status is deliberately unverified;
its published tariff is not treated as available inventory. Ticket costs are not
silently added to the planned budget or recorded as purchases. Unknown destinations
show missing information rather than invented prices or purchase links.

Sources: [OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs),
[Booking.com authentication](https://developers.booking.com/demand/docs/development-guide/authentication),
[Hostelworld partner API](https://partner-api.hostelworld.com/).
