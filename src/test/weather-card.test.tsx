import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { TripWeather } from "@/components/TripWeather";
import { findWeatherPlaces, fetchForecast } from "@/lib/weather";
vi.mock("@/lib/weather", async (original) => ({
  ...(await original<typeof import("@/lib/weather")>()),
  findWeatherPlaces: vi.fn(),
  fetchForecast: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps forecast results in the same card, loads only on request and converts units", async () => {
  vi.mocked(findWeatherPlaces).mockResolvedValue([
    { id: 1, name: "Lisbon", latitude: 38.7, longitude: -9.1, country: "Portugal" },
  ]);
  vi.mocked(fetchForecast).mockResolvedValue({
    timezone: "Europe/Lisbon",
    current: { time: "2026-10-18T12:00", temperature_2m: 20 },
    daily: {
      time: ["2026-10-18"],
      temperature_2m_max: [23],
      temperature_2m_min: [16],
      precipitation_probability_max: [20],
      weather_code: [2],
    },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TripWeather destination="Lisbon" startDate="2026-10-18" days={1} />
    </QueryClientProvider>,
  );
  const result = screen.getByTestId("weather-results");
  expect(findWeatherPlaces).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Check destination weather" }));
  expect(await screen.findByText("20°C")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "°F" }));
  expect(screen.getByText("68°F")).toBeVisible();
  expect(screen.getByTestId("weather-results")).toBe(result);
});

it("shows 15 real returned outlook days separately from a distant trip without another API call", async () => {
  vi.mocked(findWeatherPlaces).mockResolvedValue([
    { id: 1, name: "Lisbon", latitude: 38.7, longitude: -9.1 },
  ]);
  const dates = Array.from({ length: 16 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
  vi.mocked(fetchForecast).mockResolvedValue({
    timezone: "Europe/Lisbon",
    current: { time: "2026-11-01T12:00", temperature_2m: 20 },
    daily: {
      time: dates,
      temperature_2m_max: dates.map(() => 23),
      temperature_2m_min: dates.map(() => 16),
      precipitation_probability_max: dates.map(() => 20),
      weather_code: dates.map(() => 2),
    },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TripWeather destination="Lisbon" startDate="2027-06-15" days={5} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Check destination weather" }));
  expect(await screen.findAllByTestId("forecast-day")).toHaveLength(15);
  expect(screen.getAllByText("Longer-range estimate")).toHaveLength(8);
  expect(fetchForecast).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "My travel dates" }));
  expect(screen.queryAllByTestId("forecast-day")).toHaveLength(0);
  expect(screen.getByText(/No forecast is available for these travel dates/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "15-day outlook" }));
  expect(screen.getAllByTestId("forecast-day")).toHaveLength(15);
  expect(fetchForecast).toHaveBeenCalledTimes(1);
});
