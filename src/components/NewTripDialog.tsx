import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES, type TravelStyle } from "@/lib/travel-data";
import { endDate, estimatedBudget, templateActivities, STYLES, INTERESTS } from "@/lib/planning";
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
  const [f, setF] = useState({
    destination: template?.destination ?? "",
    start: new Date().toISOString().slice(0, 10),
    days: template?.days ?? 5,
    travelers: 2,
    budget: template ? template.price * 2 : 1500,
    currency: "EUR",
    style: "Balanced" as TravelStyle,
    interest: template?.category ?? "Food & culture",
  });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (
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
      toast.error("Check your destination, days, travelers, and budget.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
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
      if (error) throw error;
      try {
        await saveTripPreferences(data.id, {
          ...DEFAULT_PREFERENCES,
          travelers: f.travelers,
          style: f.style,
          interest: f.interest,
        });
      } catch {
        toast.error(
          "Trip created, but travel settings could not save. Update them on the trip page.",
        );
      }
      if (template && f.destination.trim() === template.destination) {
        const { error: activityError } = await supabase
          .from("activities")
          .insert(templateActivities(template.id, f.days).map((a) => ({ ...a, trip_id: data.id })));
        if (activityError)
          toast.error(
            "Trip created, but template activities could not save. Add activities on your trip page.",
          );
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["trips"] }),
        qc.invalidateQueries({ queryKey: ["travel-preferences"] }),
      ]);
      onOpenChange(false);
      navigate({ to: "/trips/$tripId", params: { tripId: data.id } });
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
            {template ? template.name : "Your next story"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Make this template your own. Suggested activities are added when you keep its destination."
              : "Set a destination, a little time, and a budget for the whole group."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={create} className="space-y-4">
          <div>
            <Label htmlFor="new-destination">Destination</Label>
            <Input
              id="new-destination"
              className="mt-2"
              required
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
            Budget style presets use estimated EUR costs. Edit your total and currency as needed.
            Flights are excluded.
          </p>
          <Button className="w-full" disabled={busy}>
            {busy ? (
              "Creating…"
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create trip
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
