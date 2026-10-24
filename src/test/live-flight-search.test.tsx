import { useState } from "react";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveFlightSearch } from "@/components/LiveFlightSearch";
import { searchFlights } from "@/lib/flight-search";
import type { FlightChoice } from "@/lib/travel-workspace";
vi.mock("@/lib/flight-search", () => ({
  flightEndpoint: () => "https://example.com/search-flights",
  searchFlights: vi.fn(),
}));
const brief = {
  destination: "Lisbon",
  start: "2027-01-10",
  days: 6,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
const offers = [
  ["Low cost", 200, 300],
  ["Quick air", 400, 180],
  ["Balanced air", 280, 220],
].map(([airline, price, duration], i) => ({
  flights: [
    {
      departure_airport: { id: "BER", name: "Berlin", time: "2027-01-10 10:00" },
      arrival_airport: { id: "LIS", name: "Lisbon", time: "2027-01-10 14:00" },
      airline: String(airline),
      flight_number: `EX${i}`,
      duration: Number(duration),
    },
  ],
  total_duration: Number(duration),
  price: Number(price),
  type: "Round trip" as const,
}));
const result = {
  query: {
    origin: "BER",
    destination: "LIS",
    outbound: "2027-01-10",
    returning: "2027-01-15",
    adults: 2,
    children: 0,
    infants: 0,
    currency: "EUR",
  },
  checkedAt: "2026-10-24T12:00:00Z",
  sourceTime: null,
  offers,
  searchUrl: "https://www.google.com/travel/flights",
};
beforeEach(() => {
  vi.mocked(searchFlights).mockResolvedValue(result);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("guided flight selection", () => {
  it("automatically searches the inherited route on entry and shows only two editable route fields", async () => {
    render(<LiveFlightSearch brief={brief} departure="Berlin" active />);
    expect(screen.getByRole("combobox", { name: "Departure" })).toHaveValue("Berlin");
    expect(screen.getByRole("combobox", { name: "Destination" })).toHaveValue("Lisbon");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Choose cheapest" });
    expect(searchFlights).toHaveBeenCalledTimes(1);
    expect(searchFlights).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: "BER",
        destination: "LIS",
        adults: 2,
        outbound: "2027-01-10",
      }),
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Fastest")).toBeVisible();
    expect(screen.getByText("Best balance")).toBeVisible();
  });
  it("suggests Nuremberg from nurm and searches again only after choosing the suggestion", async () => {
    render(<LiveFlightSearch brief={brief} departure="Berlin" active />);
    await screen.findByRole("button", { name: "Choose cheapest" });
    fireEvent.change(screen.getByRole("combobox", { name: "Departure" }), {
      target: { value: "nurm" },
    });
    const option = await screen.findByRole("button", { name: /Nuremberg.*NUE/i });
    expect(searchFlights).toHaveBeenCalledTimes(1);
    fireEvent.click(option);
    await waitFor(() =>
      expect(searchFlights).toHaveBeenCalledWith(
        expect.objectContaining({ origin: "NUE", destination: "LIS" }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("requires a chosen live estimate before continuing, and invalidates it after an edit", async () => {
    const next = vi.fn();
    function Wrapper() {
      const [chosen, setChosen] = useState<FlightChoice>();
      return (
        <LiveFlightSearch
          brief={brief}
          departure="Berlin"
          active
          chosen={chosen}
          onChoose={setChosen}
          onContinue={next}
        />
      );
    }
    render(<Wrapper />);
    await screen.findByRole("button", { name: "Choose cheapest" });
    expect(screen.getByRole("button", { name: /Continue to hotels/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Choose cheapest" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue to hotels/ }));
    expect(next).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByRole("combobox", { name: "Destination" }), {
      target: { value: "Rome" },
    });
    expect(screen.queryByRole("button", { name: /Continue to hotels/ })).not.toBeInTheDocument();
  });
  it("makes no background searches for a hidden flight panel", () => {
    render(<LiveFlightSearch brief={brief} departure="Berlin" active={false} />);
    expect(searchFlights).not.toHaveBeenCalled();
  });
});
