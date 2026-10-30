# Travel Buddy requirements audit — 30 October 2026

This audit uses the latest requested behavior where earlier requests conflict. It covers the website, its saved-trip interfaces and PDF export. It does not treat presentation slides, a native iPhone app, or provider account setup as website features.

## Why features appeared to return

1. The guest planner, saved-trip editors and PDF exporter had separate implementations. Removing a control in the guest planner did not remove its saved-trip counterpart. The exporter still appended older fictional comparison data.
2. The itinerary, category-based recommendations and extra-place list overlapped. The category-based section was removed, and backups now exclude planned places across the whole trip, including accent/punctuation variants.
3. GitHub Pages deployment can lag behind main. During this audit, the earlier deployment waited in GitHub's queue even though its artifact build succeeded. The public `release.json` identifies the actual served source commit; a commit on main alone does not prove the website has updated.
4. All fetched teammate/feature branches (`IftiTest`, `km-test`, `codex/add-ai-travel`, `codex/full-trip-suggestions`) have zero commits missing from main. No additional teammate branch merge was needed.

## Latest decisions and checks

| Requirement | Result and evidence |
| --- | --- |
| One website/version on GitHub Pages | Main is the combined source; publish guard rejects stale branches, dirty builds and mismatched source/artifacts. `pages-release` tests cover these failures. |
| Clean homepage, travel imagery, simpler cards | Existing credited travel hero, reserved picture areas and expandable details retained. Car, hotel and attraction picture components remain in use. |
| Distinct connected sections | Planner, Flights, Hotels, Car Rental, Attractions, Shopping, Currency and restored Weather navigation. Guest and saved routes use the same section map. The completed guest overview now includes an explicit Search hotels button, and an optional flight selection never blocks that next step. |
| Single website scrollbar; no automatic jumping | Workspace views have no nested scrolling or fixed content height. Source scan found no app `scrollTo`/`scrollIntoView` calls. Narrow-screen browser check found no horizontal overflow or nested workspace scrollers. Dialogs may scroll internally when open. |
| Mobile and desktop usability | Native browser check of narrow layout (297 CSS pixels wide under the tool's device scaling), section dropdown and weather/itinerary switching; desktop sidebar retained. This is not a physical-device test. |
| Guest planning without registration | Session simulation, regeneration, section changes and edits remain available. Save alone prompts for an account. Tests cover refresh, dismissing login and preserving edits. |
| Persistent account plans/history | Existing Supabase trip/activity/settings/expense persistence retained; account-trip tests exercise saving, retrying and carrying guest edits into the same trip. No database migration was required by this audit. |
| Minimal initial inputs | Destination, dates/duration, travelers, optional group budget and optional departure; departure required only for flight searches. Existing destination/date/group values are carried into hotel/flight steps. |
| Optional budget with a suggested amount | Creating a plan with an empty budget uses a labeled planning estimate and range; it does not fabricate live destination prices. Existing entered budgets and quotes are kept. |
| Business / Family / Budget persona at the start | Three persona choices retained, with genuinely different places/pacing/work blocks and child-aware activities. Existing/manual itineraries are not silently overwritten. |
| Children count and age bands | Counts 0–3 are offered; age ranges and exact ages are supported. Current non-overlapping bands are 0–3, 4–6, 7–10, 11–15 and 16–17. Exact ages are not guessed from ranges for hotel pricing. |
| Three activities per day | Starter/persona plans include at least three visit/experience slots besides meals/rest/work; named sourced stops are used when available. Limited directory coverage is explicitly unverified rather than invented. Travel-day visits remain adjustable. |
| Three different backup places | One expanded backup list starts with three available places, excludes visits anywhere in the trip and supports search, more choices and adding to a selected day. Sparse directories show a warning instead of fabricated entries. |
| No duplicate recommendation blocks | Removed the redundant “Three ideas for your day” section. Flight recommendations also no longer repeat one flight under multiple category labels. |
| Hotels automatically based on trip and allowance | Search runs when the hotel section is active. Initial cards now use only prices within the hotel allowance. When some hotels fit, additional above-allowance options remain opt-in. When none fits, the three lowest-priced returned alternatives appear directly with above-budget labels and no automatic selection. Choosing an offer updates the connected budget. |
| No Hotel comfort / Rooms needed selectors | Removed leftover comfort controls and the manual room-count input from saved-trip editors. Existing saved room counts, quotes and allocation data remain readable. No financial data is silently rewritten. |
| Clarify hotel room recommendation | Live cards now show suggested room setup, state that actual beds/category are unconfirmed, show average nightly and whole-stay prices, property description and a provider/booking-information link. Hotel images are retained with a selected quote for PDF export. |
| Real flight recommendations | Existing private-backend flight search retained; no demo flight cards. Initial recommendations now follow the allocated flight budget; over-budget choices are explicit. Distinct advertised offers, airline/times/stops/duration, source time and external search links remain available. |
| Real car search and pictures | Search supports pickup airport, dates/times, travelers, driver age and residence. Real provider model photos, seats, bags, transmission, whole-rental price and conditions retained. Backend availability GET returned HTTP 200 with `available: true` during this audit. |
| Connected budget and daily costs | Existing selections replace allowances and update the total/remaining budget. Editable operating estimates, daily group and per-person amounts, over-budget warnings, room-night/person-night/whole-stay quote units remain supported. |
| Maps, distance, transportation and tickets | Actual itinerary locations feed day maps; straight-line/estimated logistics, admission references and official access links remain. Known edited locations map without falling back to unrelated default stops; matching visits retain restaurant suggestions. Live in-app routing is not configured; links open provider directions. The reviewed Lisbon timing preview stays explicitly labeled non-live. |
| History/stories and restaurants | Existing place stories, sources, photos, restaurant suggestions and map links retained. Coverage is conditional on the source directory; the app does not claim unknown opening hours or invent venues. |
| Local shopping and product search | Search and product idea chips retained; stores, location/directions and source details are available. Stock and product prices remain explicitly unverified; this is not a live inventory integration. |
| Currency converter | Existing public rate source, date/source labels, currency selection and conversion tests retained. |
| Weather/temperature | Restored dedicated Weather access for guest and saved trips. Actual Open-Meteo forecast loaded for the sample destination during this audit. Forecast horizon/date limitations and source labeling remain visible. |
| PDF download with maps/pictures/stories | Export still includes every day, manual edits, maps/fallback diagrams, full stories, references, food/tickets and budget data. Removed all automatically inserted fictional flight/hotel comparisons. Selected car and newly selected hotel photos are embedded where downloadable; unavailable images/maps are reported. |
| No extra AI/model spend | Public plan creation still uses the free deterministic planner. No paid model or new key/provider was enabled. Live search remains subject to existing provider quotas and availability. |
| Keys and maintainability | Private provider credentials remain in backend secrets. Only `.env.example` is tracked. Existing release guard, server-module exclusion, TypeScript and regression tests remain in place; no new dependency added. |

## Remaining limits — not represented as completed integrations

- A paid/live generative AI model is not enabled, following the decision to avoid extra API costs. The free planner is labeled as template/rule based.
- Flight and hotel frontend endpoints are configured. Their GET responses are HTTP 405 because these services accept POST searches; that is not proof of a current provider offer. This audit did not consume additional upstream flight/hotel quota merely to prove connectivity. Contract/selection flows are tested with provider-shaped fixtures.
- Live hotel search currently supports one room. Larger room arrangements use an external search; no single-room rate is multiplied and presented as a verified group quote. Child age ranges remain useful for activity planning, but exact ages are needed for live hotel prices.
- Complete cross-website price comparison, direct booking/payment, verified shop stock and guaranteed worldwide attraction coverage are not implemented. Current links are external search/property links, not reserved offers.
- Long trips may reuse sourced destinations when the directory is small. Three named unique venues on every day cannot be guaranteed without enough verified location data. Backup shortages are visible.
- Attraction prices are reference tariffs and operating costs are estimates; selecting a venue does not buy a ticket or automatically charge its tariff. The existing allowance/shortfall warnings remain visible.
- The seven additional curated Lisbon places now have locally served, credited photos, avoiding Portuguese/English Wikipedia title failures. Generic destinations still depend on source coverage. Some image hosts disallow download; PDF falls back to text/source links and reports missing media. Weather cannot forecast arbitrarily far in advance.
- Hotel offers only return property-level data; specific room categories, beds, cancellation rules and bookable occupancy require provider confirmation.

## Verification and release

- Full Vitest suite: **61 files / 239 tests passed** after the main fixes; the final map/restaurant correction also passed its focused regression checks. TypeScript passed. Release safeguards: **3 tests passed**. Targeted lint has no errors; existing effect-dependency warnings remain in legacy quote/search components.
- Targeted tests cover no duplicate activities, whole-trip backup exclusions, flight/hotel budget opt-in, saved room/comfort controls, free guest planning, exact-age family pricing, PDF maps/stories, and saved-trip retries.
- `node --test scripts/test/pages-release.test.mjs` verifies that older branches/artifacts cannot overwrite the combined release.
- Browser checks cover desktop and narrow navigation, one document scrollbar, actual destination weather and the corrected three-stop/backup layout.
- Publish from a clean commit matching GitHub main, then compare live `release.json` with that commit. Until deployment succeeds, report the public site as pending rather than live.
