import { useEffect, useRef, useState } from "react";
import { CarFront } from "lucide-react";
import { carSearchInput, type CarSearchResult } from "../../supabase/functions/_shared/car-search";
import { resolveFlightAirport } from "@/lib/flight-airports";
import { carSearchAvailable, searchCars } from "@/lib/car-rental";
import { endDate } from "@/lib/planning";
import { carScope, type CarChoice } from "@/lib/travel-workspace";
import type { StayBrief } from "@/lib/stay-planning";
import { CityAirportInput } from "./CityAirportInput";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
export function CarRental({
  brief,
  active = false,
  allowance,
  chosen,
  onChoose,
}: {
  brief: StayBrief;
  active?: boolean;
  allowance: number;
  chosen?: CarChoice | undefined;
  onChoose: (choice: CarChoice | undefined) => void;
}) {
  const [pickup, setPickup] = useState(brief.destination),
    [age, setAge] = useState(""),
    [residence, setResidence] = useState("");
  const [pickupDate, setPickupDate] = useState(brief.start),
    [dropoffDate, setDropoffDate] = useState(endDate(brief.start, brief.days));
  const [pickupTime, setPickupTime] = useState("10:00"),
    [dropoffTime, setDropoffTime] = useState("10:00");
  const [result, setResult] = useState<CarSearchResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [resolved, setResolved] = useState("");
  const controller = useRef<AbortController | null>(null),
    scope = carScope(brief);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setResult(null);
    setError("");
    setBusy(false);
    setPickup(brief.destination);
    setPickupDate(brief.start);
    setDropoffDate(endDate(brief.start, brief.days));
  }, [scope, brief.destination, brief.start, brief.days]);
  const [available, setAvailable] = useState<boolean | null>(null),
    [connectionError, setConnectionError] = useState(false);
  useEffect(() => {
    if (!active) return;
    const signal = new AbortController();
    void carSearchAvailable(signal.signal)
      .then((value) => {
        if (!signal.signal.aborted) {
          setAvailable(value);
          setConnectionError(false);
        }
      })
      .catch(() => {
        if (!signal.signal.aborted) {
          setAvailable(false);
          setConnectionError(true);
        }
      });
    return () => signal.abort();
  }, [active]);
  const money = (n: number) => dailyMoney(n, brief.currency),
    selected = chosen?.scope === scope ? chosen : null;
  return (
    <section aria-label="Car rental search" className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary">
          <CarFront className="h-4 w-4" />
          GO A LITTLE FURTHER
        </p>
        <h2 className="mt-2 text-3xl font-semibold">A car for your kind of trip.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search real advertised rental prices. Destination and dates come from your trip; confirm
          the pickup airport and driver details.
        </p>
        <p className="mt-2 text-sm">
          Local transport allowance: {money(allowance)}. A selected rental is added separately;
          fuel, parking and other transport remain estimates.
        </p>
      </div>
      {available !== true && (
        <p role="status" className="rounded-xl border bg-muted/30 p-4 text-sm">
          {available === null
            ? "Checking car rental connection…"
            : connectionError
              ? "Car rental search is temporarily unavailable. Your trip is unchanged."
              : "Live car rental searches are awaiting activation. No demonstration prices are shown."}
        </p>
      )}
      <form
        className="space-y-4 rounded-2xl border bg-card p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          controller.current?.abort();
          const current = new AbortController();
          controller.current = current;
          setBusy(true);
          setError("");
          setResult(null);
          try {
            const airport = await resolveFlightAirport(pickup, current.signal);
            setResolved(`${airport.name} (${airport.code})`);
            const query = carSearchInput.parse({
              pickup: airport.code,
              pickupDate,
              dropoffDate,
              pickupTime,
              dropoffTime,
              age: Number(age),
              residence: residence.toUpperCase(),
              currency: brief.currency,
              travelers: brief.travelers,
            });
            const next = await searchCars(query, current.signal);
            if (!current.signal.aborted) setResult(next);
          } catch (cause) {
            if (!current.signal.aborted)
              setError(
                cause instanceof Error && cause.name !== "ZodError"
                  ? cause.message
                  : "Check dates, driver age and country of residence.",
              );
          } finally {
            if (!current.signal.aborted) setBusy(false);
          }
        }}
      >
        <CityAirportInput
          label="Pickup airport"
          value={pickup}
          onChange={setPickup}
          onSelect={() => {}}
        />
        <p className="text-xs text-muted-foreground">
          Airport pickup, with return to the same airport. Choose the exact airport before
          searching.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Pickup date
            <input
              aria-label="Car pickup date"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Return date
            <input
              aria-label="Car return date"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Pickup time
            <input
              aria-label="Car pickup time"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Return time
            <input
              aria-label="Car return time"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="time"
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Driver age
            <input
              aria-label="Driver age"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Country of residence
            <input
              aria-label="Driver country of residence"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3 uppercase"
              placeholder="Two letters, e.g. DE"
              pattern="[A-Za-z]{2}"
              maxLength={2}
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              required
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Driver age and residence affect pricing. A search sends these details, pickup location,
          dates and currency to Scrappa. No name or account is needed. Free search allowance
          applies.
        </p>
        <Button disabled={busy || available !== true} type="submit">
          {busy ? "Comparing rental cars…" : "Find rental cars"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}
      {selected && (
        <div className="rounded-xl border border-secondary bg-secondary/10 p-4 text-sm">
          <p>
            Selected: {selected.name} · {selected.supplier} · {money(selected.amount)} for the
            rental. Not booked.
          </p>
          <Button variant="link" onClick={() => onChoose(undefined)}>
            Remove rental from budget
          </Button>
        </div>
      )}
      {result && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {resolved} · {result.query.pickupDate} {result.query.pickupTime} →{" "}
            {result.query.dropoffDate} {result.query.dropoffTime} · {result.query.travelers}{" "}
            travelers · checked {new Date(result.checkedAt).toLocaleString()}. Source:
            Rentalcars.com via independent provider Scrappa. Prices can change; reconfirm all terms
            with the rental company.
          </p>
          {!result.offers.length && (
            <p>
              No suitable priced cars were returned for your group. Try another airport or dates.
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-3">
            {result.offers.slice(0, 6).map((offer) => (
              <article key={offer.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <p className="text-xs text-secondary">{offer.supplier}</p>
                <h3 className="mt-2 text-xl font-semibold">{offer.name} or similar</h3>
                <p className="mt-2 text-sm">
                  {offer.seats} seats · {offer.transmission}
                </p>
                <p className="mt-3 text-2xl font-semibold">{money(offer.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Whole rental ·{" "}
                  {offer.amount <= allowance
                    ? "Within local transport allowance"
                    : "Above local transport allowance"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Mileage: {offer.mileage}. Fuel: {offer.fuelPolicy}. Cancellation:{" "}
                  {offer.cancellation === null
                    ? "check provider"
                    : offer.cancellation
                      ? "free cancellation reported; check conditions"
                      : "check conditions"}
                  . Deposit: {offer.deposit === null ? "not supplied" : money(offer.deposit)}.
                  Insurance, excess and optional extras: confirm with provider.
                </p>
                <Button
                  className="mt-4"
                  onClick={() =>
                    onChoose({
                      ...offer,
                      scope,
                      checkedAt: result.checkedAt,
                      pickup: resolved,
                      pickupDate: result.query.pickupDate,
                      dropoffDate: result.query.dropoffDate,
                      pickupTime: result.query.pickupTime,
                      dropoffTime: result.query.dropoffTime,
                    })
                  }
                >
                  Use this rental in budget
                </Button>
              </article>
            ))}
          </div>
          <a
            className="inline-block text-sm text-secondary underline"
            href="https://www.rentalcars.com/"
            target="_blank"
            rel="noreferrer"
          >
            Search and book on Rentalcars.com ↗
          </a>
          <p className="text-xs text-muted-foreground">
            External search link; the exact displayed car and price are not reserved or preselected.
          </p>
        </div>
      )}
    </section>
  );
}
