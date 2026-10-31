import { childAgeDescription } from "../../supabase/functions/_shared/travel-persona";
import { z } from "zod";
import { carOfferSchema } from "../../supabase/functions/_shared/car-search";
import { endDate } from "./planning";
import {
  requestedRooms,
  stayScope,
  stayBudget,
  stayCost,
  type StayBrief,
  type StayChoice,
} from "./stay-planning";

export const SECTIONS = [
  { id: "planner", label: "AI Travel Planner" },
  { id: "chat", label: "Travel Chatbot" },
  { id: "flights", label: "Flights" },
  { id: "hotels", label: "Hotels" },
  { id: "cars", label: "Car Rental" },
  { id: "attractions", label: "Attractions & Activities" },
  { id: "shopping", label: "Local Shopping" },
  { id: "currency", label: "Currency" },
  { id: "weather", label: "Weather" },
] as const;
export type TravelSection = (typeof SECTIONS)[number]["id"];
export const flightChoiceSchema = z.object({
  id: z.string().max(100),
  label: z.string().max(150),
  amount: z.number().finite().min(0).max(1000000),
  scope: z.string().max(1200),
  evidence: z.enum(["demo", "entered", "live-search"]),
  checkedAt: z.string().datetime().optional(),
});
export const carChoiceSchema = carOfferSchema.extend({
  scope: z.string().max(1200),
  checkedAt: z.string().datetime(),
  pickup: z.string().max(200),
  pickupDate: z.string().max(10),
  dropoffDate: z.string().max(10),
  pickupTime: z.string().max(5),
  dropoffTime: z.string().max(5),
});
export type CarChoice = z.infer<typeof carChoiceSchema>;
export function carScope(brief: StayBrief) {
  return JSON.stringify([
    brief.destination,
    brief.start,
    brief.days,
    brief.travelers,
    brief.currency,
  ]);
}
export const estimateSchema = z.object({
  activities: z.number().finite().min(0).max(1000000),
  food: z.number().finite().min(0).max(1000000),
  transport: z.number().finite().min(0).max(1000000),
  shopping: z.number().finite().min(0).max(1000000),
});
export type FlightChoice = z.infer<typeof flightChoiceSchema>;
export type Estimates = z.infer<typeof estimateSchema>;
export type WorkspaceJourney = {
  departure: string;
  flightBudget: number;
  hotelRooms?: number | undefined;
  hotelComfort: "Simple" | "Comfortable" | "Premium";
  flightsRequired?: boolean | undefined;
  selectedFlight?: FlightChoice | undefined;
  selectedCar?: CarChoice | undefined;
  estimates?: Estimates | undefined;
};
export const cents = (amount: number) => Math.round(amount * 100) / 100;
export function flightScope(brief: StayBrief, departure: string) {
  return JSON.stringify([
    departure.trim().toLowerCase(),
    brief.destination.trim().toLowerCase(),
    brief.start,
    brief.days,
    brief.travelers,
    brief.currency,
    ...(brief.childrenAgeRanges?.length
      ? [{ ageRanges: brief.childrenAgeRanges }]
      : brief.childrenAges?.length
        ? [brief.childrenAges]
        : []),
  ]);
}
export function selectedFlight(brief: StayBrief, journey: WorkspaceJourney) {
  return journey.flightsRequired !== false &&
    journey.selectedFlight?.scope === flightScope(brief, journey.departure)
    ? journey.selectedFlight
    : null;
}
export function flightCost(brief: StayBrief, journey: WorkspaceJourney) {
  return journey.flightsRequired === false
    ? 0
    : (selectedFlight(brief, journey)?.amount ?? journey.flightBudget);
}
export function connectedBudget(
  brief: StayBrief,
  journey: WorkspaceJourney,
  stay?: StayChoice | null,
) {
  brief = { ...brief, hotelRooms: journey.hotelRooms ?? brief.hotelRooms };
  const plannedFlight = journey.flightsRequired === false ? 0 : journey.flightBudget;
  const original = stayBudget({
    ...brief,
    flightBudget: plannedFlight,
    hotelComfort: journey.hotelComfort,
  });
  const pool = Math.round(Math.max(0, original.remaining) * 100);
  const food = Math.floor(pool * 0.4),
    activities = Math.floor(pool * 0.25),
    transport = Math.floor(pool * 0.2);
  const estimates = journey.estimates ?? {
    food: food / 100,
    activities: activities / 100,
    transport: transport / 100,
    shopping: (pool - food - activities - transport) / 100,
  };
  const flight = flightCost(brief, journey),
    hotel = stay ? (stayCost(stay, brief) ?? original.allowance) : original.allowance;
  const estimated = cents(
    estimates.food + estimates.activities + estimates.transport + estimates.shopping,
  );
  const carChoice =
    journey.selectedCar?.scope === carScope(brief) &&
    journey.selectedCar.currency === brief.currency
      ? journey.selectedCar
      : null;
  const car = carChoice?.amount ?? 0;
  const planned = cents(flight + hotel + estimated + car);
  const remaining = cents(brief.budget - planned);
  return {
    flight,
    hotel,
    car,
    carChoice,
    estimates,
    estimated,
    planned,
    remaining,
    original,
    flightChoice: selectedFlight(brief, journey),
    hotelChosen: !!stay && stayCost(stay, brief) !== null,
  };
}

// Demonstration fixtures are never provider inventory. No real airline, hotel or verified schedule is implied.
export function demoFlights(brief: StayBrief, journey: WorkspaceJourney) {
  const scope = flightScope(brief, journey.departure);
  return [
    {
      id: "demo-cheapest",
      label: "Cheapest Option",
      multiplier: 0.82,
      airline: "Demo Air · fictional",
      depart: "06:40",
      arrive: "12:10",
      duration: "5h 30m",
      route: "1 connection",
      inbound: "18:00 → 23:30",
    },
    {
      id: "demo-value",
      label: "Best Value Option",
      multiplier: 1,
      airline: "Example Airways · fictional",
      depart: "10:15",
      arrive: "12:45",
      duration: "2h 30m",
      route: "Direct",
      inbound: "14:30 → 17:00",
    },
    {
      id: "demo-convenient",
      label: "Most Convenient Option",
      multiplier: 1.24,
      airline: "Sample Sky · fictional",
      depart: "12:00",
      arrive: "14:20",
      duration: "2h 20m",
      route: "Direct",
      inbound: "16:00 → 18:20",
    },
  ].map((option) => ({
    ...option,
    amount: cents(journey.flightBudget * option.multiplier),
    scope,
    evidence: "demo" as const,
    dates: `${brief.start} → ${endDate(brief.start, brief.days)}`,
  }));
}
export function demoHotels(
  brief: StayBrief,
  journey: WorkspaceJourney,
): Array<StayChoice & { tag: string; location: string; rating: string }> {
  const allowance = connectedBudget(brief, journey).original.allowance;
  return [
    {
      name: "Demo Garden Rooms",
      tag: "Budget-Friendly Option",
      location: "Example residential neighborhood",
      rating: "7.8 / 10 · simulated",
      factor: 0.78,
    },
    {
      name: "Demo City Retreat",
      tag: "Best Value Option",
      location: "Example central neighborhood",
      rating: "8.6 / 10 · simulated",
      factor: 1,
    },
    {
      name: "Demo Landmark House",
      tag: "Best Location Option",
      location: "Example historic center",
      rating: "9.1 / 10 · simulated",
      factor: 1.28,
    },
  ].map((item) => ({
    ...item,
    type: "Hotel",
    unit: "stay",
    amount: cents(allowance * item.factor),
    extras: 0,
    rooms: requestedRooms({ ...brief, hotelRooms: journey.hotelRooms ?? brief.hotelRooms }),
    evidence: "demo",
    scope: stayScope({ ...brief, hotelRooms: journey.hotelRooms ?? brief.hotelRooms }),
  }));
}
