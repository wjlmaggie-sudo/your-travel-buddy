import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CarRental } from "@/components/CarRental";
import { carSearchAvailable, searchCars } from "@/lib/car-rental";
vi.mock("@/lib/car-rental", () => ({ carSearchAvailable: vi.fn(), searchCars: vi.fn() }));
vi.mock("@/lib/flight-airports", () => ({
  resolveFlightAirport: vi.fn(async () => ({ code: "LIS", name: "Lisbon Airport" })),
  suggestFlightAirports: vi.fn(async () => []),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const brief = {
  destination: "Lisbon",
  start: "2026-12-01",
  days: 4,
  travelers: 2,
  budget: 1000,
  currency: "EUR",
  style: "Balanced" as const,
};
it("clearly shows pending activation and prevents searches without a key", async () => {
  vi.mocked(carSearchAvailable).mockResolvedValue(false);
  render(<CarRental active brief={brief} allowance={100} onChoose={vi.fn()} />);
  expect(await screen.findByText(/Live car rental searches are awaiting activation/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Find rental cars" })).toBeDisabled();
  expect(searchCars).not.toHaveBeenCalled();
});
it("uses trip dates and actual driver details, then selects a real response for the budget", async () => {
  vi.mocked(carSearchAvailable).mockResolvedValue(true);
  vi.mocked(searchCars).mockImplementation(async (query) => ({
    query,
    provider: "scrappa-rentalcars",
    checkedAt: "2026-10-25T12:00:00Z",
    offers: [
      {
        id: "test-offer",
        name: "Test vehicle",
        supplier: "Test supplier",
        amount: 120,
        currency: "EUR",
        seats: 5,
        transmission: "MANUAL",
        mileage: "Unlimited",
        fuelPolicy: "Full to full",
        cancellation: null,
        deposit: null,
      },
    ],
  }));
  const onChoose = vi.fn();
  render(<CarRental active brief={brief} allowance={100} onChoose={onChoose} />);
  await vi.waitFor(() =>
    expect(screen.getByRole("button", { name: "Find rental cars" })).toBeEnabled(),
  );
  expect(screen.getByLabelText("Car pickup date")).toHaveValue("2026-12-01");
  expect(screen.getByLabelText("Car return date")).toHaveValue("2026-12-04");
  fireEvent.change(screen.getByLabelText("Driver age"), { target: { value: "35" } });
  fireEvent.change(screen.getByLabelText("Driver country of residence"), {
    target: { value: "de" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Find rental cars" }));
  expect(await screen.findByText("Test vehicle or similar")).toBeVisible();
  expect(searchCars).toHaveBeenCalledWith(
    expect.objectContaining({
      pickup: "LIS",
      age: 35,
      residence: "DE",
      pickupDate: "2026-12-01",
      dropoffDate: "2026-12-04",
    }),
    expect.any(AbortSignal),
  );
  fireEvent.click(screen.getByRole("button", { name: "Use this rental in budget" }));
  expect(onChoose).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: 120,
      pickup: "Lisbon Airport (LIS)",
      pickupDate: "2026-12-01",
    }),
  );
});
