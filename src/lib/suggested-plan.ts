import type { TripIdeas } from "../../supabase/functions/_shared/trip-ideas";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
export type SuggestedActivity = {
  id: string;
  trip_id: string;
  day: number;
  position: number;
  time: string;
  title: string;
  location: string;
  notes: string;
};
export function prepareSuggestedPlan(
  tripId: string,
  ideas: TripIdeas,
  existing: Pick<Tables<"activities">, "day" | "position">[],
): SuggestedActivity[] {
  return ideas.days.flatMap((day) => {
    const last = Math.max(-1, ...existing.filter((a) => a.day === day.day).map((a) => a.position));
    return day.items.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      trip_id: tripId,
      day: day.day,
      position: last + index + 1,
    }));
  });
}
export async function saveSuggestedPlan(activities: SuggestedActivity[]) {
  if (!activities.length) throw new Error("There is no suggested itinerary to save.");
  // One PostgreSQL statement: either the entire plan is stored or it fails.
  // Stable draft IDs make retrying a network failure safe.
  const { error } = await supabase.from("activities").upsert(activities, { onConflict: "id" });
  if (error) throw error;
}
