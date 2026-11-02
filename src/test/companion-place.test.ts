import { expect, it } from "vitest";
import { companionActivityPlace } from "@/lib/companion-place";
it("matches saved Lisbon stop locations and legacy titles without network access", () => {
  expect(
    companionActivityPlace("Lisbon, Portugal", { title: "Visit: Alfama", location: "Alfama" })
      ?.name,
  ).toBe("Alfama");
  expect(companionActivityPlace("Lisboa", { title: "Explore Belém Tower" })?.name).toBe(
    "Belém Tower",
  );
});
it("does not attach an old photo after the location changes, or invent photos for generic stops", () => {
  expect(
    companionActivityPlace("Lisbon", { title: "Alfama", location: "My new stop" }),
  ).toBeUndefined();
  expect(
    companionActivityPlace("Lisbon", { title: "Breakfast and plan the day", location: "Lisbon" }),
  ).toBeUndefined();
  expect(companionActivityPlace("Paris", { title: "Alfama" })).toBeUndefined();
});
it("uses the destination's real guide for other cities", () => {
  const place = {
    name: "Museum",
    lat: 48,
    lon: 2,
    description: "",
    source: "https://example.com/museum",
  };
  expect(companionActivityPlace("Paris", { title: "Visit", location: "Museum" }, [place])).toBe(
    place,
  );
});
