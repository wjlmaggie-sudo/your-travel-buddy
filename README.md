# Your Travel Buddy

## Travel planning personas

See the [Business, Family and Budget Travel specifications](docs/personas/README.md)
for activity-selection and itinerary-planning behavior. Optional persona controls and
child ages now adapt local itineraries; the documents also describe future extensions.

## Current provider connection — 23 October 2026

Hotel searches now connect to the Nuitee sandbox through a separate Supabase Edge
Function. Opening Hotels automatically loads up to three previews within the planned
hotel allowance, using the existing destination, dates, travelers and currency. Country
information is resolved automatically. Optional sandbox preferences show named countries;
no technical country/nationality code inputs are required. Repeated searches are cached;
all provider prices are test data, not bookable live offers. The shared daily limit
is 20 provider requests. Private provider credentials stay in Supabase secrets.
The public function URL is the build variable `VITE_HOTEL_SEARCH_URL`; local
production builds use the ignored `.env.production.local` file. See
[hotel provider setup](deployment/HOTEL_PROVIDER_PREVIEW.md) for deployment details.
Connected hotel views and PDF exports omit fictional hotel comparisons. The hotel
allowance matches the overview budget; the redundant comfort selector has been removed
from hotel results. Older saved demo selections remain clearly labeled and can be cleared.
The free itinerary planner, main account/trip backend and PDF exports remain in place.
Flights still use labeled demo comparisons and external search links; flight and
car-rental APIs are not connected.

build a app, including travel planning, user to need

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87280428-5ed9-4d20-8336-1c51239f60c6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## One integrated app

The root Lovable application is the only maintained app. AI Travel features now use the existing Fraunces/Karla typography, cream and terracotta palette, and shared UI components. The former standalone `ai-travel/` application has been removed.

- Account sign-in, cloud-saved trips, day-by-day activities, activity ordering, expense tracking, currencies, and Lovable AI ideas remain in place.
- Six editable trip templates, category filters, and surprise discovery are available on My trips.
- Trip creation supports destination, departure, duration, travelers, budget styles, and interests. Group totals, per-person totals, daily estimates, and suggested category allocations appear on each trip.
- Activities support editing, notes, map links, and itinerary export.
- Shops & packing provides searchable example products, category filters, Google Shopping links, destination-aware Google Maps shop searches, and per-trip packing lists.

Traveler preferences and packing lists are stored in the signed-in user's Supabase Auth metadata under `travel_preferences`, keyed by trip ID. Existing trips, activities, and expenses keep their current database tables and row-level security. No database migration is needed. Historical trips default to two travelers and Balanced style until updated.

Budget suggestions and example product prices are estimates, excluding flights. Style presets and product estimates are in EUR; group budgets retain the selected trip currency. AI generation uses the existing server-side `LOVABLE_API_KEY` and adds group size and budget to the prompt. It generates up to 30 days per request; templates and manual plans support up to 30 days.

## Validation and deployment

Run `npm run test`, `npx tsc --noEmit`, and `npm run build`. Keep the existing Lovable/Supabase environment configuration. Pushes to `main` sync to the connected Lovable project. GitHub Pages publishes the built artifact from `gh-pages`, as described below. The original Lovable build is retained for editor previews.


## GitHub Pages publishing

The published website is `https://wjlmaggie-sudo.github.io/your-travel-buddy/`; login is `https://wjlmaggie-sudo.github.io/your-travel-buddy/#/auth`.

In repository **Settings → Pages → Build and deployment → Source**, select **Deploy from a branch**, then branch **gh-pages** and folder **/ (root)**. That branch contains only the built `dist/` contents. Source code remains on `main`; this is one app with a separate deployment artifact. Do not publish the source repository root.

The Pages build uses Vite and React with the existing routes, UI components, styles, and Supabase project. `vite.pages.config.ts` is the client-only target; the existing `vite.config.ts` remains Lovable's server target. Hash navigation (`#/auth`, `#/trips`) makes links and reloads work without server rewrites. Assets resolve relative to `/your-travel-buddy/`. If the repository is renamed, set `PAGES_BASE_PATH` to its new path when building; for custom-domain builds, set `PAGES_BASE_PATH=/`.

### Environment values and repository secrets

`.env` is ignored and is no longer tracked. Copy `.env.example` to `.env` for local development. Values previously committed were the Supabase URL, project identifier, and publishable key; these are public browser configuration. Their historical commits have not been rewritten.

Under **Settings → Secrets and variables → Actions → Repository secrets**, the optional Pages workflow template reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The matching `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`, and `VITE_SUPABASE_PROJECT_ID` settings are also stored as repository secrets for configuration/deployment. A publishable key is intentionally included in the browser bundle; database access is protected by authentication and existing row-level security. Private AI keys, service-role keys, and management tokens must never be named `VITE_*`, placed in `public/`, or committed.

In Lovable Cloud / Supabase Auth URL configuration, allow `https://wjlmaggie-sudo.github.io/your-travel-buddy/` as a redirect URL. Pages uses PKCE email confirmation so auth tokens do not conflict with hash routes. Users retain their existing Supabase accounts and cloud data; signing in on the new origin creates a separate browser session.

### AI backend deployment (requires backend owner access)

Static hosting cannot execute the original TanStack server function. The Pages build substitutes `src/lib/ai.edge.ts`, which calls the authenticated `generate-trip-ideas` Supabase Edge Function. The existing Lovable server build keeps its native server function. Both use the same UI.

Deploy `supabase/functions/generate-trip-ideas/index.ts` through the existing Lovable Cloud backend or Supabase CLI. Keep JWT verification enabled and set `LOVABLE_API_KEY` in the **backend's function secrets**. The handler also verifies the signed-in user, validates input, and handles CORS. No AI key is sent to the browser.

For a Supabase project managed by your account, add a management token as the repository secret `SUPABASE_ACCESS_TOKEN`, then install the optional `deployment/github-actions/supabase-function.yml` workflow under `.github/workflows/` through an account with workflow permissions, and run **Actions → Deploy AI backend → Run workflow**. The function is deployed separately from the website, and the website can publish while backend setup is pending. For a Lovable-managed project, use Lovable Cloud to deploy the function and configure its secret instead.

The owner-managed AI function and daily usage migration were deployed on 17 October 2026. The owner chose the free planner and removed the AI provider key. The website now creates editable template itineraries without calling a paid AI service, and has no AI-generation buttons or billing prompts. Optional AI backend source remains available for a future opt-in integration; it is not used by the current UI. See [live AI and accommodation setup](deployment/LIVE_AI_AND_STAYS.md) for the current two-backend connection, public build variables and remaining provider access. Existing sign-in and trip data are preserved.

### Local checks

- `npm run test`
- `npx tsc --noEmit`
- `npm run build:pages`
- `npm run preview:pages` (open the printed URL including `/your-travel-buddy/`)
- `npm run build` (the original Lovable server build)


### Updating the deployed artifact

Run `npm run build:pages` with the public configuration in your ignored local `.env`, then `npm run publish:pages`. The publisher commits the contents of `dist/` to `gh-pages` without rewriting deployment history. A `main` push alone does not rebuild the website in this deployment mode.

The connected OAuth credential can push source code but cannot create GitHub Actions workflows without its `workflow` scope. Ready-to-use workflow templates are retained in `deployment/github-actions/`. To enable automatic builds from `main` later, add `pages.yml` through GitHub's web editor or a credential authorized to manage workflows, placing it at `.github/workflows/pages.yml`, then switch Pages Source to **GitHub Actions**. It builds from the repository secrets already configured and uploads `dist/`. Do not put private backend keys into browser variables.


this is a test
## Full-trip suggestions, daily budgets, and place coverage

New custom trips can open straight into a full suggested itinerary. The complete
plan supports 1–30 days, editing before saving, saving every day in one operation,
individual-day saves, and adding/removing suggested activities. Existing saved
activities are kept. Stable draft activity IDs make save retries idempotent.
Every saved activity remains editable through the normal itinerary editor.

Each day displays its date, the group spending limit, an approximate per-person
amount, and a category allocation. The Budget tab lists every day against actual
expenses recorded for that date. Splits use integer cents so all daily group
amounts sum exactly to the total. This is a planning allocation, not live hotel,
flight, or ticket pricing. Changing the group budget updates the daily amounts.

The Places directory searches Wikipedia for destination coordinates and retrieves
mapped attractions, shops, and food venues near the selected destination. It uses
OpenStreetMap via the documented Private.coffee Overpass instance, with Wikipedia
nearby entries as an independent fallback during map-provider outages. Results
are fetched on demand, bounded to a 4 km radius, cached for 30 minutes (up to 50
queries in memory), and attributed. Coverage, names, and opening hours need local
verification. No product inventory or current pricing is claimed. Selected places
can be saved as normal trip activities. AI may use up to 18 directory references
when that option is enabled; it never treats external names as instructions.

Trips, activities, and expenses remain in the existing authenticated PostgreSQL
tables. Queries now page through all results instead of silently stopping at the
API's first page. The optional checked-in migration adds a row-level protected
preferences table and query indexes for growing accounts. Legacy preferences are
read as a fallback; new table rows take precedence after migration. Storage quotas
and backend capacity have not been verified or changed from this checkout.

**AI activation and database owner steps:** see
[`deployment/BACKEND_SETUP.md`](deployment/BACKEND_SETUP.md). The code and frontend
can be deployed without those owner permissions, but live AI generation remains
unavailable until the Edge Function and backend secret are deployed. The database
upgrade has not been applied automatically.

### Public travel planner and weather

The homepage generates a complete, editable starter itinerary before sign-in.
Only the destination needs typing: days, travelers, and total budget have useful
defaults. Departure date, currency, style, and interests are under More options.
Budget presets change meals and activities as well as daily allocations. EUR
bands are rough planning estimates; other currencies use the selected travel
style without assuming an exchange rate. Unknown destinations get a clearly
labeled flexible outline, never fabricated venue names or AI claims.

Users can edit every day, download without an account, or save the entire edited
plan through sign-in. The validated itinerary travels with the brief in this
tab's session storage. The save dialog carries existing edits into one bulk
activity upsert and retries against the same trip and activity IDs if saving
fails. Saved-trip suggestions also use free local templates. Optional historical AI function sources remain in the repository but are not called by the planning UI.

Day views now include numbered OpenStreetMap markers, credited location photos,
and restaurant alternatives with menu and map links. Lisbon has an offline
curated guide covering Alfama, central Lisbon, Belém, Sintra, and Chiado. Other
places use the existing on-demand directory; coverage varies. Additional photos
are matched by place coordinates and require an open Commons license. Maps load
as days enter view. The saved itinerary keeps Add activity controls but hides
extra fields until pressed; existing activities use their Edit controls.

Leaflet 1.9.4 is vendored from its npm registry release under its BSD 2-Clause
license in public/vendor/leaflet/LICENSE. Maps attribute OpenStreetMap. The
curated place summaries are adapted from Wikipedia (CC BY-SA), linked on each
card; photo creator/license links are shown individually. Restaurant information
links to venue or official tourism pages and is not live inventory or a booking.
Run scripts/refresh-lisbon-guide.py to refresh curated place metadata and image
attribution from the Wikipedia and Commons APIs. It downloads metadata, not
image binaries.

Destination weather is available on the public brief and saved itinerary.
Activity day headings also show the matching daily forecast automatically, with
conditions, high/low temperatures in Celsius and rain probability. Hidden days
share cached forecasts without starting their own requests; unavailable dates
and provider errors appear as compact messages beside the day.
Open-Meteo geocoding resolves the destination (including a country qualifier),
with a selector to correct ambiguous locations. On-demand forecasts show current
temperature separately from daily highs/lows and rain probability for matching
trip dates, with Celsius/Fahrenheit switching. Dates beyond the available
16-day forecast window, past trips, missing readings, and provider failures are
explicitly identified. Forecasts cache for ten minutes and use cancellable,
time-limited requests. No weather API key is embedded in the website.

Sources: https://open-meteo.com/en/docs and
https://open-meteo.com/en/docs/geocoding-api (location data: GeoNames).
The default endpoint is intended for this personal, non-commercial deployment;
commercial use requires the appropriate Open-Meteo service plan and a secure
backend for any paid API credential. See https://open-meteo.com/en/terms.

The newly authorized Supabase project `xuvilqwfeiwfoigcvrsb` is separate from the
currently deployed backend. Linking its GitHub integration does not switch the
app's public configuration or migrate accounts/data. Before switching production,
prepare the base trips/activities/expenses schema with owner policies, then apply
the preferences migration, configure auth redirects and AI, and validate saving.
The existing preferences-only migration cannot initialize an empty project.


## Accommodation, transport and admission

See [live AI and stays](deployment/LIVE_AI_AND_STAYS.md). Public and saved plans now include accommodation quote selection, nights/rooms/beds calculations and daily remaining budgets. Suggested maps include straight-line leg distances, rough walking estimates and official Lisbon admission/transport guidance. Live booking-provider API access remains unconfigured; external search links and traveler-entered quotes are labeled accordingly.

## Free planner mode

As of 17 October 2026, public and saved-trip planning use local templates by default. The “Create my travel plan” action does not call an AI provider. Destination, duration, group size, budget and interests still shape the outline. Maps, weather, saved trips, accommodation quote comparison and daily budgets remain available. Hotel prices are traveler-entered quotes or checked on external booking sites. Suggestions are labeled as template-based; no live-model generation or live hotel-price API is claimed.


## Whole-trip planning and reference exchange rates

New public plans require departure, destination, days, people and a total group budget. Return flights start as an editable 25% allocation, not a route-based fare estimate. Hotel comfort allocates 30%, 45% or 60% of the post-flight budget; an explicitly chosen stay quote overrides that allocation. The remaining budget is split among food (40%), tourist tickets (25%), local transport (20%) and shopping/buffer (15%), using exact cents and displaying any flights-plus-stay shortfall. Hotel adjustments retain activity edits. Flight links open a provider search; no actual airline, schedule, availability or fare has been retrieved.

Journey settings are stored per trip in the signed-in user's `travel_journeys` Auth metadata, alongside existing stay settings. No database migration is required. Existing trips keep their flights-excluded calculations until the user explicitly saves journey settings. Imported public plans carry journey settings and edited activities through sign-in.

Place cards have expandable, credited stories: selected Lisbon landmarks use official heritage sources; other exact linked Wikipedia pages can supply background on demand. Missing history is identified without inventing a story. Known standard-adult admission totals are compared with the indicative ticket allowance; unknown fees are explicitly excluded from totals.

The compact currency calculator loads free ECB reference rates via Frankfurter v2 (`/v2/providers/ecb/rate/{base}/{quote}`) only when expanded. It displays the publication date, supports swapping currencies and computes entered amounts locally. The API receives only the currency pair, never the amount or trip budget. Rates are reference values, can use the previous business day, exclude bank spreads/fees and do not automatically change the trip's currency or budget. Source: https://frankfurter.dev/.

## Five-section Travel Buddy redesign

The connected prototype now has dedicated Planner, Flights, Hotels, Attractions & Activities and Local Shopping views. The shared budget retains operating estimates while selection prices change and reports remaining/over-budget amounts. Flight and hotel comparison cards currently use explicitly fictional demonstration data; external provider links open real searches, not verified offers for those cards. Generation remains free local templates, with no paid AI calls. See [prototype behavior and live integration requirements](deployment/CONNECTED_TRAVEL_PROTOTYPE.md) for persistence, provenance, scope validation and remaining provider work.

## Stable workspace and guest sessions

The homepage uses a bundled CC0 photograph of Lago di Braies by Luca Bravo, credited beside the hero. The original file and license are documented in [asset credits](deployment/ASSET_CREDITS.md).

Planning, flights, hotels, a single itinerary day, shopping, currency and weather now use one fixed-height responsive workspace. Each mounted view owns its scrolling area; hiding a view preserves its state and scroll position. Switching views cannot change document height. Generating a plan no longer calls `focus()` or automatically scrolls the window. The full budget is confined to Overview; a compact live summary stays in the workspace header. Photo and map failure placeholders retain their reserved dimensions. Currency is a dedicated on-demand card, and weather keeps loading/results within a reserved forecast area.

Guest simulations use `sessionStorage` under `travel-buddy-guest-simulation`, independent of the existing explicit save/sign-in handoff key. They survive a refresh in the same tab and are not written to a personal account or persistent search history. Guest planning does not check authentication. An explicit Save action checks the existing session and either continues to the saved-trip flow or opens an optional sign-in prompt. Canceling that prompt retains the guest simulation. Saved trips, preferences, quotes, expense tracking and packing remain behind the existing authenticated routes. AI generation remains free local templates, and flight/hotel demonstration offers keep their provenance labels.
