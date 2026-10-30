import { describe, expect, it } from "vitest";
import {
  curatedDay,
  curatedRestaurants,
  loadCityGuide,
  dayGuide,
  groupNearbyStops,
} from "@/lib/city-guides";
describe("visual day guides", () => {
  it("groups the Lisbon, Belém, and Sintra stops separately, with real coordinates and credited photos", () => {
    for (let day = 1; day <= 5; day++) {
      const stops = curatedDay("Lisbon, Portugal", day)!;
      expect(stops.length).toBeGreaterThanOrEqual(2);
      for (const stop of stops) {
        expect(stop.lat).toBeGreaterThan(38);
        expect(stop.lat).toBeLessThan(40);
        expect(stop.lon).toBeGreaterThan(-10);
        expect(stop.lon).toBeLessThan(-8);
        if (stop.image) expect(stop.image.source).toMatch(/^https:\/\/commons.wikimedia.org\//);
        if (stop.image) expect(stop.image.license).toMatch(/CC|Public domain|PD/);
      }
    }
    expect(curatedDay("Lisbon, Portugal", 3)?.map((item) => item.name)).toContain("Belém Tower");
    expect(curatedDay("Lisbon, Portugal", 4)?.map((item) => item.name)).toContain(
      "Sintra National Palace",
    );
    expect(
      curatedRestaurants("Lisbon, Portugal", 4, "Budget").every((item) =>
        item.address.includes("Sintra"),
      ),
    ).toBe(true);
  });
  it("changes restaurant ordering by budget and never uses the Lisbon guide for another city", async () => {
    const guide = await loadCityGuide("Lisbon, Portugal");
    expect(dayGuide(guide, "Lisbon, Portugal", 1, "Budget").restaurants[0]?.name).toBe(
      "Time Out Market Lisboa",
    );
    expect(dayGuide(guide, "Lisbon, Portugal", 1, "Luxury").restaurants[0]?.name).toBe(
      "Cantinho do Avillez",
    );
    expect(curatedDay("Kyoto, Japan", 1)).toBeNull();
  });
  it("groups nearby stops together even when directory order mixes neighborhoods", () => {
    const stop = (name: string, lat: number, lon: number) => ({
      name,
      lat,
      lon,
      description: "",
      source: "https://www.openstreetmap.org",
    });
    const groups = groupNearbyStops([
      stop("West 1", 40, 1),
      stop("East 1", 40, 2),
      stop("West 2", 40.001, 1),
      stop("East 2", 40.001, 2),
      stop("West 3", 40.002, 1),
      stop("East 3", 40.002, 2),
    ]);
    expect(groups[0]?.map((item) => item.name)).toEqual(["West 1", "West 2", "West 3"]);
    expect(groups[1]?.map((item) => item.name)).toEqual(["East 1", "East 2", "East 3"]);
    expect(groups.flat()).toHaveLength(6);
  });
});

it("keeps restaurants for mapped itinerary stops and never substitutes a default map for unknown edits", async () => {
  const { itineraryGuide } = await import("@/lib/city-guides");
  const guide = await loadCityGuide("Lisbon");
  const matched = itineraryGuide(guide, "Lisbon", 1, "Balanced", {}, [{ location: "Alfama" }]);
  expect(matched.places.map((place) => place.name)).toEqual(["Alfama"]);
  expect(matched.restaurants.length).toBeGreaterThan(0);
  const manual = itineraryGuide(guide, "Lisbon", 1, "Balanced", {}, [
    { location: "My unlisted place" },
  ]);
  expect(manual.places).toEqual([]);
  expect(manual.restaurants).toEqual([]);
});
