import lisbon from "./lisbon-places.json";
import { PERSONA_LISBON_PLACES } from "./persona-stops";
import type { VisualPlace } from "./city-guides";

const nameKey = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
/** Match the actual stop, never substitute a nearby attraction or a similarly named city. */
export function companionActivityPlace(
  destination: string,
  stop: { location?: string; title: string },
  guidePlaces: VisualPlace[] = [],
): VisualPlace | undefined {
  const pool: VisualPlace[] = /^(lisbon|lisboa)(,|$)/i.test(destination.trim())
    ? [...lisbon, ...PERSONA_LISBON_PLACES]
    : guidePlaces;
  const subject =
    stop.location?.trim() || stop.title.replace(/^(visit|explore|discover)\s*:?\s+/i, "");
  return pool.find((place) => nameKey(place.name) === nameKey(subject));
}
