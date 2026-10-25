import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { loadCityGuide } from "@/lib/city-guides";
import { PlacePhoto } from "./PlacePhoto";
export function TripCover({
  destination,
  locations,
  active,
}: {
  destination: string;
  locations: string[];
  active: boolean;
}) {
  const guide = useQuery({
    queryKey: ["visual-city-guide", destination],
    queryFn: () => loadCityGuide(destination),
    enabled: active,
    staleTime: 1800000,
    retry: false,
  });
  const places = guide.data?.days.flat() ?? [];
  const place =
    places.find((p) => p.image && locations.includes(p.name)) ?? places.find((p) => p.image);
  return (
    <aside
      className="overflow-hidden rounded-2xl border bg-background"
      aria-label="Destination inspiration"
    >
      {place ? (
        <>
          <PlacePhoto place={place} active={active} />
          <p className="px-3 pb-3 text-sm font-semibold">{place.name}</p>
        </>
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-secondary/5 p-4 text-center text-secondary">
          <MapPin className="h-8 w-8" />
          <p className="text-sm">{destination}</p>
        </div>
      )}
    </aside>
  );
}
