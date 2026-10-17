import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Utensils, ExternalLink, Loader2 } from "lucide-react";
import { dayGuide, loadCityGuide, type VisualPlace } from "@/lib/city-guides";
import type { TravelStyle } from "@/lib/travel-data";
import { AdmissionDetails, RouteLogistics } from "./VisitLogistics";
import { DayRouteMap } from "./DayRouteMap";
import { fetchPlacePhoto } from "@/lib/place-photos";

function Photo({ place }: { place: VisualPlace }) {
  const [failed, setFailed] = useState(false);
  const query = useQuery({
    queryKey: ["place-photo", place.name, place.lat, place.lon],
    queryFn: ({ signal }) => fetchPlacePhoto(place, signal),
    enabled: !place.image,
    staleTime: 86400000,
    retry: false,
  });
  const photo = place.image ?? query.data;
  if (!photo || failed) return null;
  return (
    <figure>
      <img
        src={photo.url}
        alt={place.name}
        loading="lazy"
        className="aspect-[16/10] w-full rounded-t-xl object-cover"
        onError={() => setFailed(true)}
      />
      <figcaption className="px-3 pt-2 text-[10px] text-muted-foreground">
        <a href={photo.source} target="_blank" rel="noreferrer" className="underline">
          Photo: {photo.credit} · {photo.license}
        </a>
      </figcaption>
    </figure>
  );
}
export function DayVisuals({
  destination,
  day,
  style,
  foodPerPerson,
  travelers = 1,
  date,
}: {
  travelers?: number | undefined;
  date?: string | undefined;
  destination: string;
  day: number;
  style: TravelStyle;
  foodPerPerson?: number | undefined;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!box.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const query = useQuery({
    queryKey: ["visual-city-guide", destination],
    queryFn: () => loadCityGuide(destination),
    enabled: visible,
    staleTime: 1800000,
    retry: false,
  });
  const guide = useMemo(
    () => (query.data ? dayGuide(query.data, destination, day, style) : null),
    [query.data, destination, day, style],
  );
  const maps = (text: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
  const directions = guide?.places.length
    ? "https://www.google.com/maps/dir/?" +
      new URLSearchParams({
        api: "1",
        origin: `${guide.places[0]!.lat},${guide.places[0]!.lon}`,
        destination: `${guide.places.at(-1)!.lat},${guide.places.at(-1)!.lon}`,
        waypoints: guide.places
          .slice(1, -1)
          .map((place) => `${place.lat},${place.lon}`)
          .join("|"),
      })
    : null;
  return (
    <div ref={box} className="my-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          Suggested stops for day {day}
        </h4>
        {directions && (
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-secondary underline"
          >
            Open directions
          </a>
        )}
      </div>
      {!visible || query.isPending ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding places for this day…
        </p>
      ) : guide?.places.length ? (
        <>
          <DayRouteMap places={guide.places} day={day} />
          <RouteLogistics places={guide.places} destination={destination} day={day} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guide.places.map((place, index) => (
              <article
                key={place.name}
                className="min-w-0 overflow-hidden rounded-xl border bg-background/40"
              >
                <Photo place={place} />
                <div className="p-3">
                  <h5 className="text-sm font-semibold">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {index + 1}
                    </span>
                    {place.name}
                  </h5>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {place.description}
                  </p>
                  <AdmissionDetails place={place} travelers={travelers} date={date} />
                  <div className="mt-3 flex gap-3 text-xs">
                    <a
                      href={maps(place.name + ", " + destination)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary underline"
                    >
                      View place
                    </a>
                    <a
                      href={place.source}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground underline"
                    >
                      Place details
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Numbers match the map. Stops are suggestions, not bookings or a verified route. Check
            tickets, access, travel time, and opening hours. Place information: Wikipedia /
            OpenStreetMap.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Place details are unavailable for this destination right now.{" "}
          <a href={maps(destination)} target="_blank" rel="noreferrer" className="underline">
            Explore the destination map
          </a>
          .
        </p>
      )}
      <div className="rounded-xl bg-muted/40 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Utensils className="h-4 w-4 text-primary" />A few places to eat
        </h4>
        {guide?.restaurants.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {guide.restaurants.map((restaurant) => (
              <article key={restaurant.name} className="rounded-lg border bg-card p-3">
                <p className="text-sm font-semibold">{restaurant.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{restaurant.kind}</p>
                <p className="mt-1 text-xs text-muted-foreground">{restaurant.address}</p>
                <p className="mt-2 text-xs">{restaurant.price}</p>
                {restaurant.minMealEUR &&
                  foodPerPerson !== undefined &&
                  foodPerPerson < restaurant.minMealEUR && (
                    <p className="mt-1 text-xs text-primary">
                      This may exceed your daily food allowance. Check the menu or choose a cheaper
                      alternative.
                    </p>
                  )}
                <div className="mt-3 flex gap-3 text-xs">
                  <a
                    href={restaurant.source}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-secondary underline"
                  >
                    Menu & details
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={maps(restaurant.name + " " + restaurant.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Map
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No verified restaurant names are available yet.{" "}
            <a
              href={maps("restaurants in " + destination)}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Browse restaurants on the map
            </a>
            .
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Options are alternatives, not extra meals added to your budget. Prices and availability
          can change; check menus and dietary needs.
        </p>
      </div>
    </div>
  );
}
