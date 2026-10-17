import { describe, it, expect, vi } from "vitest";
import { curatedStory, fetchPlaceStory } from "@/lib/place-stories";
const place = {
  name: "Alfama",
  source: "https://en.wikipedia.org/wiki/Alfama",
  lat: 38.71,
  lon: -9.13,
  description: "Old Lisbon neighborhood",
};
describe("sourced stories", () => {
  it("links curated landmark history to primary sources", () => {
    expect(curatedStory("São Jorge Castle")?.text).toContain("1147");
    expect(curatedStory("Pena Palace")?.source).toContain("parquesdesintra.pt");
  });
  it("loads background from the exact linked Wikipedia page and does not invent missing history", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(Response.json({ type: "standard", extract: "Sourced background." }));
    expect((await fetchPlaceStory(place, undefined, request))?.credit).toContain("Wikipedia");
    expect(request.mock.calls[0]?.[0]).toContain("summary/Alfama");
    expect(
      await fetchPlaceStory(
        { ...place, source: "https://www.openstreetmap.org/node/1" },
        undefined,
        request,
      ),
    ).toBeNull();
    expect(
      await fetchPlaceStory(
        place,
        undefined,
        vi
          .fn()
          .mockResolvedValue(Response.json({ type: "disambiguation", extract: "Not this place" })),
      ),
    ).toBeNull();
  });
});
