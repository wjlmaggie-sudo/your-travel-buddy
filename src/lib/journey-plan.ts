import { createStarterIdeas } from "./starter-plan";
import { journeyBudget, type Journey } from "./journey-planning";
import type { StayBrief, StayChoice } from "./stay-planning";
import type { TravelStyle } from "./travel-data";
export function createJourneyIdeas(
  brief: StayBrief & { interest: string },
  journey: Journey,
  stay?: StayChoice | null,
  places: { name: string; kind: string }[] = [],
) {
  const costs = journeyBudget(brief, journey, stay);
  const spend = Math.max(0, costs.remaining) / brief.days / brief.travelers;
  const style: TravelStyle =
    brief.currency === "EUR"
      ? spend < 50
        ? "Budget"
        : spend < 120
          ? "Balanced"
          : "Luxury"
      : brief.style;
  const ideas = createStarterIdeas(
    {
      destination: brief.destination,
      days: brief.days,
      travelers: brief.travelers,
      budget: Math.max(0, brief.budget - journey.flightBudget),
      currency: brief.currency,
      style,
      interests: brief.interest,
      places,
    },
    { style },
  );
  ideas.summary = ideas.summary?.replace(
    /Your total group spending cap is [\d.]+ [A-Z]{3}, excluding flights\./,
    `Your total group spending cap is ${brief.budget.toFixed(2)} ${brief.currency}, including the flight and hotel allowances shown above.`,
  );
  ideas.days[0]!.items[0] = {
    time: "",
    title: `Travel from ${journey.departure} to ${brief.destination}`.slice(0, 200),
    location: brief.destination,
    notes:
      "Outbound travel day. Flight schedules are not retrieved; check your actual arrival time and allow for baggage, airport transfers and rest before sightseeing.",
  };
  const last = ideas.days.at(-1)!;
  last.items[last.items.length - 1] = {
    time: "",
    title: `Return to ${journey.departure}`.slice(0, 200),
    location: brief.destination,
    notes:
      "Return travel day. Check your ticket and airport check-in deadline, allow a transfer buffer, and move activities if the flight timing requires it.",
  };
  return ideas;
}
