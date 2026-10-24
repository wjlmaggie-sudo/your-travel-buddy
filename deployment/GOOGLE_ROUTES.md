# Google Routes transport comparison

Prepared 24 October 2026. **Google API not activated or live-tested.** No Google credential is
configured locally, no Google billing was enabled, and no paid route calls were made.
The owner is unsure whether a Google Cloud project exists. Keep activation off until
the owner has reviewed the account and costs.

## Prepared behavior

Public and saved daily plans show a compact “Getting around” panel below their suggested stops. Walking, public transport and car use labeled icon links. A route summary expands to edit locations/departure, while journey details and privacy information are available in a separate disclosure. Start/end
fields default to the first two stops; other stops and hotel/airport/full addresses
are supported. Known stops send exact coordinates. An optional departure uses the
explicitly displayed device timezone. Empty means now, independently of trip dates.

Without `VITE_TRANSPORT_ROUTES_URL`, the panel displays direct, clearly labeled
example times only for the reviewed Alfama → Lisbon Cathedral design preview
(9 min walking, 12 min public transport, 5 min driving). These are fictional design
values, never provider results. Other routes show “Not connected”; edits immediately
remove examples when the pair no longer matches. Examples are not saved or exported.
Optional public transport, walking and driving links remain under journey details.
These links do not call our Routes API or require developer billing.

When configured, a manual comparison makes one request per mode. Transit displays
returned walking distance, lines and transfer count. Driving uses `TRAFFIC_AWARE`.
Modes can fail independently; missing routes never become invented journey times.
Fares, disruption alerts, fuel, parking and toll prices are not retrieved. Results
stay in component memory; editing locations invalidates them. No route data is saved
in trips or PDF exports. The OpenStreetMap map continues to show only suggested
markers; Google geometry is neither requested nor drawn on it. Google results have a
separate bordered panel, attribution and walking warnings.

## Cost and request limits

Google's global pay-as-you-go pricing checked 24 October 2026:

| SKU | Monthly free allowance | First paid tier, USD per 1,000 |
| --- | --- | --- |
| Compute Routes Essentials (walking/transit here) | 10,000 | $5 |
| Compute Routes Pro (traffic-aware driving here) | 5,000 | $10 |

One complete comparison uses two Essentials calls and one Pro call. Allowances are
shared at the billing-account level, not separate for each user or website. Billing
activation is required even within the allowance. Other API usage, taxes and backend
hosting can affect total costs. This change does not enable billing.

The supplied atomic database quota caps all users together at **30 upstream attempts
per UTC day**, normally ten full comparisons. Failures consume quota too. No retries
or automatic searches occur. Database errors block requests. This does not limit
another app using the same Google account/key. Configure Google quotas as well;
budget alerts do not enforce spending limits. Origin restrictions are browser
protection, not authentication; other clients can spoof Origin but cannot bypass
the database quota through this handler.

## Activation steps, when approved

1. Check projects/APIs/Billing in the owner's existing
   [Google Cloud console](https://console.cloud.google.com/) before creating anything.
   The owner must handle payment setup and acceptance of any new terms.
2. Enable Routes API, activate billing only once approved, and create a backend-only
   API key restricted to Routes API. Do not use browser-referrer restrictions for a
   server key. Restrict server IPs only if stable egress has been configured.
3. Use the existing optional-integration Supabase project `xuvilqwfeiwfoigcvrsb`.
   Apply only `supabase/migrations/20261024120000_transport_quota.sql` there. Do not
   migrate or replace the existing account/trip backend.
4. Set private Edge Function secrets:
   - `GOOGLE_ROUTES_API_KEY`: private key, never in chat or any `VITE_` variable.
   - `GOOGLE_ROUTES_ENABLED`: `true` only when approved for activation.
   - `TRANSPORT_ALLOWED_ORIGINS`: `https://wjlmaggie-sudo.github.io`.
   Supabase provides the function's own URL/service-role credential.
5. Deploy with an explicit target:
   `supabase functions deploy transport-routes --project-ref xuvilqwfeiwfoigcvrsb --no-verify-jwt`.
   Guest access uses its own origin allowlist and durable quota.
6. Before public activation, publish application Terms of Use and Privacy Policy
   meeting Google's requirements, including Google terms/privacy links and data
   processing disclosures. The contextual feature links do not replace full app
   policies. Review EEA-specific requirements for an EEA billing account.
7. Set public build configuration `VITE_TRANSPORT_ROUTES_URL` to
   `https://xuvilqwfeiwfoigcvrsb.supabase.co/functions/v1/transport-routes` and rebuild.
   The workflow template reads the same-named repository variable. Keep existing
   `VITE_SUPABASE_*` values to preserve accounts and trips.
8. Verify real requests for all modes, future departure, unavailable routes,
   upstream denial, quota rejection and disallowed Origin. Confirm account usage
   in Google Cloud. Mock tests do not establish a working live provider connection.

Disable by removing the frontend endpoint and rebuilding or setting backend
`GOOGLE_ROUTES_ENABLED` to `false`.

Official sources: [pricing](https://developers.google.com/maps/billing-and-pricing/pricing),
[billing](https://developers.google.com/maps/documentation/routes/usage-and-billing),
[requests](https://developers.google.com/maps/documentation/routes/compute_route_directions),
[transit](https://developers.google.com/maps/documentation/routes/transit-route),
[policies](https://developers.google.com/maps/documentation/routes/policies).

## Preview integration validation

On 24 October 2026, 12 focused transport/itinerary checks passed, TypeScript
checking passed, and the static production build passed. Browser verification
confirmed the panel inside the guest Lisbon day view with the example-data label.
The complete Vitest run stalled before reporting files and was stopped; no claim
is made that the full suite passed. Google billing verification remains incomplete.
