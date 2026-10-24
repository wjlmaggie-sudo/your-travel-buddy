import { curatedPersonaDay, rankPersonaPlaces, PERSONA_LISBON_PLACES } from "./persona-stops";
import type { PersonaDetails } from "../../supabase/functions/_shared/travel-persona";
import { distanceKm } from "./visit-logistics";
import lisbon from "./lisbon-places.json";
import { nearbyPlaces, searchDestinations } from "./place-directory";
import type { TravelStyle } from "./travel-data";

export type VisualPlace = {
  name: string;
  lat: number;
  lon: number;
  description: string;
  openingHours?: string | undefined;
  kind?: string | undefined;
  source: string;
  image?: { url: string; credit: string; license: string; source: string };
};
export type Restaurant = {
  name: string;
  kind: string;
  address: string;
  source: string;
  price?: string;
  minMealEUR?: number;
};
export type CityGuide = { days: VisualPlace[][]; restaurants: Restaurant[][]; curated: boolean };
const lisbonDays = [
  ["Alfama", "Lisbon Cathedral", "São Jorge Castle"],
  ["Praça do Comércio", "Santa Justa Lift", "Chiado"],
  ["Jerónimos Monastery", "Belém Tower"],
  ["Sintra National Palace", "Pena Palace"],
  ["Carmo Convent", "Chiado", "Time Out Market Lisboa"],
];
const market: Restaurant = {
  name: "Time Out Market Lisboa",
  kind: "Food hall · multiple kitchens",
  address: "Avenida 24 de Julho 49, Lisbon",
  source: "https://www.timeout.com/time-out-market-lisboa/restaurants",
  price: "Menu prices vary by counter",
};
const cantinho: Restaurant = {
  name: "Cantinho do Avillez",
  kind: "Contemporary Portuguese restaurant",
  address: "Rua dos Duques de Bragança 7, Lisbon",
  source: "https://www.visitlisboa.com/pt-pt/locais/cantinho-do-avillez",
  price: "Tourism listing: €20–50 per person",
  minMealEUR: 20,
};
const ramiro: Restaurant = {
  name: "Cervejaria Ramiro",
  kind: "Seafood restaurant",
  address: "Avenida Almirante Reis 1-H, Lisbon",
  source: "https://www.cervejariaramiro.com/contatos?lang=en",
  price: "Check current menu; seafood prices vary",
};
const belem: Restaurant = {
  name: "Pastéis de Belém",
  kind: "Bakery & café · a pastry stop, not a full meal",
  address: "Rua de Belém 84–92, Lisbon",
  source: "https://pasteisdebelem.pt/en/contact/",
  price: "Check current menu",
};
const sintra: Restaurant = {
  name: "Café Paris",
  kind: "Portuguese & international restaurant",
  address: "Praça da República 32, Sintra",
  source: "https://www.visitlisboa.com/pt-pt/locais/cafe-paris",
  price: "Tourism listing: €20–50 per person",
  minMealEUR: 20,
};
const piriquita: Restaurant = {
  name: "Piriquita I",
  kind: "Bakery & café · local pastries",
  address: "Rua das Padarias 1, Sintra",
  source: "https://piriquita.pt/pages/as-nossas-lojas",
  price: "Check current menu",
};

export function curatedDay(destination: string, day: number) {
  if (!/^(lisbon|lisboa)(,|$)/i.test(destination.trim())) return null;
  return lisbonDays[(day - 1) % lisbonDays.length]!.flatMap((name) => {
    const place = lisbon.find((item) => item.name === name);
    return place ? [place as VisualPlace] : [];
  });
}
export function curatedRestaurants(
  destination: string,
  day: number,
  style: TravelStyle,
): Restaurant[] {
  if (!/^(lisbon|lisboa)(,|$)/i.test(destination.trim())) return [];
  const index = (day - 1) % 5;
  if (index === 3) return style === "Budget" ? [piriquita, sintra] : [sintra, piriquita];
  if (index === 2) return [belem];
  return style === "Budget" ? [market, cantinho] : [cantinho, ramiro, market];
}
/** Nearby stop groups, using straight-line proximity rather than claiming a road-route optimizer. */
export function groupNearbyStops(places: VisualPlace[], size = 3): VisualPlace[][] {
  const remaining = [...places],
    groups: VisualPlace[][] = [];
  while (remaining.length) {
    const group = [remaining.shift()!];
    while (group.length < size && remaining.length) {
      const last = group[group.length - 1]!;
      let best = 0;
      for (let i = 1; i < remaining.length; i++)
        if (distanceKm(last, remaining[i]!) < distanceKm(last, remaining[best]!)) best = i;
      group.push(remaining.splice(best, 1)[0]!);
    }
    groups.push(group);
  }
  return groups;
}
export async function loadCityGuide(destination: string): Promise<CityGuide> {
  if (curatedDay(destination, 1))
    return {
      days: lisbonDays.map((_, index) => curatedDay(destination, index + 1)!),
      restaurants: lisbonDays.map((_, index) =>
        curatedRestaurants(destination, index + 1, "Balanced"),
      ),
      curated: true,
    };
  const destinations = await searchDestinations(destination);
  const city = destinations[0];
  if (!city) return { days: [], restaurants: [], curated: false };
  const places = await nearbyPlaces(city);
  const attractions: VisualPlace[] = places
    .filter((place) => place.category === "Attractions")
    .map((place) => ({
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      description: place.kind,
      kind: place.kind,
      openingHours: place.openingHours || undefined,
      source: place.source,
    }));
  const food = places
    .filter((place) => place.category === "Food & drink")
    .map((place) => ({
      name: place.name,
      kind: place.kind,
      address: place.address || destination,
      source: place.source,
      price: "Prices unavailable · check menu",
    }));
  return {
    days: groupNearbyStops(attractions),
    restaurants: [food.slice(0, 3)],
    curated: false,
  };
}
export function dayGuide(
  guide: CityGuide,
  destination: string,
  day: number,
  style: TravelStyle,
  details: PersonaDetails & { start?: string | undefined; startDate?: string | undefined } = {},
) {
  const curated = curatedPersonaDay(destination, day, details);
  if (curated) return { places: curated, restaurants: [] };
  if (details.persona) {
    const ranked = rankPersonaPlaces(guide.days.flat(), details);
    const groups = groupNearbyStops(ranked, details.persona === "business" ? 1 : 2);
    return { places: groups.length ? groups[(day - 1) % groups.length]! : [], restaurants: [] };
  }
  return {
    places: guide.days.length ? guide.days[(day - 1) % guide.days.length]! : [],
    restaurants: guide.curated
      ? curatedRestaurants(destination, day, style)
      : (guide.restaurants[0] ?? []),
  };
}

/** Map the locations actually present in the itinerary, including saved/manual choices. */
export function itineraryGuide(
  guide: CityGuide,
  destination: string,
  day: number,
  style: TravelStyle,
  details: PersonaDetails & { start?: string | undefined; startDate?: string | undefined } = {},
  items?: { location?: string | null | undefined; title?: string | null | undefined }[],
) {
  const base = dayGuide(guide, destination, day, style, details);
  if (!items) return base;
  const pool = [
    ...guide.days.flat(),
    ...base.places,
    ...(/^(lisbon|lisboa)(,|$)/i.test(destination.trim()) ? PERSONA_LISBON_PLACES : []),
  ];
  const selected: VisualPlace[] = [];
  for (const item of items) {
    const place = pool.find((p) => p.name.toLowerCase() === item.location?.trim().toLowerCase());
    if (place && !selected.some((p) => p.name === place.name)) selected.push(place);
  }
  return selected.length || details.persona ? { places: selected, restaurants: [] } : base;
}

export async function personaReferences(
  destination: string,
  days: number,
  style: TravelStyle,
  details: PersonaDetails,
) {
  const guide = await loadCityGuide(destination);
  return Array.from({ length: days }, (_, index) =>
    dayGuide(guide, destination, index + 1, style, details).places.map((p) => ({
      name: p.name,
      kind: (p.kind ?? p.description).slice(0, 100),
      day: index + 1,
    })),
  )
    .flat()
    .slice(0, 60);
}
