import { describe, expect, it } from "vitest";
import {
  matchFlightAirport,
  nearbyFlightAirport,
  resolveFlightAirport,
  type FlightAirport,
} from "@/lib/flight-airports";
const directory: FlightAirport[] = [
  {
    code: "BER",
    name: "Berlin Brandenburg Airport",
    city: "Berlin",
    country: "DE",
    latitude: 52.36,
    longitude: 13.5,
    large: true,
  },
  {
    code: "LIS",
    name: "Humberto Delgado Airport",
    city: "Lisbon",
    country: "PT",
    latitude: 38.77,
    longitude: -9.13,
    large: true,
  },
];
describe("flight airport defaults", () => {
  it("resolves city names, countries and editable explicit airport codes", () => {
    expect(matchFlightAirport("Berlin", directory)?.code).toBe("BER");
    expect(matchFlightAirport("Lisbon, Portugal", directory)?.code).toBe("LIS");
    expect(matchFlightAirport("ber", directory)?.code).toBe("BER");
    expect(matchFlightAirport("Berlin (BER)", directory)?.code).toBe("BER");
    expect(matchFlightAirport("Lisbon, Germany", directory)).toBeUndefined();
  });
  it("resolves common trip cities from the actual scheduled-airport directory", async () => {
    expect((await resolveFlightAirport("Berlin", new AbortController().signal)).code).toBe("BER");
    expect((await resolveFlightAirport("Lisbon", new AbortController().signal)).code).toBe("LIS");
  });
  it("does not assign a distant airport to an unresolved location", () => {
    expect(nearbyFlightAirport(0, 0, directory)).toBeUndefined();
    expect(nearbyFlightAirport(52.5, 13.4, directory, "DE")?.code).toBe("BER");
    expect(nearbyFlightAirport(52.5, 13.4, directory, "PT")).toBeUndefined();
  });
});
