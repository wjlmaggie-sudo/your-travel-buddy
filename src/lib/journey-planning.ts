import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { endDate } from "./planning";
import { stayBudget, type StayBrief, type StayChoice } from "./stay-planning";

export const journeySchema = z.object({
  departure: z.string().trim().min(1).max(200),
  flightBudget: z.number().finite().min(0).max(1000000),
  hotelComfort: z.enum(["Simple", "Comfortable", "Premium"]),
});
export type Journey = z.infer<typeof journeySchema>;
export const flightAllowance = (total: number) => Math.round(Math.max(0, total) * 25) / 100;
export function journeyBudget(brief: StayBrief, journey: Journey, stay?: StayChoice | null) {
  const costs = stayBudget(
    { ...brief, flightBudget: journey.flightBudget, hotelComfort: journey.hotelComfort },
    stay,
  );
  const cents = Math.round(Math.max(0, costs.remaining) * 100);
  const food = Math.floor(cents * 0.4),
    sights = Math.floor(cents * 0.25),
    transport = Math.floor(cents * 0.2);
  return {
    ...costs,
    parts: [
      { label: "Flights · group return allowance", amount: journey.flightBudget },
      { label: "Hotel / accommodation", amount: costs.accommodation },
      { label: "Food", amount: food / 100 },
      { label: "Tourist spots & tickets", amount: sights / 100 },
      { label: "Local transport", amount: transport / 100 },
      { label: "Shopping & buffer", amount: (cents - food - sights - transport) / 100 },
    ],
  };
}
export function flightSearch(brief: StayBrief, departure: string) {
  return (
    "https://www.google.com/travel/flights?" +
    new URLSearchParams({
      q: `Return flights from ${departure} to ${brief.destination}, departing ${brief.start}, returning ${endDate(brief.start, brief.days)}, ${brief.travelers} adults`,
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
