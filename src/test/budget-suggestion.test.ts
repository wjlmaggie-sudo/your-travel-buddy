import { expect, it, vi, afterEach } from "vitest";
import { suggestBudget, convertBudgetSuggestion } from "@/lib/budget-suggestion";
import { journeySchema } from "@/lib/journey-planning";
const fx = vi.hoisted(() => vi.fn());
vi.mock("@/lib/exchange-rates", () => ({ fetchExchangeRate: fx }));
const brief = {
  destination: "Lisbon, Portugal",
  days: 5,
  travelers: 2,
  style: "Balanced" as const,
};
afterEach(() => vi.resetAllMocks());
it("scales the reference allowance by destination, duration, group and style, and separates flights", () => {
  const result = suggestBudget(brief);
  expect(result).toMatchObject({
    amount: 1300,
    currency: "EUR",
    perPersonDay: 130,
    flights: 0,
    profile: "Lisbon reference",
  });
  expect(result.low).toBeLessThan(result.amount);
  expect(result.high).toBeGreaterThan(result.amount);
  expect(suggestBudget({ ...brief, travelers: 4 }).amount).toBe(2600);
  expect(suggestBudget({ ...brief, days: 10 }).amount).toBe(2600);
  expect(suggestBudget({ ...brief, destination: "Bali, Indonesia" }).amount).toBeLessThan(
    result.amount,
  );
  expect(suggestBudget({ ...brief, persona: "budget-travel" }).amount).toBeLessThan(result.amount);
  expect(suggestBudget({ ...brief, persona: "business" }).amount).toBeGreaterThan(result.amount);
  expect(suggestBudget({ ...brief, departure: "Berlin" })).toMatchObject({
    amount: 2300,
    flights: 1000,
  });
  expect(suggestBudget({ ...brief, destination: "Unknown destination" }).profile).toBe(
    "General city-trip reference",
  );
});
it("converts every budget amount consistently, preserving provenance through saved journey settings", async () => {
  fx.mockResolvedValue({ rate: 1.2, date: "2026-10-23" });
  const converted = await convertBudgetSuggestion(suggestBudget(brief), "USD");
  expect(converted).toMatchObject({
    amount: 1560,
    perPersonDay: 156,
    currency: "USD",
    fxDate: "2026-10-23",
  });
  expect(
    journeySchema.parse({
      departure: "",
      flightsRequired: false,
      flightBudget: 0,
      hotelComfort: "Comfortable",
      budgetSuggestion: converted,
    }).budgetSuggestion,
  ).toEqual(converted);
});
it("keeps EUR labels when conversion fails rather than relabeling euro amounts", async () => {
  fx.mockRejectedValue(new Error("offline"));
  const converted = await convertBudgetSuggestion(suggestBudget(brief), "JPY");
  expect(converted).toMatchObject({ currency: "EUR", amount: 1300 });
  expect(converted.note).toContain("uses EUR");
});
