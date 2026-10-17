import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, MapPin, Sparkles, Wallet, Check, Compass } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { budgetAllocation, INTERESTS, STYLES, estimatedBudget } from "@/lib/planning";
import { readPlannerDraft, savePlannerDraft, type PlannerDraft } from "@/lib/planner-draft";
import { TripWeather } from "./TripWeather";

const COLORS = ["bg-secondary", "bg-primary", "bg-amber-500", "bg-sky-600", "bg-stone-400"];
const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export function TravelPlanner() {
  const [draft, setDraft] = useState<PlannerDraft>(() => ({
    destination: "",
    start: new Date().toISOString().slice(0, 10),
    days: 5,
    travelers: 2,
    budget: 1500,
    currency: "EUR",
    style: "Balanced",
    interest: "Food & culture",
  }));
  useEffect(() => {
    const saved = readPlannerDraft();
    if (saved) setDraft(saved);
  }, []);
  const navigate = useNavigate();
  const daily = draft.budget / Math.max(1, draft.days);
  const perPerson = daily / Math.max(1, draft.travelers);
  const allocation = budgetAllocation(daily, draft.style);

  return (
    <section
      id="plan-your-trip"
      aria-labelledby="planner-heading"
      className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12 md:py-16"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            A little structure. A lot of possibility.
          </p>
          <h2 id="planner-heading" className="text-3xl font-semibold md:text-4xl">
            Make room for your next adventure.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start with the essentials. Make every day your own.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs text-secondary">
          <Check className="h-3.5 w-3.5" /> Free to explore · Yours to edit
        </span>
      </div>
      <div className="overflow-hidden rounded-3xl border bg-card shadow-card lg:grid lg:grid-cols-[1.15fr_1fr]">
        <form
          className="space-y-6 p-6 md:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!savePlannerDraft(draft)) {
              toast.error(
                "Your browser could not keep this draft. You can enter the details again after signing in.",
              );
              return;
            }
            navigate({ to: "/trips" });
          }}
        >
          <div className="flex items-center gap-3 text-secondary">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10">
              <Compass className="h-5 w-5" />
            </span>
            <span className="font-medium">Your trip, your way</span>
          </div>
          <div>
            <Label htmlFor="planner-destination">Where would you love to go?</Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
              <Input
                id="planner-destination"
                className="h-11 pl-10"
                placeholder="e.g. Kyoto, Japan"
                required
                maxLength={200}
                value={draft.destination}
                onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Lisbon, Portugal", "Kyoto, Japan", "Bali, Indonesia"].map((place) => (
                <button
                  type="button"
                  key={place}
                  onClick={() => setDraft({ ...draft, destination: place })}
                  className="rounded-full bg-muted/60 px-3 py-1 text-xs transition hover:bg-accent"
                >
                  {place.split(",")[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planner-days">How many days?</Label>
              <Input
                className="mt-2 h-11"
                id="planner-days"
                type="number"
                required
                min={1}
                max={30}
                value={draft.days}
                onChange={(e) => setDraft({ ...draft, days: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="planner-travelers">How many people?</Label>
              <Input
                className="mt-2 h-11"
                id="planner-travelers"
                type="number"
                required
                min={1}
                max={20}
                value={draft.travelers}
                onChange={(e) => setDraft({ ...draft, travelers: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="planner-start">When do you leave?</Label>
            <Input
              id="planner-start"
              className="mt-2 h-11"
              type="date"
              required
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Find your travel rhythm</legend>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  aria-pressed={draft.style === style}
                  className={`rounded-xl border px-2 py-3 text-sm transition ${draft.style === style ? "border-secondary bg-secondary/10 font-semibold text-secondary" : "hover:bg-muted"}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      style,
                      budget: estimatedBudget(
                        Math.max(1, draft.days),
                        Math.max(1, draft.travelers),
                        style,
                      ),
                      currency: "EUR",
                    })
                  }
                >
                  {style}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div>
              <Label htmlFor="planner-budget">Total budget · whole group</Label>
              <Input
                className="mt-2 h-11"
                id="planner-budget"
                type="number"
                required
                min={0}
                max={1000000}
                step="0.01"
                value={draft.budget}
                onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="planner-currency">Currency</Label>
              <select
                id="planner-currency"
                className="mt-2 h-11 w-full rounded-md border bg-background px-2 text-sm"
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              >
                {Intl.supportedValuesOf("currency").map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="planner-interest">What makes a great trip for you?</Label>
            <select
              id="planner-interest"
              className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm"
              value={draft.interest}
              onChange={(e) => setDraft({ ...draft, interest: e.target.value })}
            >
              {INTERESTS.map((interest) => (
                <option key={interest}>{interest}</option>
              ))}
            </select>
          </div>
          <div>
            <Button size="lg" className="w-full" type="submit">
              Build my travel plan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sign in next to save your plan. Your choices come with you.
            </p>
          </div>
        </form>
        <aside
          className="flex flex-col border-t bg-secondary/[0.055] p-6 md:p-8 lg:border-l lg:border-t-0"
          aria-label="Your budget preview"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Your adventure at a glance
          </p>
          <h3 className="mt-3 break-words text-3xl font-semibold">
            {draft.destination.trim() || "Somewhere wonderful"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.days || 1} days · {draft.travelers || 1}{" "}
            {draft.travelers === 1 ? "traveler" : "travelers"} · {draft.style.toLowerCase()} travel
          </p>
          <div className="my-7 grid grid-cols-2 gap-4" aria-live="polite">
            <div className="rounded-2xl border border-secondary/15 bg-card p-4">
              <Wallet className="mb-3 h-4 w-4 text-secondary" />
              <p className="break-words font-display text-3xl">
                {formatMoney(daily, draft.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">per day · whole group</p>
            </div>
            <div className="rounded-2xl border border-secondary/15 bg-card p-4">
              <span className="mb-3 block text-xs text-secondary">SHARED MOMENTS</span>
              <p className="break-words font-display text-3xl">
                {formatMoney(perPerson, draft.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">per person, per day</p>
            </div>
          </div>
          <div className="rounded-2xl bg-card/70 p-5">
            <h4 className="text-sm font-semibold">A little plan for each day</h4>
            <div className="my-4 flex h-2 overflow-hidden rounded-full" aria-hidden="true">
              {allocation.map((item, index) => (
                <div
                  key={item.label}
                  className={COLORS[index]}
                  style={{ width: `${daily > 0 ? (item.amount / daily) * 100 : 20}%` }}
                />
              ))}
            </div>
            <dl className="space-y-3">
              {allocation.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-sm">
                  <dt className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${COLORS[index]}`} />
                    {item.label}
                  </dt>
                  <dd className="font-medium">{formatMoney(item.amount, draft.currency)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Suggested allocation, not live prices. Daily figures are averages; final daily budgets
            account for rounding. Style presets use EUR estimates. Flights are excluded.
          </p>
          <div className="mt-6 flex items-start gap-3 border-t border-secondary/15 pt-5">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">
              A plan with room for you.
              <span className="block text-muted-foreground">
                Review AI suggestions, swap activities, discover local shops, and track spending as
                you go.
              </span>
            </p>
          </div>
          <div className="mt-6">
            <TripWeather
              key={`${draft.destination}-${draft.start}-${draft.days}`}
              destination={draft.destination}
              startDate={draft.start}
              days={Math.min(30, Math.max(1, draft.days))}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
