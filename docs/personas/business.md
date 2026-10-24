# Business travel persona

Status: proposed product and planning specification. This document does not enable a persona in the application, connect another provider, or change deployed behavior.

## Purpose

Help a traveler arrive prepared for work, keep commitments, and enjoy useful free time within the same total trip budget. Business travel does not imply luxury, a premium hotel, an employer paying, or permission to exceed the budget. A traveler can choose business priorities on a modest budget.

The persona is a planning preference, not a demographic profile. Do not assume age, gender, occupation, mobility, expense policy, or willingness to work while traveling.

## Goals and default priorities

1. Protect confirmed meetings and travel deadlines.
2. Reduce the risk and inconvenience of reaching those commitments.
3. Keep adequate time for meals, rest, and optional preparation.
4. Fit flights, accommodation, transfers, and activities within the group spending cap.
5. Offer a small number of nearby cultural or food experiences during genuine free time.

A useful result explains why a convenient option is recommended and shows its extra cost. It does not equate the most expensive option with the best one.

## Inputs and progressive disclosure

Reuse the existing destination, dates or duration, traveler count, total group budget, and currency. Reuse departure location when flights are required; otherwise leave flights out. Selecting **Business** should be the only additional required action for an initial outline.

An optional **Work commitments** editor can ask for:

- Date, local start/end time, and venue or approximate area.
- A label such as “Meeting”; attendees and confidential meeting details are unnecessary.
- Whether the time is fixed, a preferred arrival buffer, and any preparation block.
- Optional company spending caps, refundable-rate requirements, and accessibility needs.
- Optional working-space, breakfast, or connectivity requirements; these are requests to verify, not guaranteed amenities.

Do not ask users to repeat their destination or enter country codes. If dates or venues are missing, generate a flexible outline and mark timings/commutes as unresolved. Never invent meetings, fixed flight times, or a claim that an itinerary is meeting-safe.

Meetings use the venue's local time zone. Display this explicitly, particularly when departure and arrival zones differ. Do not infer meeting times from the browser's time zone.

## Activity selection and ranking

First exclude or mark as unresolved anything that conflicts with a fixed commitment, access requirement, verified opening interval, or remaining activity allowance. Unknown opening hours or travel times are not proof that a visit fits.

Rank the remaining candidates in this order:

1. Practical fit: usable free interval including a return buffer, and proximity to the meeting or accommodation area.
2. Fit with the user's interests and stated access/energy preferences.
3. Low scheduling risk: a flexible visit or short experience is preferable to a rigid timed ticket before a meeting.
4. Full estimated cost, including detour transport, relative to the activity allowance.
5. Local relevance and variety without unnecessary cross-city travel.

Prefer one optional main experience on a work-heavy day. Do not fill every gap. Suggest a nearby café or short history walk as an alternative to a distant attraction. A restaurant is not automatically suitable for a business meeting, quiet work, a dietary need, or invoice requirements; show evidence when available and otherwise say “Confirm with venue.”

Each suggestion should explain its fit, for example: “Optional evening walk near your meeting area; no paid entry assumed. Opening/access and the transfer time still need confirmation.” History/story content may enrich the stop, but must not invent historical facts, exact hours, or ticket prices.

## Scheduling rules

- Fixed commitments and user-locked activities are anchors; regeneration must preserve them.
- Build free intervals around anchors before choosing activities. Include meals, rest, and transfers as occupied time.
- When verified routing is available, use the actual mode and estimate with its source and retrieval time. Straight-line distance alone is not a commute duration.
- Until routing is available, use clearly labeled provisional buffers and flag feasibility for review. A suggested 30-minute pre-meeting margin is an editable planning assumption, not a universal safety guarantee.
- Do not place a timed attraction between arrival and the first commitment until the flight, baggage/entry needs, check-in, and transfer can reasonably fit.
- On departure day, reserve the carrier's applicable check-in deadline and a transfer margin. If these are unknown, keep nearby activities optional and request confirmation.
- Avoid early optional starts after late arrivals. Allow users to override pace and breaks.
- For overlapping meetings or an impossible transfer, show the conflict and alternatives instead of silently moving a meeting.
- In a multi-person group, default to a shared schedule; do not assume everyone attends the same meetings or create separately charged subgroups without confirmation.

## One connected group budget

Business is separate from the existing Budget/Balanced/Luxury spending style. Do not automatically set `hotelComfort` to Premium or raise the total cap when Business is selected.

Use the existing connected budget as the single source of monetary totals. Keep planned allowances distinct from selected/entered quotes and distinguish estimates, sandbox results, and verified offers. Whole-stay/group totals must include the stated room count and nights; identify unknown taxes or extras rather than treating them as zero.

| Part | Business planning tradeoff |
| --- | --- |
| Flights | Prefer arrival reliability and commitment fit over a marginal saving, but show the price difference. Include baggage and transfer assumptions. A direct route or changeable fare is a preference, not an automatic requirement or verified availability. |
| Hotel | Compare the whole stay plus commute cost. A modest nearby property can beat a higher-rated distant one. Quiet workspace, Wi-Fi quality, breakfast, and invoices must be verified separately. |
| Transport | Compare public transport and taxi/rental alternatives where supported. Include transfer time and total group fare; do not assume a taxi is always faster or transit always works at the needed hour. |
| Food | Reserve meals near work commitments, respecting dietary needs and remaining allowance. No automatic premium dining. |
| Activities | Fit short, optional experiences around work and inside the activity allowance. Free/public alternatives remain useful at any spending level. |
| Reserve | Keep an explicit contingency within the total cap; do not also count it as activity or transport spend. |

If a selected quote exceeds an allowance, immediately update the overall remaining budget. Offer an explicit reallocation or a cheaper choice; do not silently shrink necessary meals, delete commitments, select a purchase, or raise the cap. If required travel exceeds the total budget, state that the plan is not affordable and offer changed dates, duration, location, or budget.

## Illustrative example: work first, optional discovery

**Hypothetical only:** Lisbon, three calendar days/two nights, one adult, EUR 900 total including return flights. The user supplies two day-2 meetings at 09:00–12:00 and 14:00–17:00 in the same approximate area. No particular flight, property, fare, route, attraction availability, or opening time is verified by this example.

| Group allocation | EUR | Assumption |
| --- | ---: | --- |
| Return flights | 240 | Placeholder total, including assumed baggage |
| Accommodation | 300 | One room × two nights × 150; taxes assumed included for this arithmetic only |
| Food | 90 | Three days × 30 |
| Local transport | 75 | Placeholder transfers and local travel combined |
| Activities | 30 | Optional day-2 experience allowance, not a ticket quote |
| Shopping | 0 | No purchase assumed |
| Unspent contingency | 165 | Reserved within the EUR 900 cap |
| **Total allocation** | **900** | **735 planned costs + 165 unspent reserve** |

| Day | Proposed outline | Illustrative costs, EUR |
| --- | --- | ---: |
| 1 | Travel and hotel arrival; verify actual times before adding a short local walk. Rest/preparation instead if arrival is late. | Flight half 120 + hotel night 150 + food 30 + transport 40 = **340** |
| 2 | Breakfast/preparation; provisional 08:30 arrival at meeting area; fixed meetings 09:00–12:00 and 14:00–17:00; lunch and transfer/rest between them. Optional nearby evening visit only after checking hours and routing. | Hotel night 150 + food 30 + transport 15 + activity allowance 30 = **225** |
| 3 | Checkout and return travel; optional nearby activity only after confirming the airport deadline. | Flight half 120 + food 30 + transport 20 = **170** |
| **Total scheduled costs** | Return flight split by day for display only; count it once in the trip total. | **735** |

The EUR 30 activity amount is reserved, not a confirmed purchase; unused amounts remain unspent. The flight split is a display allocation, not two independent fare quotes. The contingency has no scheduled spending day. With that reserve included as an allocated category, the dashboard unallocated balance is EUR 0; the reserve is not an additional spendable balance. An average cap of EUR 300/day is not a claim that each day's actual spend is EUR 300.

## Editable experience and explanations

- Present a concise summary: work blocks, selected base area, unresolved feasibility checks, and total remaining budget.
- Make work blocks visually distinct from optional leisure suggestions. Avoid opening extra panels or scrolling the page automatically.
- Allow editing/removing meetings, moving activities, replacing a hotel, and excluding flights. Recalculate affected conflicts and costs without deleting manual edits.
- Let the user switch persona; preserve quotes, fixed commitments, and locked edits. Show a preview of changed optional suggestions before replacing them.
- Guest users receive the same planning and editing experience with tab-session storage. Require sign-in only for persistent saving/personal history. Do not send sensitive commitment details to an external service merely to generate a free local outline.
- A future verified flight/hotel provider can improve selection evidence, but the persona must remain useful without a paid AI or new API account.

## Edge cases

- **One-day trip:** no hotel cost; preserve travel and commitment buffers rather than scheduling a full sightseeing day.
- **Destination without curated places:** use honest broad activity categories and verification prompts, not invented venues.
- **Duration only/no dates:** generate a provisional work/free-time structure; calendar-specific hours and fares remain unavailable.
- **Unknown meeting location:** suggest an editable base area but mark the commute unresolved.
- **Overnight flight/time-zone or daylight-saving change:** use local dated times; flag ambiguity before promising a feasible connection.
- **Budget zero or below essential costs:** show an affordability problem, not a plausible-looking bookable business trip.
- **Partner or children accompanying a traveler:** keep Business as the selected planning priority but respect explicitly entered family needs; do not assume adult-only activities.
- **Employer policy or accessibility conflict:** show the incompatibility; cheaper or nearby does not override a hard requirement.
- **Provider failure/no in-budget inventory:** explain the limitation and retain editable plans. Do not substitute fictional hotels as real offers.

## Acceptance scenarios for future implementation

1. Given a guest with only basic trip inputs and Business selected, generating a plan requires no account, meeting description, or API key; provisional details are labeled.
2. Given fixed meetings, generation creates no overlapping activity; unknown commute feasibility is flagged rather than asserted.
3. Given a lower-cost hotel farther away and a nearby option, comparisons expose whole-stay plus commute assumptions; neither exceeds the cap without an explicit warning.
4. Given the EUR 900 example above, scheduled costs equal EUR 735 and unspent reserve equals EUR 165; the ledger totals exactly EUR 900 without counting the flight twice.
5. Given a replacement hotel costing EUR 360 instead of EUR 300, scheduled costs become EUR 795. Keeping the protected EUR 165 reserve gives EUR 960 allocated and a EUR 60 shortfall. Only after explicit approval to reduce the reserve to EUR 105 does the allocation fit the unchanged EUR 900 cap.
6. Given a user-edited activity and fixed meeting, regenerating suggestions preserves both unless the user explicitly approves replacing them.
7. Given an unavailable provider or unverified hotel amenities, the UI shows uncertainty and never claims live availability, reliable Wi-Fi, or invoice eligibility without evidence.
8. Given a persona switch, the interface stays stable, keeps the current plan/quotes, and explains proposed changes to leisure priorities.

## Existing implementation and gaps

Inspected repository paths, relative to the repository root:

- `src/lib/planner-draft.ts`: validates the current draft, spending style and interests; guest simulations use session storage. No persona field or meeting constraints are currently represented.
- `src/lib/planning.ts`: provides Budget/Balanced/Luxury styles, estimated allocations, and exact cent-splitting for daily budgets. These are spending styles, not the proposed personas.
- `src/lib/starter-plan.ts`: creates deterministic local templates with generic daily times and curated place/restaurant references; it explicitly says it is not model-generated. It does not solve meeting windows, verified routing, or opening-hour feasibility.
- `src/lib/journey-plan.ts`: applies journey/hotel allowances and arrival/return placeholders to starter ideas; flight schedules are explicitly not retrieved.
- `src/lib/journey-planning.ts` and `src/lib/stay-planning.ts`: contain journey schemas, hotel quote scopes, flight allowance, night calculations, and external searches. Business preferences must not bypass their group totals or quote-scoping checks.
- `src/lib/travel-workspace.ts`: `connectedBudget` unifies flight, hotel, activity, food, transport and shopping/buffer values. A dedicated contingency display and persona-aware allocation would be proposed additions, not existing separate persisted fields.
- `src/components/InstantPlan.tsx`: connects sections, budget updates and guest state; its `activityEdited` behavior already protects edited activities from some automatic regeneration. Per-activity locking and commitment-aware regeneration remain proposed.
- `src/components/HotelRecommendations.tsx` and `src/components/HotelSearchPreview.tsx`: support the currently connected hotel sandbox path. Sandbox data must retain its test label and cannot establish production availability or business amenities.
- `src/components/ItineraryDay.tsx`, `src/components/PlaceStory.tsx`, and `src/lib/trip-pdf.ts`: existing itinerary, story and PDF surfaces that should eventually reflect work blocks, estimate labels and persona explanations consistently.

Implementation should first add a backward-compatible optional persona and commitment model, then deterministic constraints/ranking and explanatory UI. Existing drafts without a persona should retain current behavior. No database migration, production API activation, paid model, booking action, or secret change is required by this documentation task.
