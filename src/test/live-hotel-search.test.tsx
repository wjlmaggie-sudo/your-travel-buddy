import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { it, expect, vi, afterEach } from "vitest";
import { LiveHotelSearch } from "@/components/LiveHotelSearch";
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
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("searches only on request, filters allowance and keeps results out of saved quotes", async () => {
  mocks.search.mockResolvedValue({
    query: {},
    provider: "serpapi-google-hotels",
    checkedAt: "2030-01-01T10:00:00Z",
    sourceTime: null,
    searchUrl: "https://www.google.com/travel/hotels",
    offers: [
      {
        id: "1",
        name: "In budget",
        amount: 200,
        currency: "EUR",
        photo: null,
        taxesIncluded: true,
        stars: 4,
        rating: 4.2,
        website: "https://hotel.example",
      },
      {
        id: "2",
        name: "Too expensive",
        amount: 900,
        currency: "EUR",
        photo: null,
        taxesIncluded: false,
        stars: null,
        rating: null,
        website: null,
      },
    ],
  });
  const { rerender } = render(<LiveHotelSearch brief={brief} allowance={500} active />);
  expect(mocks.search).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Search real hotels" }));
  expect(await screen.findByText("In budget")).toBeVisible();
  expect(screen.getByText("Room type & beds:")).toBeVisible();
  expect(screen.getByText(/Not specified by the provider/)).toBeVisible();
  expect(screen.queryByText("Too expensive")).not.toBeInTheDocument();
  expect(mocks.search).toHaveBeenCalledWith(
    expect.objectContaining({ adults: 2, childrenAges: [], checkout: "2030-06-12" }),
    expect.any(AbortSignal),
  );
  expect(screen.queryByRole("button", { name: /Book|Save|Select/ })).not.toBeInTheDocument();
  rerender(<LiveHotelSearch brief={{ ...brief, destination: "Lisbon" }} allowance={500} active />);
  expect(screen.queryByText("In budget")).not.toBeInTheDocument();
});
it("does not guess exact child ages or trigger a paid lookup for age ranges", () => {
  render(
    <LiveHotelSearch
      brief={{ ...brief, travelers: 3, childrenAgeRanges: ["4-6"] }}
      allowance={500}
      active
    />,
  );
  expect(screen.getByRole("button", { name: "Search real hotels" })).toBeDisabled();
  expect(screen.getByText(/Exact child ages/)).toBeVisible();
  expect(mocks.search).not.toHaveBeenCalled();
});

it("keeps multi-room requests out of single-room live results and carries rooms to the external search", () => {
  render(<LiveHotelSearch brief={{ ...brief, hotelRooms: 2 }} allowance={500} active />);
  expect(screen.getByRole("button", { name: "Search real hotels" })).toBeDisabled();
  expect(screen.getByText(/You requested 2 rooms/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Booking.com/ })).toHaveAttribute(
    "href",
    expect.stringContaining("no_rooms=2"),
  );
  expect(mocks.search).not.toHaveBeenCalled();
});
