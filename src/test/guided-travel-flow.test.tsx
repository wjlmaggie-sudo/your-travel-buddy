import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const services = vi.hoisted(() => ({ flights: vi.fn(), hotels: vi.fn() }));
vi.mock("@/lib/flight-search", () => ({
  flightEndpoint: () => "https://example.com/search-flights",
  searchFlights: services.flights,
}));
vi.mock("@/lib/live-hotel-search", () => ({ searchLiveHotels: services.hotels }));
vi.mock("@/components/DayVisuals", () => ({ DayVisuals: () => null }));
vi.mock("@/components/DayWeather", () => ({ DayWeather: () => null }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
import { TravelPlanner } from "@/components/TravelPlanner";
import { readGuestSimulation } from "@/lib/planner-draft";
const offers = [100, 200, 300].map((price, i) => ({
  price,
  total_duration: 300 - i * 50,
  type: "Round trip" as const,
  flights: [
    {
      airline: `Airline ${i}`,
      flight_number: `EX${i}`,
      duration: 300 - i * 50,
      departure_airport: { id: "BER", name: "Berlin", time: "2030-06-10 09:00" },
      arrival_airport: { id: "LIS", name: "Lisbon", time: "2030-06-10 12:00" },
    },
  ],
}));
beforeEach(() => {
  sessionStorage.clear();
  services.flights.mockImplementation(async (query) => ({
    query,
    offers,
    checkedAt: "2030-01-01T12:00:00Z",
    sourceTime: null,
    searchUrl: "https://www.google.com/travel/flights",
  }));
  services.hotels.mockImplementation(async (query) => ({
    query,
    checkedAt: "2030-01-01T12:00:00Z",
    sourceTime: null,
    searchUrl: "https://www.google.com/travel/hotels",
    provider: "serpapi-google-hotels",
    offers: [100, 200, 300].map((amount, i) => ({
      id: String(i),
      name: `Hotel ${i}`,
      description: "",
      photo: null,
      amount,
      currency: "EUR",
      taxesIncluded: true,
      stars: 3,
      rating: 4 + i / 10,
      website: null,
    })),
  }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function setup() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TravelPlanner />
    </QueryClientProvider>,
  );
}
function basics() {
  fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
  fireEvent.change(screen.getByLabelText("When do you leave?"), {
    target: { value: "2030-06-10" },
  });
}
it("continues from basics through live flights, selected hotel and three attraction ideas", async () => {
  setup();
  basics();
  fireEvent.change(screen.getByLabelText("Departure city / airport"), {
    target: { value: "Berlin" },
  });
  expect(services.flights).not.toHaveBeenCalled();
  expect(services.hotels).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Continue to flights/ }));
  await screen.findByRole("button", { name: "Choose cheapest" });
  expect(screen.getByRole("combobox", { name: "Departure" })).toHaveValue("Berlin");
  expect(screen.queryByText("Your journey at a glance")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Choose cheapest" }));
  expect(readGuestSimulation()?.journey?.selectedFlight?.evidence).toBe("live-search");
  fireEvent.click(screen.getByRole("button", { name: /Continue to hotels/ }));
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: "Choose this hotel" })).toHaveLength(3),
  );
  expect(services.hotels).toHaveBeenCalledOnce();
  fireEvent.click(screen.getAllByRole("button", { name: "Choose this hotel" })[0]!);
  expect(readGuestSimulation()?.stay?.evidence).toBe("live-search");
  fireEvent.click(screen.getByRole("button", { name: /Continue to attractions/ }));
  expect(await screen.findByRole("region", { name: "Attraction recommendations" })).toBeVisible();
  expect(screen.getByText("Culture & stories")).toBeVisible();
  expect(screen.getByText("Outside & unhurried")).toBeVisible();
  expect(screen.getByText("Local discovery")).toBeVisible();
}, 20000);
it("uses exact child ages for a family room and balances adults and children in attraction ideas", async () => {
  setup();
  basics();
  fireEvent.change(screen.getByLabelText("How many people?"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Family" }));
  fireEvent.change(screen.getByLabelText("Children in your group"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Exact ages" }));
  fireEvent.change(screen.getByLabelText("Child 1 exact age"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: /Continue to hotels/ }));
  await screen.findAllByRole("button", { name: "Choose this hotel" });
  expect(services.hotels).toHaveBeenCalledWith(
    expect.objectContaining({ adults: 2, childrenAges: [6] }),
    expect.any(AbortSignal),
  );
  expect(readGuestSimulation()?.journey?.hotelRooms).toBe(1);
  fireEvent.click(screen.getAllByRole("button", { name: "Choose this hotel" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: /Continue to attractions/ }));
  expect(await screen.findByText("For children")).toBeVisible();
  expect(screen.getByText("For grown-ups")).toBeVisible();
  expect(screen.getByText("Together")).toBeVisible();
}, 20000);

it("carries an edited flight destination into the hotel step after selection", async () => {
  setup();
  basics();
  fireEvent.change(screen.getByLabelText("Departure city / airport"), {
    target: { value: "Berlin" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Continue to flights/ }));
  await screen.findByRole("button", { name: "Choose cheapest" });
  fireEvent.change(screen.getByRole("combobox", { name: "Departure" }), {
    target: { value: "nurm" },
  });
  fireEvent.click(await screen.findByRole("button", { name: /Nuremberg.*NUE/i }));
  await screen.findByRole("button", { name: "Choose cheapest" });
  fireEvent.change(screen.getByRole("combobox", { name: "Destination" }), {
    target: { value: "Rome" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update flights" }));
  await screen.findByRole("button", { name: "Choose cheapest" });
  fireEvent.click(screen.getByRole("button", { name: "Choose cheapest" }));
  await waitFor(() => expect(readGuestSimulation()?.destination).toBe("Rome"));
  expect(readGuestSimulation()?.journey?.departure).toBe("Nuremberg, Germany");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Continue to hotels/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue to hotels/ }));
  await screen.findAllByRole("button", { name: "Choose this hotel" });
  expect(services.hotels).toHaveBeenCalledWith(
    expect.objectContaining({ destination: "Rome" }),
    expect.any(AbortSignal),
  );
}, 20000);
