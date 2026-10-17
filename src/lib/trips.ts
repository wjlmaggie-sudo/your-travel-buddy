import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["food", "stay", "transport", "activities", "other"] as const;

import { collectPages } from "./pagination";
import type { Tables } from "@/integrations/supabase/types";

export const tripsQuery = () =>
  queryOptions({
    queryKey: ["trips"],
    queryFn: async () => {
      const [trips, expenses] = await Promise.all([
        collectPages<Tables<"trips">>((from, to) =>
          supabase.from("trips").select("*").order("start_date").order("id").range(from, to),
        ),
        collectPages<Pick<Tables<"expenses">, "trip_id" | "amount">>((from, to) =>
          supabase.from("expenses").select("trip_id, amount").order("id").range(from, to),
        ),
      ]);
      const spent: Record<string, number> = {};
      expenses.forEach((e) => (spent[e.trip_id] = (spent[e.trip_id] ?? 0) + Number(e.amount)));
      return trips.map((trip) => ({ ...trip, spent: spent[trip.id] ?? 0 }));
    },
  });
export const tripQuery = (id: string) =>
  queryOptions({
    queryKey: ["trip", id],
    queryFn: async () => {
      const [trip, activities, expenses] = await Promise.all([
        supabase.from("trips").select("*").eq("id", id).single(),
        collectPages<Tables<"activities">>((from, to) =>
          supabase
            .from("activities")
            .select("*")
            .eq("trip_id", id)
            .order("day")
            .order("position")
            .order("id")
            .range(from, to),
        ),
        collectPages<Tables<"expenses">>((from, to) =>
          supabase
            .from("expenses")
            .select("*")
            .eq("trip_id", id)
            .order("spent_on", { ascending: false })
            .order("id")
            .range(from, to),
        ),
      ]);
      if (trip.error) throw trip.error;
      return { trip: trip.data, activities, expenses };
    },
  });

export function tripDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(0)} ${currency}`;
  }
}
