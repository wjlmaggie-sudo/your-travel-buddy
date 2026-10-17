import { TEMPLATES, type TravelStyle } from "./travel-data";
import { curatedDay, curatedRestaurants } from "./city-guides";
import {
  tripIdeaInput,
  type TripIdeaInput,
  type TripIdeas,
} from "../../supabase/functions/_shared/trip-ideas";

/** A deterministic starter itinerary. Never represent this as model-generated or live availability. */
export function budgetTravelStyle(
  input: Pick<TripIdeaInput, "budget" | "days" | "travelers" | "currency" | "style">,
): TravelStyle {
  // EUR presets are rough planning bands, not destination prices or currency conversion.
  if (input.currency !== "EUR") return input.style;
  const perPerson = input.budget / Math.max(1, input.days) / Math.max(1, input.travelers);
  return perPerson < 100 ? "Budget" : perPerson < 250 ? "Balanced" : "Luxury";
}

export function createStarterIdeas(
  value: TripIdeaInput,
  options?: { style?: TravelStyle },
): TripIdeas {
  const input = tripIdeaInput.parse(value);
  const city = input.destination.split(",")[0]!.trim().toLowerCase();
  const template = TEMPLATES.find((item) => item.destination.split(",")[0]!.toLowerCase() === city);
  const themes = input.interests.toLowerCase().includes("nature")
    ? [
        "A gentle nature walk",
        "Parks and local landscapes",
        "A scenic neighborhood",
        "An outdoor afternoon",
        "Local food and markets",
        "Independent shops and crafts",
        "A flexible day to explore",
      ]
    : input.interests.toLowerCase().includes("beach")
      ? [
          "A relaxed arrival",
          "Time by the water",
          "Local food and markets",
          "A coastal neighborhood",
          "Local culture and crafts",
          "A slow outdoor afternoon",
          "A flexible day to explore",
        ]
      : [
          "Get to know the neighborhood",
          "Local history and culture",
          "Markets and regional flavors",
          "Parks and quieter streets",
          "Art and independent shops",
          "A new neighborhood",
          "A flexible day to explore",
        ];
  const daily = input.budget / input.days;
  const style = options?.style ?? budgetTravelStyle(input);
  const modest = style === "Budget";
  const luxury = style === "Luxury";
  const tight = input.budget === 0 || (input.currency === "EUR" && daily / input.travelers < 40);
  return {
    summary: `${input.days}-day ${style.toLowerCase()} starter itinerary for ${input.destination}, for ${input.travelers} ${input.travelers === 1 ? "person" : "people"}. ${template ? "Adapted from a curated destination template." : "A flexible planning outline; choose and verify local venues before visiting."} This is a template-based plan, not an AI-generated itinerary. Your total group spending cap is ${input.budget.toFixed(2)} ${input.currency}, excluding flights. Budget allocations are estimates, not booking prices.${tight ? " This allowance may not cover accommodation, meals, and transport; the outline prioritizes free activities, and paid costs need a separate affordability check." : ""}${input.currency !== "EUR" ? " The selected travel style is used without currency conversion." : ""}`,
    days: Array.from({ length: input.days }, (_, index) => {
      const highlight = template?.activities[index];
      const theme = themes[index % themes.length]!;
      const last = index === input.days - 1;
      const primary =
        highlight?.[0] ?? `${theme}${index >= themes.length ? ` · day ${index + 1}` : ""}`;
      const notes =
        highlight?.[1] ??
        "Choose a suitable local place and verify opening hours, transport, access, and admission before you go.";
      const reference = input.places?.[index];
      const stops = curatedDay(input.destination, index + 1);
      const morning = stops?.[0];
      const afternoon = stops?.[1];
      const restaurant = curatedRestaurants(input.destination, index + 1, style).find(
        (item) => !item.kind.includes("Bakery"),
      );
      return {
        day: index + 1,
        items: [
          {
            time: "09:00",
            title: index === 0 ? "Breakfast and an easy start" : "Breakfast and plan the day",
            location: input.destination,
            notes:
              index === 0
                ? "Allow for arrival and check-in; move these activities to fit your actual travel times."
                : "Check today's weather and local opening hours before setting out.",
          },
          {
            time: "10:00",
            title:
              `${luxury ? "A guided take on: " : modest ? "Explore at your own pace: " : ""}${reference ? `Discover ${reference.name}` : (morning?.name ?? primary)}`.slice(
                0,
                200,
              ),
            location: reference?.name ?? morning?.name ?? input.destination,
            notes: reference
              ? "A directory reference, not a confirmed booking. Check that this place matches your destination, interests, and access needs."
              : `${notes} ${modest ? "Prefer free public areas; skip ticketed visits that exceed your activity allowance." : luxury ? "An optional local guide can add context; confirm a quote within your daily experience allowance before booking." : "Pick one main experience and check any admission cost against your daily allowance."}`.slice(
                  0,
                  1000,
                ),
          },
          {
            time: "13:00",
            title: modest
              ? "A picnic or market lunch"
              : luxury
                ? "A leisurely regional lunch"
                : "Lunch at a neighborhood café",
            location: restaurant ? `${restaurant.name}, ${restaurant.address}` : input.destination,
            notes: modest
              ? "Choose a market meal, picnic, or casual café within your food allowance; check dietary needs."
              : luxury
                ? "Consider a restaurant showcasing regional cooking. Check menu prices and dietary needs before booking."
                : "Choose a local lunch spot near your morning activity and leave time to rest.",
          },
          {
            time: "15:00",
            title: last
              ? "One last discovery and departure buffer"
              : luxury
                ? "An optional local workshop or guided experience"
                : modest
                  ? "A free neighborhood walk and window-shopping"
                  : index % 3 === 0
                    ? "Browse local shops and crafts"
                    : index % 3 === 1
                      ? "A slow walk and a café stop"
                      : "A park, gallery, or neighborhood of your choice",
            location: !last && afternoon ? afternoon.name : input.destination,
            notes: last
              ? "Keep this optional and allow enough time for packing, transfers, and your onward journey."
              : luxury
                ? "Check local availability and the full price before booking. Keep travel time and your experience allowance in mind."
                : modest
                  ? "Use public spaces and browse without buying. Walk where practical; allow for necessary transport costs."
                  : "Keep the afternoon near your morning route and reserve time for a relaxed break.",
          },
          {
            time: "19:00",
            title: last
              ? "Dinner or your onward journey"
              : modest
                ? "A simple dinner and a quiet evening"
                : luxury
                  ? "A special dinner to remember"
                  : "Dinner and a relaxed evening",
            location: input.destination,
            notes: last
              ? "Adapt this to your departure time; skip it if you are already traveling."
              : "Stay within your remaining food budget and leave time to rest before tomorrow.",
          },
        ],
      };
    }),
  };
}
