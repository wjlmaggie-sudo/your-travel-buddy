# Activate full-trip AI and database storage

Project reference: `secqnjmhobdbpalktkcb` (the existing backend).
The GitHub Pages frontend is already connected to it. The steps below require
its Lovable Cloud / Supabase owner; GitHub repository access does not grant
backend administration.

1. Apply `supabase/migrations/20261017150000_trip_storage.sql` through the existing
   project's SQL editor/migration system. It adds an owner-protected preferences
   table and indexes, without deleting trips, activities, or expenses. Reload the
   website after applying it. Until then, preferences keep using the existing
   account metadata fallback.
2. Deploy/update `supabase/functions/generate-trip-ideas/index.ts`, its `deno.json`,
   and `supabase/functions/_shared/trip-ideas.ts`. Keep JWT verification enabled.
   The handler also verifies the user before calling AI. Configure
   `LOVABLE_API_KEY` in backend secrets; never use a `VITE_` prefix for this key.
3. Allow `https://wjlmaggie-sudo.github.io/your-travel-buddy/` in the backend's
   authentication redirect allowlist, for email confirmation.
4. Sign in as a test user, create a 3-day trip, and leave “Suggest the whole trip”
   selected. Verify that all 3 days appear. Edit a suggested activity, save the
   whole itinerary, reload, and confirm it persists. Log an expense with a trip
   date and confirm that day's actual spending updates.
5. Review the project's database size, storage, backups, and user quotas in the
   backend dashboard against expected traffic. This checkout cannot inspect or
   increase those quotas without owner access. No claim of unlimited capacity
   is made.

Suggested Lovable instruction (no credentials to paste):

> Keep the existing Supabase project. Apply the checked-in trip storage
> migration and deploy the checked-in generate-trip-ideas Edge Function with
> its shared schema and Deno imports. Keep the AI key in backend secrets, keep
> JWT verification on, and allow the GitHub Pages root URL for auth redirects.
> Verify full-trip generation, edit/save/reload, and daily budgets with a test
> account. Do not create a second backend or replace existing user data.

For your own Supabase account, CLI deployment is also supported by the workflow
example in `deployment/github-actions/supabase-function.yml`. Its access token
belongs in GitHub repository secrets, not source code or chat.
