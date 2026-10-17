import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["food", "stay", "transport", "activities", "other"] as const;

export const tripsQuery = () =>
  queryOptions({
    queryKey: ["trips"],
    queryFn: async () => {
      const [{ data: trips, error }, { data: exp }] = await Promise.all([
        supabase.from("trips").select("*").order("start_date"),
        supabase.from("expenses").select("trip_id, amount"),
      ]);
      if (error) throw error;
      const spent: Record<string, number> = {};
      (exp ?? []).forEach((e) => (spent[e.trip_id] = (spent[e.trip_id] ?? 0) + Number(e.amount)));
      return (trips ?? []).map((t) => ({ ...t, spent: spent[t.id] ?? 0 }));
    },
  });

export const tripQuery = (id: string) =>
  queryOptions({
    queryKey: ["trip", id],
    queryFn: async () => {
      const [t, a, e] = await Promise.all([
        supabase.from("trips").select("*").eq("id", id).single(),
        supabase.from("activities").select("*").eq("trip_id", id).order("day").order("position"),
        supabase.from("expenses").select("*").eq("trip_id", id).order("spent_on", { ascending: false }),
      ]);
      if (t.error) throw t.error;
      return { trip: t.data, activities: a.data ?? [], expenses: e.data ?? [] };
    },
  });

export function tripDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n.toFixed(0)} ${currency}`;
  }
}
