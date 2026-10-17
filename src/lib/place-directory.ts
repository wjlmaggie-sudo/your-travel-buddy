import { z } from "zod";

export type Destination = { name: string; lat: number; lon: number; source: string };
export type Place = {
  id: string;
  name: string;
  category: "Attractions" | "Shops" | "Food & drink";
  kind: string;
  lat: number;
  lon: number;
  address: string;
  openingHours: string;
  source: string;
};
const coordinate = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
const wikiPage = z.object({
  title: z.string(),
  index: z.number().optional(),
  description: z.string().optional(),
  coordinates: z.array(coordinate).optional(),
});
const wikiResponse = z.object({
  query: z.object({ pages: z.record(z.string(), wikiPage) }).optional(),
});
const osmElement = z.object({
  id: z.number(),
  type: z.enum(["node", "way", "relation"]),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: coordinate.optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
const osmResponse = z.object({ elements: z.array(osmElement) });
const cache = new Map<string, { until: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, get: () => Promise<T>): Promise<T> {
  const found = cache.get(key);
  if (found && found.until > Date.now()) return found.value as T;
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;
  const request = get()
    .then((value) => {
      if (cache.size >= 50) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      cache.set(key, { value, until: Date.now() + 30 * 60 * 1000 });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}
export async function searchDestinations(query: string): Promise<Destination[]> {
  const text = query.trim().slice(0, 150);
  if (text.length < 2) return [];
  return cached("destination:" + text.toLowerCase(), async () => {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: text,
      gsrnamespace: "0",
      gsrlimit: "8",
      prop: "coordinates",
      colimit: "max",
      format: "json",
      origin: "*",
    });
    const response = await fetch("https://en.wikipedia.org/w/api.php?" + params, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Destination search is busy. Please try again.");
    const data = wikiResponse.parse(await response.json());
    return Object.values(data.query?.pages ?? {})
      .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
      .flatMap((page) => {
        const coords = page.coordinates?.[0];
        return coords
          ? [
              {
                name: page.title,
                ...coords,
                source:
                  "https://en.wikipedia.org/wiki/" +
                  encodeURIComponent(page.title.replaceAll(" ", "_")),
              },
            ]
          : [];
      });
  });
}
export function parsePlaces(value: unknown): Place[] {
  const data = osmResponse.parse(value);
  const seen = new Set<string>();
  return data.elements.flatMap((element) => {
    const name = element.tags["name:en"] || element.tags["name"];
    const coords =
      element.center ??
      (element.lat !== undefined && element.lon !== undefined
        ? { lat: element.lat, lon: element.lon }
        : null);
    const category = element.tags["shop"]
      ? "Shops"
      : element.tags["tourism"]
        ? "Attractions"
        : "Food & drink";
    const key = `${name}:${coords?.lat.toFixed(3)}:${coords?.lon.toFixed(3)}`;
    if (!name || !coords || !coordinate.safeParse(coords).success || seen.has(key)) return [];
    seen.add(key);
    return [
      {
        id: `${element.type}/${element.id}`,
        name: name.slice(0, 200),
        category,
        kind: (
          element.tags["shop"] ||
          element.tags["tourism"] ||
          element.tags["amenity"] ||
          "place"
        ).replaceAll("_", " "),
        ...coords,
        address: [
          element.tags["addr:housenumber"],
          element.tags["addr:street"],
          element.tags["addr:city"],
        ]
          .filter(Boolean)
          .join(" "),
        openingHours: element.tags["opening_hours"] ?? "",
        source: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      } as Place,
    ];
  });
}
export async function nearbyPlaces(destination: Destination): Promise<Place[]> {
  const coords = coordinate.parse(destination);
  return cached(`places:${coords.lat.toFixed(3)}:${coords.lon.toFixed(3)}`, async () => {
    const area = `(around:4000,${coords.lat},${coords.lon})`;
    const query = `[out:json][timeout:20][maxsize:16777216];nwr${area}[tourism~"museum|attraction|gallery|viewpoint"][name];out center tags 35;nwr${area}[shop][name];out center tags 35;nwr${area}[amenity~"cafe|restaurant|food_court"][name];out center tags 25;`;
    try {
      const response = await fetch(
        import.meta.env["VITE_OVERPASS_ENDPOINT"] ||
          "https://overpass.private.coffee/api/interpreter",
        {
          method: "POST",
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error("Place provider unavailable");
      const places = parsePlaces(await response.json());
      if (places.length) return places;
    } catch {
      /* Use the independent encyclopedia directory during map outages. */
    }
    const params = new URLSearchParams({
      action: "query",
      generator: "geosearch",
      ggscoord: `${coords.lat}|${coords.lon}`,
      ggsradius: "4000",
      ggslimit: "100",
      prop: "coordinates|description",
      colimit: "max",
      format: "json",
      origin: "*",
    });
    const response = await fetch("https://en.wikipedia.org/w/api.php?" + params, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("The place directory is busy. Please try again later.");
    const data = wikiResponse.parse(await response.json());
    return Object.entries(data.query?.pages ?? {}).flatMap(([id, page]) => {
      const location = page.coordinates?.[0];
      if (!location) return [];
      const description = page.description ?? "Mapped place";
      const text = `${page.title} ${description}`.toLowerCase();
      if (
        /defunct|demolished|destroyed|earthquake|\bbattle\b|former theatre|former theater/.test(
          text,
        )
      )
        return [];
      if (
        !/museum|gallery|historic site|palace|park\b|garden|monument|square|boulevard|church|cathedral|synagogue|temple|mosque|castle|fortress|landmark|theatre|theater|cinema|aquarium|zoo|beach|market|shop|mall|restaurant|café|cafe|coffee|bakery|\bpub\b|\bbar\b|jazz club/.test(
          text,
        )
      )
        return [];
      const category: Place["category"] =
        /shop|market|mall|shopping|retail|bookstore|bookshop/.test(text)
          ? "Shops"
          : /restaurant|cafe|café|coffee|bakery|pub |bar /.test(text)
            ? "Food & drink"
            : "Attractions";
      return [
        {
          id: "wikipedia/" + id,
          name: page.title,
          category,
          kind: description,
          ...location,
          address: "",
          openingHours: "",
          source:
            "https://en.wikipedia.org/wiki/" + encodeURIComponent(page.title.replaceAll(" ", "_")),
        },
      ];
    });
  });
}
