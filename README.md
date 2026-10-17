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

Budget suggestions and example product prices are estimates, excluding flights. Style presets and product estimates are in EUR; group budgets retain the selected trip currency. AI generation uses the existing server-side `LOVABLE_API_KEY` and adds group size and budget to the prompt. It generates at most 14 days per request; templates and manual plans support up to 30 days.

## Validation and deployment

Run `npm run test`, `npx tsc --noEmit`, and `npm run build`. Keep the existing Lovable/Supabase environment configuration. Pushes to `main` sync to the connected Lovable project; use Lovable's Publish/Update flow for its live website. The old Sites preview is a separate deployment and does not automatically follow GitHub changes.
