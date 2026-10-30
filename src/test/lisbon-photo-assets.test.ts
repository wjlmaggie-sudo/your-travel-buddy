import { expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { localPlacePhoto } from "@/lib/local-place-photos";
import { PERSONA_LISBON_PLACES } from "@/lib/persona-stops";
import { curatedDay } from "@/lib/city-guides";
it("ships real local JPEGs and attribution for every additional Lisbon persona stop and Vila Sassetti", () => {
  const places = [
    ...PERSONA_LISBON_PLACES,
    ...curatedDay("Lisbon", 4)!.filter((place) => place.name === "Vila Sassetti gardens"),
  ];
  expect(places).toHaveLength(7);
  for (const place of places) {
    const photo = localPlacePhoto(place)!;
    expect(photo).toBeDefined();
    expect(photo.credit).toBeTruthy();
    expect(photo.license).toBe("CC BY-SA 4.0");
    expect(photo.source).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
    const file = resolve("public", photo.url.slice(import.meta.env.BASE_URL.length));
    expect(existsSync(file)).toBe(true);
    expect([...readFileSync(file).subarray(0, 3)]).toEqual([255, 216, 255]);
  }
});
it("never gives another city's same-named place a Lisbon photo", () => {
  expect(localPlacePhoto({ name: "Praça do Comércio", lat: 40.2, lon: -8.4 })).toBeUndefined();
});
