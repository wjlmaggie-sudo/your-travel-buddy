import { z } from "zod";
import countries from "./discovery-countries.json";
import meta from "./global-directory-meta.json";
import { suggestBudget } from "./budget-suggestion";
import type { DiscoveryNeeds } from "./destination-discovery";
export const GLOBAL_DIRECTORY = meta;
export type GlobalCity = {
  id: number;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  population: number;
};
export type ActivityEvidence = { name: string; source: string; tag: string };
export type GlobalSuggestion = {
  destination: string;
  country: string;
  region: string;
  minDays: number;
  idea: string;
  caution: string;
  source: string;
  reasons: string[];
  evidence: ActivityEvidence[];
  temperature: { high: number; low: number; days: number; label: string; source: string } | null;
  reference: ReturnType<typeof suggestBudget> | null;
  shortfall: number | null;
  score: number;
};
export type GlobalDiscoveryResult = {
  results: GlobalSuggestion[];
  scanned: number;
  total: number;
  offset: number;
  nextOffset: number | null;
  checkedAt: string;
};
const cityRows = z.array(
  z.tuple([
    z.number().int(),
    z.string(),
    z.string(),
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
    z.number().nonnegative(),
  ]),
);
const countryInfo = countries as Record<string, { name: string; region: string; capital: string }>;
const cache = new Map<string, { until: number; value: unknown }>();
let directory: Promise<GlobalCity[]> | undefined;
export function resetGlobalDiscoveryCache() {
  directory = undefined;
  cache.clear();
}
async function cached<T>(key: string, ttl: number, run: () => Promise<T>): Promise<T> {
  const found = cache.get(key);
  if (found && found.until > Date.now()) return found.value as T;
  const value = await run();
  if (cache.size >= 30) cache.delete(cache.keys().next().value!);
  cache.set(key, { until: Date.now() + ttl, value });
  return value;
}
async function readJSON(
  url: string | URL,
  signal: AbortSignal,
  fetcher: typeof fetch,
  body?: URLSearchParams,
) {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      ...(typeof window === "undefined"
        ? { "User-Agent": "TravelBuddy/1.0 (+https://wjlmaggie-sudo.github.io/your-travel-buddy/)" }
        : {}),
    },
    signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    ...(body ? { method: "POST", body } : {}),
  });
  if (!response.ok)
    throw new Error(`Public data service unavailable (${response.status}). Please retry later.`);
  return response.json();
}
export async function loadGlobalCities(fetcher: typeof fetch = fetch): Promise<GlobalCity[]> {
  return (directory ??= readJSON(
    `${import.meta.env.BASE_URL}data/global-cities.json`,
    new AbortController().signal,
    fetcher,
  )
    .then((data) =>
      cityRows.parse(data).map(([id, name, countryCode, lat, lon, population]) => ({
        id,
        name,
        countryCode,
        lat,
        lon,
        population,
      })),
    )
    .catch((error) => {
      directory = undefined;
      throw error;
    }));
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function distance(a: Pick<GlobalCity, "lat" | "lon">, b: Pick<GlobalCity, "lat" | "lon">) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const n =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(Math.max(0, 1 - n)));
}
export function globalCandidates(cities: GlobalCity[], needs: DiscoveryNeeds): GlobalCity[] {
  const departure = needs.departure
    ? cities.find((c) => normalize(c.name) === normalize(needs.departure!.split(",")[0]!))
    : undefined;
  const ranked = cities
    .filter((c) => {
      const country = countryInfo[c.countryCode];
      return (
        country &&
        (!needs.country || normalize(country.name) === normalize(needs.country)) &&
        (!needs.region || country.region === needs.region) &&
        !needs.excludedCountries?.some((name) => normalize(name) === normalize(country.name))
      );
    })
    .map((c) => ({
      city: c,
      score:
        Math.log10(Math.max(1000, c.population)) +
        (needs.warm ? Math.max(0, 4 - Math.abs(c.lat) / 12) : 0) -
        (departure ? distance(c, departure) / ((needs.days ?? 7) <= 5 ? 2000 : 10000) : 0),
    }))
    .sort((a, b) => b.score - a.score);
  const buckets = new Map<string, GlobalCity[]>();
  for (const { city } of ranked) {
    const bucket = buckets.get(city.countryCode) ?? [];
    bucket.push(city);
    buckets.set(city.countryCode, bucket);
  }
  const ordered: GlobalCity[] = [];
  for (let round = 0; ; round++) {
    let found = false;
    for (const bucket of buckets.values())
      if (bucket[round]) {
        ordered.push(bucket[round]!);
        found = true;
      }
    if (!found) break;
  }
  return ordered;
}
const activityTerms: Record<string, string> = {
  hiking: '( "hiking trail" OR "hiking trails" OR "hiking routes" OR "trekking" )',
  beach: "beach",
  culture: "( museum OR temple OR heritage OR gallery )",
  family: '( aquarium OR zoo OR playground OR "amusement park" )',
  surfing: "surfing",
  skiing: '( skiing OR "ski resort" )',
  diving: '( "scuba diving" OR snorkeling )',
  golf: '"golf course"',
  tennis: "tennis",
};
export function requestedActivities(needs: DiscoveryNeeds) {
  return [
    ...new Set([
      ...(needs.activities?.length ? needs.activities : needs.activity ? [needs.activity] : []),
      ...(needs.family ? ["family"] : []),
    ]),
  ];
}
const wikiResponse = z.object({
  error: z.unknown().optional(),
  warnings: z.unknown().optional(),
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          pageid: z.number(),
          title: z.string(),
          coordinates: z
            .array(z.object({ lat: z.number(), lon: z.number(), globe: z.string().optional() }))
            .optional(),
        }),
      ),
    })
    .optional(),
});
export async function activityEvidence(
  cities: GlobalCity[],
  tags: string[],
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<ActivityEvidence[][]> {
  if (tags.length > 3) throw new Error("Choose up to three activity themes per search.");
  const key = "wiki:" + cities.map((c) => c.id).join(",") + ":" + tags.join(",");
  return cached(key, 86400000, async () => {
    const result: ActivityEvidence[][] = cities.map(() => []);
    const tasks = cities.flatMap((city, i) => tags.map((tag) => ({ city, i, tag })));
    let cursor = 0;
    // Two in-flight requests maximum. No background polling or paid fallback.
    async function worker() {
      while (cursor < tasks.length) {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        const { city, i, tag } = tasks[cursor++]!;
        const url = new URL("https://en.wikipedia.org/w/api.php");
        url.search = new URLSearchParams({
          action: "query",
          format: "json",
          origin: "*",
          generator: "search",
          gsrsearch: `${activityTerms[tag]} nearcoord:30km,${city.lat},${city.lon}`,
          gsrlimit: "3",
          gsrnamespace: "0",
          prop: "coordinates",
          coprimary: "primary",
        }).toString();
        const data = wikiResponse.parse(await readJSON(url, signal, fetcher));
        // Ignoring warnings could silently discard the geographic constraint.
        if (data.error || data.warnings)
          throw new Error("Public geographic search could not verify the query.");
        for (const page of Object.values(data.query?.pages ?? {})) {
          // A nearby city/province article is not a specific activity place.
          const title = normalize(page.title).replace(/\s*\([^)]*\)$/, "");
          if (
            title === normalize(city.name) ||
            title === normalize(countryInfo[city.countryCode]?.name ?? "") ||
            /\b(province|district|county|prefecture|municipality|governorate|railway|railroad|highway|institution|school|university|regiment|battalion)\b/i.test(
              page.title,
            )
          )
            continue;
          const location = page.coordinates?.find((c) => !c.globe || c.globe === "earth");
          if (!location || distance(city, location) > 30.5) continue;
          result[i]!.push({
            tag,
            name: page.title.slice(0, 150),
            source: `https://en.wikipedia.org/?curid=${page.pageid}`,
          });
        }
      }
    }
    await Promise.all([worker(), worker()]);
    return result;
  });
}
const dailyWeather = z.object({
  timezone: z.string(),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
  }),
});
export async function globalTemperatures(
  cities: GlobalCity[],
  start: string,
  days: number,
  signal: AbortSignal,
  fetcher: typeof fetch,
  now = new Date(),
) {
  const today = now.toISOString().slice(0, 10),
    diff = (Date.parse(start) - Date.parse(today)) / 86400000;
  const forecast = diff >= 0 && diff < 16;
  const month = Number(start.slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new Error("Choose a valid departure date.");
  const year = now.getUTCFullYear() - 1;
  const historyStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const historyEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const key = `temp:${cities.map((c) => c.id).join(",")}:${forecast ? today + start + days : historyStart}`;
  return cached(key, forecast ? 600000 : 86400000, async () => {
    const url = new URL(
      forecast
        ? "https://api.open-meteo.com/v1/forecast"
        : "https://archive-api.open-meteo.com/v1/archive",
    );
    url.search = new URLSearchParams({
      latitude: cities.map((c) => c.lat).join(","),
      longitude: cities.map((c) => c.lon).join(","),
      daily: "temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      ...(forecast ? { forecast_days: "16" } : { start_date: historyStart, end_date: historyEnd }),
    }).toString();
    const raw = await readJSON(url, signal, fetcher);
    const data = z.array(dailyWeather).parse(Array.isArray(raw) ? raw : [raw]);
    if (data.length !== cities.length)
      throw new Error("Weather results do not match the requested locations.");
    const end = new Date(Date.parse(start) + (days - 1) * 86400000).toISOString().slice(0, 10);
    return data.map((d) => {
      const indexes = d.daily.time.flatMap((date, i) =>
        !forecast || (date >= start && date <= end) ? [i] : [],
      );
      const highs = indexes
        .map((i) => d.daily.temperature_2m_max[i])
        .filter((v): v is number => typeof v === "number");
      const lows = indexes
        .map((i) => d.daily.temperature_2m_min[i])
        .filter((v): v is number => typeof v === "number");
      return highs.length && lows.length
        ? {
            high: Math.round(highs.reduce((a, b) => a + b, 0) / highs.length),
            low: Math.round(lows.reduce((a, b) => a + b, 0) / lows.length),
            days: highs.length,
            label: forecast
              ? `Forecast reference for ${highs.length} covered trip days`
              : `Historical model reference: ${historyStart.slice(0, 7)} — not a forecast or climate normal`,
            source: forecast
              ? "https://open-meteo.com/en/docs"
              : "https://open-meteo.com/en/docs/historical-weather-api",
          }
        : null;
    });
  });
}
export async function searchGlobalDestinations(
  needs: DiscoveryNeeds,
  start: string,
  offset = 0,
  signal: AbortSignal = new AbortController().signal,
  fetcher: typeof fetch = fetch,
): Promise<GlobalDiscoveryResult> {
  const cities = await loadGlobalCities(fetcher);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const candidates = globalCandidates(cities, needs);
  const selected: GlobalCity[] = [];
  let cursor = offset;
  while (cursor < candidates.length && selected.length < 12) {
    const city = candidates[cursor++]!;
    if (selected.every((c) => distance(c, city) > 65)) selected.push(city);
  }
  if (!selected.length)
    return {
      results: [],
      scanned: 0,
      total: candidates.length,
      offset,
      nextOffset: null,
      checkedAt: new Date().toISOString(),
    };
  const tags = requestedActivities(needs);
  if (needs.unsupported || tags.length > 3 || tags.some((tag) => !activityTerms[tag]))
    throw new Error(
      "Choose up to three supported themes: hiking, beach, culture, family, surfing, skiing, diving, golf or tennis.",
    );
  const [evidence, weather] = await Promise.allSettled([
    activityEvidence(selected, tags.length ? tags : ["culture"], signal, fetcher),
    globalTemperatures(selected, start, needs.days ?? 5, signal, fetcher),
  ]);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (evidence.status === "rejected" && tags.length)
    throw new Error(
      "The public geographic search service could not verify your activities. Retry later; no fixed destination list has been substituted.",
    );
  if (weather.status === "rejected" && needs.warm !== undefined)
    throw new Error(
      "The public weather service is unavailable. Your temperature preference has not been verified; please retry later.",
    );
  const groupBudget =
    needs.budget && (!needs.budgetPerPerson || needs.travelers)
      ? needs.budget * (needs.budgetPerPerson ? needs.travelers! : 1)
      : undefined;
  const results: GlobalSuggestion[] = selected
    .flatMap((city, i) => {
      const places = evidence.status === "fulfilled" ? (evidence.value[i] ?? []) : [];
      const temp = weather.status === "fulfilled" ? (weather.value[i] ?? null) : null;
      if (
        tags.some((tag) => !places.some((p) => p.tag === tag)) ||
        (needs.warm === true && (!temp || temp.high < 20)) ||
        (needs.warm === false && (!temp || temp.high > 20))
      )
        return [];
      const country = countryInfo[city.countryCode]!;
      const destination = `${city.name}, ${country.name}`;
      const reference =
        needs.days && needs.travelers
          ? suggestBudget({
              destination,
              days: needs.days,
              travelers: needs.travelers,
              style: "Balanced",
              departure: needs.departure,
            })
          : null;
      const shortfall =
        reference && groupBudget && needs.currency === "EUR"
          ? Math.max(0, reference.low - groupBudget)
          : null;
      return [
        {
          destination,
          country: country.name,
          region: country.region,
          minDays: 1,
          idea: places.length
            ? `Nearby Wikipedia topic references include ${places
                .slice(0, 3)
                .map((p) => p.name)
                .join(", ")}.`
            : `A city base from the global GeoNames directory. Explore activities before choosing.`,
          source: `https://www.geonames.org/${city.id}`,
          evidence: places.slice(0, 8),
          temperature: temp,
          reference,
          shortfall,
          caution:
            "Wikipedia topic matches do not verify opening hours, tickets, trail access or suitability for children. Nearby places can be up to 30 km away. Check transport and entry requirements; no availability or live travel price is implied.",
          reasons: [
            ...tags.map((tag) => `Nearby ${tag} article reference (check current suitability)`),
            ...(temp
              ? [
                  `${temp.high}°C average daily high / ${temp.low}°C average low in the reference period`,
                ]
              : ["Weather lookup unavailable"]),
            ...(needs.warm !== undefined
              ? ["Temperature filter: warm ≥20°C average high; cooler ≤20°C"]
              : []),
            ...(shortfall !== null
              ? [
                  shortfall > 0
                    ? `Below the broad planner reference allowance by €${Math.round(shortfall)}`
                    : "Budget meets the low planner reference, not a live quote",
                ]
              : []),
          ],
          score: (shortfall === 0 ? 2 : 0) + Math.min(places.length, 5),
        },
      ];
    })
    .sort((a, b) => b.score - a.score);
  return {
    results,
    scanned: selected.length,
    total: candidates.length,
    offset,
    nextOffset: cursor < candidates.length ? cursor : null,
    checkedAt: new Date().toISOString(),
  };
}
