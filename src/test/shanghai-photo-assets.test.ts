import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assets from "@/lib/shanghai-photo-assets.json";
import { localPlacePhoto } from "@/lib/local-place-photos";
import { loadCityGuide } from "@/lib/city-guides";
it("loads sourced Shanghai stops and credited local photos without remote directory requests", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  try {
    const guide = await loadCityGuide("shanghai");
    expect(guide.days.flat().length).toBeGreaterThanOrEqual(15);
    expect(fetcher).not.toHaveBeenCalled();
    expect(Object.keys(assets).length).toBeGreaterThanOrEqual(8);
    for (const [name, asset] of Object.entries(assets)) {
      const place = guide.days.flat().find((p) => p.name === name)!;
      expect(place, name).toBeDefined();
      const photo = localPlacePhoto(place)!;
      expect(photo.credit).toBeTruthy();
      expect(photo.license).toMatch(/^CC|Public domain|PD/);
      expect(photo.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect([...readFileSync(resolve("public", asset.file)).subarray(0, 3)]).toEqual([
        255, 216, 255,
      ]);
    }
    expect(localPlacePhoto({ name: "Shanghai Grand Theatre", lat: 48, lon: 2 })).toBeUndefined();
  } finally {
    vi.unstubAllGlobals();
  }
});
