import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { stayBudget, type StayChoice } from "@/lib/stay-planning";
import { flightCost, connectedBudget } from "@/lib/travel-workspace";
import { createJourneyIdeas } from "@/lib/journey-plan";
import type { Journey } from "@/lib/journey-planning";
import { createStarterIdeas } from "@/lib/starter-plan";
import { useTripPreferences } from "@/lib/travel-preferences";
import {
  prepareSuggestedPlan,
  saveSuggestedPlan,
  type SuggestedActivity,
} from "@/lib/suggested-plan";
import { dailyBudgets, budgetAllocation } from "@/lib/planning";
import { DayVisuals } from "./DayVisuals";
import { searchDestinations, nearbyPlaces } from "@/lib/place-directory";
import { tripDays } from "@/lib/trips";
import { DayBudgetSummary } from "@/components/DailyBudget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  journey?: Journey | null | undefined;
  stayChoice?: StayChoice | null | undefined;
  trip: Tables<"trips">;
  activities: Tables<"activities">[];
  autoGenerate?: boolean;
  onSaved: () => void;
  onApplied: () => void;
};
export function TripSuggestions({
  trip,
  stayChoice,
  journey,
  activities,
  autoGenerate = false,
  onSaved,
  onApplied,
}: Props) {
  const preferences = useTripPreferences(trip.id);
  const [interests, setInterests] = useState("");
  const [useDirectory, setUseDirectory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [directoryNote, setDirectoryNote] = useState("");
  const [summary, setSummary] = useState("");
  const [draft, setDraft] = useState<SuggestedActivity[]>([]);
  const [applied, setApplied] = useState<number[]>([]);
  const started = useRef(false);
  const days = tripDays(trip.start_date, trip.end_date);
  const budgets = dailyBudgets(
    Number(trip.budget),
    days,
    preferences.preference.travelers,
    trip.start_date,
  );
  const connected = journey
    ? connectedBudget(
        {
          destination: trip.destination,
          start: trip.start_date,
          days,
          travelers: preferences.preference.travelers,
          budget: Number(trip.budget),
          currency: trip.currency,
          style: preferences.preference.style,
          persona: preferences.preference.persona,
          childrenAges: preferences.preference.childrenAges,
          childrenAgeRanges: preferences.preference.childrenAgeRanges,
        },
        journey,
        stayChoice,
      )
    : null;
  const stayPlan = stayBudget(
    {
      ...(journey
        ? {
            flightBudget: flightCost(
              {
                destination: trip.destination,
                start: trip.start_date,
                days,
                travelers: preferences.preference.travelers,
                budget: Number(trip.budget),
                currency: trip.currency,
                style: preferences.preference.style,
                persona: preferences.preference.persona,
                childrenAges: preferences.preference.childrenAges,
                childrenAgeRanges: preferences.preference.childrenAgeRanges,
              },
              journey,
            ),
            hotelComfort: journey.hotelComfort,
          }
        : {}),
      destination: trip.destination,
      start: trip.start_date,
      days,
      travelers: preferences.preference.travelers,
      budget: Number(trip.budget),
      currency: trip.currency,
      style: preferences.preference.style,
      persona: preferences.preference.persona,
      childrenAges: preferences.preference.childrenAges,
      childrenAgeRanges: preferences.preference.childrenAgeRanges,
    },
    stayChoice,
  );
  async function run() {
    if (
      draft.length &&
      !window.confirm("Replace the unsaved suggestion? Your saved itinerary will stay unchanged.")
    )
      return;
    setLoading(true);
    setError("");
    setDirectoryNote("");
    setStatus("Planning your entire trip…");
    try {
      let places: { name: string; kind: string }[] = [];
      if (useDirectory) {
        setStatus("Finding local places for your trip…");
        try {
          const locations = await searchDestinations(trip.destination);
          const location = locations[0];
          if (location) {
            const found = await nearbyPlaces(location);
            // Keep a mix instead of filling the prompt with one category.
            places = ["Attractions", "Food & drink", "Shops"]
              .flatMap((category) => found.filter((p) => p.category === category).slice(0, 6))
              .map((p) => ({ name: p.name, kind: p.kind }));
            setDirectoryNote(
              places.length
                ? `Includes ${places.length} reference places from the local directory near ${location.name}. Verify current hours and access.`
                : "No local directory entries were found. Review suggested place names before visiting.",
            );
          }
        } catch {
          setDirectoryNote(
            "The local place directory was unavailable. This suggestion uses templates; verify place names and opening hours.",
          );
        }
      }
      setStatus(`Planning all ${days} days. This can take a minute…`);
      const input = {
        destination: trip.destination,
        days,
        interests: interests || preferences.preference.interest,
        travelers: preferences.preference.travelers,
        budget: Number(trip.budget),
        currency: trip.currency,
        style: preferences.preference.style,
        persona: preferences.preference.persona,
        childrenAges: preferences.preference.childrenAges,
        childrenAgeRanges: preferences.preference.childrenAgeRanges,
        places,
      };
      const ideas = journey
        ? createJourneyIdeas(
            { ...input, start: trip.start_date, interest: input.interests },
            journey,
            stayChoice,
            places,
          )
        : createStarterIdeas(input);
      setDraft(prepareSuggestedPlan(trip.id, ideas, activities));
      setSummary(ideas.summary ?? "A complete, editable template plan based on your trip details.");
      setApplied([]);
    } catch {
      setError(
        "Could not generate a plan. Your saved itinerary is safe; try again or add activities manually.",
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  }
  useEffect(() => {
    if (autoGenerate && !preferences.isPending && !preferences.isError && !started.current) {
      started.current = true;
      void run();
    }
  }, [autoGenerate, preferences.isPending, preferences.isError]);
  function update(id: string, field: "title" | "time" | "location" | "notes", value: string) {
    setDraft((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }
  async function apply(day?: number) {
    const remaining = draft.filter(
      (item) => !applied.includes(item.day) && (day === undefined || item.day === day),
    );
    if (!remaining.length) return;
    if (remaining.some((item) => !item.title.trim())) {
      toast.error("Give each activity a title before saving.");
      return;
    }
    setSaving(true);
    try {
      await saveSuggestedPlan(remaining);
      setApplied((current) => [...new Set([...current, ...remaining.map((item) => item.day)])]);
      toast.success(
        day === undefined
          ? "Your whole suggested itinerary is saved. Every activity can be edited."
          : `Day ${day} saved.`,
      );
      onSaved();
      if (day === undefined) onApplied();
    } catch {
      toast.error("The plan could not be saved. Your draft is still here; try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-2xl font-semibold">Your whole trip, suggested</h2>
        <p className="mt-2 text-muted-foreground">
          Get a day-by-day plan for all {days} days in {trip.destination}. Edit anything below, then
          save the whole itinerary in one step.
        </p>
        <details className="mt-4 rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Personalize this plan (optional)
          </summary>
          <Label htmlFor="plan-interests" className="mt-4 block">
            What would make this trip yours?
          </Label>
          <Textarea
            id="plan-interests"
            className="mt-2"
            maxLength={500}
            placeholder={preferences.preference.interest}
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            disabled={loading || saving}
          />
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDirectory}
              onChange={(e) => setUseDirectory(e.target.checked)}
              disabled={loading || saving}
              className="mt-1"
            />
            Include local directory places when available
          </label>
        </details>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={() => run()}
            disabled={loading || saving || preferences.isPending || preferences.isError}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {loading ? "Planning…" : draft.length ? "Create another plan" : "Create my travel plan"}
          </Button>
          {draft.length > 0 && (
            <Button
              variant="secondary"
              disabled={saving || loading || draft.every((item) => applied.includes(item.day))}
              onClick={() => apply()}
            >
              {saving ? "Saving…" : "Save whole itinerary"}
            </Button>
          )}
        </div>
        {status && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {preferences.isError && (
          <p className="mt-3 text-sm text-destructive">
            Your travel settings could not load. Refresh the page to try again.
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Free template planner · no AI API key or AI charges. Suggestions and daily spending limits
          are estimates.{" "}
          {journey
            ? "The budget includes flight selections or allowances."
            : "Flights are excluded until configured."}{" "}
          Existing saved activities are kept. New activities are added only when you save.
        </p>
      </section>
      {draft.length > 0 && (
        <>
          <section className="rounded-xl border bg-muted/40 p-5">
            <p>{summary}</p>
            {directoryNote && (
              <p className="mt-2 text-xs text-muted-foreground">
                {directoryNote} Place references: Wikipedia and ©{" "}
                <a
                  className="underline"
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenStreetMap contributors
                </a>
                .
              </p>
            )}
          </section>
          {budgets.map((budget) => {
            const items = draft.filter((item) => item.day === budget.day);
            const saved = applied.includes(budget.day);
            return (
              <section key={budget.day} className="rounded-xl border bg-card p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold">
                    Day {budget.day}{" "}
                    <span className="text-base text-muted-foreground">· {budget.date}</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving || loading || saved || !items.length}
                    onClick={() => apply(budget.day)}
                  >
                    {saved ? "Saved" : "Save this day"}
                  </Button>
                </div>
                <DayBudgetSummary
                  afterStay={
                    journey || stayPlan.quoted !== null || !stayPlan.nights
                      ? stayPlan.daily[budget.day - 1]?.amount
                      : undefined
                  }
                  includesFlights={!!journey}
                  amount={budget.amount}
                  travelers={preferences.preference.travelers}
                  currency={trip.currency}
                  style={preferences.preference.style}
                />
                <div className="space-y-4">
                  <DayVisuals
                    ticketBudget={
                      trip.currency === "EUR" && journey
                        ? (connected?.estimates.activities ?? 0) / days
                        : undefined
                    }
                    travelers={preferences.preference.travelers}
                    date={budget.date}
                    destination={trip.destination}
                    day={budget.day}
                    style={preferences.preference.style}
                    foodPerPerson={
                      trip.currency === "EUR"
                        ? journey
                          ? (connected?.estimates.food ?? 0) /
                            days /
                            preferences.preference.travelers
                          : (budgetAllocation(budget.amount, preferences.preference.style).find(
                              (item) => item.label === "Food",
                            )?.amount ?? 0) / preferences.preference.travelers
                        : undefined
                    }
                  />
                  {items.map((item, index) => (
                    <details key={item.id} className="rounded-lg border">
                      <summary className="cursor-pointer p-4 text-sm">
                        <span className="mr-2 text-primary">{item.time}</span>
                        {item.title || "Your activity"}
                        <span className="ml-2 text-xs text-muted-foreground">· Edit details</span>
                      </summary>
                      <fieldset
                        key={item.id}
                        disabled={saving || loading || saved}
                        className="rounded-lg border p-4"
                      >
                        <legend className="px-1 text-sm text-muted-foreground">
                          Activity {index + 1}
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
                          <div>
                            <Label htmlFor={`suggestion-time-${item.id}`}>Time</Label>
                            <Input
                              id={`suggestion-time-${item.id}`}
                              type="time"
                              value={item.time}
                              onChange={(e) => update(item.id, "time", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`suggestion-title-${item.id}`}>Activity</Label>
                            <Input
                              id={`suggestion-title-${item.id}`}
                              required
                              maxLength={200}
                              value={item.title}
                              onChange={(e) => update(item.id, "title", e.target.value)}
                            />
                          </div>
                        </div>
                        <Label htmlFor={`suggestion-location-${item.id}`} className="mt-3 block">
                          Place
                        </Label>
                        <Input
                          id={`suggestion-location-${item.id}`}
                          maxLength={300}
                          value={item.location}
                          onChange={(e) => update(item.id, "location", e.target.value)}
                        />
                        <Label htmlFor={`suggestion-notes-${item.id}`} className="mt-3 block">
                          Notes
                        </Label>
                        <Textarea
                          id={`suggestion-notes-${item.id}`}
                          maxLength={1000}
                          value={item.notes}
                          onChange={(e) => update(item.id, "notes", e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            setDraft((current) => current.filter((a) => a.id !== item.id))
                          }
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </fieldset>
                    </details>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  disabled={saved || saving || loading}
                  onClick={() =>
                    setDraft((current) => [
                      ...current,
                      {
                        id: crypto.randomUUID(),
                        trip_id: trip.id,
                        day: budget.day,
                        position:
                          Math.max(
                            -1,
                            ...current.filter((a) => a.day === budget.day).map((a) => a.position),
                          ) + 1,
                        time: "",
                        title: "",
                        location: trip.destination,
                        notes: "",
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add an activity
                </Button>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
