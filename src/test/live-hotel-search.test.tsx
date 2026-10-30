import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { it, expect, vi, afterEach, beforeEach } from "vitest";
import { useState } from "react";
import { LiveHotelSearch } from "@/components/LiveHotelSearch";
import type { StayChoice } from "@/lib/stay-planning";
const mocks = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("@/lib/live-hotel-search", () => ({ searchLiveHotels: mocks.search }));
const brief = {
  destination: "Berlin",
  start: "2030-06-10",
  days: 3,
  travelers: 2,
  currency: "EUR",
  budget: 1500,
  style: "Balanced" as const,
};
const result = {
  query: {},
  provider: "serpapi-google-hotels",
  checkedAt: "2030-01-01T10:00:00Z",
  sourceTime: null,
  searchUrl: "https://www.google.com/travel/hotels",
  offers: [
    {
      id: "1",
      name: "Low cost hotel",
      amount: 200,
      currency: "EUR",
      photo: null,
      taxesIncluded: true,
      stars: 3,
      rating: 4,
    },
    {
      id: "2",
      name: "Comfortable hotel",
      amount: 400,
      currency: "EUR",
      photo: null,
      taxesIncluded: true,
      stars: 5,
      rating: 4.8,
    },
    {
      id: "3",
      name: "Value hotel",
      amount: 300,
      currency: "EUR",
      photo: null,
      taxesIncluded: true,
      stars: 4,
      rating: 4.5,
    },
  ],
};
beforeEach(() => {
  mocks.search.mockResolvedValue(result);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("loads three real suggestions automatically only when the hotel step is active", async () => {
  const view = render(<LiveHotelSearch brief={brief} allowance={500} active={false} />);
  expect(mocks.search).not.toHaveBeenCalled();
  view.rerender(<LiveHotelSearch brief={brief} allowance={500} active />);
  expect(await screen.findByText("Low cost hotel")).toBeVisible();
  expect(screen.getAllByRole("button", { name: "Choose this hotel" })).toHaveLength(3);
  expect(mocks.search).toHaveBeenCalledTimes(1);
  expect(mocks.search).toHaveBeenCalledWith(
    expect.objectContaining({ adults: 2, childrenAges: [], checkout: "2030-06-12" }),
    expect.any(AbortSignal),
  );
});
it("saves an advertised estimate only after selection and enables the next step", async () => {
  const next = vi.fn(),
    chosen = vi.fn();
  function Wrapper() {
    const [stay, setStay] = useState<StayChoice | null>(null);
    return (
      <LiveHotelSearch
        brief={brief}
        allowance={500}
        active
        chosen={stay}
        onChoose={(v) => {
          setStay(v);
          chosen(v);
        }}
        onContinue={next}
      />
    );
  }
  render(<Wrapper />);
  await screen.findByText("Low cost hotel");
  expect(screen.getByRole("button", { name: /Continue to attractions/ })).toBeDisabled();
  fireEvent.click(screen.getAllByRole("button", { name: "Choose this hotel" })[0]!);
  expect(chosen).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 200, unit: "stay", evidence: "live-search", rooms: 1 }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Continue to attractions/ }));
  expect(next).toHaveBeenCalledOnce();
  await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(1));
});
it("does not guess exact child ages for live prices", () => {
  render(
    <LiveHotelSearch
      brief={{ ...brief, travelers: 3, hotelRooms: 1, childrenAgeRanges: ["4-6"] }}
      allowance={500}
      active
    />,
  );
  expect(screen.getByText(/Exact child ages/)).toBeVisible();
  expect(mocks.search).not.toHaveBeenCalled();
});
it("does not multiply a single-room price for a multi-room party", () => {
  render(<LiveHotelSearch brief={{ ...brief, hotelRooms: 2 }} allowance={500} active />);
  expect(screen.getByText(/You requested 2 rooms/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Booking.com/ })).toHaveAttribute(
    "href",
    expect.stringContaining("no_rooms=2"),
  );
  expect(mocks.search).not.toHaveBeenCalled();
});

it("keeps initial hotels within allowance, explains rooms, and makes expensive alternatives opt-in", async () => {
  render(<LiveHotelSearch brief={brief} allowance={250} active />);
  await screen.findByText("Low cost hotel");
  expect(screen.queryByText("Comfortable hotel")).not.toBeInTheDocument();
  expect(screen.queryByText("Value hotel")).not.toBeInTheDocument();
  expect(screen.getByText(/Double or twin room/)).toBeVisible();
  expect(screen.getByText(/Room type & beds:/)).toBeVisible();
  expect(screen.getByText(/€100.00 per night/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show options above allowance" }));
  expect(screen.getByText("Comfortable hotel")).toBeVisible();
  expect(mocks.search).toHaveBeenCalledTimes(1);
});
