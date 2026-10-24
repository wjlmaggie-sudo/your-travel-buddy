import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { personaFields, validParty } from "../../supabase/functions/_shared/travel-persona";
import { PersonaPreferences } from "./PersonaPreferences";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import {
  prepareSuggestedPlan,
  saveSuggestedPlan,
  type SuggestedActivity,
} from "@/lib/suggested-plan";
import { readPlannerDraft, clearPlannerDraft } from "@/lib/planner-draft";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES, type TravelStyle } from "@/lib/travel-data";
import { endDate, estimatedBudget, templateActivities, STYLES, INTERESTS } from "@/lib/planning";
import { saveJourney } from "@/lib/journey-planning";
import { saveStayChoice } from "@/lib/stay-planning";
import { DEFAULT_PREFERENCES, saveTripPreferences } from "@/lib/travel-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function NewTripDialog({
  open,
  onOpenChange,
  templateId = "",
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  templateId?: string;
}) {
  const template = TEMPLATES.find((t) => t.id === templateId);
  const [imported] = useState(() => (!template ? readPlannerDraft() : null));
  const [createdTrip, setCreatedTrip] = useState<Tables<"trips"> | null>(null);
  const [plannedActivities, setPlannedActivities] = useState<SuggestedActivity[] | null>(null);
  const [f, setF] = useState(() => ({
    destination: template?.destination ?? "",
    start: new Date().toISOString().slice(0, 10),
    days: template?.days ?? 5,
    travelers: 2,
    budget: template ? template.price * 2 : 1500,
    currency: "EUR",
    style: "Balanced" as TravelStyle,
    interest: template?.category ?? "Food & culture",
    persona: imported?.persona,
    childrenAges: imported?.childrenAges,
    childrenAgeRanges: imported?.childrenAgeRanges,
    ...imported,
  }));
  const [requestAi, setRequestAi] = useState(!template && !imported?.ideas);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (
      !validParty(f) ||
      !personaFields.childrenAges.safeParse(f.childrenAges).success ||
      !personaFields.childrenAgeRanges.safeParse(f.childrenAgeRanges).success ||
      !f.destination.trim() ||
      !Number.isInteger(f.days) ||
      f.days < 1 ||
      f.days > 30 ||
      !Number.isInteger(f.travelers) ||
      f.travelers < 1 ||
      f.travelers > 20 ||
      !Number.isFinite(f.budget) ||
      f.budget < 0
    ) {
      toast.error("Check trip details and child ages (0–17); include at least one adult.");
      return;
    }
    setBusy(true);
    try {
      const response = createdTrip
        ? { data: createdTrip, error: null }
        : await supabase
            .from("trips")
            .insert({
              destination: f.destination.trim(),
              start_date: f.start,
              end_date: endDate(f.start, f.days),
              budget: f.budget,
              currency: f.currency,
            })
            .select()
            .single();
      const { data, error } = response;
      if (error) throw error;
      if (!data) throw new Error("The trip could not be created.");
      setCreatedTrip(data);
      try {
        await saveTripPreferences(data.id, {
          ...DEFAULT_PREFERENCES,
          travelers: f.travelers,
          style: f.style,
          interest: f.interest,
          persona: f.persona,
          childrenAges: f.childrenAges,
          childrenAgeRanges: f.childrenAgeRanges,
        });
      } catch {
        toast.error(
          "Trip created, but travel settings could not save. Update them on the trip page.",
        );
      }
      if (template && f.destination.trim() === template.destination && !requestAi) {
        const { error: activityError } = await supabase
          .from("activities")
          .insert(templateActivities(template.id, f.days).map((a) => ({ ...a, trip_id: data.id })));
        if (activityError)
          toast.error(
            "Trip created, but template activities could not save. Add activities on your trip page.",
          );
      }
      if (imported?.journey) await saveJourney(data.id, imported.journey);
      if (imported?.stay) await saveStayChoice(data.id, imported.stay);
      if (imported?.ideas) {
        const items = plannedActivities ?? prepareSuggestedPlan(data.id, imported.ideas, []);
        setPlannedActivities(items);
        try {
          await saveSuggestedPlan(items);
        } catch {
          throw new Error(
            "Your trip was created, but the itinerary could not save. Keep this window open and retry saving.",
          );
        }
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["trips"] }),
        qc.invalidateQueries({ queryKey: ["travel-preferences"] }),
      ]);
      if (!template) clearPlannerDraft();
      onOpenChange(false);
      navigate({
        to: "/trips/$tripId",
        params: { tripId: data.id },
        ...(requestAi && !imported?.ideas ? { search: { suggest: true } } : {}),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create trip. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {imported?.ideas
              ? "Save your complete plan"
              : template
                ? template.name
                : "Your next story"}
          </DialogTitle>
          <DialogDescription>
            {imported?.ideas
              ? "Your itinerary and edits are ready. Confirm the details and save every day to your account."
              : template
                ? "Make this template your own. Suggested activities are added when you keep its destination."
                : "Set a destination, a little time, and a budget for the whole group."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={create} className="space-y-4">
          {!imported?.ideas && (
            <PersonaPreferences
              value={f}
              travelers={f.travelers}
              onChange={(next) =>
                setF({ ...f, ...next, travelers: Math.max(f.travelers, childCount(next) + 1) })
              }
            />
          )}
          {imported?.ideas && (
            <p className="text-sm text-muted-foreground">
              {f.destination} · {f.days} days · {f.travelers} travelers · {f.start} · {f.budget}{" "}
              {f.currency} group budget
            </p>
          )}
          <details open={!imported?.ideas}>
            <summary className="mb-3 cursor-pointer text-sm font-medium">
              Confirm or adjust trip details
            </summary>
            <fieldset disabled={!!createdTrip || busy} className="space-y-4">
              <div>
                <Label htmlFor="new-destination">Destination</Label>
                <Input
                  id="new-destination"
                  className="mt-2"
                  required
                  readOnly={!!imported?.ideas}
                  maxLength={200}
                  value={f.destination}
                  onChange={(e) => setF({ ...f, destination: e.target.value })}
                  placeholder="Lisbon, Portugal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-start">Departure</Label>
                  <Input
                    id="new-start"
                    className="mt-2"
                    type="date"
                    required
                    value={f.start}
                    onChange={(e) => setF({ ...f, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-days">Days</Label>
                  <Input
                    id="new-days"
                    readOnly={!!imported?.ideas}
                    className="mt-2"
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={f.days}
                    onChange={(e) => setF({ ...f, days: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-travelers">Travelers</Label>
                  <Input
                    id="new-travelers"
                    className="mt-2"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={f.travelers}
                    onChange={(e) => setF({ ...f, travelers: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-currency">Currency</Label>
                  <select
                    id="new-currency"
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={f.currency}
                    onChange={(e) => setF({ ...f, currency: e.target.value })}
                  >
                    {Intl.supportedValuesOf("currency").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Budget style</legend>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((style) => (
                    <Button
                      type="button"
                      key={style}
                      variant={f.style === style ? "secondary" : "outline"}
                      aria-pressed={f.style === style}
                      onClick={() =>
                        setF({
                          ...f,
                          style,
                          budget: estimatedBudget(f.days, f.travelers, style),
                          currency: "EUR",
                        })
                      }
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <div>
                <Label htmlFor="new-budget">Total group budget</Label>
                <Input
                  id="new-budget"
                  className="mt-2"
                  type="number"
                  required
                  min={0}
                  max={1000000}
                  step="0.01"
                  value={f.budget}
                  onChange={(e) => setF({ ...f, budget: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="new-interest">What do you love?</Label>
                <select
                  id="new-interest"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={f.interest}
                  onChange={(e) => setF({ ...f, interest: e.target.value })}
                >
                  {INTERESTS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Budget style presets use estimated EUR costs. Edit your total and currency as
                needed.{" "}
                {imported?.journey
                  ? "Flight allowances are included."
                  : "Flights are excluded until added to the trip."}
              </p>
              {!imported?.ideas && (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={requestAi}
                    onChange={(e) => setRequestAi(e.target.checked)}
                    disabled={busy}
                    className="mt-1"
                  />
                  <span>
                    Suggest the whole trip after creating it.
                    <span className="block text-xs text-muted-foreground">
                      You can review and edit every day before saving the suggestion.
                    </span>
                  </span>
                </label>
              )}
            </fieldset>
          </details>
          <Button className="w-full" disabled={busy}>
            {busy ? (
              "Creating…"
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {createdTrip
                  ? "Retry saving itinerary"
                  : imported?.ideas
                    ? "Save whole plan"
                    : "Create trip"}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
