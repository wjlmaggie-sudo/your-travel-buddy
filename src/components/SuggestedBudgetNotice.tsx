import type { BudgetSuggestion } from "@/lib/budget-suggestion";
import { dailyMoney } from "./DailyBudget";
export function SuggestedBudgetNotice({ suggestion }: { suggestion: BudgetSuggestion }) {
  const money = (value: number) => dailyMoney(value, suggestion.currency);
  return (
    <div
      className="mt-4 rounded-xl border border-secondary/30 bg-secondary/5 p-4 text-sm"
      aria-label="Suggested budget estimate"
    >
      <p className="font-semibold">Suggested starting budget: {money(suggestion.amount)}</p>
      <p className="mt-2">
        Planning range: {money(suggestion.low)}–{money(suggestion.high)} for the whole group.
      </p>
      <p className="mt-2">
        {money(suggestion.perPersonDay)} per person / day for the stay, meals, activities and local
        transport.{" "}
        {suggestion.flights
          ? `${money(suggestion.flights)} extra is reserved for group return flights.`
          : "Flights are excluded."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {suggestion.profile} · planning estimate, not live prices or a surveyed average.{" "}
        {suggestion.note}{" "}
        {suggestion.fxDate
          ? `Converted using the ECB reference rate dated ${suggestion.fxDate}.`
          : ""}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        You can set your own total in Edit trip details. Nothing has been booked.
      </p>
    </div>
  );
}
