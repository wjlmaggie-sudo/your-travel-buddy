import { z } from "zod";
import { endDate } from "./planning";

const placeSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string().optional(),
  country_code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});
export type WeatherPlace = z.infer<typeof placeSchema>;
const numeric = z.number().finite().nullable();
export const forecastSchema = z.object({
  timezone: z.string(),
  current: z.object({ time: z.string(), temperature_2m: numeric }).optional(),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(numeric),
    temperature_2m_min: z.array(numeric),
    precipitation_probability_max: z.array(numeric),
    weather_code: z.array(numeric),
  }),
});
export type Forecast = z.infer<typeof forecastSchema>;

async function json(url: URL, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (!response.ok) throw new Error("Weather is temporarily unavailable. Please try again.");
  return response.json();
}
export async function findWeatherPlaces(destination: string, signal: AbortSignal) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: destination.trim(),
    count: "10",
    language: "en",
    format: "json",
  }).toString();
  const data = z
    .object({ results: z.array(placeSchema).optional() })
    .parse(await json(url, signal));
  const places = data.results ?? [];
  const country = destination.split(",").at(-1)?.trim().toLowerCase();
  return places.sort(
    (a, b) =>
      Number(b.country?.toLowerCase() === country) - Number(a.country?.toLowerCase() === country),
  );
}
export async function fetchForecast(place: WeatherPlace, signal: AbortSignal) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    forecast_days: "16",
    timezone: "auto",
    temperature_unit: "celsius",
  }).toString();
  return forecastSchema.parse(await json(url, signal));
}
export function tripForecast(forecast: Forecast, start: string, days: number) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(new Date(`${start}T12:00:00Z`).getTime())
  )
    return [];
  const end = endDate(start, Math.min(30, Math.max(1, days)));
  return forecast.daily.time.flatMap((date, index) =>
    date >= start && date <= end
      ? [
          {
            date,
            high: forecast.daily.temperature_2m_max[index] ?? null,
            low: forecast.daily.temperature_2m_min[index] ?? null,
            rain: forecast.daily.precipitation_probability_max[index] ?? null,
            code: forecast.daily.weather_code[index] ?? null,
          },
        ]
      : [],
  );
}
export function weatherDescription(code: number | null) {
  if (code === null) return "Forecast";
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain or drizzle";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}
