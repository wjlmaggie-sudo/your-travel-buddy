import { expect, it, vi } from "vitest";
import { personaReferences, loadCityGuide, itineraryGuide } from "@/lib/city-guides";
import { createJourneyIdeas } from "@/lib/journey-plan";
vi.mock("@/lib/place-directory", () => ({
  searchDestinations: vi.fn(async () => [
    { name: "Example City", lat: 48, lon: 2, source: "https://example.test/city" },
  ]),
  nearbyPlaces: vi.fn(async () => [
    {
      name: "Example Castle",
      kind: "castle",
      category: "Attractions",
      lat: 48,
      lon: 2,
      source: "https://example.test/castle",
    },
    {
      name: "Example Playground",
      kind: "playground",
      category: "Attractions",
      lat: 48.001,
      lon: 2.001,
      source: "https://example.test/play",
    },
    {
      name: "Example Science Centre",
      kind: "science",
      category: "Attractions",
      lat: 48.002,
      lon: 2.002,
      source: "https://example.test/science",
    },
    {
      name: "Example Public Square",
      kind: "square",
      category: "Attractions",
      lat: 48.003,
      lon: 2.003,
      source: "https://example.test/square",
    },
  ]),
}));
it("uses matching sourced directory candidates outside the curated city in both generation and maps", async () => {
  const brief = {
    destination: "Example City",
    start: "2026-11-01",
    days: 2,
    travelers: 3,
    budget: 1000,
    currency: "EUR",
    style: "Balanced" as const,
    interest: "Food & culture",
    persona: "family" as const,
    childrenAgeRanges: ["0-3" as const],
  };
  const refs = await personaReferences(brief.destination, 2, brief.style, brief);
  expect(refs.map((p) => p.name)).toEqual(["Example Playground", "Example Playground"]);
  const plan = createJourneyIdeas(
    brief,
    { departure: "", flightBudget: 0, hotelComfort: "Comfortable", flightsRequired: false },
    undefined,
    refs,
  );
  expect(plan.days[0]?.items.some((i) => i.location === "Example Playground")).toBe(true);
  expect(JSON.stringify(plan)).not.toContain("Example Castle");
  const mapped = itineraryGuide(
    await loadCityGuide(brief.destination),
    brief.destination,
    1,
    brief.style,
    brief,
    plan.days[0]!.items,
  );
  expect(mapped.places.map((p) => p.name)).toEqual(["Example Playground"]);
  const business = await personaReferences(brief.destination, 2, brief.style, {
    persona: "business",
  });
  expect(business.map((p) => p.name)).toEqual(["Example Public Square", "Example Public Square"]);
});
