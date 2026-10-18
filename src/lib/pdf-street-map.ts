import { z } from "zod";
import type { VisualPlace } from "./city-guides";
import lisbonMap from "./lisbon-map.json";

const point = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
});
const way = z.object({
  type: z.literal("way"),
  id: z.number(),
  tags: z.record(z.string(), z.string()).default({}),
  geometry: z.array(point).max(20000),
});
export type MapWay = z.infer<typeof way>;
type Bounds = { south: number; west: number; north: number; east: number };
const WIDTH = 998,
  HEIGHT = 500;
const xml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
const mercator = (lat: number) =>
  (Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * Math.PI) / 360)) * 180) /
  Math.PI;
export function mapViewport(places: Pick<VisualPlace, "lat" | "lon">[]) {
  if (!places.length || places.some((p) => !point.safeParse(p).success)) return null;
  const lon = places.map((p) => p.lon),
    y = places.map((p) => mercator(p.lat));
  const cx = (Math.min(...lon) + Math.max(...lon)) / 2,
    cy = (Math.min(...y) + Math.max(...y)) / 2;
  let dx = Math.max(0.008, (Math.max(...lon) - Math.min(...lon)) * 1.5),
    dy = Math.max(0.004, (Math.max(...y) - Math.min(...y)) * 1.5);
  if (dx / dy < WIDTH / HEIGHT) dx = (dy * WIDTH) / HEIGHT;
  else dy = (dx * HEIGHT) / WIDTH;
  const lat = (v: number) =>
    ((2 * Math.atan(Math.exp((v * Math.PI) / 180)) - Math.PI / 2) * 180) / Math.PI;
  const bounds: Bounds = {
    south: lat(cy - dy / 2),
    north: lat(cy + dy / 2),
    west: cx - dx / 2,
    east: cx + dx / 2,
  };
  return {
    bounds,
    project: (p: { lat: number; lon: number }) => ({
      x: ((p.lon - (cx - dx / 2)) / dx) * WIDTH,
      y: ((cy + dy / 2 - mercator(p.lat)) / dy) * HEIGHT,
    }),
  };
}
function intersects(w: MapWay, b: Bounds) {
  return w.geometry.some(
    (p) => p.lat >= b.south && p.lat <= b.north && p.lon >= b.west && p.lon <= b.east,
  );
}
export function parseOsmWays(xmlText: string): MapWay[] {
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  if (document.querySelector("parsererror") || !document.querySelector("osm"))
    throw new Error("Invalid map response");
  const nodes = new Map(
    Array.from(document.querySelectorAll("node")).map((n) => [
      n.getAttribute("id"),
      { lat: Number(n.getAttribute("lat")), lon: Number(n.getAttribute("lon")) },
    ]),
  );
  return Array.from(document.querySelectorAll("way")).flatMap((element) => {
    const tags = Object.fromEntries(
      Array.from(element.querySelectorAll("tag")).map((t) => [
        t.getAttribute("k")!,
        t.getAttribute("v")!,
      ]),
    );
    if (
      !tags["highway"] &&
      !tags["waterway"] &&
      !/^(water|coastline|wood)$/.test(tags["natural"] ?? "") &&
      !/^(park|garden)$/.test(tags["leisure"] ?? "")
    )
      return [];
    const geometry = Array.from(element.querySelectorAll("nd")).flatMap((n) => {
      const p = nodes.get(n.getAttribute("ref"));
      return p ? [p] : [];
    });
    const parsed = way.safeParse({
      type: "way",
      id: Number(element.getAttribute("id")),
      tags,
      geometry,
    });
    return parsed.success && geometry.length > 1 ? [parsed.data] : [];
  });
}
async function mapApiFallback(b: Bounds, request: typeof fetch): Promise<MapWay[]> {
  // A few small source extracts only; cap request count and area for this public fallback.
  if ((b.north - b.south) * (b.east - b.west) > 0.0012)
    throw new Error("Street map data unavailable");
  const nx = Math.ceil((b.east - b.west) / 0.012),
    ny = Math.ceil((b.north - b.south) / 0.012);
  if (nx * ny > 12) throw new Error("Map area too broad");
  const ways = new Map<number, MapWay>();
  const deadline = AbortSignal.timeout(20000);
  for (let x = 0; x < nx; x++)
    for (let y = 0; y < ny; y++) {
      const west = b.west + ((b.east - b.west) * x) / nx,
        east = b.west + ((b.east - b.west) * (x + 1)) / nx;
      const south = b.south + ((b.north - b.south) * y) / ny,
        north = b.south + ((b.north - b.south) * (y + 1)) / ny;
      const response = await request(
        "https://api.openstreetmap.org/api/0.6/map?" +
          new URLSearchParams({ bbox: `${west},${south},${east},${north}` }),
        { signal: deadline },
      );
      if (!response.ok) throw new Error("Street map data unavailable");
      parseOsmWays(await response.text()).forEach((w) => ways.set(w.id, w));
    }
  return [...ways.values()];
}
const cache = new Map<string, Promise<MapWay[]>>();
/** One bounded open-data request per distinct map. Never downloads OSM raster tiles for offline use. */
export async function streetMapWays(
  places: VisualPlace[],
  request: typeof fetch = fetch,
): Promise<MapWay[]> {
  const view = mapViewport(places);
  if (!view) return [];
  const b = view.bounds;
  const bundled = lisbonMap as unknown as { areas: Bounds[]; elements: MapWay[] };
  if (
    bundled.areas?.some(
      (area) =>
        b.south >= area.south &&
        b.north <= area.north &&
        b.west >= area.west &&
        b.east <= area.east,
    )
  )
    return bundled.elements.filter((w) => intersects(w, b));
  // Broad cross-city journeys use the geographic fallback rather than an unbounded data download.
  if (b.north - b.south > 0.1 || b.east - b.west > 0.16) return [];
  const key = [b.south, b.west, b.north, b.east].map((n) => n.toFixed(5)).join(",");
  if (!cache.has(key)) {
    if (cache.size >= 30) cache.delete(cache.keys().next().value!);
    const task = (async () => {
      try {
        const bbox = `(${key})`;
        const response = await request(
          import.meta.env["VITE_OVERPASS_ENDPOINT"] ||
            "https://overpass.private.coffee/api/interpreter",
          {
            method: "POST",
            body: new URLSearchParams({
              data: `[out:json][timeout:15][maxsize:8388608];(way[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service|footway|path|steps)$"]${bbox};way[natural~"^(water|coastline|wood)$"]${bbox};way[leisure~"^(park|garden)$"]${bbox};way[waterway]${bbox};);out geom;`,
            }),
            signal: AbortSignal.timeout(20000),
          },
        );
        if (!response.ok) throw new Error("Street map data unavailable");
        const data = z.object({ elements: z.array(way).max(12000) }).parse(await response.json());
        if (!data.elements.some((w) => w.tags["highway"])) throw new Error("No streets returned");
        return data.elements;
      } catch {
        return mapApiFallback(b, request);
      }
    })();
    cache.set(key, task);
    task.catch(() => cache.delete(key));
  }
  return cache.get(key)!;
}

/** Self-contained vector street map; the PDF retains roads, labels and pins offline. */
export function streetMapSvg(places: VisualPlace[], ways: MapWay[]): string | null {
  const view = mapViewport(places);
  if (!view || !ways.some((w) => w.tags["highway"])) return null;
  const p = view.project;
  const path = (w: MapWay) =>
    w.geometry
      .map((pt, i) => {
        const xy = p(pt);
        return `${i ? "L" : "M"}${xy.x.toFixed(1)},${xy.y.toFixed(1)}`;
      })
      .join(" ");
  const visible = ways.filter((w) => intersects(w, view.bounds));
  const areas = visible
    .filter((w) => !w.tags["highway"] && w.geometry.length > 2)
    .map(
      (w) =>
        `<path d="${path(w)}${w.geometry[0]?.lat === w.geometry.at(-1)?.lat && w.geometry[0]?.lon === w.geometry.at(-1)?.lon ? " Z" : ""}" fill="${w.tags["natural"] === "water" ? "#b6d8e3" : w.tags["leisure"] || w.tags["natural"] === "wood" ? "#d7e5cc" : "none"}" stroke="${w.tags["waterway"] || w.tags["natural"] === "coastline" ? "#83b5c8" : "none"}" stroke-width="3"/>`,
    )
    .join("");
  const roads = visible.filter((w) => w.tags["highway"]);
  const width = (w: MapWay) =>
    /motorway|trunk|primary|secondary/.test(w.tags["highway"]!)
      ? 7
      : /footway|path|steps/.test(w.tags["highway"]!)
        ? 2
        : 4;
  const strokes =
    roads
      .map(
        (w) =>
          `<path d="${path(w)}" fill="none" stroke="#d0c9ba" stroke-width="${width(w) + 2}" stroke-linecap="round"/>`,
      )
      .join("") +
    roads
      .map(
        (w) =>
          `<path d="${path(w)}" fill="none" stroke="${width(w) === 7 ? "#fff0bd" : "#ffffff"}" stroke-width="${width(w)}" stroke-linecap="round"/>`,
      )
      .join("");
  const occupied: { x: number; y: number; half: number }[] = [];
  const names = new Set<string>();
  const points = places.map(p);
  const labels = roads
    .filter((w) => w.tags["name"] && w.geometry.length > 2)
    .sort((a, b) => b.geometry.length - a.geometry.length)
    .flatMap((w) => {
      const name = w.tags["name:en"] || w.tags["name"]!;
      const xy = p(w.geometry[Math.floor(w.geometry.length / 2)]!);
      const half = Math.min(name.length, 42) * 3.5 + 5;
      if (
        xy.x < half + 10 ||
        xy.x > WIDTH - half - 10 ||
        xy.y < 30 ||
        xy.y > HEIGHT - 35 ||
        names.has(name) ||
        points.some((pt) => Math.abs(pt.x - xy.x) < half + 24 && Math.abs(pt.y - xy.y) < 30)
      )
        return [];
      if (
        occupied.some(
          (box) => Math.abs(box.x - xy.x) < box.half + half + 10 && Math.abs(box.y - xy.y) < 38,
        )
      )
        return [];
      occupied.push({ ...xy, half });
      names.add(name);
      return [
        `<text x="${xy.x.toFixed(1)}" y="${xy.y.toFixed(1)}" text-anchor="middle" font-family="Roboto" font-size="13" fill="#5b5b50">${xml(name.slice(0, 42))}</text>`,
      ];
    })
    .slice(0, 22)
    .join("");
  const connectors = points
    .slice(1)
    .map(
      (pt, i) =>
        `<line x1="${points[i]!.x}" y1="${points[i]!.y}" x2="${pt.x}" y2="${pt.y}" stroke="#17685d" stroke-width="3" stroke-dasharray="7 6"/>`,
    )
    .join("");
  const markers = points
    .map(
      (pt, i) =>
        `<circle cx="${pt.x}" cy="${pt.y}" r="17" fill="#17685d" stroke="white" stroke-width="3"/><text x="${pt.x}" y="${pt.y + 5}" text-anchor="middle" font-family="Roboto" font-size="15" fill="white">${i + 1}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><defs><clipPath id="bounds"><rect width="${WIDTH}" height="${HEIGHT}"/></clipPath></defs><rect width="${WIDTH}" height="${HEIGHT}" fill="#eeeade"/><g clip-path="url(#bounds)">${areas}${strokes}${labels}${connectors}${markers}</g><rect x="12" y="12" width="35" height="28" rx="4" fill="white"/><text x="29" y="32" font-family="Roboto" text-anchor="middle" font-size="16" fill="#17685d">N</text><path d="M 40,18 L 36,26 L 44,26 Z" fill="#17685d"/><rect x="0" y="477" width="${WIDTH}" height="23" fill="white"/><text x="12" y="493" font-family="Roboto" font-size="11" fill="#52655f">Map data © OpenStreetMap contributors · openstreetmap.org/copyright · ODbL</text></svg>`;
}
