# Worldwide destination discovery

The **Travel Chatbot** section now discovers destinations from a GeoNames directory of **31,808 city/town bases across 244 countries and territories**, replacing the former 13-place curated list. It is guided input parsing plus real public-data searches, **not generative AI**. No paid model, key, new dependency or account is required for this non-commercial prototype. Existing flight/hotel providers and their free allowance controls are unchanged.

## Free data pipeline

- `scripts/update-global-city-directory.py` downloads GeoNames cities15000 and countryInfo extracts. Districts (PPLX) are excluded. The snapshot, fields, counts and attribution are recorded in `src/lib/global-directory-meta.json`; country metadata lives in `src/lib/discovery-countries.json`. Run `python3 scripts/update-global-city-directory.py` to refresh, review changed data/counts, then rebuild. `public/data/global-cities.json` is lazy-loaded when a search starts (~1.57 MB), not bundled in initial JavaScript. It covers many towns/cities, not every settlement or tourist destination.
- Candidates are filtered by country/region/exclusions. Population, rough latitude and optional straight-line departure distance prioritize candidate order; these are not route feasibility or temperature guarantees. Country interleaving spreads the first batch geographically.
- At most **12 bases** are checked per batch, with centers at least 65 km apart. **Search another global batch** continues through the remaining directory. No claim is made that a single search checks the whole world or identifies the globally best destination.
- Wikipedia/MediaWiki geographic search checks named nearby article references within 30 km. Hiking, beach, culture, family, surfing, skiing, diving, golf and tennis use explicit topic queries. Every requested theme must have at least one geolocated article result. Up to three themes per search, three results per city/theme, two in-flight requests maximum (up to 36 requests per batch). Returned primary Earth coordinates are independently distance-checked; API warnings/errors fail closed so a malformed geographic constraint cannot become a worldwide topic search. A matching article is **not proof that an activity is currently offered**, open, accessible or child-appropriate. Cards link the source article, without copying its prose. English Wikipedia coverage varies. No fixed destination fallback or paid search is enabled.
- Open-Meteo supplies daily high/low references in one multi-location request. Dates starting within the next 16 days use forecasts for the returned covered trip dates. Later dates use the previous calendar year's same-month historical reanalysis. Cards explicitly say **Historical model reference — not a forecast or climate normal**. Warm means average daily high ≥20°C; cooler means ≤20°C. A single historical month is not a future weather guarantee. Multi-location requests can consume multiple provider quota units.
- An unavailable geographic search service cannot produce verified activity matches. Missing weather cannot satisfy a temperature preference. Errors and no-match batches offer retry/another batch; **there is no curated or demonstration fallback**. Other valid data can remain visible when an optional check fails.
- Completed public results have a small in-memory cache (30 entries; article/history 24 hours, forecast 10 minutes). Requests are cancelled on preference changes. Inactive chat sections do not start searches. No permanent chat history or new server is introduced.

## Understanding and planner handoff

Supported messages now extract multiple details in one turn: days/weeks/nights, weather preference, multiple supported activities, excluded activities, departure city, ISO dates or explicit day-month-year dates, adults, children and exact ages, group size, EUR/USD/GBP budgets and per-person budgets. Number words are recognized. Follow-up corrections retain previous details. Nights convert to days plus one. Children with missing ages cause a follow-up; no ages are fabricated. Per-person budgets require a known group before conversion. A **What I understood** card exposes the extracted details, which carry into the existing editable planner only after a destination is selected. Existing unspecified details stay intact. The saved-trip chat starts a new draft without altering the saved trip.


Choosing a destination transfers understood details into the existing editable guest planner; unspecified details remain intact. Family selects the Family persona without inventing child ages. Saved-trip chat starts a new draft and does not alter an existing saved trip. Registration is still required only for persistent account saving.

Broad budget allowances reuse the existing planner helper; they are not surveyed local costs or live quotes. EUR budgets may show a shortfall against the low reference. Other currencies are not silently converted. Geographic proximity is not flight availability. Selection is not a booking.

## Limits and attribution

This is a free educational/non-commercial prototype. Open-Meteo's free hosted API is non-commercial and rate-limited (currently under 10,000 calls/day, 5,000/hour, 600/minute); commercial/promotional use requires reviewing their terms and a compliant data source. Wikipedia can throttle or be unavailable; English article coverage varies. Public Overpass was evaluated but live requests timed out, so it is not part of the discovery pipeline. No paid fallback is enabled. Batching and caching reduce load but do not guarantee service availability at commercial scale.

- GeoNames: https://www.geonames.org/export/ — CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ .
- Wikipedia/MediaWiki geographic search: https://www.mediawiki.org/wiki/Help:CirrusSearch#Geo_Search . Article titles/source links are displayed, no article prose is copied. Source article licensing: https://en.wikipedia.org/wiki/Wikipedia:Copyrights .
- Open-Meteo: https://open-meteo.com/en/terms , https://open-meteo.com/en/docs/historical-weather-api .

## Verification

`src/test/global-discovery.test.ts` tests real-shape public responses, dynamic countries outside the old list, combined activities, geographic filters, actual temperature filtering, provider failures, budget honesty and bounded batch continuation. Chat component and guided-flow tests verify multi-turn input, retry and existing planner handoff without hitting public services.

The opt-in live smoke test consumes only public free data: `RUN_PUBLIC_DISCOVERY_LIVE=1 npx vitest run --config vitest.live.config.ts`. It runs separately from offline regression tests. Do not run it in a polling loop. A live browser test should also verify CORS and actual cards on GitHub Pages.
