import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Building2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import {
  flightAllowance,
  flightSearch,
  journeyBudget,
  journeySchema,
  saveJourney,
  type Journey,
} from "@/lib/journey-planning";
import type { StayBrief, StayChoice } from "@/lib/stay-planning";
import { endDate } from "@/lib/planning";
import { dailyMoney } from "./DailyBudget";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export function JourneyPlanner({
  brief,
  journey,
  stay,
  tripId,
  onChange,
}: {
  brief: StayBrief;
  journey: Journey | null | undefined;
  stay?: StayChoice | null | undefined;
  tripId?: string;
  onChange?: (next: Journey) => void;
}) {
  const id = useId(),
    qc = useQueryClient();
  const [values, setValues] = useState<Journey>(
    journey ?? {
      departure: "",
      flightBudget: flightAllowance(brief.budget),
      hotelComfort: "Comfortable",
    },
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (journey) setValues(journey);
  }, [journey]);
  const active = journeySchema.safeParse(values);
  const costs = active.success ? journeyBudget(brief, active.data, stay) : null;
  const money = (value: number) => dailyMoney(value, brief.currency);
  function change(next: Journey) {
    setValues(next);
    if (!tripId && journeySchema.safeParse(next).success) onChange?.(next);
  }
  return (
    <section
      id="trip-flights"
      className="my-6 overflow-hidden rounded-2xl border bg-card shadow-card"
      aria-labelledby={`${id}-heading`}
    >
      <div className="bg-secondary/10 p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">
          One trip · one budget
        </p>
        <h2 id={`${id}-heading`} className="mt-2 text-2xl font-semibold">
          Flights, hotel & discoveries
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {journey
            ? `${journey.departure} → ${brief.destination} · ${brief.days} days · ${brief.travelers} people`
            : "Add your departure to include flights in this trip’s total budget."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {brief.start} → {endDate(brief.start, brief.days)} · check your dates before searching
        </p>
        <p className="mt-2 text-sm">
          Total group budget: <strong>{money(brief.budget)}</strong>
          {journey ? " · flights included" : " · flights currently excluded"}
        </p>
      </div>
      <div className="space-y-5 p-5 md:p-6">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const parsed = journeySchema.safeParse(values);
            if (!parsed.success) {
              toast.error("Enter a departure and valid flight allowance.");
              return;
            }
            setBusy(true);
            try {
              if (tripId) {
                await saveJourney(tripId, parsed.data);
                await qc.invalidateQueries({ queryKey: ["journey-settings", tripId] });
                toast.success("Flight and hotel settings saved.");
              }
              onChange?.(parsed.data);
            } catch {
              toast.error("Could not save journey settings. Your draft is kept here.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <Label htmlFor={`${id}-departure`}>Departure city / airport</Label>
            <Input
              id={`${id}-departure`}
              required
              maxLength={200}
              value={values.departure}
              onChange={(e) => change({ ...values, departure: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`${id}-flights`}>
              Return-flight allowance · whole group ({brief.currency})
            </Label>
            <Input
              id={`${id}-flights`}
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              required
              value={values.flightBudget}
              onChange={(e) => change({ ...values, flightBudget: Number(e.target.value) })}
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              Your hotel comfort
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["Simple", "Comfortable", "Premium"] as const).map((comfort) => (
                <button
                  type="button"
                  key={comfort}
                  aria-pressed={values.hotelComfort === comfort}
                  onClick={() => change({ ...values, hotelComfort: comfort })}
                  className={`rounded-xl border p-3 text-left text-sm ${values.hotelComfort === comfort ? "border-secondary bg-secondary/10" : "bg-background/40"}`}
                >
                  <span className="font-semibold">{comfort}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {comfort === "Simple"
                      ? "More for food and sightseeing"
                      : comfort === "Comfortable"
                        ? "A balance of rest and experiences"
                        : "A larger share for your stay"}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          {tripId && (
            <>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Preview changes below, then save to update your trip. Adding flights makes the
                existing total an all-in budget.
              </p>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save flight & hotel settings"}
              </Button>
            </>
          )}
        </form>
        {costs && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border p-4">
                <Plane className="h-4 w-4 text-primary" />
                <h3 className="mt-2 font-medium">1 · Flights</h3>
                <p className="mt-2 text-xl font-semibold">{money(values.flightBudget)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {money(values.flightBudget / brief.travelers)} / person, return allowance
                </p>
                <a
                  className="mt-3 inline-block text-xs text-secondary underline"
                  href={flightSearch(brief, values.departure)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Compare flights for this route
                </a>
              </article>
              <article className="rounded-xl border p-4">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="mt-2 font-medium">2 · Hotel</h3>
                <p className="mt-2 text-xl font-semibold">{money(costs.accommodation)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {costs.nights} nights ·{" "}
                  {costs.quoted !== null
                    ? "your chosen quote"
                    : `${values.hotelComfort.toLowerCase()} allowance`}
                  {costs.nights
                    ? ` · ${money(costs.accommodation / costs.nights)} / group / night`
                    : ""}
                </p>
              </article>
              <article className="rounded-xl border p-4">
                <MapPinned className="h-4 w-4 text-primary" />
                <h3 className="mt-2 font-medium">3 · Explore</h3>
                <p className="mt-2 text-xl font-semibold">{money(Math.max(0, costs.remaining))}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Food, tourist spots, local transport & buffer · about{" "}
                  {money(Math.max(0, costs.remaining) / brief.days)} / group / day
                </p>
              </article>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {costs.parts.map((part) => (
                <div
                  key={part.label}
                  className="flex justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <span>{part.label}</span>
                  <strong>{money(part.amount)}</strong>
                </div>
              ))}
            </div>
            {costs.shortfall > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Flights and hotel exceed the total budget by {money(costs.shortfall)}. Reduce an
                allowance, choose another stay or increase the total.
              </p>
            )}
            {costs.quoted !== null && (
              <p className="text-xs text-muted-foreground">
                Your chosen hotel quote overrides the comfort allowance. Choose another hotel quote
                below to change that cost.
              </p>
            )}
          </>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Flight allowance starts at 25% of the total budget. It is a planning target, not an
          airfare estimate based on this route. No airline, availability or journey time has been
          retrieved. Check dates, passenger ages, baggage, transfers and full prices on the
          provider’s site. Hotel comfort changes the allocation, not a star-rating guarantee. All
          amounts use {brief.currency}; no currency conversion is assumed.
        </p>
        {brief.days === 1 && (
          <p className="text-xs text-primary">
            A same-day return flight may be impractical. Check flight times before using this
            day-trip outline.
          </p>
        )}
      </div>
    </section>
  );
}
