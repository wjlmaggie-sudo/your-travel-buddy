import { useEffect, useState, type RefObject, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, MapPin, MessageCircle, SlidersHorizontal } from "lucide-react";
import type { PlannerDraft } from "@/lib/planner-draft";
import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { PersonaPreferences } from "./PersonaPreferences";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/** A phone-sized setup flow that shares the maintained planner state and generation logic. */
export function MobileTripSetup({
  draft,
  onChange,
  budgetInput,
  onBudgetInput,
  formRef,
  onSubmit,
  busy,
  onDiscover,
  onPreferences,
}: {
  draft: PlannerDraft;
  onChange: (draft: PlannerDraft) => void;
  budgetInput: string;
  onBudgetInput: (value: string) => void;
  formRef: RefObject<HTMLFormElement | null>;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
  onDiscover: () => void;
  onPreferences: () => void;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);
  return (
    <div className="mobile-setup">
      <div className="mobile-setup-progress" aria-label={`Trip setup, step ${step + 1} of 3`}>
        {["Where", "When & who", "Your budget"].map((name, index) => (
          <span key={name} aria-current={step === index ? "step" : undefined}>
            <i className={index <= step ? "is-filled" : ""} />
            {name}
          </span>
        ))}
      </div>
      <p className="companion-eyebrow mt-7">
        {["A NEW ADVENTURE", "MAKE IT YOURS", "TRAVEL AT YOUR PACE"][step]}
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">
        {["Where to next?", "A little more about your trip.", "A budget that fits you."][step]}
      </h1>
      <p className="mb-6 mt-3 text-sm leading-relaxed text-muted-foreground">
        {
          [
            "Start with a place. We’ll help with the rest.",
            "We’ll arrange the days around your group.",
            "Keep it comfortable. Everything stays editable.",
          ][step]
        }
      </p>
      <form
        ref={formRef}
        onSubmit={(event) => {
          if (step < 2) {
            event.preventDefault();
            setStep(step + 1);
          } else onSubmit(event);
        }}
      >
        <fieldset disabled={busy} className="space-y-5">
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="mobile-destination">Destination</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-primary" />
                  <Input
                    id="mobile-destination"
                    required
                    maxLength={200}
                    className="h-12 pl-10"
                    placeholder="City or region, country"
                    value={draft.destination}
                    onChange={(e) => onChange({ ...draft, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Lisbon, Portugal", "Kyoto, Japan", "Bali, Indonesia"].map((place) => (
                  <button
                    type="button"
                    key={place}
                    className="mobile-destination-chip"
                    onClick={() => onChange({ ...draft, destination: place })}
                  >
                    {place.split(",")[0]}
                  </button>
                ))}
              </div>
              <button type="button" className="mobile-discovery-card" onClick={onDiscover}>
                <MessageCircle className="h-6 w-6 text-secondary" />
                <span>
                  <strong>Not sure where?</strong>
                  <small>Find a place with AiTravel</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <div>
                <Label htmlFor="mobile-start">Departure date</Label>
                <Input
                  id="mobile-start"
                  type="date"
                  required
                  className="mt-2 h-12"
                  value={draft.start}
                  onChange={(e) => onChange({ ...draft, start: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobile-days">Days away</Label>
                  <Input
                    id="mobile-days"
                    type="number"
                    inputMode="numeric"
                    required
                    min={1}
                    max={30}
                    className="mt-2 h-12"
                    value={draft.days}
                    onChange={(e) => onChange({ ...draft, days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-people">Travellers</Label>
                  <Input
                    id="mobile-people"
                    type="number"
                    inputMode="numeric"
                    required
                    min={1}
                    max={20}
                    className="mt-2 h-12"
                    value={draft.travelers}
                    onChange={(e) => onChange({ ...draft, travelers: Number(e.target.value) })}
                  />
                </div>
              </div>
              <details className="mobile-setup-details">
                <summary>Family, business or budget travel</summary>
                <div className="mt-4">
                  <PersonaPreferences
                    value={draft}
                    travelers={draft.travelers}
                    onChange={(next) =>
                      onChange({
                        ...draft,
                        ...next,
                        travelers: Math.max(draft.travelers, childCount(next) + 1),
                      })
                    }
                  />
                </div>
              </details>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <Label htmlFor="mobile-budget">Total group budget ({draft.currency})</Label>
                <Input
                  id="mobile-budget"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000000}
                  step="0.01"
                  className="mt-2 h-12"
                  placeholder="Leave blank for a suggestion"
                  value={budgetInput}
                  onChange={(e) => {
                    onBudgetInput(e.target.value);
                    onChange({ ...draft, budget: Number(e.target.value) });
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  For the whole trip and everyone travelling. A blank budget gets a starting
                  estimate.
                </p>
              </div>
              <details className="mobile-setup-details">
                <summary>Add departure city for flights</summary>
                <div className="mt-3">
                  <Label htmlFor="mobile-departure">Departure city or airport</Label>
                  <Input
                    id="mobile-departure"
                    className="mt-2 h-12"
                    maxLength={200}
                    placeholder="Optional, e.g. Berlin"
                    value={draft.journey?.departure ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        journey: {
                          ...draft.journey,
                          departure: e.target.value,
                          flightsRequired: !!e.target.value.trim(),
                          flightBudget: 0,
                          hotelComfort: draft.journey?.hotelComfort ?? "Comfortable",
                        },
                      })
                    }
                  />
                </div>
              </details>
              <Button variant="outline" type="button" className="w-full" onClick={onPreferences}>
                <SlidersHorizontal size={16} className="mr-2" />
                Currency, travel style & interests
              </Button>
              <div className="mobile-setup-recap">
                <span>{draft.destination}</span>
                <small>
                  {draft.start} · {draft.days} days · {draft.travelers} travellers
                </small>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-12"
                aria-label="Previous setup step"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            <Button type="submit" className="h-12 flex-1">
              {busy ? "Preparing your trip…" : step === 2 ? "Build my trip" : "Continue"}
              {!busy && <ArrowRight size={17} className="ml-2" />}
            </Button>
          </div>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Plan freely. An account is optional.
      </p>
    </div>
  );
}
