import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { useEffect, useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  bookingSearch,
  requestedRooms,
  readStayChoice,
  saveStayChoice,
  stayScope,
  stayCost,
  stayBudget,
  type StayBrief,
  type StayChoice,
  stayChoiceSchema,
} from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AccommodationPlanner({
  brief,
  tripId,
  choice,
  onChoose,
}: {
  brief: StayBrief;
  tripId?: string;
  choice?: StayChoice | null;
  onChoose?: (choice: StayChoice | null) => void;
}) {
  const id = useId();
  const qc = useQueryClient();
  const saved = useQuery({
    queryKey: ["stay-choice", tripId],
    queryFn: () => readStayChoice(tripId!),
    enabled: !!tripId,
  });
  const selected = tripId ? saved.data : choice;
  const active = selected?.scope === stayScope(brief) ? selected : null;
  const [form, setForm] = useState({
    name: "",
    type: "Hotel" as StayChoice["type"],
    amount: "",
    unit: "stay" as StayChoice["unit"],
    rooms: requestedRooms(brief),
    extras: "0",
  });
  const [busy, setBusy] = useState(false);
  const [quotes, setQuotes] = useState<StayChoice[]>([]);
  const scope = stayScope(brief);
  const comparable = [...(active ? [active] : []), ...quotes]
    .filter(
      (quote, index, all) =>
        quote.scope === scope &&
        all.findIndex((other) => JSON.stringify(other) === JSON.stringify(quote)) === index,
    )
    .sort((a, b) => (stayCost(a, brief) ?? 0) - (stayCost(b, brief) ?? 0));
  useEffect(() => {
    if (!active)
      setForm({
        name: "",
        type: "Hotel",
        amount: "",
        unit: "stay",
        rooms: requestedRooms(brief),
        extras: "0",
      });
  }, [scope]);
  useEffect(() => {
    if (active)
      setForm({ ...active, amount: String(active.amount), extras: String(active.extras) });
  }, [active]);
  const budget = stayBudget(brief, active);
  const money = (n: number) => dailyMoney(n, brief.currency);
  async function choose(next: StayChoice | null) {
    setBusy(true);
    try {
      if (tripId) {
        await saveStayChoice(tripId, next);
        await qc.invalidateQueries({ queryKey: ["stay-choice", tripId] });
      }
      if (next)
        setQuotes((current) => [
          ...current.filter((quote) => JSON.stringify(quote) !== JSON.stringify(next)),
          next,
        ]);
      onChoose?.(next);
    } catch {
      toast.error("Your accommodation choice could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="trip-stay"
      className="my-6 rounded-2xl border bg-card p-5 shadow-card md:p-6"
      aria-labelledby={`${id}-title`}
    >
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-secondary">
        <BedDouble className="h-4 w-4" /> A place to come home to
      </p>
      <h2 id={`${id}-title`} className="mt-2 text-2xl font-semibold">
        Choose your stay
      </h2>
      {active?.evidence === "demo" && (
        <p className="mt-3 rounded-lg bg-amber-100/40 p-3 text-sm">
          <strong>Selected demonstration hotel.</strong> This fictional property and simulated price
          are for budget exploration only, not a verified quote.
        </p>
      )}
      {!budget.nights ? (
        <p className="mt-3 text-sm">This is a day trip. No overnight accommodation is included.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {brief.start} → {brief.days > 1 ? budget.daily.at(-1)?.date : brief.start} ·{" "}
            {budget.nights} nights · {brief.travelers} travelers.{" "}
            {childCount(brief)
              ? "Your child count is included in the search. Confirm exact ages, room occupancy and final prices on the booking website."
              : "Search assumes all guests are adults; update the party on the booking site if needed."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Hostel",
                detail: "Compare a bed price × people × nights. Private rooms can cost more.",
              },
              {
                title: "Hotel",
                detail: "Compare a room price × rooms × nights. Check breakfast and city tax.",
              },
              {
                title: "Apartment",
                detail: "Compare the whole stay, including cleaning and service fees.",
              },
            ].map((option) => (
              <article key={option.title} className="rounded-xl border bg-background/40 p-4">
                <h3 className="font-semibold">{option.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {option.detail}
                </p>
                <a
                  href={bookingSearch(
                    brief,
                    form.rooms,
                    option.title === "Hotel" ? undefined : option.title,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-secondary underline"
                >
                  Check prices <ExternalLink className="h-3 w-3" />
                </a>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a
              className="text-secondary underline"
              href={bookingSearch(brief, form.rooms)}
              target="_blank"
              rel="noreferrer"
            >
              Booking.com · your dates & group
            </a>
            <a
              className="text-secondary underline"
              href="https://www.hostelworld.com/"
              target="_blank"
              rel="noreferrer"
            >
              Hostelworld · enter your dates
            </a>
            <a
              className="text-secondary underline"
              href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(brief.destination)}`}
              target="_blank"
              rel="noreferrer"
            >
              Hotels on Google · check dates
            </a>
          </div>
          {/^(lisbon|lisboa)(,|$)/i.test(brief.destination.trim()) && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-medium">Named options to compare in Lisbon</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {[
                  "Avenue Hostel & Suites",
                  "Hotel Anjos",
                  "Hotel Alif Avenidas",
                  "Rossio Garden Hotel",
                ].map((name) => (
                  <a
                    key={name}
                    className="text-secondary underline"
                    href={bookingSearch(brief, form.rooms, name)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {name}
                  </a>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Prices and availability for your dates have not been retrieved. Open a listing for a
                current quote.
              </p>
            </div>
          )}
          {comparable.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {comparable.map((quote) => {
                const total = stayCost(quote, brief)!;
                const chosen = !!active && JSON.stringify(active) === JSON.stringify(quote);
                return (
                  <article
                    key={JSON.stringify(quote)}
                    className={`rounded-xl border p-4 ${chosen ? "border-secondary bg-secondary/5" : "bg-background/40"}`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {quote.type} ·{" "}
                      {quote.evidence === "demo"
                        ? "DEMO price"
                        : quote.evidence === "live-search"
                          ? "live search estimate"
                          : "entered quote"}
                    </p>
                    <h3 className="mt-1 font-semibold">{quote.name}</h3>
                    <p className="mt-2 text-2xl font-semibold">
                      {money(total)} <span className="text-xs font-normal">whole group / stay</span>
                    </p>
                    <p className="mt-1 text-xs">
                      {money(total / budget.nights)} / night for the group ·{" "}
                      {total > budget.allowance ? "Above" : "Within"} your stay allowance
                    </p>
                    <Button
                      type="button"
                      className="mt-3"
                      variant={chosen ? "secondary" : "outline"}
                      disabled={chosen || busy}
                      onClick={() => choose(quote)}
                    >
                      {chosen ? "Chosen stay" : "Choose this option"}
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Live provider prices are not connected inside this site yet. Use a current quote below
            to compare your options; no booking is made here.
          </p>
          <details className="mt-4 rounded-xl border p-4" open={!!active || undefined}>
            <summary className="cursor-pointer text-sm font-medium">
              {active
                ? `${active.evidence === "demo" ? "Demo selection" : "Chosen"}: ${active.name} · ${money(budget.quoted!)} whole stay`
                : "Add a quote & choose this stay"}
            </summary>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const parsed = stayChoiceSchema.safeParse({
                  ...form,
                  amount: form.amount === "" ? NaN : Number(form.amount),
                  extras: Number(form.extras),
                  scope: stayScope(brief),
                });
                if (!parsed.success) {
                  toast.error("Enter a property name and a valid price.");
                  return;
                }
                void choose(parsed.data);
              }}
            >
              <div>
                <Label htmlFor={`${id}-name`}>Hotel / hostel name</Label>
                <Input
                  id={`${id}-name`}
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`${id}-type`}>Accommodation type</Label>
                <select
                  id={`${id}-type`}
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as StayChoice["type"] })}
                >
                  {["Hotel", "Hostel", "Apartment"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`${id}-amount`}>Quoted price ({brief.currency})</Label>
                <Input
                  id={`${id}-amount`}
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`${id}-unit`}>Price is for</Label>
                <select
                  id={`${id}-unit`}
                  className="h-10 w-full rounded-md border bg-background px-3"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value as StayChoice["unit"] })}
                >
                  <option value="stay">Whole group / entire stay</option>
                  <option value="room-night">One room / one night</option>
                  <option value="person-night">One person or bed / one night</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`${id}-extras`}>Extra fees for whole stay ({brief.currency})</Label>
                <Input
                  id={`${id}-extras`}
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  required
                  value={form.extras}
                  onChange={(e) => setForm({ ...form, extras: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Include taxes, cleaning and service fees not already in the quote. All amounts must
                be in {brief.currency}; no currency conversion is assumed.
              </p>
              <Button disabled={busy || (saved.isPending && !!tripId)} type="submit">
                {busy ? "Saving…" : "Choose & recalculate"}
              </Button>
              {active && (
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => choose(null)}
                >
                  Remove stay choice
                </Button>
              )}
            </form>
          </details>
          {saved.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Your saved accommodation could not load. Refresh to try again.
            </p>
          )}
          {selected && !active && (
            <p className="mt-3 text-sm text-primary">
              Your previous quote was for different dates, guests, currency or destination. Recheck
              it before selecting again.
            </p>
          )}
        </>
      )}
      <div className="mt-5 rounded-xl bg-secondary/10 p-4">
        <p className="font-semibold">
          {budget.quoted === null ? "Accommodation allowance" : "Chosen accommodation"}:{" "}
          {money(budget.accommodation)}
        </p>
        {budget.nights > 0 && (
          <p className="mt-1 text-sm">
            {money(budget.accommodation / budget.nights)} / night for the group
            {budget.quoted === null
              ? " · spending target, not a hotel quote"
              : active?.evidence === "demo"
                ? " · DEMONSTRATION price"
                : active?.evidence === "live-search"
                  ? " · based on an advertised search estimate"
                  : " · based on your entered quote"}
          </p>
        )}
        <p className="mt-2 text-sm">
          {money(budget.remaining)} left for food, tickets, local transport and buffer.
        </p>
        {budget.shortfall > 0 ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Flights and accommodation exceed your trip budget by {money(budget.shortfall)}. Choose a
            cheaper stay or increase the budget.
          </p>
        ) : (
          <p className="mt-1 text-sm">
            About {money(budget.remaining / brief.days)} / day for the group ·{" "}
            {money(budget.remaining / brief.days / brief.travelers)} / person, after{" "}
            {brief.flightBudget !== undefined ? "flights and accommodation" : "accommodation"}.
          </p>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium">
            See daily budget after{" "}
            {brief.flightBudget !== undefined ? "flights and accommodation" : "accommodation"}
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {budget.daily.map((day) => (
              <li key={day.day}>
                Day {day.day} · {day.date}: {money(day.amount)} group · {money(day.perPerson)} /
                person
              </li>
            ))}
          </ul>
        </details>
        <p className="mt-3 text-xs text-muted-foreground">
          This replaces the stay allowance rather than adding it twice. It is a plan, not an expense
          or a booking.{" "}
          {brief.flightBudget !== undefined
            ? "Flights are already reserved in the overview above; food and transport still need checking."
            : "Flight costs are excluded; food and transport still need checking."}
        </p>
      </div>
    </section>
  );
}
