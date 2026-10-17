import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const preferencesSchema = z.object({
  travelers: z.number().int().min(1).max(20).default(2),
  style: z.enum(["Budget", "Balanced", "Luxury"]).default("Balanced"),
  interest: z.string().default("Food & culture"),
  packing: z.array(z.string()).default([]),
});
export type TripPreferences = z.infer<typeof preferencesSchema>;
export const DEFAULT_PREFERENCES = preferencesSchema.parse({});
const allPreferencesSchema = z.record(z.string(), preferencesSchema);
export const preferencesQuery = () =>
  queryOptions({
    queryKey: ["travel-preferences"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error("Please sign in again.");
      const result = allPreferencesSchema.safeParse(
        data.user.user_metadata["travel_preferences"] ?? {},
      );
      return result.success ? result.data : {};
    },
  });
export async function saveTripPreferences(tripId: string, preference: TripPreferences) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in again.");
  const parsed = allPreferencesSchema.safeParse(
    data.user.user_metadata["travel_preferences"] ?? {},
  );
  const all = parsed.success ? parsed.data : {};
  const result = await supabase.auth.updateUser({
    data: { travel_preferences: { ...all, [tripId]: preferencesSchema.parse(preference) } },
  });
  if (result.error) throw result.error;
}
export function useTripPreferences(tripId: string) {
  const qc = useQueryClient();
  const query = useQuery(preferencesQuery());
  const preference = query.data?.[tripId] ?? DEFAULT_PREFERENCES;
  async function save(next: TripPreferences) {
    await saveTripPreferences(tripId, next);
    await qc.invalidateQueries({ queryKey: ["travel-preferences"] });
  }
  return { ...query, preference, save };
}
