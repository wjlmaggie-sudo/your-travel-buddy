import { describe, it, expect, vi } from "vitest";
import {
  mapViewport,
  streetMapSvg,
  streetMapWays,
  parseOsmWays,
  type MapWay,
} from "@/lib/pdf-street-map";
import { curatedDay } from "@/lib/city-guides";
const places = [
  { name: "Stop 1", lat: 38.71, lon: -9.13, description: "", source: "https://example.org" },
  { name: "Stop 2", lat: 38.72, lon: -9.14, description: "", source: "https://example.org" },
];
const roads: MapWay[] = [
  {
    id: 1,
    type: "way",
    tags: { highway: "residential", name: "A & B <street>" },
    geometry: [
      { lat: 38.715, lon: -9.14 },
      { lat: 38.715, lon: -9.135 },
      { lat: 38.715, lon: -9.13 },
    ],
  },
];
describe("PDF street maps", () => {
  it("fits all stops inside a north-up geographic viewport", () => {
    const view = mapViewport(places)!;
    for (const p of places) {
      const xy = view.project(p);
      expect(xy.x).toBeGreaterThan(20);
      expect(xy.x).toBeLessThan(978);
      expect(xy.y).toBeGreaterThan(20);
      expect(xy.y).toBeLessThan(480);
    }
    expect(view.project(places[1]!).y).toBeLessThan(view.project(places[0]!).y);
    expect(mapViewport([])).toBeNull();
    expect(mapViewport([{ lat: Infinity, lon: 0 }])).toBeNull();
  });
  it("embeds real roads, escaped street labels, numbered pins and visible attribution", () => {
    const svg = streetMapSvg(places, roads)!;
    expect(svg).toContain("A &amp; B &lt;street&gt;");
    expect(svg).toContain(">1</text>");
    expect(svg).toContain(">2</text>");
    expect(svg).toContain("OpenStreetMap contributors");
    expect(svg).toContain("stroke-dasharray");
    expect(svg).not.toContain("http://tile.");
    expect(streetMapSvg(places, [])).toBeNull();
  });
  it("parses public map geometry and ignores unrelated nodes/buildings", () => {
    const ways = parseOsmWays(
      '<osm><node id="1" lat="38" lon="-9"/><node id="2" lat="38.1" lon="-9"/><way id="4"><nd ref="1"/><nd ref="2"/><tag k="highway" v="residential"/><tag k="name" v="Road"/></way><way id="5"><nd ref="1"/><nd ref="2"/><tag k="building" v="yes"/></way></osm>',
    );
    expect(ways).toHaveLength(1);
    expect(ways[0]!.geometry).toHaveLength(2);
    expect(() => parseOsmWays("<html>Error</html>")).toThrow();
  });
  it("serves each curated Lisbon day from bundled street data without a network request", async () => {
    const request = vi.fn();
    for (let day = 1; day <= 5; day++) {
      const stops = curatedDay("Lisbon", day)!;
      const ways = await streetMapWays(stops, request);
      expect(ways.some((w) => w.tags["highway"])).toBe(true);
      expect(streetMapSvg(stops, ways)).not.toBeNull();
    }
    expect(request).not.toHaveBeenCalled();
  });
});
