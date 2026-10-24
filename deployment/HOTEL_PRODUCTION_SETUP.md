# Production hotel search — prepared 24 October 2026

Status: production support is implemented locally and covered by focused adapter,
client and UI tests. It has not been deployed or activated. The deployed sandbox
returned three Berlin hotels on 24 October 2026. The Supabase dashboard lists
NUITEE_SANDBOX_API_KEY, but no NUITEE_PRODUCTION_API_KEY was present when checked.
The owner subsequently clarified they are unsure whether production access exists.

## Activation

1. Sign in to https://dashboard.liteapi.travel and check production API access.
   Obtain the production key through the provider's activation process. The owner
   must complete any required payment details, terms or approval themselves.
2. Save the key as NUITEE_PRODUCTION_API_KEY in Edge Function secrets for
   Supabase project xuvilqwfeiwfoigcvrsb. Never paste it into chat or frontend config.
3. Deploy the updated search-hotels function, shared hotel-search.ts and deno.json
   to that project. The existing atomic 20-request daily quota remains required.
4. Set HOTEL_SEARCH_MODE=production in that backend's secrets. Keep the existing
   origin allowlist and account/trip backend configuration.
5. Build the frontend with VITE_HOTEL_SEARCH_MODE=production and the existing
   VITE_HOTEL_SEARCH_URL. Publish the verified build. These settings are public;
   they must never contain the private provider key.
6. Choose actual lead traveler nationality and future dates, run one hotel search,
   and verify sandbox:false and whole-stay totals for all requested rooms.

The frontend and backend modes must match. Production rejects sandbox keys and
responses that do not explicitly report sandbox:false. There is no fallback from
production to test prices. Searches use adults only; family groups retain an
external search until exact child occupancy is supported. Search results are
memory-only, with no reservation, payment, saved live quote or PDF quote flow.
The current global daily limit is a small rollout bound, not a production-scale
abuse-control system or a guarantee about provider charges. Confirm the account's
permitted use and pricing before activation.

Rollback: restore HOTEL_SEARCH_MODE=sandbox and rebuild the frontend with
VITE_HOTEL_SEARCH_MODE=sandbox. The existing sandbox secret remains available.

Official references:

- https://docs.liteapi.travel/docs/faq
- https://docs.liteapi.travel/reference/post_hotels-rates
- https://docs.liteapi.travel/reference/authentication
