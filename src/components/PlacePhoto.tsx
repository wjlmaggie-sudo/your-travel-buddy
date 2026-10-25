import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { VisualPlace } from "@/lib/city-guides";
import { fetchPlacePhoto } from "@/lib/place-photos";
export function PlacePhoto({ place, active = true }: { place: VisualPlace; active?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [place.name, place.image?.url]);
  const query = useQuery({
    queryKey: ["place-photo", place.name, place.lat, place.lon],
    queryFn: ({ signal }) => fetchPlacePhoto(place, signal),
    enabled: active && !place.image,
    staleTime: 86400000,
    retry: false,
  });
  const photo = place.image ?? query.data;
  if (!photo || failed)
    return (
      <figure aria-label={`Photo unavailable for ${place.name}`}>
        <div className="flex aspect-[16/10] items-center justify-center rounded-t-xl bg-muted text-xs text-muted-foreground">
          {failed ? "Photo unavailable" : "Place photo"}
        </div>
        <figcaption className="h-8 px-3 pt-2 text-[10px] text-muted-foreground">
          {place.name}
        </figcaption>
      </figure>
    );
  return (
    <figure>
      <img
        src={photo.url}
        alt={place.name}
        loading="lazy"
        className="aspect-[16/10] w-full rounded-t-xl object-cover"
        onError={() => setFailed(true)}
      />
      <figcaption className="h-8 truncate px-3 pt-2 text-[10px] text-muted-foreground">
        <a
          href={photo.source}
          title={`Photo: ${photo.credit} · ${photo.license}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Photo: {photo.credit} · {photo.license}
        </a>
      </figcaption>
    </figure>
  );
}
