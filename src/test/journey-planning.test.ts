import { describe, it, expect, vi } from "vitest";
import { journeyBudget, flightSearch, journeySchema } from "@/lib/journey-planning";
import { createJourneyIdeas } from "@/lib/journey-plan";
import { stayScope, stayBudget, type StayBrief } from "@/lib/stay-planning";
const brief = {
  destination: "Lisbon",
  start: "2026-11-01",
  days: 5,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
  interest: "Food & culture",
};
const journey = { departure: "Berlin", flightBudget: 375, hotelComfort: "Comfortable" as const };
describe("all-in journey budgets", () => {
  it("reserves flights once and makes hotel comfort trade off against sightseeing", () => {
    const simple = journeyBudget(brief, { ...journey, hotelComfort: "Simple" });
    const premium = journeyBudget(brief, { ...journey, hotelComfort: "Premium" });
    expect(simple.accommodation).toBe(337.5);
    expect(premium.accommodation).toBe(675);
    expect(simple.remaining).toBe(787.5);
    expect(premium.remaining).toBe(450);
    expect(premium.parts.reduce((sum, part) => sum + part.amount, 0)).toBe(1500);
    expect(premium.nights).toBe(4);
  });
  it("respects a real entered whole-stay quote and reports flights-plus-hotel shortfall", () => {
    const quote = {
      name: "Selected hotel",
      type: "Hotel" as const,
      amount: 1200,
      extras: 20,
      rooms: 1,
      unit: "stay" as const,
      scope: stayScope(brief),
    };
    const costs = journeyBudget(brief, journey, quote);
    expect(costs.accommodation).toBe(1220);
    expect(costs.shortfall).toBe(95);
    expect(costs.daily.every((day) => day.amount === 0)).toBe(true);
  });
  it("keeps legacy stays unchanged and uses exact cents after flights", () => {
    expect(stayBudget(brief).allowance).toBe(600);
    const costs = journeyBudget(
      { ...brief, budget: 1500.07 },
      { ...journey, flightBudget: 375.03 },
    );
    expect(Math.round(costs.parts.reduce((sum, part) => sum + part.amount, 0) * 100)).toBe(150007);
    expect(Math.round(costs.daily.reduce((sum, day) => sum + day.amount, 0) * 100)).toBe(
      Math.round(costs.remaining * 100),
    );
    expect(journeyBudget({ ...brief, days: 1 }, journey).accommodation).toBe(0);
  });
  it("creates outward and return travel buffers, a complete itinerary and route-scoped search", () => {
    const ideas = createJourneyIdeas(brief, journey);
    expect(ideas.days).toHaveLength(5);
    expect(ideas.days[0]?.items[0]?.title).toContain("Berlin");
    expect(ideas.days.at(-1)?.items.at(-1)?.title).toBe("Return to Berlin");
    expect(ideas.summary).toContain("1500.00 EUR, including");
    expect(ideas.summary).not.toContain("excluding flights");
    expect(new URL(flightSearch(brief, "Berlin")).searchParams.get("q")).toContain("2026-11-05");
    expect(journeySchema.safeParse({ ...journey, departure: "" }).success).toBe(false);
  });
});
