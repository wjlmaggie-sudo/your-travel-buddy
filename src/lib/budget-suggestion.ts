import { z } from "zod";
import { fetchExchangeRate } from "./exchange-rates";
import type { TravelStyle } from "./travel-data";

export const budgetSuggestionSchema = z.object({
  amount: z.number().finite().positive().max(1000000),
  low: z.number().finite().positive(),
  high: z.number().finite().positive(),
  perPersonDay: z.number().finite().positive(),
  flights: z.number().finite().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  profile: z.string().max(100),
  fxDate: z.string().optional(),
  note: z.string().max(600),
});
export type BudgetSuggestion = z.infer<typeof budgetSuggestionSchema>;
type Input = {
  destination: string;
  days: number;
  travelers: number;
  style: TravelStyle;
  persona?: string | undefined;
  departure?: string | undefined;
};
const rounded = (n: number) => Math.round(n * 100) / 100;
/** Transparent reference allowances, not surveyed averages or live destination prices. */
export function suggestBudget(input: Input): BudgetSuggestion {
  if (
    !Number.isInteger(input.days) ||
    input.days < 1 ||
    input.days > 30 ||
    !Number.isInteger(input.travelers) ||
    input.travelers < 1 ||
    input.travelers > 20
  )
    throw new Error("Check trip days and travelers before estimating a budget.");
  const destination = input.destination.trim().toLowerCase();
  const profiles: Array<[RegExp, number, string]> = [
    [/^(lisbon|lisboa)(,\s*portugal)?$/, 0.85, "Lisbon reference"],
    [/^bali(,\s*indonesia)?$/, 0.65, "Bali reference"],
    [/^kyoto(,\s*japan)?$/, 0.95, "Kyoto reference"],
    [
      /^(paris(,\s*france)?|london(,\s*(uk|united kingdom|england))?|singapore(,\s*singapore)?)$/,
      1.3,
      "Higher-cost city reference",
    ],
    [
      /^((zurich|zürich|geneva)(,\s*switzerland)?|new york(,\s*(usa|united states))?)$/,
      1.5,
      "Higher-cost city reference",
    ],
  ];
  const profile = profiles.find(([pattern]) => pattern.test(destination));
  const style = input.persona === "budget-travel" ? "Budget" : input.style;
  const daily =
    Math.round(
      ({ Budget: 70, Balanced: 150, Luxury: 300 }[style] *
        (profile?.[1] ?? 1) *
        (input.persona === "business" ? 1.1 : 1) *
        (input.days === 1 ? 0.5 : 1)) /
        5,
    ) * 5;
  const ground = daily * input.days * input.travelers;
  // An intentionally broad flight reserve: route-specific live searches remain separate.
  const flights = input.departure?.trim() ? 500 * input.travelers : 0;
  return budgetSuggestionSchema.parse({
    amount: ground + flights,
    low: Math.round(ground * 0.75 + flights * 0.5),
    high: Math.round(ground * 1.35 + flights * 2),
    perPersonDay: daily,
    flights,
    currency: "EUR",
    profile: profile?.[2] ?? "General city-trip reference",
    note: `${input.days === 1 ? "Day-trip allowance: no overnight accommodation included." : "Reference allowances include accommodation, food, activities, local transport and a buffer."} Dates, season, room sharing and travel choices can change costs. Children use the same allowance; discounts are not assumed. Flight reserves are not route quotes.`,
  });
}
export async function convertBudgetSuggestion(suggestion: BudgetSuggestion, currency: string) {
  if (currency === "EUR") return suggestion;
  try {
    const fx = await fetchExchangeRate("EUR", currency);
    return budgetSuggestionSchema.parse({
      ...suggestion,
      currency,
      fxDate: fx.date,
      ...Object.fromEntries(
        (["amount", "low", "high", "perPersonDay", "flights"] as const).map((key) => [
          key,
          rounded(suggestion[key] * fx.rate),
        ]),
      ),
    });
  } catch {
    return {
      ...suggestion,
      note: `Currency conversion unavailable or outside the planner's amount limit; this suggested plan uses EUR. ${suggestion.note}`,
    };
  }
}
