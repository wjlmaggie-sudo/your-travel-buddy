import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { VisualPlace } from "@/lib/city-guides";
import { localPlacePhoto } from "@/lib/local-place-photos";
import { fetchPlacePhoto } from "@/lib/place-photos";
export function PlacePhoto({ place, active = true }: { place: VisualPlace; active?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const preferred = localPlacePhoto(place) ?? place.image;
  useEffect(() => setFailedUrl(null), [place.name, preferred?.url]);
  const query = useQuery({
    queryKey: ["place-photo", place.name, place.lat, place.lon],
    queryFn: ({ signal }) => fetchPlacePhoto(place, signal),
    enabled: active && (!preferred || failedUrl === preferred.url),
    staleTime: 86400000,
    retry: false,
  });
  const photo = preferred && failedUrl !== preferred.url ? preferred : query.data;
  if (!photo || failedUrl === photo.url)
    return (
      <figure aria-label={`Photo unavailable for ${place.name}`}>
        <div className="flex aspect-[16/10] items-center justify-center rounded-t-xl bg-muted text-xs text-muted-foreground">
          {query.isFetching ? "Finding photo…" : "Photo unavailable"}
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
        referrerPolicy="no-referrer"
        className="aspect-[16/10] w-full rounded-t-xl object-cover"
        onError={() => setFailedUrl(photo.url)}
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
