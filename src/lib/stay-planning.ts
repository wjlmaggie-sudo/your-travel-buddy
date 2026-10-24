import { childCount } from "../../supabase/functions/_shared/travel-persona";
import type { PersonaDetails } from "./travel-personas";
import { z } from "zod";
import { endDate, budgetAllocation, dailyBudgets } from "./planning";
import type { TravelStyle } from "./travel-data";
import { supabase } from "@/integrations/supabase/client";
export type StayBrief = PersonaDetails & {
  hotelRooms?: number | undefined;
  flightBudget?: number | undefined;
  hotelComfort?: "Simple" | "Comfortable" | "Premium" | undefined;
  destination: string;
  start: string;
  days: number;
  travelers: number;
  budget: number;
  currency: string;
  style: TravelStyle;
};
export const stayChoiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  evidence: z.enum(["demo", "entered", "live-search"]).optional(),
  checkedAt: z.string().datetime().optional(),
  type: z.enum(["Hotel", "Hostel", "Apartment"]),
  amount: z.number().finite().min(0).max(1000000),
  unit: z.enum(["stay", "room-night", "person-night"]),
  rooms: z.number().int().min(1).max(20),
  extras: z.number().finite().min(0).max(1000000),
  scope: z.string().max(600),
});
export type StayChoice = z.infer<typeof stayChoiceSchema>;
/** At least one adult per room; provider availability still determines room capacity. */
export function requestedRooms(brief: StayBrief) {
  const adults = Math.max(1, brief.travelers - childCount(brief));
  const fallback = Math.min(adults, Math.ceil(brief.travelers / 2));
  return Number.isInteger(brief.hotelRooms) && brief.hotelRooms! > 0
    ? Math.min(adults, brief.hotelRooms!)
    : fallback;
}
export function stayScope(brief: StayBrief) {
  return JSON.stringify([
    brief.destination.trim().toLowerCase(),
    brief.start,
    brief.days,
    brief.travelers,
    brief.currency,
    ...(requestedRooms(brief) !== Math.ceil(brief.travelers / 2)
      ? [{ rooms: requestedRooms(brief) }]
      : []),
    ...(brief.childrenAgeRanges?.length
      ? [{ ageRanges: brief.childrenAgeRanges }]
      : brief.childrenAges?.length
        ? [brief.childrenAges]
        : []),
  ]);
}
export function stayCost(choice: StayChoice, brief: StayBrief) {
  const nights = Math.max(0, brief.days - 1);
  if (!nights || choice.scope !== stayScope(brief)) return null;
  const multiplier =
    choice.unit === "stay"
      ? 1
      : nights * (choice.unit === "person-night" ? brief.travelers : choice.rooms);
  return Math.round((choice.amount * multiplier + choice.extras) * 100) / 100;
}
export function stayBudget(brief: StayBrief, choice?: StayChoice | null) {
  const nights = Math.max(0, brief.days - 1);
  const flights = Math.max(0, brief.flightBudget ?? 0);
  const ground = Math.max(0, brief.budget - flights);
  const allowance = !nights
    ? 0
    : brief.hotelComfort
      ? Math.round(
          ground * { Simple: 0.3, Comfortable: 0.45, Premium: 0.6 }[brief.hotelComfort] * 100,
        ) / 100
      : (budgetAllocation(ground, brief.style).find((item) => item.label === "Stays")?.amount ?? 0);
  const quoted = choice ? stayCost(choice, brief) : null;
  const accommodation = quoted ?? allowance;
  const remaining = Math.round((brief.budget - flights - accommodation) * 100) / 100;
  return {
    nights,
    flights,
    allowance,
    quoted,
    accommodation,
    remaining,
    daily: dailyBudgets(Math.max(0, remaining), brief.days, brief.travelers, brief.start),
    shortfall: Math.max(0, -remaining),
  };
}
export function bookingSearch(brief: StayBrief, rooms: number, property?: string) {
  return (
    "https://www.booking.com/searchresults.html?" +
    new URLSearchParams({
      ss: property ? `${property}, ${brief.destination}` : brief.destination,
      checkin: brief.start,
      checkout: endDate(brief.start, brief.days),
      group_adults: String(brief.travelers - (childCount(brief) ?? 0)),
      group_children: String(childCount(brief) ?? 0),
      no_rooms: String(rooms),
      selected_currency: brief.currency,
    }) +
    (brief.childrenAges ?? []).map((age) => `&age=${age}`).join("")
  );
}
export async function readStayChoice(tripId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const parsed = stayChoiceSchema.safeParse(data.user?.user_metadata["travel_stays"]?.[tripId]);
  return parsed.success ? parsed.data : null;
}
export async function saveStayChoice(tripId: string, choice: StayChoice | null) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in again.");
  const existing = data.user.user_metadata["travel_stays"];
  const choices =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
  if (choice) choices[tripId] = stayChoiceSchema.parse(choice);
  else delete choices[tripId];
  const result = await supabase.auth.updateUser({ data: { travel_stays: choices } });
  if (result.error) throw result.error;
}
