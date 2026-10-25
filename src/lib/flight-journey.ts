import type { FlightResult } from "../../supabase/functions/_shared/flight-search";

type Offer = FlightResult["offers"][number];
export function flightDuration(minutes: number) {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

/** Use provider durations, never subtract airport-local timestamps across time zones. */
export function flightConnections(offer: Offer) {
  return offer.flights.slice(0, -1).map((flight, index) => {
    const next = offer.flights[index + 1]!;
    const arrival = flight.arrival_airport;
    const departure = next.departure_airport;
    const supplied = offer.layovers?.[index];
    const sameAirport = arrival.id === departure.id;
    const matched = supplied && supplied.id === arrival.id && sameAirport ? supplied : undefined;
    // Older cached responses omit layovers. One connection's wait is still known
    // from total journey minutes minus the provider's airborne leg durations.
    const remaining =
      offer.total_duration - offer.flights.reduce((sum, leg) => sum + leg.duration, 0);
    const duration =
      matched?.duration ??
      (offer.flights.length === 2 && sameAirport && remaining >= 0 ? remaining : null);
    return {
      airport: arrival,
      nextAirport: departure,
      duration,
      overnight: matched?.overnight ?? false,
      airportChange: !sameAirport,
    };
  });
}
