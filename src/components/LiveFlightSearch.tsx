import { useEffect, useId, useRef, useState } from "react";
import { resolveFlightAirport, type FlightAirport } from "@/lib/flight-airports";
import { flightEndpoint, searchFlights } from "@/lib/flight-search";
import type { FlightResult } from "../../supabase/functions/_shared/flight-search";
import type { StayBrief } from "@/lib/stay-planning";
import { endDate } from "@/lib/planning";
import { Button } from "./ui/button";
import { childCount } from "../../supabase/functions/_shared/travel-persona";

export function LiveFlightSearch({ brief, departure }: { brief: StayBrief; departure: string }) {
  const id = useId();
  const [origin, setOrigin] = useState(departure);
  const [destination, setDestination] = useState(brief.destination);
  const [resolved, setResolved] = useState<{
    origin: FlightAirport;
    destination: FlightAirport;
  } | null>(null);
  const [adults, setAdults] = useState(brief.travelers - childCount(brief));
  const [children, setChildren] = useState(childCount(brief));
  const [infants, setInfants] = useState(0);
  const [result, setResult] = useState<FlightResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const scope = JSON.stringify([
    brief.start,
    brief.days,
    brief.currency,
    brief.travelers,
    brief.childrenAges,
    brief.childrenAgeRanges,
    departure,
    brief.destination,
  ]);
  useEffect(() => {
    controller.current?.abort();
    setResult(null);
    setResolved(null);
    setError("");
    setBusy(false);
    setOrigin(departure);
    setDestination(brief.destination);
    setAdults(brief.travelers - childCount(brief));
    setChildren(childCount(brief));
    setInfants(0);
    return () => controller.current?.abort();
  }, [scope]);
  const edit = () => {
    controller.current?.abort();
    setBusy(false);
    setResult(null);
    setResolved(null);
    setError("");
  };
  if (!flightEndpoint()) return null;
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5" aria-labelledby={`${id}-title`}>
      <div>
        <h3 id={`${id}-title`} className="text-xl font-semibold">
          Search real flights
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {origin} → {destination} · {brief.start} to {endDate(brief.start, brief.days)} · Economy ·{" "}
          {brief.currency}
        </p>
        <p className="mt-2 text-sm">
          Your trip’s departure and destination are filled in. Change either city or airport below
          if you prefer. Infants travel in their own seat; lap-infant searches are not supported
          here.
        </p>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          controller.current?.abort();
          const current = new AbortController();
          controller.current = current;
          setBusy(true);
          setError("");
          setResult(null);
          try {
            const [from, to] = await Promise.all([
              resolveFlightAirport(origin, current.signal),
              resolveFlightAirport(destination, current.signal),
            ]);
            if (current.signal.aborted) return;
            if (from.code === to.code)
              throw new Error("Choose different departure and arrival airports.");
            setResolved({ origin: from, destination: to });
            const data = await searchFlights(
              {
                origin: from.code,
                destination: to.code,
                outbound: brief.start,
                returning: endDate(brief.start, brief.days),
                adults,
                children,
                infants,
                currency: brief.currency,
              },
              current.signal,
            );
            if (!current.signal.aborted) setResult(data);
          } catch (cause) {
            if (!current.signal.aborted)
              setError(cause instanceof Error ? cause.message : "Flight search unavailable.");
          } finally {
            if (!current.signal.aborted) setBusy(false);
          }
        }}
      >
        {(
          [
            ["origin", "Departure city or airport", origin, setOrigin],
            ["destination", "Destination city or airport", destination, setDestination],
          ] as const
        ).map(([key, label, value, setter]) => (
          <label key={key} htmlFor={`${id}-${key}`} className="text-sm">
            {label}
            <input
              id={`${id}-${key}`}
              className="mt-1 w-full rounded-lg border bg-background p-2"
              value={value}
              placeholder={key === "origin" ? "e.g. Berlin or BER" : "e.g. Lisbon or LIS"}
              required
              maxLength={120}
              onChange={(e) => {
                edit();
                setter(e.target.value);
              }}
            />
          </label>
        ))}
        {(
          [
            ["adults", "Adults (12+)", adults, setAdults, 1],
            ["children", "Children (2–11)", children, setChildren, 0],
            ["infants", "Infants under 2, own seat", infants, setInfants, 0],
          ] as const
        ).map(([key, label, value, setter, min]) => (
          <label key={key} htmlFor={`${id}-${key}`} className="text-sm">
            {label}
            <input
              id={`${id}-${key}`}
              className="mt-1 w-full rounded-lg border bg-background p-2"
              type="number"
              min={min}
              max={9}
              required
              value={value}
              onChange={(e) => {
                edit();
                setter(Number(e.target.value));
              }}
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {adults + children + infants} passengers · up to 9 total. Searches use the platform’s
          shared free allowance. No search runs until you press the button.
        </p>
        <Button
          type="submit"
          disabled={
            busy ||
            adults + children + infants !== brief.travelers ||
            infants > adults ||
            adults + children + infants > 9 ||
            brief.days < 2
          }
        >
          {busy ? "Searching flights…" : "Search flight prices"}
        </Button>
        {adults + children + infants !== brief.travelers && (
          <p role="alert" className="text-sm">
            Passenger counts must match your trip’s {brief.travelers} travelers.
          </p>
        )}
        {brief.days < 2 && (
          <p className="text-sm">Choose at least two travel days for a return-flight search.</p>
        )}
      </form>
      {resolved && (
        <p className="rounded-xl bg-muted/40 p-3 text-sm" role="status">
          Airports used: {resolved.origin.name} ({resolved.origin.code}) →{" "}
          {resolved.destination.name} ({resolved.destination.code}). Change either city or enter
          another airport code above to search a different route.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border p-3 text-sm">
          {error}
        </p>
      )}
      {result && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-xs text-muted-foreground">
            Google Flights results via SerpApi · retrieved{" "}
            {new Date(result.checkedAt).toLocaleString()}
            {result.sourceTime ? ` · provider search ${result.sourceTime}` : ""}. Results may be
            cached. Prices and availability can change.
          </p>
          {!result.offers.length && (
            <p>No priced flights were returned for these airports and dates.</p>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {result.offers.map((offer, index) => (
              <article key={index} className="space-y-2 rounded-xl border p-4">
                <h4 className="font-semibold">
                  {[...new Set(offer.flights.map((f) => f.airline))].join(" + ")}
                </h4>
                {offer.flights.map((flight, leg) => (
                  <p key={leg} className="text-sm">
                    {flight.departure_airport.id} {flight.departure_airport.time} →{" "}
                    {flight.arrival_airport.id} {flight.arrival_airport.time} ·{" "}
                    {flight.flight_number}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground">
                  Outbound {Math.floor(offer.total_duration / 60)}h {offer.total_duration % 60}m ·{" "}
                  {offer.flights.length - 1} stops · airport-local times
                </p>
                <p className="text-xl font-semibold">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: result.query.currency,
                  }).format(offer.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Provider’s round-trip search price for the requested party. Return flight,
                  baggage, fees and final total must be confirmed on Google Flights.
                </p>
              </article>
            ))}
          </div>
          <a
            href={result.searchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-secondary underline"
          >
            Choose return flights and check booking options on Google Flights ↗
          </a>
          <p className="text-xs text-muted-foreground">
            These search results do not reserve a seat or update your trip budget. Use the confirmed
            group quote below after checking the full itinerary.
          </p>
        </div>
      )}
    </section>
  );
}
