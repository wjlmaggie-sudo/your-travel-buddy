import { beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  GLOBAL_DIRECTORY,
  resetGlobalDiscoveryCache,
  searchGlobalDestinations,
  globalCandidates,
  globalTemperatures,
  activityEvidence,
  type GlobalCity,
} from "@/lib/global-discovery";
import { understandDiscovery } from "@/lib/destination-discovery";
const rows = [
  [101, "Bangkok", "TH", 13.75, 100.5, 10000000],
  [102, "Suva", "FJ", -18.1, 178.4, 100000],
  [103, "Queenstown", "NZ", -45, 168.6, 20000],
  [104, "Vancouver", "CA", 49.2, -123.1, 600000],
  [105, "Marrakech", "MA", 31.6, -8, 900000],
  [106, "Lisbon", "PT", 38.7, -9.1, 500000],
] as const;
function fixtureFetch(failMaps = false, incompleteWeather = false) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("global-cities.json")) return Response.json(rows);
    if (url.includes("wikipedia.org")) {
      if (failMaps) return new Response("", { status: 503 });
      const q = new URL(url).searchParams.get("gsrsearch")!;
      const family = q.includes("aquarium");
      return Response.json({
        query: {
          pages: Object.fromEntries(
            rows.map(([id, name, , lat, lon]) => [
              id,
              {
                pageid: id,
                title: `${name} ${family ? "aquarium" : "trail"}`,
                coordinates: [{ lat, lon, globe: "earth" }],
              },
            ]),
          ),
        },
      });
    }
    if (url.includes("open-meteo.com")) {
      const query = new URL(url);
      const lats = query.searchParams.get("latitude")!.split(",");
      const data = lats.map((lat) => ({
        timezone: "UTC",
        daily: {
          time: ["2025-12-01", "2025-12-02"],
          temperature_2m_max: [
            Math.abs(Number(lat)) > 40 ? 12 : 26,
            Math.abs(Number(lat)) > 40 ? 14 : 28,
          ],
          temperature_2m_min: [10, 12],
        },
      }));
      return Response.json(incompleteWeather ? data.slice(0, 1) : data);
    }
    throw new Error(`Unexpected public request ${url} ${String(init?.method)}`);
  }) as unknown as typeof fetch;
}
beforeEach(resetGlobalDiscoveryCache);
it("ships a licensed worldwide directory rather than a hand-picked list", () => {
  const data = JSON.parse(readFileSync("public/data/global-cities.json", "utf8")) as unknown[][];
  expect(data.length).toBe(GLOBAL_DIRECTORY.cities);
  expect(data.length).toBeGreaterThan(30000);
  expect(new Set(data.map((row) => row[2])).size).toBe(GLOBAL_DIRECTORY.countries);
  expect(GLOBAL_DIRECTORY.license).toBe("CC BY 4.0");
});
it("discovers locations outside the former catalog and uses geographic article and historical temperature evidence", async () => {
  const fetcher = fixtureFetch();
  const needs = understandDiscovery("7 days warm, hiking, family activities, not Spain", {});
  const result = await searchGlobalDestinations(
    needs,
    "2030-12-01",
    0,
    new AbortController().signal,
    fetcher,
  );
  expect(result.results.some((d) => d.country === "Fiji")).toBe(true);
  expect(result.results.some((d) => d.country === "Thailand")).toBe(true);
  expect(result.results.every((d) => d.temperature!.high >= 20)).toBe(true);
  expect(
    result.results.every(
      (d) =>
        d.evidence.some((e) => e.tag === "family") && d.evidence.some((e) => e.tag === "hiking"),
    ),
  ).toBe(true);
  expect(result.results[0]?.temperature?.label).toMatch(/Historical model reference/);
  expect(result.results[0]?.source).toMatch(/^https:\/\/www.geonames.org\//);
  expect(result.scanned).toBe(rows.length);
});
it("supports countries and regions outside the old twelve-country list and respects exclusions", () => {
  const needs = understandDiscovery("5 days culture in Canada, not Spain", {});
  expect(needs.country).toBe("Canada");
  const cities = rows.map(([id, name, countryCode, lat, lon, population]) => ({
    id,
    name,
    countryCode,
    lat,
    lon,
    population,
  }));
  expect(globalCandidates(cities, needs).map((d) => d.name)).toEqual(["Vancouver"]);
  const oceania = understandDiscovery("Oceania only", {});
  expect(
    globalCandidates(cities, oceania)
      .map((d) => d.countryCode)
      .sort(),
  ).toEqual(["FJ", "NZ"]);
});
it("does not silently replace a provider outage with curated or demonstration destinations", async () => {
  await expect(
    searchGlobalDestinations(
      { days: 5, activity: "hiking" },
      "2030-12-01",
      0,
      new AbortController().signal,
      fixtureFetch(true),
    ),
  ).rejects.toThrow(/could not verify your activities/);
  resetGlobalDiscoveryCache();
  await expect(
    searchGlobalDestinations(
      { days: 5, warm: true },
      "2030-12-01",
      0,
      new AbortController().signal,
      fixtureFetch(false, true),
    ),
  ).rejects.toThrow(/temperature preference has not been verified/);
});
it("filters actual cool/warm data and keeps budgets explicitly estimated", async () => {
  const result = await searchGlobalDestinations(
    {
      days: 5,
      activity: "hiking",
      warm: false,
      country: "Canada",
      travelers: 2,
      budget: 100,
      currency: "EUR",
    },
    "2030-12-01",
    0,
    new AbortController().signal,
    fixtureFetch(),
  );
  expect(result.results).toHaveLength(1);
  expect(result.results[0]?.temperature?.high).toBe(13);
  expect(result.results[0]?.shortfall).toBeGreaterThan(0);
  expect(result.results[0]?.reasons.join(" ")).toContain("broad planner reference");
});
it("limits public-service work to 12 candidate cities per batch and provides a continuation", async () => {
  const data: GlobalCity[] = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `Town ${i}`,
    countryCode: "CA",
    lat: 20 + i,
    lon: -130,
    population: 100000 + i,
  }));
  const fetcher = vi.fn(async (input: RequestInfo | URL) =>
    String(input).endsWith("global-cities.json")
      ? Response.json(data.map((c) => [c.id, c.name, c.countryCode, c.lat, c.lon, c.population]))
      : String(input).includes("wikipedia.org")
        ? Response.json({})
        : new Response("", { status: 503 }),
  ) as unknown as typeof fetch;
  const result = await searchGlobalDestinations(
    { days: 5 },
    "2030-12-01",
    0,
    new AbortController().signal,
    fetcher,
  );
  expect(result.scanned).toBe(12);
  expect(result.nextOffset).toBe(12);
  expect(result.total).toBe(30);
});

it("uses only covered trip dates for near-term forecasts and identifies historical references separately", async () => {
  const fetcher = vi.fn(async () =>
    Response.json({
      timezone: "UTC",
      daily: {
        time: ["2026-10-31", "2026-11-01", "2026-11-02"],
        temperature_2m_max: [99, 21, 23],
        temperature_2m_min: [99, 11, 13],
      },
    }),
  ) as unknown as typeof fetch;
  const city = { id: 1, name: "Test", countryCode: "CA", lat: 40, lon: -100, population: 1000 };
  const [weather] = await globalTemperatures(
    [city],
    "2026-11-01",
    2,
    new AbortController().signal,
    fetcher,
    new Date("2026-10-31T12:00:00Z"),
  );
  expect(weather).toMatchObject({ high: 22, low: 12, days: 2 });
  expect(weather?.label).toMatch(/Forecast reference/);
  expect(String(vi.mocked(fetcher).mock.calls[0]?.[0])).toContain("api.open-meteo.com/v1/forecast");
});

it("rejects ignored geographic filters and does not count distant or administrative articles as activity places", async () => {
  const city = {
    id: 1,
    name: "Bangkok",
    countryCode: "TH",
    lat: 13.75,
    lon: 100.5,
    population: 1000000,
  };
  const warning = vi.fn(async () =>
    Response.json({ warnings: { search: { "*": "Invalid geo filter" } } }),
  ) as unknown as typeof fetch;
  await expect(
    activityEvidence([city], ["hiking"], new AbortController().signal, warning),
  ).rejects.toThrow(/geographic search/);
  const far = vi.fn(async () =>
    Response.json({
      query: {
        pages: {
          1: { pageid: 1, title: "Distant trail", coordinates: [{ lat: 50, lon: 0 }] },
          2: { pageid: 2, title: "Bangkok", coordinates: [{ lat: 13.75, lon: 100.5 }] },
          3: { pageid: 3, title: "Bangkok district", coordinates: [{ lat: 13.75, lon: 100.5 }] },
        },
      },
    }),
  ) as unknown as typeof fetch;
  expect(await activityEvidence([city], ["hiking"], new AbortController().signal, far)).toEqual([
    [],
  ]);
});
