import { personaFields, validParty } from "../../supabase/functions/_shared/travel-persona";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { collectPages } from "./pagination";
import type { Tables } from "@/integrations/supabase/types";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const preferencesSchema = z
  .object({
    ...personaFields,
    travelers: z.number().int().min(1).max(20).default(2),
    style: z.enum(["Budget", "Balanced", "Luxury"]).default("Balanced"),
    interest: z.string().default("Food & culture"),
    packing: z.array(z.string()).default([]),
  })
  .refine(validParty, { message: "Enter valid child ages and include at least one adult." });
export type TripPreferences = z.infer<typeof preferencesSchema>;
export const DEFAULT_PREFERENCES = preferencesSchema.parse({});
const missingTable = (error: { code?: string } | null) =>
  error?.code === "PGRST205" || error?.code === "42P01";
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
      const legacy = result.success ? result.data : {};
      {
        const rows = await collectPages<Tables<"trip_preferences">>(async (from, to) => {
          const response = await supabase
            .from("trip_preferences")
            .select("*")
            .order("trip_id")
            .range(from, to);
          if (missingTable(response.error)) return { data: [], error: null };
          return response;
        });
        for (const row of rows) {
          const preference = preferencesSchema.safeParse(row);
          if (preference.success) {
            const extra = legacy[row.trip_id];
            const merged = preferencesSchema.safeParse({
              ...preference.data,
              persona: extra?.persona,
              childrenAges: extra?.childrenAges,
              childrenAgeRanges: extra?.childrenAgeRanges,
            });
            if (!merged.success)
              throw new Error(
                "Your saved group details need review before searching. Please check travelers and child ages.",
              );
            legacy[row.trip_id] = merged.data;
          }
        }
        return legacy;
      }
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
  const checked = preferencesSchema.parse(preference);
  const { persona, childrenAges, childrenAgeRanges, ...base } = checked;
  const database = await supabase
    .from("trip_preferences")
    .upsert({ trip_id: tripId, ...base }, { onConflict: "trip_id" });
  // Existing table columns remain unchanged; optional persona/party data lives in account metadata.
  if (database.error && !missingTable(database.error)) throw database.error;
  if (
    !database.error &&
    !persona &&
    !childrenAges?.length &&
    !childrenAgeRanges?.length &&
    !all[tripId]?.persona &&
    !all[tripId]?.childrenAges?.length &&
    !all[tripId]?.childrenAgeRanges?.length
  )
    return;
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
