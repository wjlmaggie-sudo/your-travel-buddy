import { describe, expect, it } from "vitest";
import { flightConnections } from "@/lib/flight-journey";
const airport = (id: string, time = "2027-01-10 10:00") => ({ id, time, name: `${id} Airport` });
const leg = (from: string, to: string, duration: number) => ({
  departure_airport: airport(from),
  arrival_airport: airport(to),
  duration,
  airline: "Example",
  flight_number: "EX1",
});
const offer = {
  flights: [leg("BER", "AMS", 90), leg("AMS", "LIS", 180)],
  total_duration: 375,
  price: 220,
  type: "Round trip" as const,
};
describe("connection details", () => {
  it("uses provider layover minutes and preserves overnight warnings", () => {
    expect(
      flightConnections({
        ...offer,
        layovers: [{ id: "AMS", name: "Amsterdam", duration: 105, overnight: true }],
      })[0],
    ).toMatchObject({ duration: 105, overnight: true, airportChange: false });
  });
  it("recovers a single connection from total journey and leg durations for older responses", () => {
    expect(flightConnections(offer)[0]?.duration).toBe(105);
  });
  it("shows every stop but does not invent individual waits for missing multi-stop data", () => {
    const multi = {
      ...offer,
      flights: [leg("BER", "AMS", 90), leg("AMS", "MAD", 150), leg("MAD", "LIS", 60)],
      total_duration: 500,
    };
    expect(flightConnections(multi).map((c) => c.duration)).toEqual([null, null]);
    expect(
      flightConnections({
        ...multi,
        layovers: [
          { id: "AMS", name: "Amsterdam", duration: 80 },
          { id: "MAD", name: "Madrid", duration: 120 },
        ],
      }).map((c) => c.duration),
    ).toEqual([80, 120]);
  });
  it("flags airport changes without claiming the transfer wait is a known layover", () => {
    const change = { ...offer, flights: [leg("BER", "LHR", 90), leg("LGW", "LIS", 180)] };
    expect(flightConnections(change)[0]).toMatchObject({ airportChange: true, duration: null });
  });
});
