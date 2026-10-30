import { describe, expect, it } from "vitest";
import { createStarterIdeas, budgetTravelStyle } from "@/lib/starter-plan";
import { dailyBudgets, budgetAllocation } from "@/lib/planning";
import { ideaSchema } from "../../supabase/functions/_shared/trip-ideas";
const input = {
  destination: "Lisbon, Portugal",
  days: 3,
  travelers: 2,
  budget: 900,
  currency: "EUR",
  style: "Balanced" as const,
  interests: "Food & culture",
};
describe("complete starter itinerary", () => {
  it.each([1, 3, 7, 30])("covers all %i days with editable activities and valid output", (days) => {
    const plan = createStarterIdeas({ ...input, days });
    expect(ideaSchema.safeParse(plan).success).toBe(true);
    expect(plan.days.map((day) => day.day)).toEqual(
      Array.from({ length: days }, (_, index) => index + 1),
    );
    expect(
      plan.days.every(
        (day) => day.items.length >= 6 && day.items.every((item) => item.title && item.location),
      ),
    ).toBe(true);
  });
  it("changes meals and activities across low, medium, and high budgets for the same destination", () => {
    const plans = [420, 900, 1800].map((budget) => createStarterIdeas({ ...input, budget }));
    expect(plans[0]?.days[0]?.items[2]?.title).toContain("picnic");
    expect(plans[1]?.days[0]?.items[2]?.title).toContain("café");
    expect(plans[2]?.days[0]?.items[2]?.title).toContain("regional lunch");
    expect(plans[0]?.days[0]?.items[3]?.title).toContain("free");
    expect(plans[2]?.days[0]?.items[3]?.title).toContain("guided visit");
    for (const budget of [420.01, 900.02, 1800.03]) {
      const style = budgetTravelStyle({ ...input, budget });
      const days = dailyBudgets(budget, input.days, input.travelers, "2026-10-20");
      expect(days.reduce((sum, day) => sum + Math.round(day.amount * 100), 0)).toBe(
        Math.round(budget * 100),
      );
      for (const day of days)
        expect(
          budgetAllocation(day.amount, style).reduce(
            (sum, item) => sum + Math.round(item.amount * 100),
            0,
          ),
        ).toBe(Math.round(day.amount * 100));
    }
  });
  it("does not invent an exchange rate or pretend a zero budget covers paid travel", () => {
    expect(budgetTravelStyle({ ...input, currency: "JPY", budget: 50000, style: "Budget" })).toBe(
      "Budget",
    );
    expect(createStarterIdeas({ ...input, budget: 0 }).summary).toContain(
      "may not cover accommodation",
    );
  });
  it("labels unknown destinations as a flexible outline rather than fabricated places or AI output", () => {
    const plan = createStarterIdeas({ ...input, destination: "Somewhere unfamiliar" });
    expect(plan.summary).toContain("flexible planning outline");
    expect(plan.summary).toContain("not an AI-generated");
  });
});

it("plans three distinct named visits each day, beyond meals and rest, for every persona", () => {
  for (const persona of [undefined, "family", "business", "budget-travel"] as const) {
    const plan = createStarterIdeas({
      ...input,
      days: 5,
      persona,
      childrenAgeRanges: persona === "family" ? ["0-3"] : undefined,
    });
    for (const day of plan.days) {
      const visits = new Set(
        day.items
          .filter((item) => !/lunch|dinner|breakfast/i.test(item.title))
          .map((item) => item.location)
          .filter((name) => name !== input.destination),
      );
      expect(visits.size, `${persona ?? "general"} day ${day.day}`).toBeGreaterThanOrEqual(3);
      expect(day.items.length).toBeLessThanOrEqual(8);
    }
  }
});
