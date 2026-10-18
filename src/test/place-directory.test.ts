import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePlaces, searchDestinations, nearbyPlaces } from "@/lib/place-directory";
afterEach(() => vi.unstubAllGlobals());
describe("live place directory", () => {
  it("uses Wikipedia places when the map provider is unavailable", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("map server down"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            query: {
              pages: {
                "11": {
                  title: "Example Market",
                  description: "marketplace",
                  coordinates: [{ lat: 48.1, lon: 11.1 }],
                },
                "14": {
                  title: "Example Cathedral",
                  description: "small Gothic cathedral and seat of the Archbishop",
                  coordinates: [{ lat: 48.13, lon: 11.13 }],
                },
                "12": {
                  title: "Police Office",
                  description: "law enforcement agency",
                  coordinates: [{ lat: 48.11, lon: 11.11 }],
                },
                "13": {
                  title: "Old Theatre",
                  description: "defunct theatre",
                  coordinates: [{ lat: 48.12, lon: 11.12 }],
                },
              },
            },
          }),
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const places = await nearbyPlaces({
      name: "Fallback test city",
      lat: 48.1,
      lon: 11.1,
      source: "https://en.wikipedia.org/wiki/City",
    });
    expect(places).toHaveLength(2);
    expect(places.find((place) => place.name === "Example Cathedral")?.category).toBe(
      "Attractions",
    );
    expect(places[0]?.category).toBe("Shops");
    expect(places[0]?.source).toContain("en.wikipedia.org");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("normalizes real map records and skips unnamed or duplicate features", () => {
    const places = parsePlaces({
      elements: [
        {
          id: 1,
          type: "node",
          lat: 52.5,
          lon: 13.4,
          tags: { name: "City Museum", tourism: "museum" },
        },
        {
          id: 2,
          type: "way",
          center: { lat: 52.5, lon: 13.4 },
          tags: { name: "City Museum", tourism: "museum" },
        },
        { id: 3, type: "node", lat: 52.51, lon: 13.41, tags: { name: "Bookshop", shop: "books" } },
        { id: 4, type: "node", lat: 52.5, lon: 13.4, tags: { tourism: "museum" } },
      ],
    });
    expect(places).toHaveLength(2);
    expect(places.map((p) => p.category)).toEqual(["Attractions", "Shops"]);
    expect(places[1]?.source).toBe("https://www.openstreetmap.org/node/3");
  });
  it("keeps the search ranking rather than ordering by Wikipedia page ID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            query: {
              pages: {
                "1": { title: "Other place", index: 2, coordinates: [{ lat: 1, lon: 1 }] },
                "99": { title: "Test city", index: 1, coordinates: [{ lat: 52, lon: 13 }] },
              },
            },
          }),
        ),
      ),
    );
    const result = await searchDestinations("Unique test city");
    expect(result[0]?.name).toBe("Test city");
  });
});
