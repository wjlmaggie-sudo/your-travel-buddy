import { useQuery } from "@tanstack/react-query";
import { CloudSun, CloudRain, Snowflake, Sun } from "lucide-react";
import { findWeatherPlaces, fetchForecast, tripForecast, weatherDescription } from "@/lib/weather";

export function DayWeather({
  destination,
  date,
  active = true,
}: {
  destination: string;
  date: string | undefined;
  active?: boolean;
}) {
  const places = useQuery({
    queryKey: ["weather-places", destination],
    enabled: active && !!date && destination.trim().length >= 2,
    queryFn: ({ signal }) => findWeatherPlaces(destination, signal),
    staleTime: 3600000,
    retry: false,
  });
  const place = places.data?.[0];
  const weather = useQuery({
    queryKey: ["forecast", place?.latitude, place?.longitude],
    enabled: active && !!date && !!place,
    queryFn: ({ signal }) => fetchForecast(place!, signal),
    staleTime: 600000,
    retry: false,
  });
  const row = weather.data && date ? tripForecast(weather.data, date, 1)[0] : undefined;
  const description = row ? weatherDescription(row.code) : "";
  const Icon = /snow/i.test(description)
    ? Snowflake
    : /rain|drizzle|thunder/i.test(description)
      ? CloudRain
      : /clear/i.test(description)
        ? Sun
        : CloudSun;
  const temperature = (value: number | null) => (value == null ? "—" : `${Math.round(value)}°C`);
  const error = places.isError || weather.isError || places.data?.length === 0;
  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary"
      role="status"
      aria-label={`Weather for ${date ?? "this day"}`}
      title={
        place
          ? `Forecast for ${[place.name, place.country].filter(Boolean).join(", ")} · Open-Meteo`
          : "Weather by Open-Meteo"
      }
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {error ? (
        "Weather unavailable"
      ) : row ? (
        <>
          <span>{description}</span>
          <span className="font-semibold">
            {temperature(row.high)} / {temperature(row.low)}
          </span>
          {row.rain != null && <span>{row.rain}% rain</span>}
        </>
      ) : weather.data ? (
        "Forecast not available for this date"
      ) : (
        "Checking weather…"
      )}
      <a
        className="underline underline-offset-2"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
        aria-label="Weather by Open-Meteo"
      >
        Open-Meteo
      </a>
    </span>
  );
}
