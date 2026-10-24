import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { DayWeather } from "@/components/DayWeather";
import { findWeatherPlaces, fetchForecast } from "@/lib/weather";
vi.mock("@/lib/weather", async (original) => ({
  ...(await original<typeof import("@/lib/weather")>()),
  findWeatherPlaces: vi.fn(),
  fetchForecast: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function setup(date: string, active = true) {
  vi.mocked(findWeatherPlaces).mockResolvedValue([
    { id: 1, name: "Lisbon", country: "Portugal", latitude: 38.7, longitude: -9.1 },
  ]);
  vi.mocked(fetchForecast).mockResolvedValue({
    timezone: "Europe/Lisbon",
    current: { time: "2026-10-24T12:00", temperature_2m: 30 },
    daily: {
      time: ["2026-10-24", "2026-10-25"],
      temperature_2m_max: [23, 19],
      temperature_2m_min: [16, 12],
      precipitation_probability_max: [20, 80],
      weather_code: [2, 61],
    },
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <DayWeather destination="Lisbon" date={date} active={active} />
    </QueryClientProvider>,
  );
}
it("matches the activity date to its forecast rather than current weather", async () => {
  setup("2026-10-25");
  expect(await screen.findByText("19°C / 12°C")).toBeVisible();
  expect(screen.getByText("80% rain")).toBeVisible();
  expect(screen.getByText("Rain or drizzle")).toBeVisible();
  expect(screen.queryByText(/30°C|23°C/)).not.toBeInTheDocument();
});
it("identifies travel dates outside the forecast instead of substituting today's temperature", async () => {
  setup("2026-12-25");
  expect(await screen.findByText("Forecast not available for this date")).toBeVisible();
  expect(screen.queryByText(/30°C/)).not.toBeInTheDocument();
});
it("does not fetch weather for hidden activity days", () => {
  setup("2026-10-25", false);
  expect(findWeatherPlaces).not.toHaveBeenCalled();
});
it("reports lookup failures without breaking activities", async () => {
  vi.mocked(findWeatherPlaces).mockRejectedValue(new Error("Offline"));
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DayWeather destination="Berlin" date="2026-10-25" />
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Weather unavailable")).toBeVisible();
});
