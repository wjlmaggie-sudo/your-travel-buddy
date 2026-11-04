import lisbonAssets from "./lisbon-photo-assets.json";
import shanghaiAssets from "./shanghai-photo-assets.json";
const assets = { ...lisbonAssets, ...shanghaiAssets };
import type { VisualPlace } from "./city-guides";
/** Licensed local copies keep supported destination photos available during provider outages. */
export function localPlacePhoto(
  place: Pick<VisualPlace, "name" | "lat" | "lon">,
): VisualPlace["image"] | undefined {
  const photo = assets[place.name as keyof typeof assets];
  if (
    !photo ||
    Math.abs(place.lat - photo.lat) >= 0.015 ||
    Math.abs(place.lon - photo.lon) >= 0.015
  )
    return undefined;
  return {
    url: `${import.meta.env.BASE_URL}${photo.file}`,
    credit: photo.credit,
    license: photo.license,
    source: photo.source,
  };
}
