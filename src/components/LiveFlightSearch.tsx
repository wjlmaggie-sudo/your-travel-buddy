import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock3, Wallet, Plane, Sparkles, Zap } from "lucide-react";
import { flightConnections, flightDuration } from "@/lib/flight-journey";
import { resolveFlightAirport, type FlightAirport } from "@/lib/flight-airports";
import { flightEndpoint, searchFlights } from "@/lib/flight-search";
import { flightSuggestions, flightOfferId } from "@/lib/travel-suggestions";
import { flightScope, type FlightChoice } from "@/lib/travel-workspace";
import type { FlightResult } from "../../supabase/functions/_shared/flight-search";
import type { StayBrief } from "@/lib/stay-planning";
import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { endDate } from "@/lib/planning";
import { CityAirportInput } from "./CityAirportInput";
import { Button } from "./ui/button";
export function LiveFlightSearch({
  brief,
  departure,
  active = false,
  chosen,
  onChoose,
  onContinue,
  onEditTrip,
}: {
  brief: StayBrief;
  departure: string;
  active?: boolean;
  chosen?: FlightChoice | undefined;
  onChoose?: (
    choice: FlightChoice | undefined,
    route?: { departure: string; destination: string },
  ) => void;
  onContinue?: (() => void) | undefined;
  onEditTrip?: (() => void) | undefined;
}) {
  const [origin, setOrigin] = useState(departure),
    [destination, setDestination] = useState(brief.destination);
  const [committed, setCommitted] = useState({
    origin: departure,
    destination: brief.destination,
    revision: 0,
    scope: flightScope(brief, departure),
  });
  const [resolved, setResolved] = useState<{
    origin: FlightAirport;
    destination: FlightAirport;
  } | null>(null);
  const [result, setResult] = useState<FlightResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null),
    lastRequest = useRef("");
  const party = (() => {
    let adults = brief.travelers - childCount(brief),
      children = 0,
      infants = 0,
      needsAges = false;
    if (brief.childrenAges?.length)
      for (const age of brief.childrenAges) {
        if (age >= 12) adults++;
        else if (age < 2) infants++;
        else children++;
      }
    else
      for (const range of brief.childrenAgeRanges ?? []) {
        const [min, max] = range.split("-").map(Number);
        if (min! >= 12) adults++;
        else if (min! >= 2 && max! <= 11) children++;
        else needsAges = true;
      }
    return { adults, children, infants, needsAges };
  })();
  const scope = flightScope(brief, departure);
  useEffect(() => {
    controller.current?.abort();
    lastRequest.current = "";
    setOrigin(departure);
    setDestination(brief.destination);
    setCommitted({ origin: departure, destination: brief.destination, revision: 0, scope });
    setResult(null);
    setResolved(null);
    setError("");
    setBusy(false);
  }, [scope]);
  const queryIdentity = JSON.stringify([scope, committed, party]);
  useEffect(() => {
    if (
      !active ||
      committed.scope !== scope ||
      !flightEndpoint() ||
      !committed.origin.trim() ||
      !committed.destination.trim()
    )
      return;
    if (lastRequest.current === queryIdentity) return;
    if (party.needsAges) {
      setError(
        "Add exact child ages in trip preferences so we can search the right airline fares.",
      );
      return;
    }
    if (brief.days < 2) {
      setError("Choose at least two travel days for return flights.");
      return;
    }
    lastRequest.current = queryIdentity;
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError("");
    setResult(null);
    void (async () => {
      try {
        const [from, to] = await Promise.all([
          resolveFlightAirport(committed.origin, current.signal),
          resolveFlightAirport(committed.destination, current.signal),
        ]);
        if (current.signal.aborted) return;
        if (from.code === to.code)
          throw new Error("Choose different departure and destination airports.");
        setResolved({ origin: from, destination: to });
        const data = await searchFlights(
          {
            origin: from.code,
            destination: to.code,
            outbound: brief.start,
            returning: endDate(brief.start, brief.days),
            adults: party.adults,
            children: party.children,
            infants: party.infants,
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
    })();
    return () => {
      current.abort();
      if (lastRequest.current === queryIdentity) lastRequest.current = "";
    };
  }, [active, queryIdentity]);
  const edit = (setter: (value: string) => void, value: string) => {
    controller.current?.abort();
    setter(value);
    setResult(null);
    setResolved(null);
    setError("");
    setBusy(false);
    if (chosen) onChoose?.(undefined);
  };
  const commit = (from = origin, to = destination) =>
    setCommitted((v) => ({ origin: from, destination: to, revision: v.revision + 1, scope }));
  const choices = flightSuggestions(result?.offers ?? []);
  const matching =
    chosen &&
    result?.offers.some((o) => flightOfferId(o) === chosen.id && o.price === chosen.amount) &&
    chosen.scope === scope;
  const dirty = origin !== committed.origin || destination !== committed.destination;
  return (
    <section className="space-y-5" aria-label="Flight recommendations">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Step 2 · Flights
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Choose how you get there.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {brief.start} – {endDate(brief.start, brief.days)} · {brief.travelers} travelers · Economy
          · {brief.currency}
        </p>
      </div>
      <form
        className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <CityAirportInput
          label="Departure"
          value={origin}
          onChange={(v) => edit(setOrigin, v)}
          onSelect={(v) => commit(v, destination)}
        />
        <CityAirportInput
          label="Destination"
          value={destination}
          onChange={(v) => edit(setDestination, v)}
          onSelect={(v) => commit(origin, v)}
        />
        {(dirty || error || (!result && !busy)) && (
          <Button type="submit" className="sm:col-span-2" disabled={busy}>
            Update flights
          </Button>
        )}
      </form>
      {!flightEndpoint() && (
        <p role="alert">Flight search is unavailable. Please try again later.</p>
      )}
      {busy && (
        <div className="rounded-2xl border bg-card p-8 text-center" role="status">
          <p className="font-semibold">Finding your three flight options…</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Comparing price, journey time and stops.
          </p>
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border p-4 text-sm">
          {error}
          {party.needsAges && (
            <Button variant="link" onClick={onEditTrip}>
              Edit traveler details
            </Button>
          )}
        </div>
      )}
      {resolved && !busy && (
        <p className="text-xs text-muted-foreground">
          {resolved.origin.name} ({resolved.origin.code}) → {resolved.destination.name} (
          {resolved.destination.code})
        </p>
      )}
      {result && (
        <div aria-live="polite" className="space-y-4">
          {!choices.length && <p>No priced flights found. Try another airport above.</p>}
          <div className="flight-ticket-list">
            {choices.map(({ label, detail, offer }) => {
              const selected =
                chosen?.id === flightOfferId(offer) &&
                chosen.amount === offer.price &&
                chosen.scope === scope;
              const first = offer.flights[0]!,
                last = offer.flights.at(-1)!;
              const connections = flightConnections(offer);
              const BadgeIcon =
                label === "Cheapest" ? Wallet : label === "Fastest" ? Zap : Sparkles;
              return (
                <article
                  key={label}
                  className={`flight-ticket ${selected ? "is-selected" : ""}`}
                  aria-label={`${label} flight`}
                >
                  <div className="flight-ticket-main">
                    <div className="flight-ticket-topline">
                      <span className="flight-ticket-badge">
                        <BadgeIcon size={13} aria-hidden />
                        {label}
                      </span>
                      {selected && (
                        <span className="flight-selected">
                          <Check size={13} aria-hidden /> Selected
                        </span>
                      )}
                      <h3 className="flight-airline">
                        {[...new Set(offer.flights.map((f) => f.airline))].join(" + ")}
                      </h3>
                      <span className="flight-ticket-reason" title={detail}>
                        Outbound · local times
                      </span>
                    </div>
                    <div className="flight-route">
                      <div className="flight-endpoint">
                        <strong>{first.departure_airport.time.slice(11)}</strong>
                        <span title={first.departure_airport.name}>
                          {first.departure_airport.id}
                        </span>
                        <small>{first.departure_airport.time.slice(0, 10)}</small>
                      </div>
                      <div className="flight-route-middle">
                        <span className="flight-total-time">
                          <Clock3 size={12} aria-hidden />
                          {flightDuration(offer.total_duration)}
                        </span>
                        <div className="flight-route-line" aria-hidden="true">
                          <span />
                          {connections.map((_, index) => (
                            <i key={index} />
                          ))}
                          <Plane size={17} />
                        </div>
                        <span
                          className={connections.length ? "flight-stop-count" : "flight-nonstop"}
                        >
                          {connections.length
                            ? `${connections.length} stop${connections.length > 1 ? "s" : ""} · ${connections.map((c) => (c.airportChange ? `${c.airport.id} / ${c.nextAirport.id}` : c.airport.id)).join(" · ")}`
                            : "Nonstop"}
                        </span>
                      </div>
                      <div className="flight-endpoint flight-endpoint-arrival">
                        <strong>{last.arrival_airport.time.slice(11)}</strong>
                        <span title={last.arrival_airport.name}>{last.arrival_airport.id}</span>
                        <small>{last.arrival_airport.time.slice(0, 10)}</small>
                      </div>
                    </div>
                    {connections.length > 0 && (
                      <ul className="flight-connections" aria-label="Layovers">
                        {connections.map((connection, index) => (
                          <li key={index}>
                            <Clock3 size={14} aria-hidden />
                            <span>
                              <strong>
                                {connection.duration === null
                                  ? "Duration unavailable"
                                  : flightDuration(connection.duration)}{" "}
                                layover
                              </strong>{" "}
                              in {connection.airport.name} ({connection.airport.id})
                              {connection.overnight && <em> · Overnight</em>}
                              {connection.airportChange && (
                                <em>
                                  {" "}
                                  · Change airports to {connection.nextAirport.name} (
                                  {connection.nextAirport.id}); transfer time to confirm
                                </em>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <details className="flight-leg-details">
                      <summary>
                        Flight details <ChevronDown size={14} aria-hidden />
                      </summary>
                      <ol>
                        {offer.flights.map((leg, index) => (
                          <li key={`${leg.flight_number}-${index}`}>
                            <span className="flight-leg-number">{index + 1}</span>
                            <div>
                              <strong>
                                {leg.departure_airport.id}{" "}
                                <ArrowRight size={12} className="inline" aria-hidden />{" "}
                                {leg.arrival_airport.id}
                              </strong>
                              <p>
                                {leg.airline} · {leg.flight_number} · {flightDuration(leg.duration)}
                              </p>
                              <p>
                                {leg.departure_airport.time} → {leg.arrival_airport.time}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <p className="flight-time-note">
                        All times are local to each airport. Details shown are for the outbound
                        journey.
                      </p>
                    </details>
                  </div>
                  <div className="flight-ticket-fare">
                    <span className="flight-fare-label">
                      RETURN · {brief.travelers} {brief.travelers === 1 ? "TRAVELER" : "TRAVELERS"}
                    </span>
                    <p className="flight-price">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: brief.currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }).format(offer.price)}
                    </p>
                    <p className="flight-price-note">Advertised group fare</p>
                    <Button
                      className="flight-choose"
                      variant={selected ? "secondary" : "default"}
                      onClick={() => {
                        const clean = (value: string, airport: FlightAirport) =>
                          value.includes(" · ") || /^[A-Za-z]{3}$/.test(value.trim())
                            ? `${airport.city}, ${new Intl.DisplayNames(["en"], { type: "region" }).of(airport.country)}`
                            : value.split(" · ")[0]!.trim();
                        const route =
                          resolved && (origin !== departure || destination !== brief.destination)
                            ? {
                                departure: clean(origin, resolved.origin),
                                destination: clean(destination, resolved.destination),
                              }
                            : undefined;
                        onChoose?.(
                          {
                            id: flightOfferId(offer),
                            label:
                              `${label} · ${[...new Set(offer.flights.map((f) => f.airline))].join(" + ")} · ${result.query.origin}–${result.query.destination}`.slice(
                                0,
                                150,
                              ),
                            amount: offer.price,
                            scope,
                            evidence: "live-search",
                            checkedAt: result.checkedAt,
                          },
                          route,
                        );
                      }}
                    >
                      {selected ? "Selected flight" : `Choose ${label.toLowerCase()}`}
                      <ArrowRight size={15} aria-hidden />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {result.offers.length} returned options. Best balance weighs price, outbound
            duration and stops. Search estimates may be cached; return flights, baggage and final
            fare are confirmed before booking.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <a
              href={result.searchUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-secondary underline"
            >
              View full fares on Google Flights ↗
            </a>
            <Button disabled={!matching} onClick={onContinue}>
              Continue to hotels →
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
