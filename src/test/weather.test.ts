import { describe, expect, it, vi, afterEach } from "vitest";
import {
  findWeatherPlaces,
  tripForecast,
  outlookForecast,
  fetchForecast,
  type Forecast,
} from "@/lib/weather";

const forecast: Forecast = {
  timezone: "Asia/Tokyo",
  current: { time: "2026-10-17T12:00", temperature_2m: 22 },
  daily: {
    time: ["2026-10-17", "2026-10-18", "2026-10-19"],
    temperature_2m_max: [25, null, 21],
    temperature_2m_min: [18, 17, 16],
    precipitation_probability_max: [0, null, 80],
    weather_code: [0, null, 61],
  },
};
afterEach(() => vi.unstubAllGlobals());
describe("weather for travel dates", () => {
  it("only includes trip dates and preserves missing readings instead of inventing temperatures", () => {
    expect(tripForecast(forecast, "2026-10-18", 7)).toEqual([
      { date: "2026-10-18", high: null, low: 17, rain: null, code: null },
      { date: "2026-10-19", high: 21, low: 16, rain: 80, code: 61 },
    ]);
  });
  it("does not substitute today's forecast for a distant or past trip", () => {
    expect(tripForecast(forecast, "2026-12-01", 5)).toEqual([]);
    expect(tripForecast(forecast, "2026-09-01", 5)).toEqual([]);
    expect(tripForecast(forecast, "", 5)).toEqual([]);
  });
  it("keeps the country qualifier in location searches", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    vi.stubGlobal("fetch", fetcher);
    await findWeatherPlaces("Paris, France", new AbortController().signal);
    expect(new URL(fetcher.mock.calls[0]?.[0]).searchParams.get("name")).toBe("Paris, France");
  });
});

it("keeps a partial outlook and missing values truthful and requests the real API's extended range", async () => {
  expect(outlookForecast(forecast)).toHaveLength(3);
  expect(outlookForecast(forecast)[1]?.high).toBeNull();
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => forecast });
  vi.stubGlobal("fetch", fetcher);
  await fetchForecast(
    { id: 1, name: "Tokyo", latitude: 35.6, longitude: 139.6 },
    new AbortController().signal,
  );
  const url = new URL(fetcher.mock.calls[0]?.[0]);
  expect(url.origin).toBe("https://api.open-meteo.com");
  expect(url.searchParams.get("forecast_days")).toBe("16");
  expect(url.searchParams.get("timezone")).toBe("auto");
});
