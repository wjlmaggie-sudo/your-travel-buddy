import { describe, expect, it } from "vitest";
import { curatedPersonaDay, rankPersonaPlaces } from "@/lib/persona-stops";
import { loadCityGuide, dayGuide, itineraryGuide } from "@/lib/city-guides";
import { createJourneyIdeas } from "@/lib/journey-plan";
const brief = {
  destination: "Lisbon, Portugal",
  start: "2026-10-24",
  days: 5,
  travelers: 4,
  budget: 1500,
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
describe("actual persona-specific venue selection", () => {
  it("chooses playgrounds, marine life and science rather than the same landmarks with new wording", () => {
    expect(
      curatedPersonaDay(brief.destination, 1, {
        persona: "family",
        childrenAgeRanges: ["0-3"],
      })?.[0]?.name,
    ).toBe("Jardim da Estrela");
    expect(
      curatedPersonaDay(brief.destination, 1, {
        persona: "family",
        childrenAgeRanges: ["4-6"],
      })?.[0]?.name,
    ).toBe("Oceanário de Lisboa");
    expect(
      curatedPersonaDay(brief.destination, 1, {
        persona: "family",
        childrenAgeRanges: ["7-10"],
      })?.[0]?.name,
    ).toBe("Pavilhão do Conhecimento");
    const family = createJourneyIdeas(
      { ...brief, persona: "family", childrenAgeRanges: ["4-6"] },
      journey,
    );
    const budget = createJourneyIdeas({ ...brief, persona: "budget-travel" }, journey);
    const business = createJourneyIdeas({ ...brief, persona: "business" }, journey);
    const locations = (plan: typeof family) => [
      ...new Set(
        plan.days.flatMap((d) =>
          d.items.map((i) => i.location).filter((l) => l !== brief.destination),
        ),
      ),
    ];
    expect(locations(family)).toContain("Oceanário de Lisboa");
    expect(locations(family)).toContain("Jardim da Estrela");
    expect(locations(budget)).toContain("Alfama");
    expect(locations(budget)).not.toContain("Oceanário de Lisboa");
    expect(locations(business)).not.toContain("Sintra National Palace");
    expect(locations(business)).not.toContain("Pavilhão do Conhecimento");
    expect(locations(family)).not.toEqual(locations(budget));
    expect(locations(budget)).not.toEqual(locations(business));
  });
  it("keeps the day map tied to the real itinerary locations for every persona", async () => {
    const guide = await loadCityGuide(brief.destination);
    for (const persona of ["family", "business", "budget-travel"] as const) {
      const details = {
        ...brief,
        persona,
        ...(persona === "family" ? { childrenAgeRanges: ["4-6" as const] } : {}),
      };
      const plan = createJourneyIdeas(details, journey);
      for (const day of plan.days) {
        const mapped = itineraryGuide(
          guide,
          brief.destination,
          day.day,
          brief.style,
          details,
          day.items,
        );
        expect(mapped.places.length).toBeGreaterThan(0);
        for (const place of mapped.places)
          expect(day.items.some((i) => i.location === place.name)).toBe(true);
        expect(mapped.places.map((p) => p.name).sort()).toEqual(
          dayGuide(guide, brief.destination, day.day, brief.style, details)
            .places.map((p) => p.name)
            .sort(),
        );
      }
    }
  });
  it("retains a manual venue on the map rather than substituting new persona suggestions", async () => {
    const guide = await loadCityGuide(brief.destination);
    const current = itineraryGuide(
      guide,
      brief.destination,
      1,
      brief.style,
      { persona: "family" },
      [{ title: "My museum", location: "Carmo Convent" }],
    );
    expect(current.places.map((p) => p.name)).toEqual(["Carmo Convent"]);
    expect(
      itineraryGuide(guide, brief.destination, 1, brief.style, { persona: "family" }, [
        { location: "An unknown user venue" },
      ]).places,
    ).toEqual([]);
  });
  it("filters other cities by relevant directory features without inventing a child-friendly venue", () => {
    expect(curatedPersonaDay("Paris, France", 1, { persona: "family" })).toBeNull();
    const candidates = [
      { name: "Example castle", kind: "castle" },
      { name: "Example play area", kind: "playground" },
      { name: "Example science centre", kind: "science" },
    ];
    expect(
      rankPersonaPlaces(candidates, { persona: "family", childrenAgeRanges: ["0-3"] }).map(
        (p) => p.name,
      ),
    ).toEqual(["Example play area"]);
    expect(
      rankPersonaPlaces(candidates, { persona: "family", childrenAgeRanges: ["7-10"] }).map(
        (p) => p.name,
      ),
    ).toEqual(["Example science centre"]);
    expect(
      rankPersonaPlaces(candidates.slice(0, 1), { persona: "family", childrenAgeRanges: ["0-3"] }),
    ).toEqual([]);
  });
  it("avoids the published science-centre Monday closure for winter 2026", () => {
    const stops = curatedPersonaDay(brief.destination, 3, {
      persona: "family",
      childrenAgeRanges: ["0-3"],
      start: "2026-10-24",
    });
    expect(stops?.map((p) => p.name)).not.toContain("Pavilhão do Conhecimento");
  });
});
