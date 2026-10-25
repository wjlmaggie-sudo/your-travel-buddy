import { it, expect } from "vitest";
import { flightSuggestions, hotelSuggestions, type FlightOffer } from "@/lib/travel-suggestions";
import { balancedAttractionSuggestions } from "@/lib/attraction-suggestions";
it("uses price and duration for cheapest and fastest and offers a distinct balanced alternative", () => {
  const make = (id: string, price: number, total_duration: number): FlightOffer => ({
    price,
    total_duration,
    type: "Round trip",
    flights: [
      {
        airline: id,
        flight_number: id,
        duration: total_duration,
        departure_airport: { id: "BER", name: "Berlin", time: "2030-01-01 10:00" },
        arrival_airport: { id: "LIS", name: "Lisbon", time: "2030-01-01 12:00" },
      },
    ],
  });
  const choices = flightSuggestions([
    make("C", 100, 300),
    make("F", 400, 100),
    make("B", 200, 150),
  ]);
  expect(choices.map((c) => [c.label, c.offer.flights[0]?.airline])).toEqual([
    ["Cheapest", "C"],
    ["Fastest", "F"],
    ["Best balance", "B"],
  ]);
});
it("returns three hotel choices without inventing missing supply", () => {
  const offers = [100, 200, 300].map((amount, i) => ({
    id: String(i),
    name: String(i),
    description: "",
    amount,
    currency: "EUR",
    photo: null,
    taxesIncluded: true,
    stars: 3,
    rating: 4 + i / 10,
    website: null,
  }));
  expect(hotelSuggestions(offers)).toHaveLength(3);
  expect(
    hotelSuggestions(offers)
      .map((o) => o.offer.id)
      .sort(),
  ).toEqual(["0", "1", "2"]);
  expect(hotelSuggestions([])).toEqual([]);
});
it("balances family recommendations across child discovery, adult culture and shared outdoor time", () => {
  const places = [
    ["Aquarium", "aquarium"],
    ["Art museum", "museum"],
    ["City garden", "garden"],
  ].map(([name, kind]) => ({
    name: name!,
    kind: kind!,
    description: kind!,
    source: "https://example.com",
    lat: 0,
    lon: 0,
  }));
  const choices = balancedAttractionSuggestions(places, true);
  expect(choices.map((c) => c.place?.name)).toEqual(["Aquarium", "Art museum", "City garden"]);
  expect(choices.map((c) => c.label)).toEqual(["For children", "For grown-ups", "Together"]);
  expect(balancedAttractionSuggestions([], true)).toHaveLength(3);
  expect(balancedAttractionSuggestions([], true).every((c) => c.place === null)).toBe(true);
});

it("does not call a monastery an outdoor family stop just because its description mentions a river", () => {
  const places = [
    {
      name: "Jerónimos Monastery",
      description: "A monastery near the river",
      source: "https://example.com",
      lat: 0,
      lon: 0,
    },
    {
      name: "Praça do Comércio",
      description: "Public square",
      source: "https://example.com",
      lat: 0,
      lon: 0,
    },
    {
      name: "Oceanário de Lisboa",
      description: "Marine exhibits",
      source: "https://example.com",
      lat: 0,
      lon: 0,
    },
  ];
  const choices = balancedAttractionSuggestions(places, true, ["4-6"]);
  expect(choices[0]?.place?.name).toBe("Oceanário de Lisboa");
  expect(choices[2]?.place?.name).toBe("Praça do Comércio");
});
