import { PlacePhoto } from "./PlacePhoto";
import { useQuery } from "@tanstack/react-query";
import { loadCityGuide, curatedDay, type VisualPlace } from "@/lib/city-guides";
import { PERSONA_LISBON_PLACES } from "@/lib/persona-stops";
import { balancedAttractionSuggestions } from "@/lib/attraction-suggestions";
import { childCount, activityAgeBands } from "../../supabase/functions/_shared/travel-persona";
import type { StayBrief } from "@/lib/stay-planning";
import { admissionFor } from "@/lib/visit-logistics";
import { Button } from "./ui/button";
export function AttractionRecommendations({
  brief,
  day,
  active,
  current,
  onAdd,
}: {
  brief: StayBrief;
  day: number;
  active: boolean;
  current: { day: number; location?: string | null | undefined }[];
  onAdd: (place: VisualPlace) => void;
}) {
  const query = useQuery({
    queryKey: ["visual-city-guide", brief.destination],
    queryFn: () => loadCityGuide(brief.destination),
    enabled: active,
    staleTime: 1800000,
    retry: false,
  });
  const pool = [
    ...(query.data?.days.flat() ?? curatedDay(brief.destination, day) ?? []),
    ...(/^(lisbon|lisboa)(,|$)/i.test(brief.destination.trim()) ? PERSONA_LISBON_PLACES : []),
  ];
  const family = brief.persona === "family" && childCount(brief) > 0;
  const suggestions = balancedAttractionSuggestions(pool, family, activityAgeBands(brief));
  return (
    <section className="space-y-4" aria-label="Attraction recommendations">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Step 4 · Attractions
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Three ideas for your day.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {family
            ? "A balance of children’s discovery, adult interests and time together. Keep rest breaks and let everyone choose a favorite."
            : "Choose what appeals to you, then add it to your day."}
        </p>
      </div>
      {query.isFetching && !pool.length && (
        <p role="status" className="text-sm">
          Finding places in {brief.destination}…
        </p>
      )}
      <div className="offer-grid grid gap-4">
        {suggestions.map(({ label, detail, place, search }) => {
          const included = place && current.some((i) => i.day === day && i.location === place.name),
            ticket = place ? admissionFor(place.name) : undefined;
          return (
            <article
              key={label}
              className="visual-offer flex flex-col overflow-hidden rounded-2xl border bg-card"
            >
              {place && <PlacePhoto place={place} active={active} />}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                  {label}
                </p>
                <h4 className="mt-3 text-lg font-semibold">
                  {place?.name ?? `Explore ${label.toLowerCase()} nearby`}
                </h4>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Why visit?</summary>
                  <p className="mt-2 leading-relaxed">
                    {detail} {place?.description}
                  </p>
                </details>
                <p className="mt-3 text-xs">
                  {ticket?.price === 0
                    ? "Public-space visit · paid extras separate"
                    : ticket?.price !== undefined
                      ? `Reference adult admission €${ticket.price} · confirm family prices`
                      : "Check current admission, opening hours and age suitability."}
                </p>
                <a
                  className="my-4 text-xs text-secondary underline"
                  href={
                    place?.source ??
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${search} ${brief.destination}`)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {place
                    ? "Place details & visiting information ↗"
                    : "Find matching places nearby ↗"}
                </a>
                {place && (
                  <Button
                    className="mt-auto h-auto whitespace-normal"
                    variant="outline"
                    disabled={!!included || current.filter((i) => i.day === day).length >= 8}
                    onClick={() => onAdd(place)}
                  >
                    {included ? "Already in this day" : `Add to day ${day}`}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
