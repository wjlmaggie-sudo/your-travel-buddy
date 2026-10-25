import { SuggestedBudgetNotice } from "./SuggestedBudgetNotice";
import { useId } from "react";
import { Wallet } from "lucide-react";
import { connectedBudget, type Estimates } from "@/lib/travel-workspace";
import type { Journey } from "@/lib/journey-planning";
import type { StayBrief, StayChoice } from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
export function TripBudgetDashboard({
  brief,
  journey,
  stay,
  onChange,
}: {
  brief: StayBrief;
  journey: Journey;
  stay?: StayChoice | null | undefined;
  onChange?: (next: Journey) => void;
}) {
  const id = useId(),
    costs = connectedBudget(brief, journey, stay),
    money = (n: number) => dailyMoney(n, brief.currency);
  const rows = [
    {
      label: "Flight cost",
      value: costs.flight,
      note:
        journey.flightsRequired === false
          ? "Not required"
          : costs.flightChoice
            ? `${costs.flightChoice.evidence === "demo" ? "Selected demo" : costs.flightChoice.evidence === "live-search" ? "Live search estimate" : "Entered quote"} · group return`
            : "Allowance · no flight selected",
    },
    {
      label: "Hotel cost",
      value: costs.hotel,
      note: costs.hotelChosen
        ? `${stay?.evidence === "demo" ? "Selected demo" : stay?.evidence === "live-search" ? "Live search estimate" : "Entered quote"} · whole stay`
        : "Allowance · no hotel selected",
    },
    {
      label: "Activity costs",
      value: costs.estimates.activities,
      note: "Estimated · tickets & experiences",
    },
    {
      label: "Food & transport",
      value: costs.estimates.food + costs.estimates.transport,
      note: `Food ${money(costs.estimates.food)} · transport ${money(costs.estimates.transport)}`,
    },
    {
      label: "Shopping & buffer",
      value: costs.estimates.shopping,
      note: "Estimated · flexible spending",
    },
  ];
  return (
    <section
      aria-label="Connected trip budget"
      className="rounded-2xl border bg-card p-5 shadow-card md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary">
            <Wallet className="h-4 w-4" />
            Your connected budget
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Every choice, one clear total.</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Whole group · {brief.travelers} travelers · {brief.days} days · {brief.currency}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total travel budget</p>
          <p className="font-display text-3xl font-semibold">{money(brief.budget)}</p>
        </div>
      </div>
      {journey.budgetSuggestion?.amount === brief.budget &&
        journey.budgetSuggestion.currency === brief.currency && (
          <SuggestedBudgetNotice suggestion={journey.budgetSuggestion} />
        )}
      <dl className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-xl bg-muted/40 p-3">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-2 break-words text-xl font-semibold">{money(row.value)}</dd>
            <dd className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{row.note}</dd>
          </div>
        ))}
      </dl>
      <div
        aria-live="polite"
        className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${costs.remaining < 0 ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"}`}
      >
        <div>
          <p className="text-sm font-semibold">
            {costs.remaining < 0 ? "Over budget" : "Remaining budget"}
          </p>
          <p className="mt-1 text-xs">
            After selected costs, unselected allowances and estimates. Nothing has been booked.
          </p>
        </div>
        <p className="font-display text-2xl font-semibold">{money(Math.abs(costs.remaining))}</p>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Planned total: {money(costs.planned)} · {money(costs.planned / brief.days)} / day on
        average. Choosing a pricier offer does not silently reduce food or activity estimates.
      </p>
      {onChange && (
        <details className="mt-4 rounded-xl border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Adjust activity, food, transport & shopping estimates
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["activities", "Activities & tickets"],
                ["food", "Food"],
                ["transport", "Local transport"],
                ["shopping", "Shopping & buffer"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label htmlFor={`${id}-${key}`} className="text-xs">
                  {label} · {brief.currency}, whole trip
                </label>
                <input
                  id={`${id}-${key}`}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  value={costs.estimates[key]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isFinite(value) && value >= 0 && value <= 1000000)
                      onChange({
                        ...journey,
                        estimates: { ...costs.estimates, [key]: value } as Estimates,
                      });
                  }}
                />
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
