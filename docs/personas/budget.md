# Budget Travel persona

Status: proposed planning specification; this document does not implement a persona selector or change the website. Repository behavior below was reviewed on 24 October 2026.

## Purpose and boundary

**“Help me enjoy the destination without exceeding my whole-trip budget.”**

This persona favors worthwhile free and low-cost experiences, transparent total costs, and practical routes. It does not assume that a budget traveler is young, able to walk long distances, willing to share a bedroom, or comfortable with late-night transfers. Accessibility, personal safety, dietary needs, and explicitly stated requirements are constraints, not optional upgrades.

The proposed persona identifier is `budget-travel`. It expresses planning priorities. The existing `Budget`, `Balanced`, and `Luxury` **travel styles** express coarse spending bands and allocation weights; they are not personas. Selecting Budget Travel must not silently change a saved style, hotel comfort setting, destination, party size, or total budget. A traveler may prioritize careful spending while explicitly choosing a private hotel or one expensive must-see attraction.

## Minimal input and optional choices

Reuse the existing destination, dates/duration, traveler count, total **group** budget, and currency. Reuse departure when available; ask for it only when flights are required. Offer the persona as a simple optional choice and allow changing it without registration.

Keep these optional preferences collapsed rather than adding mandatory questions:

- Must-see activities, maximum paid experiences, and willingness to skip ticketed interiors.
- Maximum comfortable walking time and mobility/access requirements.
- Private room requirement; shared accommodation only with explicit opt-in.
- Acceptable connections, departure times, luggage requirements, and date flexibility.
- Food needs and whether grocery meals or picnics are acceptable.
- Protected contingency amount; suggest a clearly editable 10% reserve as a planning default, not a destination-specific minimum.

Unknown optional preferences should remain unknown. Do not infer nationality, discount eligibility, age, or child fares. Where children travel, actual ages and appropriate occupancy must be supported before presenting a family-valid quote; current hotel search is adults-only.

## Selection and itinerary rules

1. **Check feasibility first.** Protect mandatory travel, accommodation, adequate meals, essential transfers, fees, and contingency before optional tickets or shopping. Preserve the user's hard cap; if these cannot fit, explain the shortfall rather than shrinking essentials unrealistically.
2. **Filter constraints before ranking.** Reject unavailable/closed activities when verified, incompatible access requirements, and options whose known mandatory total exceeds the remaining allowance. Unknown admission or transfer prices cannot count as zero or prove affordability.
3. **Rank viable activities by relevance and total value.** Prefer the user's interests and must-sees, then genuine local experiences with low whole-group cost and short travel. Favor public parks, neighborhood history walks, markets without a purchase requirement, and publicly accessible viewpoints when suitable. Distinguish a free exterior visit from a paid interior. “Free tours” may expect tips; include an explicit allowance or offer a self-guided alternative. Never infer a free-entry day, resident discount, or youth concession.
4. **Build geographic clusters.** Suggest one main area in the morning and a nearby afternoon option, with meals and rest nearby. Include walking/transit time, hills, weather, opening hours, arrival/departure buffers, and booking windows where known. Distance estimates are not verified transit schedules or live routes. Do not fill a travel day with an impossible full sightseeing schedule.
5. **Explain choices briefly.** Each suggested stop should show why it fits, a short source-attributed history/story when available, location/map context, estimated or checked admission, and how to buy a ticket if needed. Do not invent history, opening hours, reservation availability, or ticket links.
6. **Keep control with the traveler.** Offer an affordable alternative to an optional paid stop. Changing an activity or hotel recomputes totals and exposes any overage. Keep manually edited activities and selected quotes; ask the user to apply proposed changes rather than overwriting them when switching persona or regenerating.

## Compare full trip costs

| Part | Prefer | Include before calling it cheaper |
| --- | --- | --- |
| Flights | Lowest acceptable total with practical timings | Whole-group return fare, required bags, unavoidable fees, airport transfers, and any extra overnight stay caused by timing; connections are optional, not automatically preferred |
| Accommodation | Suitable room near the day's route | All nights and rooms, occupancy, mandatory taxes/fees, meals actually included, cancellation conditions, and extra daily transport; a distant cheap room can cost more overall |
| Local transport | Walking when suitable; otherwise practical public transit | Group fares, airport journeys, pass validity, ticket eligibility, service times, accessibility, and realistic walking limits; compare a pass with individual tickets rather than assuming savings |
| Food and activities | Nearby casual meals and meaningful affordable visits | Adequate meals for every traveler, admission for the entire party, booking fees, expected tips, and transport to the activity |
| Shopping | Explicit optional allowance | Keep separate from contingency; an unspent shopping allowance is not permission to spend the protected reserve |

Compare like-for-like hotel or flight offers. A nonrefundable room without breakfast is not automatically better value than a cancellable room with breakfast. Show differences rather than implying equivalence. A refundable deposit is a cash-flow requirement even when not an expected final cost.

## Budget accounting contract

Use one trip currency and integer minor units internally; display group totals first and per-person/per-day equivalents second. Do not apply EUR affordability thresholds to another currency without a sourced exchange rate and timestamp. Keep original currency and conversion evidence visible for external offers.

`planned total = flights + accommodation + food + local transport + activities + shopping + protected contingency`

`unallocated amount = total group cap − planned total`

Hotel nights are `days − 1` under the current trip model; a day trip has zero hotel nights. Allocate fixed flight/stay costs once, then allocate variable daily costs separately so daily displays and whole-trip totals reconcile without double counting. Mark contingency as reserved, not actual spending. On repricing, keep categories and reserves visible and never silently raise the user's cap or remove a selected experience. An over-budget choice may be shown honestly with its shortfall; it cannot be labeled “within budget.”

Every amount needs an evidence state: **allocation**, **estimate**, **user-entered quote**, **sandbox**, or **provider-checked offer**. A provider connection does not by itself verify an offer. Sandbox prices cannot establish a real affordable trip. If a price is unknown, show “price not verified” and identify the unresolved cost; do not claim the complete trip is verified within budget.

## Illustrative trip and daily plan

**Entirely hypothetical arithmetic, not a quote, current local price, or provider availability.** Two adults, three days/two nights in Lisbon, EUR 600 total including return flights. The illustration assumes both travelers accept the proposed food and walking choices and that accessibility and opening hours will be checked.

| Whole-trip category | Group allowance | Basis |
| --- | ---: | --- |
| Return flights | EUR 160 | Both travelers, required baggage included in this assumption |
| Accommodation | EUR 180 | One private room × two nights × EUR 90, assumed mandatory charges included |
| Food | EUR 90 | EUR 30/day for the group; suitability/prices need verification |
| Local transport | EUR 48 | Includes assumed airport transfers; distributed below |
| Activities | EUR 36 | Optional paid experience; all other illustrated visits are public-area walks |
| Shopping | EUR 12 | Optional, not essential spending |
| Protected contingency | EUR 60 | 10% of total cap; not pre-spent |
| **Planned total including reserve** | **EUR 586** | **EUR 14 remains unallocated** |

| Day | Flights/stay allocated once | Food | Transport | Activities | Shopping | Planned spend, excluding reserve |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1: arrival and nearby neighborhood | EUR 170 = outbound 80 + night 90 | EUR 30 | EUR 20 | EUR 0 | EUR 0 | **EUR 220** |
| 2: clustered city exploration | EUR 90 = night 90 | EUR 30 | EUR 8 | EUR 36 | EUR 8 | **EUR 172** |
| 3: short final visit and departure | EUR 80 = return 80 | EUR 30 | EUR 20 | EUR 0 | EUR 4 | **EUR 134** |
| **Total** | **EUR 340** | **EUR 90** | **EUR 48** | **EUR 36** | **EUR 12** | **EUR 526** |

Reconciliation: EUR 526 proposed spending + EUR 60 reserve + EUR 14 unallocated = EUR 600 cap. The average cap is EUR 200/group/day or EUR 100/person/day; this is not a second daily spending allowance.

Example Day 2: 09:00 breakfast, 10:00 Praça do Comércio and a self-guided history stop, 12:30 nearby casual lunch, 14:00 optional paid experience in the same central area only after verifying the whole-group price is at most EUR 36, then a gentle Chiado walk and dinner. A no-ticket alternative preserves the full EUR 36 activity allowance. Times and route are illustrative, not validated reservations; adjust for hills, access, weather, actual lodging, and transport. Keep a factual short story with its source on each named stop; verify details before publishing it.

## Edge cases and acceptance scenarios

- **EUR 0 or insufficient total:** provide useful free-activity ideas but state that travel, meals, and accommodation are unresolved or infeasible; never call this a complete affordable trip.
- **Selected room increases by EUR 40:** show the new total and any loss of unallocated funds; protect the reserve and offer explicit tradeoffs. In the example the increase exceeds unallocated EUR 14 by EUR 26; do not silently consume contingency or rewrite food allowances.
- **Very cheap remote hotel:** include group transfers and necessary travel time before ranking it ahead of a central hotel. Show the assumptions if a fare or schedule is unknown.
- **Day trip or late arrival:** day trip allocates no hotel, and a late-arrival day gets transfers/rest instead of timed morning activities.
- **Unverified prices, no provider access, or quota exhausted:** keep local guest planning available and disclose missing prices; no demo or sandbox values masquerade as real deals.
- **Non-EUR budget:** retain the user's currency/style without pretending the current EUR thresholds apply. Currency conversion needs evidence; unavailable conversion means affordability remains uncertain.
- **Limited mobility or no shared rooms:** retain those constraints even if they reduce the available options. Do not replace them with long walks or dormitory accommodation to make the arithmetic fit.
- **Manual edits and persona switch:** preserve edited stories/activities and selected hotel/flight; show proposed alternatives separately and recalculate the shared budget. A persona change alone must not trigger paid API calls.
- **Guest refresh and saving:** retain persona/preferences only in the current session when implemented; simulation remains usable without login. Ask for an account only for persistent saving/history, carrying over the explicit choice after sign-in.

## Existing support and implementation gaps

Paths below are relative to the repository root.

| Repository area | Present behavior | Proposed Budget Travel work |
| --- | --- | --- |
| `src/lib/starter-plan.ts`, `src/lib/journey-plan.ts` | Deterministic local templates; Budget wording favors public areas and simple meals. EUR bands derive styles. Flight travel days include buffers in text. | Add persona as a separate explicit input; constraint-aware ranking, paid/free alternatives, and duration-aware clustering. Do not claim a live AI model is generating the current templates. |
| `src/lib/planning.ts` | Style-based allocation; exact-cent equal daily budget splitting; existing “Shopping & buffer” combined category. | Separate protected contingency from shopping and reconcile fixed plus variable costs without duplicating totals. The illustrative ledger above is proposed, not the current algorithm. |
| `src/lib/travel-workspace.ts`, `src/lib/stay-planning.ts` | Connected group budget, scoped quotes, whole-stay calculations; legacy hotel comfort allocation ratios. Default connected estimates split the remaining pool into food, activities, transport, and shopping. | Apply explicit reserve and total-cost comparison. Preserve saved values; do not add back redundant Hotel comfort controls or assume the persona means hostel. |
| `src/components/HotelRecommendations.tsx`, `src/lib/hotel-search.ts`, `supabase/functions/_shared/hotel-search.ts` | Configured hotel view searches under the planned hotel allowance. Connected provider is sandbox; occupancy currently uses adults and empty children arrays. Fictional hotel cards are hidden when the endpoint is configured. | Keep evidence labels and hard allowance checks. Verified production multi-seller offers require a separate authorized integration; this document activates none. |
| `src/lib/travel-workspace.ts` (`demoFlights`) | Flights remain demonstration fixtures, not connected flight inventory. | Preserve explicit demo labeling until a verified provider is integrated; do not promise real cheapest fares. |
| `src/lib/city-guides.ts`, `src/lib/lisbon-places.json`, `src/lib/visit-logistics.ts` | Curated Lisbon places, sources, images/descriptions, restaurant references, and distance/logistics helpers. These do not establish live opening hours, fare availability, or optimal transit routing. | Reuse sourced story/map content; add evidence-aware fees, walking constraints, and clustering instead of inventing live facts. |
| `src/lib/planner-draft.ts`, `src/lib/travel-preferences.ts`, `src/components/InstantPlan.tsx`, `src/lib/trip-pdf.ts` | Guest simulations in session storage, signed-in preferences/saving, editable itinerary workspace, and PDF export exist. Schemas currently have no Budget Travel persona. | Add backward-compatible optional persona/preferences to guest and saved data, carry them into generation and PDF, and test edited-content preservation. No authentication requirement for simulations. |

This specification needs no new API key, paid model, account activation, migration, or deployment. Later implementation should reuse existing components and tests, remain compatible with GitHub Pages, and keep any future provider secrets in the backend.
