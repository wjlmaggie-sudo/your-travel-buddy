# Guided travel selection

The landing header uses a small landscape thumbnail. Trip basics lead directly to
Flights (or Hotels when no departure is supplied). Clicking Flights in the sidebar
also submits and validates an unfinished basic form. The overview no longer shows
"Your journey at a glance". Existing account saves, manual itinerary editing and
PDF export remain available.

Flight search runs when its step opens, using the trip dates, group, currency,
departure and destination. Only the two route fields are displayed. The accessible
comboboxes support keyboard selection, city and IATA searches, accents and one
prefix typo; "nurm" ranks Nuremberg / Nürnberg (NUE) first. Typing does not send
provider requests. Selecting a suggestion or submitting Update flights commits a
search. Selecting a flight on an edited route carries the city into the hotel and
attraction steps, clearing a hotel that belonged to the previous destination.

Flight cards show the cheapest advertised return fare, the shortest outbound
journey, and an alternative that balances normalized price, outbound duration and
stops. Categories can identify the same offer when one flight satisfies both.
No return leg is fabricated: these are advertised round-trip search estimates;
return flight details, baggage and final prices are confirmed with the provider.
A chosen estimate updates the budget and enables Continue to hotels. The simulated
flight comparisons, manual quote form and route/allowance panel are removed.

Hotels search automatically when their step opens. Up to three distinct offers are
ranked as Cheapest, Comfort pick (highest-rated alternative) and Best value. The
app prefers offers within the remaining hotel allowance when at least three fit;
otherwise above-allowance results stay visible with the shortfall shown. Missing
supply remains missing. A selected whole-stay estimate enables attractions.
Single-room occupancy constraints are preserved; no nightly rates are multiplied
into invented group totals. Family basics default to one shared room unless the
user already requested a specific room count. Exact child ages can be entered in
trip preferences; ambiguous age ranges do not become guessed airline categories.

Both clients share identical pending requests and cache results in memory for ten
minutes. Returning to a step and React Strict Mode do not duplicate upstream calls.
The existing backend origin checks, JWT verification, private credentials and
shared 200-request pilot quota remain unchanged. No booking or payment is performed.

Attractions show three recommendation cards per day. Families with children get
For children, For grown-ups, and Together, with sourced venues where available.
Missing local directory data produces explicit category searches, never invented
venue names. Named recommendations can be added to the current day; saved manual
activities and the eight-activity cap remain respected.

Selected prices use evidence `live-search` with a retrieval timestamp. Trip saves,
budget labels and PDF export preserve that they are estimates, not bookings. Old
demonstration selections are excluded from the guest flow. Choices are scoped to
the trip route, dates, guest composition, currency and requested hotel rooms.

Validation: all 204 tests passed across 55 files. TypeScript and the production
Pages build passed. The route-edit integration additionally verifies selecting
Nuremberg via autocomplete and carrying an edited Rome destination into Hotels.
