import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HotelRecommendations } from "@/components/HotelRecommendations";
import { connectedBudget } from "@/lib/travel-workspace";
const capture = vi.hoisted(() => vi.fn());
vi.mock("@/components/LiveHotelSearch", () => ({
  LiveHotelSearch: (props: { allowance: number }) => {
    capture(props);
    return <p>Provider allowance: {props.allowance}</p>;
  },
}));
const brief = {
  destination: "Lisbon",
  start: "2030-11-01",
  days: 5,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
const journey = { departure: "Berlin", flightBudget: 375, hotelComfort: "Comfortable" as const };
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("uses money left after the chosen flight and operating estimates for hotel recommendations", () => {
  const changed = { ...journey, flightBudget: 465 };
  const costs = connectedBudget(brief, changed);
  render(<HotelRecommendations brief={brief} journey={changed} onChoose={vi.fn()} active />);
  expect(capture).toHaveBeenCalledWith(
    expect.objectContaining({
      allowance: Math.max(0, brief.budget - costs.flight - costs.estimated),
      active: true,
    }),
  );
  expect(screen.queryByText(/demo|fictional/i)).not.toBeInTheDocument();
});
it("carries the requested room count and chosen estimate to the hotel step", () => {
  const onChoose = vi.fn(),
    onContinue = vi.fn();
  render(
    <HotelRecommendations
      brief={brief}
      journey={{ ...journey, hotelRooms: 2 }}
      onChoose={onChoose}
      onContinue={onContinue}
      active
    />,
  );
  expect(capture).toHaveBeenCalledWith(
    expect.objectContaining({
      brief: expect.objectContaining({ hotelRooms: 2 }),
      onChoose,
      onContinue,
    }),
  );
});
it("skips hotel search for day trips", () => {
  render(
    <HotelRecommendations brief={{ ...brief, days: 1 }} journey={journey} onChoose={vi.fn()} />,
  );
  expect(screen.getByText("No overnight stay needed.")).toBeVisible();
  expect(capture).not.toHaveBeenCalled();
});
