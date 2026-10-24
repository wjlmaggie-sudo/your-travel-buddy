import type { CityGuide, VisualPlace } from "./city-guides";
import { PERSONA_LISBON_PLACES } from "./persona-stops";
import { admissionFor } from "./visit-logistics";
export type PlannedPlace = {
  day: number;
  title?: string | null | undefined;
  location?: string | null | undefined;
};
const normalize = (value: string) => value.trim().toLocaleLowerCase();
export function extraPlaces(
  guide: CityGuide,
  destination: string,
  current: PlannedPlace[],
  search = "",
) {
  const candidates = [
    ...guide.days.flat(),
    ...(/^(lisbon|lisboa)(,|$)/i.test(destination.trim()) ? PERSONA_LISBON_PLACES : []),
  ];
  const unique = [...new Map(candidates.map((p) => [normalize(p.name), p])).values()];
  const term = normalize(search);
  return unique.filter((place) => {
    const name = normalize(place.name);
    const included = current.some(
      (item) =>
        normalize(item.location ?? "") === name || normalize(item.title ?? "").includes(name),
    );
    return (
      !included &&
      (!term || normalize(`${place.name} ${place.description} ${place.kind ?? ""}`).includes(term))
    );
  });
}
export function extraActivity(place: VisualPlace) {
  const ticket = admissionFor(place.name);
  return {
    time: "",
    title: place.name.slice(0, 200),
    location: place.name.slice(0, 300),
    notes:
      `Your optional addition, outside the original recommendations. ${place.description} ${ticket ? `${ticket.label}. ${ticket.note}` : "Admission cost is unverified; confirm it with the venue."} Check opening hours, age/access requirements, route timing and your existing activity allowance before visiting. Not booked; no ticket cost has been added automatically. Source: ${place.source}`.slice(
        0,
        1000,
      ),
  };
}
