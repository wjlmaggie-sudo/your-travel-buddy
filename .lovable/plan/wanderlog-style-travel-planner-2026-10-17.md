# Wanderlog-style Travel Planner

Warm, travel-journal look (earthy terracotta, sand, forest green; serif display headings + clean body font).

## What users can do
1. **Sign up / sign in** with email and password; trips are saved to their account.
2. **My Trips** dashboard: cards for each trip (destination, dates, budget used).
3. **Create a trip**: destination, start/end dates, total budget, currency.
4. **Trip page** with tabs:
   - **Itinerary**: day-by-day list; add activities with time, place, notes; reorder/delete.
   - **Budget**: log expenses by category (food, stay, transport, activities, other); see spent vs. budget with a progress bar and category breakdown.
   - **AI Ideas**: generate a suggested day-by-day plan for the destination and interests; one click adds suggestions to the itinerary.
5. Public landing page at `/` explaining the app with a "Start planning" button.

## Pages
- `/` landing
- `/auth` sign in / sign up
- `/trips` my trips (signed-in)
- `/trips/$tripId` trip details with tabs (signed-in)

## Technical details
- Enable Lovable Cloud; email auth on.
- Tables: `trips`, `activities` (trip_id, day, time, title, location, notes, position), `expenses` (trip_id, amount, category, note, date). All owner-scoped via RLS + grants.
- AI ideas via a server function using Lovable AI Gateway (default model, streamed, structured JSON output); handle 402/429 with clear messages.
- Data loaded with TanStack Query; protected pages under `_authenticated`.
- Per-route head metadata; sonner toasts mounted in root.
