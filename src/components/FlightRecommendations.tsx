import { LiveFlightSearch } from "./LiveFlightSearch";
import { childCount, childAgeDescription } from "../../supabase/functions/_shared/travel-persona";
import { useId, useState } from "react";
import { Plane, ArrowRight, Check } from "lucide-react";
import { demoFlights, flightScope, flightCost, selectedFlight } from "@/lib/travel-workspace";
import { flightSearch, type Journey } from "@/lib/journey-planning";
import type { StayBrief } from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
export function FlightRecommendations({
  brief,
  journey,
  onChange,
}: {
  brief: StayBrief;
  journey: Journey;
  onChange: (next: Journey) => void;
}) {
  const id = useId(),
    [quote, setQuote] = useState(""),
    [name, setName] = useState("");
  const active = selectedFlight(brief, journey),
    money = (n: number) => dailyMoney(n, brief.currency);
  if (journey.flightsRequired === false)
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-2xl font-semibold">A trip without flights</h2>
        <p className="mt-3 text-muted-foreground">
          Your flight cost is zero. To compare flights, open Edit route & flight allowance below and
          add your departure.
        </p>
      </section>
    );
  return (
    <section aria-labelledby={`${id}-title`} className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Find your way there
        </p>
        <h2 id={`${id}-title`} className="mt-2 text-3xl font-semibold">
          Find your flight.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {journey.departure} → {brief.destination} · {brief.travelers} travelers · group return
          allowance {money(journey.flightBudget)}
        </p>
      </div>
      <LiveFlightSearch brief={brief} departure={journey.departure} />
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm">Explore simulated flight comparisons</summary>
        <p
          role="note"
          className="rounded-xl border border-amber-600/30 bg-amber-100/30 p-4 text-sm"
        >
          <strong>Demonstration data · not real flight offers.</strong> Airlines, schedules,
          durations and prices below are simulated to demonstrate comparison and budget changes.
          They are not validated for this route or time zone. Use the real flight search above when
          available.
        </p>
        {childCount(brief) > 0 && (
          <p className="rounded-xl border p-4 text-sm">
            Your group includes children aged {childAgeDescription(brief)}. These demo totals do not
            calculate child fares. Confirm ages, seating, baggage and the full group price with the
            airline.
          </p>
        )}
        <div className="offer-grid grid gap-4">
          {demoFlights(brief, journey).map((option) => (
            <article
              key={option.id}
              className={`flex flex-col rounded-2xl border bg-card p-5 shadow-card ${active?.id === option.id && active.amount === option.amount ? "ring-2 ring-secondary" : ""}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {option.label}
              </span>
              <span className="mt-3 w-fit rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-950">
                DEMO · simulated offer
              </span>
              <div className="my-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h3 className="font-sans text-base font-semibold">{option.airline}</h3>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <strong>{option.depart}</strong>
                <ArrowRight className="h-4 w-4" />
                <strong>{option.arrive}</strong>
              </div>
              <p className="mt-3 text-sm">
                Outbound {option.duration} · {option.route}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Return {option.inbound} · simulated times
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{option.dates}</p>
              <div className="mt-5 flex-1">
                <p className="text-2xl font-semibold">{money(option.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Whole group · return · simulated total
                </p>
                <p
                  className={`mt-2 text-xs ${option.amount > journey.flightBudget ? "text-primary" : "text-secondary"}`}
                >
                  {option.amount > journey.flightBudget
                    ? `${money(option.amount - journey.flightBudget)} above flight allowance`
                    : `${money(journey.flightBudget - option.amount)} below flight allowance`}
                </p>
              </div>
              <Button
                className="mt-4"
                variant={
                  active?.id === option.id && active.amount === option.amount
                    ? "secondary"
                    : "outline"
                }
                onClick={() =>
                  onChange({
                    ...journey,
                    selectedFlight: {
                      id: option.id,
                      label: option.label,
                      scope: option.scope,
                      amount: option.amount,
                      evidence: "demo",
                    },
                  })
                }
              >
                {active?.id === option.id && active.amount === option.amount ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Selected demo flight
                  </>
                ) : (
                  "Try this demo flight"
                )}
              </Button>
              <a
                className="mt-3 text-center text-xs text-secondary underline"
                href={flightSearch(brief, journey.departure)}
                target="_blank"
                rel="noreferrer"
              >
                Search real flights on Google ↗
              </a>
            </article>
          ))}
        </div>
      </details>
      {active && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/10 p-4">
          <p className="text-sm">
            Current flight cost: <strong>{money(flightCost(brief, journey))}</strong> ·{" "}
            {active.evidence === "demo"
              ? "demonstration selection"
              : "traveler-entered quote, not independently verified"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...journey, selectedFlight: undefined })}
          >
            Clear flight selection
          </Button>
        </div>
      )}
      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">Use a real quote you found</summary>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = Number(quote);
            if (name.trim() && quote !== "" && amount >= 0 && amount <= 1000000)
              onChange({
                ...journey,
                selectedFlight: {
                  id: "entered-flight",
                  label: name.trim().slice(0, 150),
                  amount,
                  scope: flightScope(brief, journey.departure),
                  evidence: "entered",
                },
              });
          }}
        >
          <div>
            <label htmlFor={`${id}-airline`} className="text-sm">
              Airline / quote name
            </label>
            <input
              id={`${id}-airline`}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={name}
              maxLength={150}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${id}-price`} className="text-sm">
              Whole-group return price ({brief.currency})
            </label>
            <input
              id={`${id}-price`}
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={quote}
              required
              onChange={(e) => setQuote(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Include baggage and fees. This is your entered quote, not a verified offer or a booking.
          </p>
          <Button type="submit">Use entered flight quote</Button>
        </form>
      </details>
    </section>
  );
}
