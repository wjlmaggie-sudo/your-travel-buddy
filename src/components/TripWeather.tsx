import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CloudSun,
  Sun,
  CloudRain,
  Snowflake,
  Cloud,
  Thermometer,
  Droplets,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  findWeatherPlaces,
  fetchForecast,
  tripForecast,
  outlookForecast,
  weatherDescription,
} from "@/lib/weather";

export function TripWeather({
  destination,
  startDate,
  days,
  active = true,
}: {
  active?: boolean;
  destination: string;
  startDate: string;
  days: number;
}) {
  const [view, setView] = useState<"outlook" | "trip">("outlook");
  const [requested, setRequested] = useState(false);
  const [placeId, setPlaceId] = useState<number>();
  const [unit, setUnit] = useState<"C" | "F">("C");
  const places = useQuery({
    queryKey: ["weather-places", destination],
    enabled: active && requested && destination.trim().length >= 2,
    queryFn: ({ signal }) => findWeatherPlaces(destination, signal),
    staleTime: 3600000,
    retry: false,
  });
  const place = places.data?.find((item) => item.id === placeId) ?? places.data?.[0];
  const weather = useQuery({
    queryKey: ["forecast", place?.latitude, place?.longitude],
    enabled: active && requested && !!place,
    queryFn: ({ signal }) => fetchForecast(place!, signal),
    staleTime: 600000,
    retry: false,
  });
  const rows = weather.data
    ? view === "outlook"
      ? outlookForecast(weather.data)
      : tripForecast(weather.data, startDate, days)
    : [];
  const temperature = (value: number | null | undefined) =>
    value == null ? "—" : `${Math.round(unit === "F" ? (value * 9) / 5 + 32 : value)}°${unit}`;
  const loading = requested && (places.isFetching || weather.isFetching);
  const error = places.isError || weather.isError;
  return (
    <section className="tool-card mx-auto max-w-3xl" aria-label="Destination weather">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">A look at the weather</h3>
        </div>
        {weather.data && (
          <div className="flex gap-1" aria-label="Temperature unit">
            {(["C", "F"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={unit === value}
                className={`rounded-md px-2 py-1 text-xs ${unit === value ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}
                onClick={() => setUnit(value)}
              >
                °{value}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        className="mt-5 min-h-32 rounded-2xl bg-gradient-to-br from-secondary/10 to-transparent p-5"
        data-testid="weather-results"
      >
        {!requested ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              See a 15-day outlook with daily highs, lows and rain chances, or check your travel
              dates. Real forecast data from Open-Meteo; later days are less certain.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={destination.trim().length < 2}
              onClick={() => setRequested(true)}
            >
              Check destination weather
            </Button>
          </>
        ) : (
          <div className="mt-3" aria-live="polite">
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking the local forecast…
              </p>
            )}
            {places.data && places.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No matching place found. Try a nearby city and include the country.
              </p>
            )}
            {place && (
              <>
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor={`weather-place-${place.id}`}
                >
                  Weather location · choose the correct match
                </label>
                <select
                  id={`weather-place-${place.id}`}
                  className="mt-1 w-full min-w-0 rounded-md border bg-background p-2 text-sm"
                  value={place.id}
                  onChange={(e) => setPlaceId(Number(e.target.value))}
                >
                  {places.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {[item.name, item.admin1, item.country].filter(Boolean).join(", ")}
                    </option>
                  ))}
                </select>
              </>
            )}
            {error && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Weather is unavailable right now. Your travel plan is still available.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (places.isError) void places.refetch();
                    else void weather.refetch();
                  }}
                >
                  Try weather again
                </Button>
              </div>
            )}
            {weather.data && !error && (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <Thermometer className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-display text-4xl">
                      {temperature(weather.data.current?.temperature_2m)}{" "}
                      <span className="font-sans text-xs text-muted-foreground">
                        now at destination
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weather.data.current?.time.replace("T", " ")} · {weather.data.timezone}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-5 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Forecast period"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "outlook" ? "default" : "outline"}
                    aria-pressed={view === "outlook"}
                    onClick={() => setView("outlook")}
                  >
                    15-day outlook
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "trip" ? "default" : "outline"}
                    aria-pressed={view === "trip"}
                    onClick={() => setView("trip")}
                  >
                    My travel dates
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => void weather.refetch()}
                  >
                    Refresh forecast
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {view === "outlook"
                    ? "Today and the next 14 days at your destination. This is separate from your planned trip dates."
                    : `Your trip: ${startDate} · ${days} days. Only dates covered by the provider are shown.`}{" "}
                  Days 8–15 are longer-range estimates and can change considerably.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Retrieved {new Date(weather.dataUpdatedAt).toLocaleString()} · shown in your
                  browser’s local time.
                </p>
                {rows.length > 0 ? (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-secondary">
                      {view === "outlook"
                        ? "15-day destination outlook"
                        : "Forecast for your travel dates"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {rows.map((row) => (
                        <div
                          key={row.date}
                          data-testid="forecast-day"
                          className="rounded-xl border bg-card p-3"
                        >
                          <ForecastIcon description={weatherDescription(row.code)} />
                          {weather.data!.daily.time.indexOf(row.date) >= 7 && (
                            <p className="mb-2 text-[10px] font-medium text-secondary">
                              Longer-range estimate
                            </p>
                          )}
                          <p className="text-xs font-medium">
                            {new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            {temperature(row.high)}{" "}
                            <span className="font-normal text-muted-foreground">
                              / {temperature(row.low)}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {weatherDescription(row.code)}
                          </p>
                          {row.rain != null && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Droplets className="h-3 w-3" />
                              {row.rain}% rain chance
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {view === "trip" && rows.length < days && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Only {rows.length} of {days} travel days have a forecast. Check again closer
                        to departure for the remaining days.
                      </p>
                    )}
                    {view === "outlook" && rows.length < 15 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Only {rows.length} of 15 outlook days were returned. Missing readings are
                        shown as —; no temperatures are invented.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {view === "outlook" ? (
                      "The provider did not return daily forecasts. Try refreshing later."
                    ) : (
                      <>
                        No forecast is available for these travel dates yet, or the dates have
                        passed. The temperature above is current weather, not a prediction for your
                        trip.
                      </>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Weather by{" "}
        <a
          className="underline underline-offset-2"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>
        . Check again before outdoor activities.
      </p>
    </section>
  );
}

function ForecastIcon({ description }: { description: string }) {
  const Icon = /snow|ice/i.test(description)
    ? Snowflake
    : /rain|drizzle|thunder/i.test(description)
      ? CloudRain
      : /clear/i.test(description)
        ? Sun
        : /overcast|fog/i.test(description)
          ? Cloud
          : CloudSun;
  return <Icon aria-hidden="true" className="mb-2 h-6 w-6 text-secondary" />;
}
