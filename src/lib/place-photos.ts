import { localPlacePhoto } from "./local-place-photos";
import { z } from "zod";
import type { VisualPlace } from "./city-guides";
const metadata = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          pageimage: z.string().optional(),
          coordinates: z.array(z.object({ lat: z.number(), lon: z.number() })).optional(),
          imageinfo: z
            .array(
              z.object({
                thumburl: z.string().optional(),
                descriptionurl: z.string(),
                extmetadata: z.record(z.string(), z.object({ value: z.string() })),
              }),
            )
            .optional(),
        }),
      ),
    })
    .optional(),
});
async function get(host: string, params: Record<string, string>, signal: AbortSignal) {
  const response = await fetch(
    host + "?" + new URLSearchParams({ ...params, format: "json", origin: "*" }),
    { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) },
  );
  if (!response.ok) return null;
  return metadata.parse(await response.json());
}
/** Only use a coordinate-matched Wikipedia subject and a Commons image with an open license. */
export async function fetchPlacePhoto(
  place: VisualPlace,
  signal: AbortSignal,
): Promise<VisualPlace["image"] | null> {
  const local = localPlacePhoto(place);
  if (local) return local;
  const result = await get(
    "https://en.wikipedia.org/w/api.php",
    {
      action: "query",
      titles: place.name,
      redirects: "1",
      prop: "pageimages|coordinates",
      piprop: "name",
      colimit: "max",
    },
    signal,
  );
  const page = Object.values(result?.query?.pages ?? {}).find(
    (page) =>
      page.pageimage &&
      page.coordinates?.some(
        (point) =>
          Math.abs(point.lat - place.lat) < 0.015 && Math.abs(point.lon - place.lon) < 0.015,
      ),
  );
  if (!page?.pageimage) return null;
  const commons = await get(
    "https://commons.wikimedia.org/w/api.php",
    {
      action: "query",
      titles: "File:" + page.pageimage,
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "700",
    },
    signal,
  );
  const info = Object.values(commons?.query?.pages ?? {}).find((page) => page.imageinfo)
    ?.imageinfo?.[0];
  const clean = (name: string) =>
    info?.extmetadata[name]?.value.replace(/<[^>]*>/g, "").slice(0, 250) ?? "";
  const license = clean("LicenseShortName");
  if (
    !info?.thumburl ||
    !/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(info.thumburl) ||
    !/^https:\/\/commons\.wikimedia\.org\//.test(info.descriptionurl) ||
    (!license.startsWith("CC") && license !== "Public domain" && license !== "PD")
  )
    return null;
  return {
    url: info.thumburl,
    credit: clean("Artist") || "Wikimedia Commons contributor",
    license,
    source: info.descriptionurl,
  };
}
