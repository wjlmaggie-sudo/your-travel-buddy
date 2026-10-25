# Optional trip budgets

The homepage and account-trip creation forms start with an empty, optional budget.
An entered total (including zero) remains the user's limit. Leaving it blank creates
an editable reference budget; saved plans still contain a numeric total so hotels,
flights, daily allocations and connected budget arithmetic keep working.

The local model uses EUR reference allowances of 70 / 150 / 300 per person/day for
Budget / Balanced / Luxury, then applies explicitly defined destination reference
multipliers. These are product assumptions, not current surveyed averages or live
prices. The destination profiles are deliberately limited; unknown destinations use
a labeled general city-trip reference. Budget Travel uses Budget; Business adds a
10% reference uplift. Day trips use half the daily reference and exclude overnight
accommodation. Children use the same allowance; discounts are not invented.

The indicative ground-cost range is 75–135% of the point estimate. When a departure
is entered, a separate, broad EUR 500/person return-flight reserve is added, with a
EUR 250–1000/person range. This is not a route-specific quote. Live flight and hotel
results remain separate; choosing one updates the existing connected budget.

For example, five days in Lisbon for two people with Balanced preferences produces
an editable EUR 1300 ground budget (EUR 130/person/day), range EUR 975–1755,
excluding flights. Every price is labeled as an assumption-based planning estimate.

For another currency, the existing Frankfurter ECB reference-rate endpoint converts
all estimate amounts consistently and stores the conversion date. If conversion is
unsupported, unavailable, or exceeds the planner's numeric limit, the suggested
plan uses EUR and explicitly explains why. Euro values are never relabeled as a
different currency. Manually entered amounts are not converted automatically.

The suggestion and its provenance live in existing journey metadata, guest session
storage and explicit sign-in handoff. The overview shows the full range and daily
assumptions; guided flight/hotel steps show a compact estimate notice. PDF exports
retain the estimate label, range, flight reserve and conversion date. Typing a new
total and updating the trip clears the automatic-estimate label.

No new paid service, AI key, database migration or provider credential is required.
Exchange-rate service documentation: https://frankfurter.dev/
