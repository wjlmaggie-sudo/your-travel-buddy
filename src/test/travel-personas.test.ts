import { describe, expect, it } from "vitest";
import { createJourneyIdeas } from "@/lib/journey-plan";
import { plannerDraftSchema } from "@/lib/planner-draft";
import { connectedBudget, demoFlights, flightCost } from "@/lib/travel-workspace";
import { bookingSearch, stayScope } from "@/lib/stay-planning";
import { ideaSchema } from "../../supabase/functions/_shared/trip-ideas";
const brief = {
  destination: "Lisbon, Portugal",
  start: "2026-11-01",
  days: 3,
  travelers: 4,
  budget: 1800,
  currency: "EUR",
  style: "Balanced" as const,
  interest: "Food & culture",
};
const journey = {
  departure: "",
  flightBudget: 0,
  hotelComfort: "Comfortable" as const,
  flightsRequired: false,
};
describe("persona-aware local planning", () => {
  it("keeps range-based ages distinct from exact ages and adapts the youngest group", () => {
    const family = {
      ...brief,
      persona: "family" as const,
      childrenAgeRanges: ["0-3", "7-10"] as ("0-3" | "7-10")[],
    };
    expect(plannerDraftSchema.safeParse(family).success).toBe(true);
    expect(
      createJourneyIdeas(family, journey).days[1]!.items.some((i) => i.title.includes("nap break")),
    ).toBe(true);
    const url = new URL(bookingSearch(family, 1));
    expect(url.searchParams.get("group_adults")).toBe("2");
    expect(url.searchParams.get("group_children")).toBe("2");
    expect(url.searchParams.getAll("age")).toEqual([]);
    expect(stayScope(family)).not.toBe(
      stayScope({ ...family, childrenAges: [0, 7], childrenAgeRanges: undefined }),
    );
    expect(plannerDraftSchema.safeParse({ ...family, childrenAges: [0, 7] }).success).toBe(false);
  });
  it("changes activities and pace independently of the same budget", () => {
    const business = createJourneyIdeas({ ...brief, persona: "business" }, journey);
    const family = createJourneyIdeas(
      { ...brief, persona: "family", childrenAges: [3, 9] },
      journey,
    );
    const budget = createJourneyIdeas({ ...brief, persona: "budget-travel" }, journey);
    expect(business.days[1]!.items.some((i) => i.title.includes("work or meeting"))).toBe(true);
    expect(family.days[1]!.items.some((i) => i.title.includes("nap break"))).toBe(true);
    expect(budget.days[1]!.items.some((i) => i.title.includes("Self-guided"))).toBe(true);
    for (const persona of ["business", "family", "budget-travel"] as const) {
      expect(connectedBudget({ ...brief, persona }, journey)).toEqual(
        connectedBudget(brief, journey),
      );
    }
    for (const plan of [business, family, budget])
      expect(ideaSchema.safeParse(plan).success).toBe(true);
  });
  it("adapts family activities to preschool, school-age and teenage children without assuming discounts", () => {
    const plan = (ages: number[]) =>
      JSON.stringify(
        createJourneyIdeas({ ...brief, persona: "family", childrenAges: ages }, journey),
      );
    expect(plan([2, 13])).toContain("Jardim da Estrela");
    expect(plan([8])).toContain("Pavilhão do Conhecimento");
    expect(plan([15])).toContain("science and culture together");
    expect(plan([])).toContain("No children assumed");
    expect(plan([8])).toContain("child prices are unverified");
  });
  it("keeps travel days and one-day output valid with each persona", () => {
    for (const persona of ["business", "family", "budget-travel"] as const) {
      for (const days of [1, 5, 30]) {
        const result = createJourneyIdeas(
          { ...brief, persona, days },
          { ...journey, flightsRequired: true, departure: "Berlin", flightBudget: 400 },
        );
        expect(ideaSchema.safeParse(result).success).toBe(true);
        expect(result.days[0]!.items[0]!.title).toContain("Travel from Berlin");
        expect(result.days.at(-1)!.items.at(-1)!.title).toContain("Return to Berlin");
      }
    }
  });
  it("validates ages and at least one adult while accepting old drafts", () => {
    expect(plannerDraftSchema.safeParse(brief).success).toBe(true);
    for (const childrenAges of [[-1], [18], [2.5], [2, 3, 4, 5]]) {
      expect(
        plannerDraftSchema.safeParse({ ...brief, persona: "family", childrenAges }).success,
      ).toBe(false);
    }
    expect(
      plannerDraftSchema.safeParse({ ...brief, persona: "family", childrenAges: [0, 17] }).success,
    ).toBe(true);
  });
  it("includes party ages in external hotel searches and invalidates stale quotes when they change", () => {
    const family = { ...brief, persona: "family" as const, childrenAges: [3, 10] };
    const url = new URL(bookingSearch(family, 1));
    expect(url.searchParams.get("group_adults")).toBe("2");
    expect(url.searchParams.get("group_children")).toBe("2");
    expect(url.searchParams.getAll("age")).toEqual(["3", "10"]);
    expect(stayScope(family)).not.toBe(stayScope({ ...family, childrenAges: [4, 10] }));
    const flying = { ...journey, flightsRequired: true, departure: "Berlin", flightBudget: 400 };
    const selectedFlight = demoFlights(family, flying)[0]!;
    expect(flightCost(family, { ...flying, selectedFlight })).toBe(selectedFlight.amount);
    expect(flightCost({ ...family, childrenAges: [4, 10] }, { ...flying, selectedFlight })).toBe(
      400,
    );
  });
});
