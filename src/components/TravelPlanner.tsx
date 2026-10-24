import { PersonaPreferences } from "./PersonaPreferences";
import { useEffect, useRef, useState } from "react";
import { Compass, MapPin, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  TravelWorkspace,
  WorkspacePanel,
  BudgetSummary,
  type BudgetSnapshot,
} from "./TravelWorkspace";
import { TravelTools } from "./TravelTools";
import { InstantPlan } from "./InstantPlan";
import { SECTIONS, type TravelSection } from "@/lib/travel-workspace";
import {
  readPlannerDraft,
  readGuestSimulation,
  plannerDraftSchema,
  type PlannerDraft,
} from "@/lib/planner-draft";
import { createJourneyIdeas } from "@/lib/journey-plan";
import { flightAllowance } from "@/lib/journey-planning";
import { budgetTravelStyle } from "@/lib/starter-plan";
import { STYLES, INTERESTS, estimatedBudget } from "@/lib/planning";
import type { TripIdeas } from "../../supabase/functions/_shared/trip-ideas";

export function TravelPlanner() {
  const preferencesTrigger = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<PlannerDraft>(() => ({
    destination: "",
    start: new Date().toISOString().slice(0, 10),
    days: 5,
    travelers: 2,
    budget: 1500,
    currency: "EUR",
    style: "Balanced",
    interest: "Food & culture",
    journey: {
      departure: "",
      flightBudget: 0,
      hotelComfort: "Comfortable",
      flightsRequired: false,
    },
  }));
  const [pendingPlan, setPendingPlan] = useState<PlannerDraft | null>(null);
  const [budget, setBudget] = useState<BudgetSnapshot | null>(null);
  const [section, setSection] = useState<TravelSection>("planner"),
    [editing, setEditing] = useState(true),
    [preferences, setPreferences] = useState(false),
    [edited, setEdited] = useState(false);
  const [result, setResult] = useState<{
    brief: PlannerDraft;
    ideas: TripIdeas;
    revision: number;
  } | null>(null);
  useEffect(() => {
    const saved = readGuestSimulation() ?? readPlannerDraft();
    if (saved) {
      setDraft(saved);
      if (saved.ideas) {
        setResult({ brief: saved, ideas: saved.ideas, revision: 1 });
        setEditing(false);
      }
    }
  }, []);
  function generate(event: React.FormEvent) {
    event.preventDefault();
    const includeFlights =
      draft.journey?.flightsRequired !== false && !!draft.journey?.departure.trim();
    const parsed = plannerDraftSchema.safeParse({
      ...draft,
      journey: {
        ...draft.journey,
        flightsRequired: includeFlights,
        flightBudget: includeFlights ? flightAllowance(draft.budget) : 0,
        departure: draft.journey?.departure ?? "",
        hotelComfort: draft.journey?.hotelComfort ?? "Comfortable",
        selectedFlight: undefined,
      },
      ideas: undefined,
      stay: undefined,
    });
    if (!parsed.success) {
      toast.error(
        "Check the destination, dates, budget and group. Enter every child’s age (0–17) and include at least one adult.",
      );
      return;
    }
    if (result && edited) {
      setPendingPlan(parsed.data);
      return;
    }
    applyPlan(parsed.data);
  }
  function applyPlan(next: PlannerDraft) {
    const ideas = createJourneyIdeas(next, next.journey!);
    setResult((current) => ({
      brief: { ...next, style: budgetTravelStyle(next) },
      ideas,
      revision: (current?.revision ?? 0) + 1,
    }));
    setEdited(false);
    setEditing(false);
    setPendingPlan(null);
  }
  const planned = result?.brief ?? draft;
  return (
    <section
      id="plan-your-trip"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
      aria-label="Guest travel planner"
    >
      <span className="sr-only" role="status">
        {result
          ? "Your trip plan is ready. Choose a section to explore or edit your trip details."
          : ""}
      </span>
      <Dialog
        open={!!pendingPlan}
        onOpenChange={(open) => {
          if (!open) setPendingPlan(null);
        }}
      >
        <DialogContent
          className="w-[calc(100%_-_2rem)] rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Rebuild this simulation?</DialogTitle>
            <DialogDescription>
              This replaces edited activities and selected offers in the current simulation. Saved
              account trips are not changed.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              if (pendingPlan) applyPlan(pendingPlan);
            }}
          >
            Rebuild and replace edits
          </Button>
          <Button variant="outline" onClick={() => setPendingPlan(null)}>
            Keep my edits
          </Button>
        </DialogContent>
      </Dialog>
      <TravelWorkspace
        section={section}
        onChange={setSection}
        title={
          result
            ? `${result.brief.destination} · ${result.brief.days} days`
            : "Make room for your next adventure"
        }
        summary={
          result && budget ? (
            <BudgetSummary {...budget} />
          ) : (
            <span className="text-secondary">Guest-friendly · free</span>
          )
        }
      >
        <WorkspacePanel
          active={section === "planner" && (!result || editing)}
          label="Plan your trip"
        >
          <div className="mx-auto max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-secondary">
              A whole trip, with less effort
            </p>
            <h2 id="planner-heading" className="mt-2 text-3xl font-semibold">
              Your next adventure starts here.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A few details are all you need. Explore every section without an account.
            </p>
            <form className="mt-6 space-y-5" onSubmit={generate}>
              <div>
                <Label htmlFor="planner-destination">Where would you love to go?</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-primary" />
                  <Input
                    id="planner-destination"
                    className="h-12 pl-10"
                    placeholder="City or region, country"
                    required
                    maxLength={200}
                    value={draft.destination}
                    onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Lisbon, Portugal", "Kyoto, Japan", "Bali, Indonesia"].map((place) => (
                    <button
                      key={place}
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                      onClick={() => setDraft({ ...draft, destination: place })}
                    >
                      {place.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planner-start">When do you leave?</Label>
                  <Input
                    id="planner-start"
                    type="date"
                    className="mt-2 h-11"
                    required
                    value={draft.start}
                    onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="planner-days">How many days?</Label>
                  <Input
                    id="planner-days"
                    type="number"
                    className="mt-2 h-11"
                    min={1}
                    max={30}
                    required
                    value={draft.days}
                    onChange={(e) => setDraft({ ...draft, days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="planner-travelers">How many people?</Label>
                  <Input
                    id="planner-travelers"
                    type="number"
                    className="mt-2 h-11"
                    min={1}
                    max={20}
                    required
                    value={draft.travelers}
                    onChange={(e) => setDraft({ ...draft, travelers: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="planner-budget">Total group budget ({draft.currency})</Label>
                  <Input
                    id="planner-budget"
                    type="number"
                    className="mt-2 h-11"
                    min={0}
                    max={1000000}
                    step="0.01"
                    required
                    value={draft.budget}
                    onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
              <PersonaPreferences
                value={draft}
                travelers={draft.travelers}
                onChange={(next) => setDraft({ ...draft, ...next })}
              />
              <div>
                <Label htmlFor="planner-departure">Departure city / airport</Label>
                <Input
                  id="planner-departure"
                  className="mt-2 h-11"
                  placeholder="Optional · add it for flight comparisons"
                  maxLength={200}
                  value={draft.journey?.departure ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      journey: {
                        ...draft.journey,
                        departure: e.target.value,
                        flightsRequired: !!e.target.value.trim(),
                        flightBudget: flightAllowance(draft.budget),
                        hotelComfort: draft.journey?.hotelComfort ?? "Comfortable",
                      },
                    })
                  }
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Leave blank to plan without flights. You can add flights later.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="h-11">
                  {result ? "Rebuild my whole trip" : "Create my travel plan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  ref={preferencesTrigger}
                  onClick={() => setPreferences(true)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Preferences
                </Button>
                {result && (
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Back to overview
                  </Button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Free template suggestions · yours to edit. Check Hotels for provider connection
                status. Live AI and live flight offers are not connected. Demo prices are clearly
                labeled.
              </p>
            </form>
          </div>
        </WorkspacePanel>
        <Dialog open={preferences} onOpenChange={setPreferences}>
          <DialogContent
            className="max-h-[85svh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              preferencesTrigger.current?.focus({ preventScroll: true });
            }}
          >
            <DialogHeader>
              <DialogTitle>Make the trip your own</DialogTitle>
              <DialogDescription>
                Optional preferences. Changes take effect when you generate or rebuild your plan.
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="planner-currency">Currency</Label>
              <select
                id="planner-currency"
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              >
                {Intl.supportedValuesOf("currency").map((code) => (
                  <option key={code}>{code}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Changing currency does not convert the amount.
              </p>
            </div>
            <div aria-label="Compare budget presets" className="grid grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <Button
                  variant="outline"
                  key={style}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      style,
                      currency: "EUR",
                      budget: estimatedBudget(draft.days, draft.travelers, style),
                    })
                  }
                >
                  {style} · €{estimatedBudget(draft.days, draft.travelers, style)}
                </Button>
              ))}
            </div>
            <div>
              <Label htmlFor="planner-interest">What do you enjoy?</Label>
              <select
                id="planner-interest"
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                value={draft.interest}
                onChange={(e) => setDraft({ ...draft, interest: e.target.value })}
              >
                {INTERESTS.map((interest) => (
                  <option key={interest}>{interest}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => setPreferences(false)}>Done</Button>
          </DialogContent>
        </Dialog>
        {!result && !["planner", "currency", "weather"].includes(section) && (
          <WorkspacePanel
            active
            label={SECTIONS.find((item) => item.id === section)?.label ?? "Travel options"}
          >
            <div className="mx-auto max-w-lg py-12 text-center">
              <Compass className="mx-auto h-10 w-10 text-secondary" />
              <h2 className="mt-4 text-3xl font-semibold">Start with your trip.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Your destination, dates and budget connect every recommendation. No sign-in needed.
              </p>
              <Button className="mt-5" onClick={() => setSection("planner")}>
                Open travel planner
              </Button>
            </div>
          </WorkspacePanel>
        )}
        {result && (
          <InstantPlan
            key={result.revision}
            section={section}
            overviewActive={!editing}
            onEditBrief={() => setEditing(true)}
            onSectionChange={setSection}
            brief={result.brief}
            initialIdeas={result.ideas}
            onBudgetChange={setBudget}
            onEdited={() => setEdited(true)}
          />
        )}
        <TravelTools
          key={`${planned.destination}-${planned.start}-${planned.days}`}
          section={section}
          currency={planned.currency}
          destination={planned.destination}
          start={planned.start}
          days={Math.min(30, Math.max(1, planned.days))}
        />
      </TravelWorkspace>
    </section>
  );
}
