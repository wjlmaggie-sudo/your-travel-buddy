import { describe, it, expect } from "vitest";
import {
  stayBudget,
  stayCost,
  stayScope,
  bookingSearch,
  type StayBrief,
  type StayChoice,
} from "@/lib/stay-planning";
const brief: StayBrief = {
  destination: "Lisbon",
  start: "2026-10-17",
  days: 5,
  travelers: 3,
  budget: 1500,
  currency: "EUR",
  style: "Balanced",
};
const quote = (unit: StayChoice["unit"], amount = 100): StayChoice => ({
  name: "Chosen property",
  type: "Hotel",
  unit,
  amount,
  rooms: 2,
  extras: 20,
  scope: stayScope(brief),
});
describe("accommodation comparisons", () => {
  it("uses four nights for a five-day trip and handles rooms, beds and whole stays separately", () => {
    expect(stayCost(quote("room-night"), brief)).toBe(820);
    expect(stayCost(quote("person-night", 25), brief)).toBe(320);
    expect(stayCost(quote("stay", 400), brief)).toBe(420);
  });
  it("replaces the accommodation allowance without double counting", () => {
    const result = stayBudget(brief, quote("stay", 400));
    expect(result.remaining).toBe(1080);
    expect(result.daily.reduce((sum, day) => sum + day.amount, 0)).toBe(1080);
    expect(result.allowance).toBe(600);
  });
  it("reports an impossible budget and rejects quotes for different dates or currency", () => {
    expect(stayBudget(brief, quote("stay", 1800)).shortfall).toBe(320);
    expect(stayCost(quote("stay"), { ...brief, currency: "USD" })).toBeNull();
    expect(stayCost(quote("stay"), { ...brief, start: "2026-10-18" })).toBeNull();
    expect(stayCost(quote("stay"), { ...brief, travelers: 4 })).toBeNull();
  });
  it("does not allocate accommodation to a day trip and creates scoped booking searches", () => {
    expect(stayBudget({ ...brief, days: 1 }).accommodation).toBe(0);
    const url = new URL(bookingSearch(brief, 2));
    expect(url.searchParams.get("checkout")).toBe("2026-10-21");
    expect(url.searchParams.get("group_adults")).toBe("3");
    expect(url.searchParams.get("no_rooms")).toBe("2");
  });
});
it("invalidates an old quote after requested rooms change and preserves old default scopes", () => {
  expect(stayScope({ ...brief, hotelRooms: 2 })).toBe(stayScope(brief));
  expect(stayCost(quote("stay", 400), { ...brief, hotelRooms: 3 })).toBeNull();
});
