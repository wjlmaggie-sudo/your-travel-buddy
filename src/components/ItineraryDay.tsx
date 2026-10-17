import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { TravelStyle } from "@/lib/travel-data";
import { DayVisuals } from "./DayVisuals";
import { EditActivity } from "./EditActivity";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ItineraryDay({
  day,
  items,
  tripId,
  refresh,
  destination,
  style,
  foodPerPerson,
}: {
  day: number;
  items: Tables<"activities">[];
  tripId: string;
  refresh: () => void;
  destination: string;
  style: TravelStyle;
  foodPerPerson?: number | undefined;
}) {
  const [f, setF] = useState({ time: "", title: "", location: "", notes: "" });
  const [showAdd, setShowAdd] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const { error } = await supabase.from("activities").insert({
      ...f,
      trip_id: tripId,
      day,
      position: Math.max(-1, ...items.map((item) => item.position)) + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setF({ time: "", title: "", location: "", notes: "" });
    setShowAdd(false);
    refresh();
  }
  async function move(idx: number, dir: -1 | 1) {
    const a = items[idx],
      b = items[idx + dir];
    if (!a || !b) return;
    const results = await Promise.all([
      supabase.from("activities").update({ position: b.position }).eq("id", a.id),
      supabase.from("activities").update({ position: a.position }).eq("id", b.id),
    ]);
    if (results.some((result) => result.error))
      toast.error("Could not reorder activities. Please try again.");
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-2xl font-semibold">Day {day}</h2>
      <DayVisuals destination={destination} day={day} style={style} foodPerPerson={foodPerPerson} />
      <ul className="mt-4 divide-y">
        {items.map((a, i) => (
          <li key={a.id} className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap">
            <span className="w-14 shrink-0 font-medium text-primary">{a.time || "—"}</span>
            <div className="min-w-0 flex-1 break-words">
              <p className="font-medium">{a.title}</p>
              {a.location && (
                <a
                  className="flex items-center gap-1 text-sm text-muted-foreground underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-3 w-3" />
                  {a.location}
                </a>
              )}
              {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
            </div>
            <div className="flex w-full justify-end sm:w-auto">
              <EditActivity activity={a} refresh={refresh} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {!showAdd && (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
          Add activity
        </Button>
      )}
      {showAdd && (
        <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[90px_1fr_1fr_auto]">
          <Input
            aria-label={`Day ${day} activity time`}
            type="time"
            value={f.time}
            onChange={(e) => setF({ ...f, time: e.target.value })}
          />
          <Input
            aria-label={`Day ${day} activity title`}
            required
            placeholder="Activity"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <Input
            aria-label={`Day ${day} activity place`}
            placeholder="Place"
            value={f.location}
            onChange={(e) => setF({ ...f, location: e.target.value })}
          />
          <Input
            aria-label={`Day ${day} activity notes`}
            placeholder="Notes"
            className="sm:col-span-3"
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
        </form>
      )}
    </section>
  );
}
