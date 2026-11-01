import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { finalTripBudget, exactPersonSplit, finalBudgetSchema } from "@/lib/final-trip-budget";
import { carScope, flightScope } from "@/lib/travel-workspace";
import { stayScope, type StayBrief, type StayChoice } from "@/lib/stay-planning";
import type { Journey } from "@/lib/journey-planning";
import { FinalTripBudget } from "@/components/FinalTripBudget";
import { makeCompanionTrip, readCompanionTrips, saveCompanionTrip } from "@/lib/travel-companion";

const brief: StayBrief = {
  destination: "Lisbon, Portugal",
  start: "2030-06-10",
  days: 4,
  travelers: 3,
  hotelRooms: 2,
  budget: 2000,
  currency: "EUR",
  style: "Balanced",
};
const journey: Journey = {
  departure: "Berlin",
  flightsRequired: true,
  flightBudget: 500,
  hotelRooms: 2,
  hotelComfort: "Comfortable",
  selectedFlight: {
    id: "flight",
    label: "Chosen return flights",
    amount: 400,
    evidence: "live-search",
    scope: flightScope(brief, "Berlin"),
  },
  selectedCar: {
    id: "rental",
    name: "Selected compact",
    supplier: "Provider",
    amount: 120,
    currency: "EUR",
    seats: 4,
    transmission: "Automatic",
    mileage: "Check provider",
    fuelPolicy: "Check provider",
    cancellation: null,
    deposit: null,
    scope: carScope(brief),
    checkedAt: "2026-11-01T08:00:00.000Z",
    pickup: "Lisbon",
    pickupDate: "2030-06-10",
    dropoffDate: "2030-06-13",
    pickupTime: "10:00",
    dropoffTime: "10:00",
  },
  estimates: { activities: 80.01, food: 120.02, transport: 40.03, shopping: 50.04 },
};
const stay: StayChoice = {
  name: "Chosen hotel",
  type: "Hotel",
  evidence: "entered",
  amount: 100,
  unit: "room-night",
  rooms: 2,
  extras: 10,
  scope: stayScope(brief),
};
afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("final trip budget shared by website and iPhone", () => {
  it("includes group flights, all rooms/nights, rental and operating costs exactly once", () => {
    const review = finalTripBudget(brief, journey, stay);
    expect(review.rows.find((row) => row.id === "flights")?.amount).toBe(400);
    expect(review.rows.find((row) => row.id === "hotel")?.amount).toBe(610);
    expect(review.selectedTotal).toBe(1130);
    expect(review.estimatedTotal).toBe(290.1);
    expect(review.total).toBe(1420.1);
    expect(review.remaining).toBe(579.9);
    expect(review.missing).toEqual([]);
    const split = exactPersonSplit(review);
    expect(split).toEqual({ base: 473.36, extraPeople: 2 });
    expect(Math.round(split.base * 100) * 3 + split.extraPeople).toBe(
      Math.round(review.total * 100),
    );
  });
  it("uses a whole-stay price once and handles person-night prices separately", () => {
    expect(
      finalTripBudget(brief, journey, { ...stay, unit: "stay", amount: 300 }).rows.find(
        (r) => r.id === "hotel",
      )?.amount,
    ).toBe(310);
    expect(
      finalTripBudget(brief, journey, { ...stay, unit: "person-night", amount: 20 }).rows.find(
        (r) => r.id === "hotel",
      )?.amount,
    ).toBe(190);
  });
  it("replaces allowances with selected quotes rather than charging both", () => {
    const before = finalTripBudget(
      brief,
      { ...journey, selectedFlight: undefined, selectedCar: undefined },
      null,
    );
    const after = finalTripBudget(
      brief,
      { ...journey, selectedCar: undefined },
      { ...stay, unit: "stay", amount: 300, extras: 0 },
    );
    expect(after.total).toBe(400 + 300 + 290.1);
    expect(after.estimatedTotal).toBe(290.1);
    expect(before.missing).toHaveLength(2);
    expect(after.missing).toEqual([]);
  });
  it("ignores quotes that no longer match destination, dates, group or currency", () => {
    const changed = { ...brief, destination: "Rome, Italy", currency: "USD" };
    const result = finalTripBudget(changed, journey, stay);
    expect(result.selectedTotal).toBe(0);
    expect(result.missing).toHaveLength(3);
    expect(result.rows.find((row) => row.id === "car")?.amount).toBe(0);
    expect(result.rows.find((row) => row.id === "hotel")?.kind).toBe("estimate");
  });
  it("does not require flights or accommodation for a one-day trip without flights", () => {
    const result = finalTripBudget(
      { ...brief, days: 1 },
      { ...journey, flightsRequired: false, selectedCar: undefined },
      null,
    );
    expect(result.rows.find((row) => row.id === "flights")?.amount).toBe(0);
    expect(result.rows.find((row) => row.id === "hotel")?.amount).toBe(0);
    expect(result.missing).toEqual([]);
  });
  it("keeps over-budget selections visible and never reduces remaining estimates", () => {
    const result = finalTripBudget({ ...brief, budget: 1000 }, journey, stay);
    expect(result.total).toBe(1420.1);
    expect(result.remaining).toBe(-420.1);
    expect(result.estimatedTotal).toBe(290.1);
  });
  it("identifies demo prices as estimates, never completed real selections", () => {
    const result = finalTripBudget(
      brief,
      {
        ...journey,
        selectedFlight: { ...journey.selectedFlight!, evidence: "demo" },
        selectedCar: undefined,
      },
      { ...stay, evidence: "demo" },
    );
    expect(result.selectedTotal).toBe(0);
    expect(result.missing).toHaveLength(2);
  });
  it("persists the same reconciled total with the offline plan and rejects tampered totals", () => {
    const copy = makeCompanionTrip({
      brief,
      journey,
      stay,
      days: [{ day: 1, items: [{ title: "Explore" }] }],
    });
    saveCompanionTrip(copy);
    expect(readCompanionTrips()[0]?.finalBudget?.total).toBe(1420.1);
    expect(finalBudgetSchema.safeParse({ ...copy.finalBudget, total: 1 }).success).toBe(false);
  });
  it("updates the visible final total after replacement estimates are applied", () => {
    function Editable() {
      const [value, setValue] = useState(journey);
      return <FinalTripBudget brief={brief} journey={value} stay={stay} onChange={setValue} />;
    }
    render(<Editable />);
    const total = screen.getByLabelText("Final budget total");
    expect(total).toHaveTextContent("1,420.10");
    fireEvent.click(screen.getByText("Adjust activities, meals, transport & shopping"));
    fireEvent.change(screen.getByLabelText("Food & drinks (EUR)"), { target: { value: "220.02" } });
    expect(total).toHaveTextContent("1,420.10");
    fireEvent.click(screen.getByRole("button", { name: "Apply costs to final budget" }));
    expect(total).toHaveTextContent("1,520.10");
    expect(
      within(screen.getByRole("region", { name: "Final trip budget" })).getByText(
        /remaining estimates before booking/,
      ),
    ).toBeVisible();
  });
});
