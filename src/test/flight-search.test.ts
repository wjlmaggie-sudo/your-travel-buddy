import { describe, expect, it, vi } from "vitest";
import {
  createFlightHandler,
  normalizeFlights,
  flightInput,
} from "../../supabase/functions/_shared/flight-search";
const query = {
  origin: "BER",
  destination: "NRT",
  outbound: "2027-01-10",
  returning: "2027-01-20",
  adults: 1,
  children: 0,
  infants: 0,
  currency: "EUR",
};
const raw = {
  best_flights: [
    {
      flights: [
        {
          departure_airport: { id: "BER", name: "Berlin", time: "2027-01-10 10:00" },
          arrival_airport: { id: "NRT", name: "Narita", time: "2027-01-11 08:00" },
          airline: "Example",
          flight_number: "EX1",
          duration: 840,
        },
      ],
      total_duration: 840,
      price: 900,
      type: "Round trip",
    },
  ],
};
const request = (origin = "https://example.com", body: unknown = query) =>
  new Request("https://backend.example/search-flights", {
    method: "POST",
    headers: { Origin: origin },
    body: JSON.stringify(body),
  });
describe("real flight adapter", () => {
  it("rejects invalid dates and passenger mixes", () => {
    expect(flightInput.safeParse({ ...query, outbound: "2027-02-30" }).success).toBe(false);
    expect(flightInput.safeParse({ ...query, infants: 2 }).success).toBe(false);
    expect(flightInput.safeParse({ ...query, returning: query.outbound }).success).toBe(false);
  });
  it("keeps provider prices and local dates, drops incomplete or mismatched offers", () => {
    const result = normalizeFlights(
      {
        ...raw,
        other_flights: [
          { price: 100 },
          {
            ...raw.best_flights[0],
            flights: [
              {
                ...raw.best_flights[0]!.flights[0],
                departure_airport: { id: "LHR", name: "London", time: "2027-01-10 10:00" },
              },
            ],
          },
        ],
      },
      query,
    );
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]?.price).toBe(900);
    expect(result.offers[0]?.flights[0]?.arrival_airport.time).toBe("2027-01-11 08:00");
  });
  it("preserves provider layovers for the flight cards", () => {
    const result = normalizeFlights(
      {
        best_flights: [
          {
            ...raw.best_flights[0],
            layovers: [{ id: "AMS", name: "Amsterdam Schiphol", duration: 95, overnight: true }],
          },
        ],
      },
      query,
    );
    expect(result.offers[0]?.layovers).toEqual([
      { id: "AMS", name: "Amsterdam Schiphol", duration: 95, overnight: true },
    ]);
  });
  it("blocks unallowed origins, missing credentials and exhausted quota before upstream requests", async () => {
    const fetcher = vi.fn();
    const claim = vi.fn(async () => false);
    const handler = createFlightHandler({
      apiKey: "private-test",
      allowedOrigins: ["https://example.com"],
      claim,
      fetcher,
    });
    expect((await handler(request("https://bad.example"))).status).toBe(403);
    expect((await handler(request())).status).toBe(429);
    expect(fetcher).not.toHaveBeenCalled();
    const disabled = createFlightHandler({
      apiKey: undefined,
      allowedOrigins: ["https://example.com"],
      claim,
      fetcher,
    });
    expect((await disabled(request())).status).toBe(503);
  });
  it("shares concurrent requests and caches exact criteria without exposing the private key", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(raw)));
    const claim = vi.fn(async () => true);
    const handler = createFlightHandler({
      apiKey: "private-test",
      allowedOrigins: ["https://example.com"],
      claim,
      fetcher,
    });
    const responses = await Promise.all([handler(request()), handler(request())]);
    expect(responses.every((v) => v.status === 200)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledTimes(1);
    expect(await responses[0]!.text()).not.toContain("private-test");
    expect((await handler(request())).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("fails closed when quota database fails and sanitizes upstream errors", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "private-test" })));
    const fail = createFlightHandler({
      apiKey: "private-test",
      allowedOrigins: ["https://example.com"],
      claim: async () => {
        throw new Error("DB");
      },
      fetcher,
    });
    expect((await fail(request())).status).toBe(502);
    expect(fetcher).not.toHaveBeenCalled();
    const upstream = createFlightHandler({
      apiKey: "private-test",
      allowedOrigins: ["https://example.com"],
      claim: async () => true,
      fetcher,
    });
    const response = await upstream(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private-test");
  });
});
