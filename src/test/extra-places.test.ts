import { expect, it } from "vitest";
import { extraPlaces, extraActivity } from "@/lib/extra-places";
import { itineraryGuide, loadCityGuide } from "@/lib/city-guides";
it("offers sourced places outside the persona's current plan and maps a chosen addition", async () => {
  const guide = await loadCityGuide("Lisbon, Portugal");
  const current = [
    { day: 1, title: "After work: Praça do Comércio", location: "Praça do Comércio" },
  ];
  const options = extraPlaces(guide, "Lisbon, Portugal", current);
  expect(options.some((p) => p.name === "Praça do Comércio")).toBe(false);
  const aquarium = options.find((p) => p.name === "Oceanário de Lisboa")!;
  expect(aquarium).toBeDefined();
  const added = extraActivity(aquarium);
  expect(added.notes).toContain(aquarium.source);
  expect(added.notes).toContain("no ticket cost has been added automatically");
  for (const details of [{}, { persona: "business" as const }]) {
    const mapped = itineraryGuide(guide, "Lisbon, Portugal", 1, "Balanced", details, [
      ...current,
      added,
    ]);
    expect(mapped.places.map((p) => p.name)).toContain(aquarium.name);
  }
  expect(
    extraPlaces(guide, "Lisbon, Portugal", [...current, { ...added, day: 2 }]).some(
      (p) => p.name === aquarium.name,
    ),
  ).toBe(false);
});
