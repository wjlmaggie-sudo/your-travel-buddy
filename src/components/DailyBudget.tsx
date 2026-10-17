import { dailyBudgets, budgetAllocation } from "@/lib/planning";
import { tripDays } from "@/lib/trips";
import type { Tables } from "@/integrations/supabase/types";
import type { TravelStyle } from "@/lib/travel-data";
export function dailyMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
export function DailyBudget({
  trip,
  travelers,
  expenses,
  includesFlights = false,
}: {
  trip: Tables<"trips">;
  travelers: number;
  expenses: Tables<"expenses">[];
  includesFlights?: boolean;
}) {
  const days = dailyBudgets(
    Number(trip.budget),
    tripDays(trip.start_date, trip.end_date),
    travelers,
    trip.start_date,
  );
  return (
    <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-2xl font-semibold">Your daily budget</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your group budget is spread across the trip. These are planned spending limits, not live
        price quotes;{" "}
        {includesFlights ? "flight allowances are included." : "flights are excluded."}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-3 pr-4 font-medium">Day / date</th>
              <th className="px-3 py-3 font-medium">Group budget</th>
              <th className="px-3 py-3 font-medium">Per person (approx.)</th>
              <th className="px-3 py-3 font-medium">Actual spent</th>
              <th className="py-3 pl-3 font-medium">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const spent = expenses
                .filter((e) => e.spent_on === day.date)
                .reduce((sum, e) => sum + Number(e.amount), 0);
              return (
                <tr key={day.day} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    Day {day.day}
                    <span className="block text-xs text-muted-foreground">{day.date}</span>
                  </td>
                  <td className="px-3 py-3 font-medium">{dailyMoney(day.amount, trip.currency)}</td>
                  <td className="px-3 py-3">{dailyMoney(day.perPerson, trip.currency)}</td>
                  <td className="px-3 py-3">{dailyMoney(spent, trip.currency)}</td>
                  <td className={`py-3 pl-3 ${spent > day.amount ? "text-destructive" : ""}`}>
                    {dailyMoney(day.amount - spent, trip.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className="pt-4">Whole trip</td>
              <td className="px-3 pt-4">{dailyMoney(Number(trip.budget), trip.currency)}</td>
              <td className="px-3 pt-4">
                {dailyMoney(Number(trip.budget) / travelers, trip.currency)}
              </td>
              <td className="px-3 pt-4">
                {dailyMoney(
                  expenses.reduce((sum, e) => sum + Number(e.amount), 0),
                  trip.currency,
                )}
              </td>
              <td className="pt-4 pl-3">
                {dailyMoney(
                  Number(trip.budget) - expenses.reduce((sum, e) => sum + Number(e.amount), 0),
                  trip.currency,
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Change your total budget or traveler count above to update the daily plan. Expenses outside
        the trip dates count toward the whole-trip total.
      </p>
    </section>
  );
}
export function DayBudgetSummary({
  amount,
  travelers,
  currency,
  style,
  afterStay,
  includesFlights = false,
}: {
  amount: number;
  travelers: number;
  currency: string;
  style: TravelStyle;
  afterStay?: number | undefined;
  includesFlights?: boolean;
}) {
  return (
    <div className="my-4 rounded-lg bg-muted/60 p-4">
      <p className="font-medium">
        Planned budget: {dailyMoney(amount, currency)} for the group{" "}
        <span className="font-normal text-muted-foreground">
          · {dailyMoney(amount / travelers, currency)} per person
        </span>
      </p>
      {afterStay !== undefined && (
        <p className="mt-2 text-sm text-secondary">
          {includesFlights ? "After flights & hotel:" : "After accommodation:"}{" "}
          {dailyMoney(afterStay, currency)} for the group ·{" "}
          {dailyMoney(afterStay / travelers, currency)} per person. Stay cost is already reserved in
          the comparison above.
        </p>
      )}
      {afterStay === undefined && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {budgetAllocation(amount, style).map((part) => (
            <span key={part.label}>
              {part.label}: {dailyMoney(part.amount, currency)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
