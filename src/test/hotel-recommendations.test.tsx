import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HotelRecommendations } from "@/components/HotelRecommendations";
import { connectedBudget, demoFlights, demoHotels } from "@/lib/travel-workspace";
const endpoint = vi.hoisted(() => vi.fn());
vi.mock("@/lib/hotel-search", () => ({ hotelSearchEndpoint: endpoint }));
vi.mock("@/components/HotelSearchPreview", () => ({
  HotelSearchPreview: ({ allowance }: { allowance: number }) => (
    <p>Provider allowance: {allowance}</p>
  ),
}));
const brief = {
  destination: "Lisbon",
  start: "2026-11-01",
  days: 5,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
const journey = { departure: "Berlin", flightBudget: 375, hotelComfort: "Comfortable" as const };
afterEach(cleanup);
it("uses the overview hotel allowance after a flight upgrade and hides fictional hotels when connected", () => {
  endpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
  const changed = { ...journey, selectedFlight: demoFlights(brief, journey)[2]! };
  render(<HotelRecommendations brief={brief} journey={changed} onChoose={vi.fn()} active />);
  expect(
    screen.getByText(`Provider allowance: ${connectedBudget(brief, changed).original.allowance}`),
  ).toBeVisible();
  expect(screen.queryByText(/Hotel comfort & allowance/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Try demonstration hotels/)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Try this demo hotel" })).not.toBeInTheDocument();
});
it("lets users clear a previously saved demo without suggesting new fictional hotels", () => {
  endpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
  const onChoose = vi.fn();
  render(
    <HotelRecommendations
      brief={brief}
      journey={journey}
      stay={demoHotels(brief, journey)[0]!}
      onChoose={onChoose}
    />,
  );
  expect(screen.getByText(/previous demo selection/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear demo hotel selection" }));
  expect(onChoose).toHaveBeenCalledWith(null);
});
it("keeps the explicitly labeled comparison available for installations without a provider", () => {
  endpoint.mockReturnValue(null);
  render(<HotelRecommendations brief={brief} journey={journey} onChoose={vi.fn()} />);
  expect(screen.getAllByRole("button", { name: "Try this demo hotel" })).toHaveLength(3);
});
