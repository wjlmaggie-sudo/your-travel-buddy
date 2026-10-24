# Travel planning personas

Product and implementation specifications, prepared 24 October 2026. **These documents
propose future behavior; this documentation change does not activate personas in the app.**
Three subagents independently developed one persona each; the parent agent reviewed the
shared constraints and integration guidance.

| Persona | Main planning goal | Activity and schedule emphasis | Specification |
| --- | --- | --- | --- |
| Business | Fit useful leisure around work commitments | Protected meeting/work blocks, nearby activities, punctual transfers | [Business](business.md) |
| Family | Make the trip manageable and enjoyable for the whole group | Age-aware options, meal/rest breaks, fewer transfers | [Family](family.md) |
| Budget Travel | Get meaningful experiences within an explicit spending cap | Free/low-cost options, total-cost comparisons, affordable routes | [Budget Travel](budget.md) |

## One planner, different priorities

A persona guides ranking, pace and explanations; it is not a separate app or a price tier.
Business does not mean luxury, Family does not imply children or a particular household,
and Budget Travel does not imply shared accommodation or strenuous walking.

Keep persona separate from existing `Budget`, `Balanced`, `Luxury` travel styles. Those
styles already influence template selection and estimates; a Business or Family trip can
also have a low budget. Do not silently replace an existing style or change the total budget
when a persona changes. Existing plans without a persona retain current behavior.

Suggested UI: one optional three-choice persona control alongside the basic trip inputs.
The user can skip it. Show persona-specific refinements progressively rather than adding
three more mandatory forms. Reuse destination, dates/duration, travelers, currency, budget
and optional departure from the current trip. Family-specific occupancy information must
be collected before issuing any future child-aware provider search.

## Shared planning contract

1. Apply hard constraints first: dates, group composition when known, locked events,
   accessibility needs, valid opening/ticket windows when verified, and the group budget.
2. Rank feasible options by the selected persona; explain the tradeoff in plain language.
   Missing essential information makes a recommendation provisional, not verified.
3. Cluster nearby activities and include travel, meals, rest and arrival/departure buffers.
   Route distances and times need a source; otherwise label them as estimates.
4. Use one connected budget for flights, hotel, activities, food, transport and shopping/buffer.
   Work in currency cents, distinguish whole-trip/group costs from daily and per-person
   figures, and include known taxes/fees. Unknown costs are not zero. Never claim that an
   incomplete estimate guarantees affordability.
5. Keep user edits and explicitly locked activities. A persona change previews its effects;
   accept/regenerate only with a clear user action. Do not overwrite edited days silently.
6. Preserve guest simulations and PDF exports; require login only for persistent account
   saving. No paid AI service is necessary for deterministic persona rules.
7. Keep source, price status and checked time where available. Illustrative examples in
   these specs are not offers, verified itineraries or new provider integrations.

## Current implementation and integration points

- [`TravelPlanner`](../../src/components/TravelPlanner.tsx) owns basic guest inputs;
  [`planner-draft.ts`](../../src/lib/planner-draft.ts) validates the tab-session draft.
- [`starter-plan.ts`](../../src/lib/starter-plan.ts) generates deterministic templates;
  [`journey-plan.ts`](../../src/lib/journey-plan.ts) adds journey-aware planning.
- [`travel-workspace.ts`](../../src/lib/travel-workspace.ts) calculates connected costs;
  [`stay-planning.ts`](../../src/lib/stay-planning.ts) handles stay units and scope.
- [`city-guides.ts`](../../src/lib/city-guides.ts),
  [`visit-logistics.ts`](../../src/lib/visit-logistics.ts) and
  [`place-stories.ts`](../../src/lib/place-stories.ts) supply destination context.
- [`trip-pdf.ts`](../../src/lib/trip-pdf.ts) exports the itinerary; persona context would
  need to be carried into exports and persistent saved-trip flows as well as guest drafts.
- The current hotel API is **sandbox only**, uses adult-only occupancy and returns up to
  three test previews. Flights remain labeled demos/external search links. No real-time
  multi-site hotel comparison or production booking is activated by this work.

## Suggested delivery order

1. Agree on the three persona specifications and their acceptance scenarios.
2. Add an optional validated persona field and minimal preference data to draft/saved-trip
   flows, preserving old plans and avoiding sensitive employer/child identity data.
3. Implement shared feasibility checks and persona ranking in the local planner; keep
   destination knowledge separate from preference rules.
4. Add reason labels, controlled regeneration and persona context in PDF output.
5. Verify the same trip under each persona: distinguish activity choices/pace, preserve
   exact budget arithmetic and edits, and disclose missing provider/occupancy data.

Provider access and production pricing are separate work. Do not present a new persona
as evidence that live flights, child rates, room suitability or hotel comparison exist.
