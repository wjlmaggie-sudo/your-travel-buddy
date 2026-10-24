import { PersonaPreferences } from "./PersonaPreferences";
import { personaSummary } from "@/lib/travel-personas";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useTripPreferences, type TripPreferences } from "@/lib/travel-preferences";
import { budgetAllocation, STYLES, INTERESTS, estimatedBudget } from "@/lib/planning";
import type { TravelStyle } from "@/lib/travel-data";
import { tripDays, money } from "@/lib/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TripSettings({
  trip,
  includesFlights = false,
}: {
  trip: Tables<"trips">;
  includesFlights?: boolean;
}) {
  const prefs = useTripPreferences(trip.id);
  const [draft, setDraft] = useState<TripPreferences | null>(null);
  const [budget, setBudget] = useState(Number(trip.budget));
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const value = draft ?? prefs.preference;
  const days = tripDays(trip.start_date, trip.end_date);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("trips").update({ budget }).eq("id", trip.id);
      if (error) throw error;
      await prefs.save({ ...prefs.preference, ...value });
      toast.success("Travel settings saved");
      setDraft(null);
    } catch {
      toast.error("Could not save all settings. Please try again.");
    } finally {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["trip", trip.id] }),
        qc.invalidateQueries({ queryKey: ["trips"] }),
      ]);
      setBusy(false);
    }
  }
  return (
    <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-2xl font-semibold">A plan for everyone</h2>
      {prefs.isError ? (
        <p className="mt-3 text-destructive">
          Travel settings could not load.{" "}
          <button className="underline" onClick={() => prefs.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">
            {days} days · {prefs.preference.travelers} travelers · {prefs.preference.style} ·{" "}
            {money(Number(trip.budget) / prefs.preference.travelers, trip.currency)} per person ·{" "}
            {money(Number(trip.budget) / prefs.preference.travelers / days, trip.currency)} per
            person / day
          </p>
          {personaSummary(prefs.preference) && (
            <p className="mt-2 text-sm text-secondary">{personaSummary(prefs.preference)}</p>
          )}
          <form onSubmit={save} className="mt-5 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="settings-travelers">Travelers</Label>
              <Input
                id="settings-travelers"
                className="mt-2"
                type="number"
                min={1}
                max={20}
                required
                value={value.travelers}
                onChange={(e) => setDraft({ ...value, travelers: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="settings-style">Budget style</Label>
              <select
                id="settings-style"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={value.style}
                onChange={(e) => setDraft({ ...value, style: e.target.value as TravelStyle })}
              >
                {STYLES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="settings-budget">Group budget ({trip.currency})</Label>
              <Input
                id="settings-budget"
                className="mt-2"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="settings-interest">Interests</Label>
              <select
                id="settings-interest"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={value.interest}
                onChange={(e) => setDraft({ ...value, interest: e.target.value })}
              >
                {INTERESTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <PersonaPreferences
                value={value}
                travelers={value.travelers}
                onChange={(next) => setDraft({ ...value, ...next })}
              />
            </div>
            <Button disabled={busy || prefs.isPending}>{busy ? "Saving…" : "Save settings"}</Button>
          </form>
          {trip.currency === "EUR" && (
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              onClick={() => setBudget(estimatedBudget(days, value.travelers, value.style))}
            >
              Use estimated {value.style.toLowerCase()} budget
            </Button>
          )}
          {!includesFlights && (
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {budgetAllocation(Number(trip.budget), prefs.preference.style).map((b) => (
                <div key={b.label} className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">{b.label}</p>
                  <p className="mt-1 font-medium">{money(b.amount, trip.currency)}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Suggested allocation, not actual spending.{" "}
            {includesFlights ? "Flights are included in the overview below." : "Flights excluded."}{" "}
            Use the Budget tab to record expenses. Persona or age changes apply when you generate a
            new suggestion; saved activities are kept until you review and save replacements.
          </p>
        </>
      )}
    </section>
  );
}
