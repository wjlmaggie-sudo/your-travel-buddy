# Connected Travel Buddy prototype — 18 October 2026

One GitHub/Lovable app now has five dedicated interfaces: AI Travel Planner, Flights, Hotels, Attractions & Activities, Local Shopping. Public plans carry one brief and one selection state across views; signed-in trips retain their current itinerary, directory, expenses and packing tools under the new navigation.

## What works now

- Minimal brief: destination, departure when flights are required, start date, duration, travelers, budget; optional currency/preferences. No-flight plans do not require departure.
- Editable local template generation with a daily overview, maps, pictures where available, restaurant alternatives, admission/source notes, distance estimates and sourced place stories. Templates are explicitly not a live AI model or schedule optimizer. Actual flight times, verified opening hours and accessibility must still be checked.
- Three **fictional demo** return-flight cards, classified cheapest, value and convenience. Airline identities, times, durations and prices are simulated. Each has a real external route/date search link, which is a search and not a bookable offer for the simulated card.
- Three **fictional demo** hotel cards, classified budget, value and location. Names, neighborhoods, ratings and prices are simulated. Building illustrations are explicitly not actual property photos. Existing real-name Lisbon candidate links and manually entered stay quotes remain available separately.
- A shared budget computes selected costs (or unselected allowances), activity/food/local transport/shopping estimates, planned total, average per day, and remaining/over-budget amount. Selection upgrades do not silently shrink other estimates. Users can edit the operating estimates. All calculations use exact cents and one currency; the exchange widget does not automatically convert the budget.
- Local Shopping searches Wikipedia destination coordinates and the existing OpenStreetMap directory. Users choose the search area. Stores are ranked by name/type matches, with sources, addresses/coordinates, hours where listed and directions. **No product inventory or product prices have been verified.** External product/map searches are provided without claiming stock.

## Data and persistence

`travel_journeys[tripId]` in the signed-in user's existing Auth metadata holds route, optional flight requirement, flight allocation, hotel comfort, optional selected flight and optional operating estimates. `travel_stays[tripId]` retains hotel selection, with an optional `evidence: demo | entered` marker. Old metadata stays valid. Flight quotes are scoped to departure/destination/dates/travelers/currency; hotel scope remains destination/dates/travelers/currency. Stale quotes are ignored. Public sign-in drafts preserve selections and provenance. No schema migration or new secrets are needed.

Existing trips with no journey metadata retain their old calculations until the user enables connected planning or saves route settings. No account/backend migration is performed. Selection save failures leave the previous server-backed selection in place and show an error; controls are disabled while a selection is saving.

## Remaining live integrations

This prototype deliberately makes **no paid AI, flight inventory or hotel inventory requests**. It does not claim real airline recommendations or verified property offers. Turning it into the full live product requires approved server-side providers and (where required) credentials/commercial access.

A future provider adapter must return a scoped search result (route, dates, people, currency), provider identity, retrieval time, real offer/property identifier and expiry where available; flight legs need airports, timezone-aware times, airline, duration, stops, baggage/fees and full return/group price. Hotel results need property coordinates, real images with usage rights, source rating, rooms/occupancy, full-stay price, taxes/fees and cancellation terms. Revalidate the selected offer before redirecting to book. Missing data must remain unavailable, never filled with fictional values labeled verified.

AI can then compare the retrieved offers and grounded place data, respecting budget, travel windows and known opening constraints. AI must not invent prices, availability, opening hours or booking links. Product stock requires a store/retailer inventory source with item identity, location and timestamp. Keep any private provider key on a backend, never in the GitHub Pages browser bundle.

Source remains on main, compiled browser artifact on gh-pages/root. Lovable history is preserved. The optional historical AI function sources remain untouched and unused by the current UI.
