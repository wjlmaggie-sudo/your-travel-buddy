import { describe, it, expect } from "vitest";
import { admissionFor, distanceKm, routeLegs } from "@/lib/visit-logistics";
import { curatedDay } from "@/lib/city-guides";
describe("visit logistics", () => {
  it("calculates real coordinate distances without calling them routed distances", () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.195, 2);
    expect(distanceKm({ lat: 38.7, lon: -9.1 }, { lat: 38.7, lon: -9.1 })).toBe(0);
    expect(routeLegs(curatedDay("Lisbon", 1)!)).toHaveLength(2);
  });
  it("distinguishes free, paid and unverified admission with official links", () => {
    expect(admissionFor("São Jorge Castle")?.price).toBe(17);
    expect(admissionFor("Alfama")?.price).toBe(0);
    expect(admissionFor("Belém Tower")?.price).toBeUndefined();
    expect(admissionFor("Unknown Place")).toBeUndefined();
    expect(admissionFor("Carmo Convent")?.closedDay).toBe(0);
  });
});
