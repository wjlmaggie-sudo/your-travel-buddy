# Restored planner-to-hotel flow — 30 October 2026

The basics form continues directly to hotels if flights are omitted, or to flight comparison if a departure is supplied. The completed-plan overview also has a prominent **Search hotels →** action, including after a same-tab refresh. Trip destination, dates, guests and hotel allowance carry forward unchanged; hotel search starts automatically on entering the hotel step.

Flight offers are optional selections: a guest can continue to hotel search while retaining the provisional flight allowance. Hotel offers are likewise optional before exploring activities. No fake selection or booking is created.

Hotels within allowance remain the initial recommendations when available. If none of the returned properties fits, three lowest-priced real alternatives are displayed directly, each labeled above allowance; they are never described as fitting the budget or selected automatically. If a provider returns an error, zero priced properties, unsupported occupancy, or requires exact child ages, its explanation remains visible.

A live Lisbon test for 1–5 December 2026, two adults, EUR, returned three displayed whole-stay offers inside a EUR 675 allowance. Search prices are advertised estimates, checked 30 October 2026; they are not guaranteed bookable offers. Identical searches use the existing client/server cache and free allowance safeguards.

Seven additional Lisbon/Sintra activity photographs are served as local JPEG files with Commons attribution. Their previous missing pictures came from Portuguese names being looked up only in English Wikipedia. Coordinates guard against using a Lisbon photograph for another city's same-named place. The photo component can also fall back to a fresh lookup if a nonlocal supplied image fails. PDF export uses the same local photo source.

Regression coverage: completed overview → hotel step, trip-detail carryover, automatic hotel requests, explicit over-budget fallback, bundled JPEG existence/licensing/location matching, and the normal guided flight/hotel/attraction flow. No new paid provider, model, key or dependency is needed.
