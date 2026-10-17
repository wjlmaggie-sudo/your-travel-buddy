# Your Travel Buddy

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

Until the function and its secret are deployed, the AI tab reports a setup/unavailable error. Sign-in, saved trips, manual itineraries, templates, budgets, product searches, and packing lists continue to work independently. AI hosting was not verified from this checkout because backend management credentials were unavailable.

### Local checks

- `npm run test`
- `npx tsc --noEmit`
- `npm run build:pages`
- `npm run preview:pages` (open the printed URL including `/your-travel-buddy/`)
- `npm run build` (the original Lovable server build)


### Updating the deployed artifact

Run `npm run build:pages` with the public configuration in your ignored local `.env`, then `npm run publish:pages`. The publisher commits the contents of `dist/` to `gh-pages` without rewriting deployment history. A `main` push alone does not rebuild the website in this deployment mode.

The connected OAuth credential can push source code but cannot create GitHub Actions workflows without its `workflow` scope. Ready-to-use workflow templates are retained in `deployment/github-actions/`. To enable automatic builds from `main` later, add `pages.yml` through GitHub's web editor or a credential authorized to manage workflows, placing it at `.github/workflows/pages.yml`, then switch Pages Source to **GitHub Actions**. It builds from the repository secrets already configured and uploads `dist/`. Do not put private backend keys into browser variables.

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
