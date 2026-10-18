import { describe, expect, it } from "vitest";
import { connectedBudget, demoFlights, demoHotels, flightCost } from "@/lib/travel-workspace";
import { journeySchema } from "@/lib/journey-planning";
const brief = {
  destination: "Lisbon",
  start: "2026-11-01",
  days: 5,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
const journey = { departure: "Berlin", flightBudget: 375, hotelComfort: "Comfortable" as const };
describe("one connected budget", () => {
  it("keeps operating estimates stable and exposes overspend from flight and hotel upgrades", () => {
    const original = connectedBudget(brief, journey);
    const flight = demoFlights(brief, journey)[2]!;
    const hotel = demoHotels(brief, journey)[2]!;
    const upgraded = connectedBudget(brief, { ...journey, selectedFlight: flight }, hotel);
    expect(upgraded.estimates).toEqual(original.estimates);
    expect(upgraded.flight).toBe(465);
    expect(upgraded.hotel).toBe(648);
    expect(upgraded.remaining).toBe(-231.75);
    expect(upgraded.planned).toBe(1731.75);
    expect(
      connectedBudget(brief, { ...journey, selectedFlight: demoFlights(brief, journey)[0]! })
        .remaining,
    ).toBe(67.5);
  });
  it("rejects stale quotes after dates, group, departure or currency change", () => {
    const selected = { ...journey, selectedFlight: demoFlights(brief, journey)[0]! };
    expect(flightCost(brief, selected)).toBe(307.5);
    expect(flightCost({ ...brief, start: "2026-12-01" }, selected)).toBe(375);
    expect(flightCost({ ...brief, travelers: 3 }, selected)).toBe(375);
    expect(flightCost({ ...brief, currency: "USD" }, selected)).toBe(375);
    expect(flightCost(brief, { ...selected, departure: "Paris" })).toBe(375);
  });
  it("uses edited estimates, exact cents, no-flight and same-day budgets without inventing prices", () => {
    const noFlights = { ...journey, departure: "", flightsRequired: false };
    expect(journeySchema.safeParse(noFlights).success).toBe(true);
    const costs = connectedBudget({ ...brief, days: 1 }, noFlights);
    expect(costs.flight).toBe(0);
    expect(costs.hotel).toBe(0);
    expect(costs.remaining).toBe(0);
    const custom = connectedBudget(brief, {
      ...journey,
      estimates: { activities: 100, food: 200, transport: 50, shopping: 25 },
    });
    expect(custom.planned).toBe(1256.25);
    expect(custom.remaining).toBe(243.75);
    expect(demoFlights(brief, journey).every((option) => option.evidence === "demo")).toBe(true);
    expect(demoHotels(brief, journey).every((option) => option.evidence === "demo")).toBe(true);
  });
});
