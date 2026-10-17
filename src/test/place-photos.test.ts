import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlacePhoto } from "@/lib/place-photos";
const place = {
  name: "A landmark",
  lat: 38.7,
  lon: -9.1,
  description: "",
  source: "https://en.wikipedia.org/wiki/A_landmark",
};
const first = {
  query: { pages: { "1": { pageimage: "Landmark.jpg", coordinates: [{ lat: 38.7, lon: -9.1 }] } } },
};
function commons(license: string) {
  return {
    query: {
      pages: {
        "2": {
          imageinfo: [
            {
              thumburl: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Landmark.jpg",
              descriptionurl: "https://commons.wikimedia.org/wiki/File:Landmark.jpg",
              extmetadata: {
                LicenseShortName: { value: license },
                Artist: { value: "<a>Example photographer</a>" },
              },
            },
          ],
        },
      },
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
describe("place photo matching", () => {
  it("rejects an image for a different geographic place", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          query: { pages: { "1": { pageimage: "Wrong.jpg", coordinates: [{ lat: 48, lon: 2 }] } } },
        }),
      });
    vi.stubGlobal("fetch", fetcher);
    expect(await fetchPlacePhoto(place, new AbortController().signal)).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("retains image attribution and only displays open-licensed Commons images", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => first })
      .mockResolvedValueOnce({ ok: true, json: async () => commons("CC BY-SA 4.0") });
    vi.stubGlobal("fetch", fetcher);
    expect(await fetchPlacePhoto(place, new AbortController().signal)).toEqual(
      expect.objectContaining({ credit: "Example photographer", license: "CC BY-SA 4.0" }),
    );
    fetcher
      .mockResolvedValueOnce({ ok: true, json: async () => first })
      .mockResolvedValueOnce({ ok: true, json: async () => commons("All rights reserved") });
    expect(await fetchPlacePhoto(place, new AbortController().signal)).toBeNull();
  });
});
