import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveFlightSearch } from "@/components/LiveFlightSearch";
import { searchFlights } from "@/lib/flight-search";
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
  offers: [],
  searchUrl: "https://www.google.com/travel/flights",
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("inherited flight route", () => {
  it("pre-fills trip cities and submits resolved airport codes with inherited dates and party", async () => {
    vi.mocked(searchFlights).mockResolvedValue(result);
    render(<LiveFlightSearch brief={brief} departure="Berlin" />);
    expect(screen.getByLabelText("Departure city or airport")).toHaveValue("Berlin");
    expect(screen.getByLabelText("Destination city or airport")).toHaveValue("Lisbon");
    expect(searchFlights).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Search flight prices" }));
    await waitFor(() =>
      expect(searchFlights).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: "BER",
          destination: "LIS",
          outbound: "2027-01-10",
          returning: "2027-01-15",
          adults: 2,
        }),
        expect.any(AbortSignal),
      ),
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("(BER)"));
  });
  it("allows an override and updates defaults when the trip route changes", async () => {
    vi.mocked(searchFlights).mockResolvedValue(result);
    const view = render(<LiveFlightSearch brief={brief} departure="Berlin" />);
    fireEvent.change(screen.getByLabelText("Destination city or airport"), {
      target: { value: "FCO" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search flight prices" }));
    await waitFor(() =>
      expect(searchFlights).toHaveBeenCalledWith(
        expect.objectContaining({ origin: "BER", destination: "FCO" }),
        expect.any(AbortSignal),
      ),
    );
    view.rerender(
      <LiveFlightSearch brief={{ ...brief, destination: "Tokyo" }} departure="Munich" />,
    );
    expect(screen.getByLabelText("Departure city or airport")).toHaveValue("Munich");
    expect(screen.getByLabelText("Destination city or airport")).toHaveValue("Tokyo");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
