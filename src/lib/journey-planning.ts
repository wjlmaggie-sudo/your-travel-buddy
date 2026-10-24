import { childCount, childAgeDescription } from "../../supabase/functions/_shared/travel-persona";
import { z } from "zod";
import {
  flightChoiceSchema,
  estimateSchema,
  flightCost,
  connectedBudget,
} from "./travel-workspace";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { endDate } from "./planning";
import { stayBudget, type StayBrief, type StayChoice } from "./stay-planning";

export const journeySchema = z
  .object({
    departure: z.string().trim().max(200),
    flightsRequired: z.boolean().optional(),
    selectedFlight: flightChoiceSchema.optional(),
    estimates: estimateSchema.optional(),
    flightBudget: z.number().finite().min(0).max(1000000),
    hotelComfort: z.enum(["Simple", "Comfortable", "Premium"]),
  })
  .refine((value) => value.flightsRequired === false || value.departure.length > 0, {
    message: "Enter a departure city when flights are required.",
    path: ["departure"],
  });
export type Journey = z.infer<typeof journeySchema>;
export const flightAllowance = (total: number) => Math.round(Math.max(0, total) * 25) / 100;
export function journeyBudget(brief: StayBrief, journey: Journey, stay?: StayChoice | null) {
  const costs = stayBudget(
    { ...brief, flightBudget: flightCost(brief, journey), hotelComfort: journey.hotelComfort },
    stay,
  );
  const planned = connectedBudget(brief, journey, stay);
  return {
    ...costs,
    parts: [
      { label: "Flights · group return allowance", amount: planned.flight },
      { label: "Hotel / accommodation", amount: planned.hotel },
      { label: "Food", amount: planned.estimates.food },
      { label: "Tourist spots & tickets", amount: planned.estimates.activities },
      { label: "Local transport", amount: planned.estimates.transport },
      { label: "Shopping & buffer", amount: planned.estimates.shopping },
    ],
  };
}
export function flightSearch(brief: StayBrief, departure: string) {
  return (
    "https://www.google.com/travel/flights?" +
    new URLSearchParams({
      q: `Return flights from ${departure} to ${brief.destination}, departing ${brief.start}, returning ${endDate(brief.start, brief.days)}, ${brief.travelers - (childCount(brief) ?? 0)} adults${childCount(brief) ? ` and ${childCount(brief)} children in age groups ${childAgeDescription(brief)}` : ""}`,
    })
  );
}
export const journeyQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["journey-settings", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const parsed = journeySchema.safeParse(data.user?.user_metadata["travel_journeys"]?.[tripId]);
      return parsed.success ? parsed.data : null;
    },
  });
export async function saveJourney(tripId: string, journey: Journey) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in again.");
  const existing = data.user.user_metadata["travel_journeys"];
  const all = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  const result = await supabase.auth.updateUser({
    data: { travel_journeys: { ...all, [tripId]: journeySchema.parse(journey) } },
  });
  if (result.error) throw result.error;
}
