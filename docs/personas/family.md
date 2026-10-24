# Family travel persona

Status: proposed product and planning specification. This document does not implement a persona selector, child pricing, new provider access, or live AI. Existing template planning remains free to explore as a guest.

## Who this serves

A group planning around shared interests, different energy levels, and time together. A family may include children, older relatives, or adults only; selecting this persona must not assume a particular family structure. The main goal is a manageable, enjoyable trip inside one whole-group budget, with fewer transfers and enough time to eat, rest, and adapt.

Suggested interface label: **Family — a relaxed pace, shared experiences, and time to recharge.** Persona is separate from spending level: a family can have a small or large budget.

## Inputs and defaults

Reuse destination, dates or duration, traveler count, total group budget, currency, and optional departure city. Reuse the existing trip when navigating between sections. Do not ask again for destination or country codes.

One optional, collapsed “Adapt for your group” area can collect:

- Adults and children, with optional child age bands for activity suitability. Reconcile these counts with total travelers. Do not infer that all four travelers means two adults and two children.
- Preferred pace: relaxed by default; regular or active if requested.
- Break or nap window, preferred meal times, and approximate walking tolerance.
- Stroller/step-free preference and optional room/bed arrangement. Ask about functional requirements, not diagnoses or personal histories.
- A short choice of interests, indoor/outdoor preference, and dietary preferences without requiring sensitive explanations.

No names, birth dates, passport details, or children's profiles are needed for a simulated itinerary. If a future quotation provider requires children's exact ages, request ages at travel time only at that quote step and explain why; age bands are not accurate fare inputs. Unknown ages must remain unknown. If the user skips optional details, offer a broadly relaxed outline and label child-specific suitability and prices as unconfirmed.

## Activity selection and scheduling

Use deterministic local rules first; no paid AI is needed for the initial persona. Apply these in order:

1. **Eligibility:** exclude known restrictions incompatible with the group's stated ages/access needs or available time. Check destination match, date, and remaining activity budget. Unknown suitability is a visible uncertainty, not a verified match. Never claim facilities, safety, opening hours, or accessible routes from a venue's name or photo.
2. **Rank suitable candidates:** proposed normalized weights are shared interests 30%, compact routing 25%, manageable duration/effort 20%, cost fit 15%, and reliable suitability information 10%. These are starting product rules, not measured outcomes. Do not reward low prices for an option that fails a hard requirement.
3. **Build a gentle day:** one main experience in the morning and at most one optional nearby afternoon stop. Include lunch and a substantial rest block. Avoid making shopping or nightlife mandatory.
4. **Account for movement:** include the trip to each stop, waiting/check-in where applicable, and a flexible transition buffer. Use supplied routing data when available; otherwise mark travel times as estimates. Straight-line distance cannot establish a stroller-friendly walking route.
5. **Adapt to arrival, departure, and weather:** do not schedule paid visits against unknown flight times. Keep travel days light; provide a nearby indoor alternative for outdoor plans, with its own cost and uncertainty labels.

Opening hours, ticket age bands, free-child rules, timed-entry requirements, and reservation links need a source and freshness label when available. Otherwise show “Check with the venue,” rather than inventing a ticket price or guaranteed entry. Include the existing short place story where available, with an optional simpler explanation suitable for reading together; do not invent historical facts.

Every activity remains editable, removable, or replaceable. Changing persona should preview the affected days and budget before applying; preserve manually edited activities and explicit flight/hotel selections unless the user chooses to replace them. Show a small explanation such as “Nearby park chosen to keep the afternoon flexible.”

## Flights, accommodation, and local transport

**Flights:** prefer a suitable daytime direct journey when the whole-trip cost allows it, then compare a less convenient alternative. Include checked bags, seats, airport transfers, and child-restraint requirements only when their costs/rules are known. Do not assume child fares or free infant travel. The current app has no verified flight inventory: do not turn its demo schedules into recommendations represented as real offers.

**Accommodation:** compare the total for the complete group and all nights, including known mandatory extras. Prioritize a practical location, room arrangement, and cancellation terms within the existing hotel allowance. Kitchenette, cot, connecting rooms, lift, breakfast, and child facilities are preferences to verify, not facts inferred from star ratings. A cheap room that does not fit the group is ineligible. Do not auto-split children into separate rooms or assume two rooms connect.

**Current provider limitation:** the Nuitee integration is sandbox only. Its request treats every traveler as an adult, splits them into rooms of at most two adults, and sends `children: []`; normalization requires matching adult totals and zero children. It cannot quote a family with children accurately. Until child ages and room-level occupancy are supported end to end, suppress an actionable family-occupancy claim and say that family pricing needs confirmation. Do not silently substitute adult quotes for children or label sandbox prices as real offers. Adult-only family groups can use the existing adult test flow with its sandbox disclosure.

**Transport:** compare the group total for transit versus a taxi/transfer when known, considering practical distance, changes, luggage, and access preferences. Never assume a taxi has child seats or that a rental includes them. Walking can be a pleasant option, but it is not automatically suitable or zero-effort.

If a suitable room or transport option exceeds the allowance, show the shortfall and alternatives; keep the total budget fixed. Ask the user to accept any reallocation, larger budget, or shorter trip. Do not silently raise the hotel budget, use a smaller occupancy, or remove meals to manufacture affordability.

## One connected budget

All displayed costs are whole-group totals in the chosen currency. Per-person and per-night views are secondary and labeled. Use the shared budget calculation, not a separate family calculator. Count a selected whole-stay price once, not again on every day. Keep paid meals/tickets in their own categories, and avoid counting included breakfast twice.

Reserve a visible contingency inside the total, rather than adding a buffer on top. In the current model, shopping and buffer share one category; a separately protected reserve would require a future model/UI change. Known extras count immediately; unknown child fares, room eligibility, local taxes, or transport costs keep a “provisional total” label. Never convert an unpriced essential to zero. A negative remaining amount is a shortfall, not a recommendation that fits.

### Illustrative whole-trip budget

**Hypothetical planning example only — not current prices, provider offers, a booking, or a prediction.** Five days/four nights in one city, two adults and two children; all amounts are EUR for all four people. These amounts assume no meal inclusions and need real group quotes before purchase.

| Category | Whole-trip allocation | Meaning |
| --- | ---: | --- |
| Return flights | €800 | All four travelers; illustrative baggage/seat/fees allowance included |
| Accommodation | €1,000 | Four nights, a hypothetical room arrangement suitable for all four |
| Food | €450 | €90 per day for the group |
| Activities | €250 | €50 per day on average; actual spending may differ by day |
| Local transport | €200 | €40 per day on average, including airport movement |
| Shopping and contingency | €300 | €60 per day held as a trip reserve; not scheduled spending |
| **Total budget** | **€3,000** | **€2,700 allocated spending plus €300 reserve** |

The same model can display €600 per calendar day as an average including flights and accommodation, but must distinguish this from the €180 daily food/activity/transport allowance. Because the €300 reserve is already an allocated category, the current shared dashboard's remaining/unallocated balance is **€0**, not €300. A €900 flight instead of €800 makes the unchanged allocation total €3,100, a €100 shortfall. After explicit approval to reduce the reserve to €200, the allocation again totals €3,000. Independently, choosing a €1,200 hotel instead of €1,000 makes the unchanged allocation €3,200; reducing the reserve from €300 to €100 would need explicit approval. Neither choice changes the budget cap or silently spends the reserve.

### Illustrative editable day

This is a generic non-travel day using the example above, not a verified route, opening timetable, or set of ticket prices. The 30-minute transitions are placeholders to replace with route data.

| Time | Plan | Illustrative group cost | Editing behavior |
| --- | --- | ---: | --- |
| 08:30–09:15 | Breakfast and an unhurried start | €15 food | Adjust for hotel breakfast if genuinely included |
| 09:15–09:45 | Travel and arrival buffer | Part of €40 transport allowance | Change mode after checking access and group needs |
| 10:00–11:30 | One hands-on museum or cultural experience | €50 activities | Verify age suitability, group ticket total, hours, and booking requirements |
| 11:30–12:00 | Flexible transition | — | Keep available for a longer visit or a break |
| 12:00–13:00 | Nearby lunch | €35 food | Replace with a suitable nearby alternative |
| 13:00–15:00 | Return/quiet time and rest | Transport within the same €40 cap | Optional rest location; do not assume hotel early access |
| 15:00–16:30 | Optional nearby public park or short walk | €0 admission assumption | Verify public access; skip if tired or swap for an indoor option |
| 17:30–18:30 | Early dinner and return | €40 food | Avoid unnecessary late transfers |

Day operating allowance: €90 food + €50 activities + €40 total transport = **€180**. Actual transport can be lower; an allowance is not a fare. Hotel and flights are already counted at trip level. The €60 average reserve is not an extra activity budget. If the replacement indoor option costs €20, show activity spending €70 and the corresponding trip-budget change before applying it.

## Edge cases and acceptance scenarios

- **Guest, unknown ages:** destination/duration/travelers/budget produces a usable relaxed local outline without login. It does not claim child-specific prices or save personal history. Saving prompts for an account; session use and PDF remain available.
- **Two adults and two children:** selecting this composition does not send four adults as a verified family hotel quote. It explains the current provider limitation and leaves the itinerary usable.
- **One adult with a child, or a larger multigenerational group:** room needs are explicit; no inferred family structure, assumed connecting rooms, or automatic separate child room.
- **One day:** no overnight accommodation allocation. **Late arrival/early departure:** no fixed ticketed attraction conflicting with travel. **Unknown schedule:** leave travel-day timing flexible.
- **Very tight or zero budget:** prioritize genuinely free options and flag that food, transport, or lodging may still be unaffordable; do not claim a complete feasible trip when essentials are unpriced.
- **Weather/access restriction:** replacing an outdoor stop preserves the rest block and updates the same trip total; no claim that an unverified route is step-free.
- **User upgrade:** a more expensive suitable hotel updates total and remaining budget immediately; no automatic removal of meals or increase to the user's cap. Show any shortfall.
- **Manual edits:** a user-edited afternoon survives navigation and does not disappear when persona or budget suggestions refresh. A proposed replacement is reviewable and reversible.
- **Changed party/dates/currency:** invalidate incompatible quotes and re-evaluate occupancy, ticket ages, and budget; do not keep a stale family price. No matching verified option produces an honest unavailable state, not demo inventory presented as real.

## Existing implementation and gaps

Paths below are relative to the repository root, supplied to make this proposal actionable:

| Existing path | What exists / proposed work |
| --- | --- |
| `src/lib/starter-plan.ts` | Deterministic template generation, fixed meal/activity times and spending styles. Add a distinct family persona rule layer; do not equate family with Budget/Balanced/Luxury. |
| `src/lib/journey-plan.ts` | Budget-aware starter ideas and arrival/return placeholders. Extend with rest windows, suitability filtering, compact routes, and transparent uncertainty. |
| `src/lib/travel-workspace.ts` | `connectedBudget`, category estimates, scoped flight choices. Reuse totals; optional protected reserve would be a deliberate extension. Flight fixtures remain demonstrations. |
| `src/lib/stay-planning.ts` | Whole-stay/room-night/person-night calculations and scoped accommodation choices. Current `bookingSearch` sets all travelers as adults and zero children: it needs a party-aware update before family booking searches. |
| `src/lib/journey-planning.ts` | Journey schema and external flight-search link currently describe travelers as adults. Add optional party composition without making new fields mandatory for existing saved plans. |
| `supabase/functions/_shared/hotel-search.ts` | Adult-only sandbox request/normalization. Child ages, per-room adults/children, occupancy eligibility, and truthful production provenance are prerequisites for genuine family quotes. |
| `src/components/HotelSearchPreview.tsx` | Automatic budget-bounded hotel test flow. Add an honest unsupported-family-occupancy state before provider calls if children are specified. |
| `src/components/InstantPlan.tsx` | Editable activities and `activityEdited` protection. Retain edits and existing guest behavior when applying a persona. |
| `src/lib/city-guides.ts`, `src/lib/place-stories.ts` | Existing curated places and story content can inform suggestions. They are not evidence of current facilities, availability, or ticket prices. |
| `src/lib/weather.ts`, `src/lib/trip-pdf.ts` | Reuse weather and PDF support; export family pacing, uncertainty labels, stories, and the same budget without implying a live forecast outside its supported horizon. |

No code changes, database migrations, credentials, paid service activation, provider signup, or deployment are authorized by this document itself. Implementation should retain GitHub Pages compatibility, private backend keys, optional authentication for persistent saving only, and the current free local planning fallback.
