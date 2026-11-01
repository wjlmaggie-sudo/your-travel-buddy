import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAccountCopies,
  companionText,
  currentTripDay,
  directionsUrl,
  makeCompanionTrip,
  nextStop,
  readCompanionTrips,
  saveCompanionTrip,
  stopInstant,
  tripDate,
} from "@/lib/travel-companion";
import { appOrigins } from "../../supabase/functions/_shared/app-origins";
import type { PdfTrip } from "@/lib/trip-pdf";

const source = {
  tripId: "a1111111-1111-4111-8111-111111111111",
  ownerId: "b1111111-1111-4111-8111-111111111111",
};
const plan: PdfTrip = {
  brief: {
    destination: "Lisbon, Portugal",
    start: "2026-11-01",
    days: 3,
    travelers: 2,
    currency: "EUR",
    budget: 500,
    style: "Balanced",
  },
  days: [
    {
      day: 1,
      items: [
        {
          title: "Explore Alfama",
          time: "10:00",
          location: "Alfama",
          notes: "Keep a little time for coffee.",
        },
        { title: "Lunch", time: "12:30" },
      ],
    },
    { day: 3, items: [{ title: "Belém", time: "09:00" }] },
  ],
  packing: ["Charger"],
};
beforeEach(() => localStorage.clear());
describe("offline travel companion", () => {
  it("retains a full itinerary across rereads without a network or account", () => {
    const copy = saveCompanionTrip(makeCompanionTrip(plan));
    expect(readCompanionTrips()[0]).toEqual(copy);
    expect(copy.stops).toHaveLength(3);
    expect(tripDate(copy, 3)).toBe("2026-11-03");
  });
  it("moves to the next planned stop while preserving done/skipped state", () => {
    const copy = makeCompanionTrip(plan);
    copy.stops[0]!.status = "done";
    expect(nextStop(copy, 1)?.title).toBe("Lunch");
    copy.stops[1]!.status = "skipped";
    expect(nextStop(copy, 1)).toBeUndefined();
    saveCompanionTrip(copy);
    expect(readCompanionTrips()[0]?.stops[1]?.status).toBe("skipped");
  });
  it("keeps progress, local expenses, custom packing and notes when downloading again", () => {
    const copy = makeCompanionTrip(plan, source);
    copy.stops[0]!.status = "done";
    copy.note = "Hotel door code reminder";
    copy.packing.push({ name: "Raincoat", packed: true });
    copy.localExpenses.push({
      id: "coffee",
      amount: 3.5,
      category: "food",
      date: "2026-11-01",
      note: "Coffee",
    });
    copy.essentials.push({ id: "reservation", title: "Hotel reference", details: "PRIVATE-123" });
    saveCompanionTrip(copy);
    const refreshed = makeCompanionTrip(plan, source);
    expect(refreshed.stops[0]?.status).toBe("done");
    expect(refreshed.localExpenses[0]?.amount).toBe(3.5);
    expect(refreshed.note).toBe(copy.note);
    expect(refreshed.packing.find((item) => item.name === "Raincoat")?.packed).toBe(true);
    expect(refreshed.essentials[0]?.details).toBe("PRIVATE-123");
  });
  it("does not leak booking references, expenses or personal notes in a shared itinerary", () => {
    const copy = makeCompanionTrip(plan);
    copy.note = "private note";
    copy.essentials.push({ id: "booking", title: "reference", details: "SECRET123" });
    const text = companionText(copy);
    expect(text).toContain("Explore Alfama");
    expect(text).not.toContain("SECRET123");
    expect(text).not.toContain("private note");
  });
  it("clears account copies on logout and keeps guest plans", () => {
    saveCompanionTrip(makeCompanionTrip(plan));
    saveCompanionTrip(makeCompanionTrip(plan, source));
    clearAccountCopies();
    expect(readCompanionTrips()).toHaveLength(1);
    expect(readCompanionTrips()[0]?.ownerId).toBeUndefined();
  });
  it("clears other users' copies when an account changes", () => {
    saveCompanionTrip(makeCompanionTrip(plan, source));
    clearAccountCopies("c1111111-1111-4111-8111-111111111111");
    expect(readCompanionTrips()).toEqual([]);
  });
  it("uses the trip timezone and clamps days before and after the trip", () => {
    const copy = { ...makeCompanionTrip(plan), timezone: "Asia/Tokyo" };
    expect(currentTripDay(copy, new Date("2026-11-01T16:30:00Z"))).toBe(2);
    expect(currentTripDay(copy, new Date("2026-10-01T16:30:00Z"))).toBe(1);
    expect(currentTripDay(copy, new Date("2026-12-01T16:30:00Z"))).toBe(3);
  });
  it("resolves reminder wall times across timezones and rejects nonexistent DST times", () => {
    expect(stopInstant("2026-11-01", "10:00", "Asia/Tokyo")?.toISOString()).toBe(
      "2026-11-01T01:00:00.000Z",
    );
    expect(stopInstant("2026-03-29", "02:30", "Europe/Berlin")).toBeNull();
    expect(stopInstant("2026-11-01", "Flexible", "Europe/Berlin")).toBeNull();
  });
  it("rejects corrupted storage and fails visibly when saving cannot persist", () => {
    localStorage.setItem("travel-buddy-offline-trips-v1", "broken");
    expect(readCompanionTrips()).toEqual([]);
    localStorage.setItem("travel-buddy-offline-trips-v1", '[{"version":99}]');
    expect(readCompanionTrips()).toEqual([]);
    expect(() => saveCompanionTrip({ ...makeCompanionTrip(plan), budget: -1 })).toThrow();
  });
  it("encodes Apple Maps destinations and sets the selected transport mode", () => {
    const url = new URL(
      directionsUrl({ title: "Lunch", location: "Café & Bakery" }, "Lisbon", "transit"),
    );
    expect(url.searchParams.get("daddr")).toBe("Café & Bakery, Lisbon");
    expect(url.searchParams.get("dirflg")).toBe("r");
  });
  it("allows only exact configured and native origins without a wildcard", () => {
    expect(appOrigins("https://example.com")).toEqual([
      "https://example.com",
      "capacitor://localhost",
    ]);
    expect(appOrigins(undefined)).toContain("https://wjlmaggie-sudo.github.io");
    expect(appOrigins(undefined)).not.toContain("*");
  });
});
