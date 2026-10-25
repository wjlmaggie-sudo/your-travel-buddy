import type { FlightResult } from "../../supabase/functions/_shared/flight-search";
import type { LiveHotelResult } from "../../supabase/functions/_shared/serpapi-hotels";
export type FlightOffer = FlightResult["offers"][number];
export const flightOfferId = (offer: FlightOffer) =>
  offer.flights
    .map((f) => `${f.flight_number}:${f.departure_airport.time}`)
    .join("|")
    .slice(0, 100);
export function flightSuggestions(offers: FlightOffer[]) {
  if (!offers.length) return [];
  const unique = [...new Map(offers.map((o) => [flightOfferId(o), o])).values()];
  const cheapest = [...unique].sort(
    (a, b) => a.price - b.price || a.total_duration - b.total_duration,
  )[0]!;
  const fastest = [...unique].sort(
    (a, b) => a.total_duration - b.total_duration || a.price - b.price,
  )[0]!;
  const score = (o: FlightOffer) =>
    o.price / cheapest.price +
    o.total_duration / fastest.total_duration +
    (o.flights.length - 1) * 0.2;
  const remaining = unique.filter(
    (o) =>
      flightOfferId(o) !== flightOfferId(cheapest) && flightOfferId(o) !== flightOfferId(fastest),
  );
  const best = [...(remaining.length ? remaining : unique)].sort((a, b) => score(a) - score(b))[0]!;
  return [
    { label: "Cheapest", detail: "Lowest advertised fare", offer: cheapest },
    { label: "Fastest", detail: "Shortest outbound journey", offer: fastest },
    { label: "Best balance", detail: "Price, journey time and fewer stops", offer: best },
  ];
}
export function hotelSuggestions(offers: LiveHotelResult["offers"]) {
  const remaining = [...offers].sort((a, b) => a.amount - b.amount);
  if (!remaining.length) return [];
  const cheapest = remaining.shift()!;
  const comfort = [...remaining].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) || (b.stars ?? 0) - (a.stars ?? 0) || a.amount - b.amount,
  )[0];
  const pool = remaining.filter((o) => o.id !== comfort?.id);
  const best = [...pool].sort(
    (a, b) => a.amount / Math.max(1, a.rating ?? 1) - b.amount / Math.max(1, b.rating ?? 1),
  )[0];
  return [
    { label: "Cheapest", detail: "Lowest whole-stay price", offer: cheapest },
    ...(comfort
      ? [
          {
            label: "Comfort pick",
            detail: "Highest-rated alternative to the cheapest stay",
            offer: comfort,
          },
        ]
      : []),
    ...(best
      ? [{ label: "Best value", detail: "A balance of price and guest rating", offer: best }]
      : []),
  ];
}
