import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HotelSearchPreview } from "@/components/HotelSearchPreview";
const api = vi.hoisted(() => ({
  hotelSearchEndpoint: vi.fn(),
  budgetHotelPreviews: vi.fn(),
  hotelDestinations: vi.fn(),
  forgetHotelPreviews: vi.fn(),
}));
vi.mock("@/lib/hotel-search", () => ({ hotelSearchEndpoint: api.hotelSearchEndpoint }));
vi.mock("@/lib/hotel-suggestions", () => ({
  budgetHotelPreviews: api.budgetHotelPreviews,
  hotelDestinations: api.hotelDestinations,
  forgetHotelPreviews: api.forgetHotelPreviews,
}));
const brief = {
  destination: "Lisbon, Portugal",
  start: "2030-06-10",
  days: 5,
  travelers: 3,
  currency: "EUR",
  budget: 1500,
  style: "Balanced" as const,
};
const quote = (name = "Sandbox Hotel", amount = 450) => ({
  sandbox: true,
  checkedAt: "2030-06-01T10:00:00Z",
  offers: [
    { id: "1", name, address: "Test address", photo: null, stars: 4, amount, currency: "EUR" },
  ],
});
beforeEach(() => {
  vi.clearAllMocks();
  api.hotelSearchEndpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
  api.hotelDestinations.mockResolvedValue([
    { id: 1, city: "Lisbon", countryCode: "PT", country: "Portugal", label: "Lisbon, Portugal" },
  ]);
  api.budgetHotelPreviews.mockResolvedValue(quote());
});
afterEach(cleanup);
it("keeps unconfigured guest planning usable without any provider request", () => {
  api.hotelSearchEndpoint.mockReturnValue(null);
  render(<HotelSearchPreview brief={brief} allowance={500} active />);
  expect(screen.getByText(/Provider connection pending/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Search hotels on Booking.com/ })).toHaveAttribute(
    "href",
    expect.stringContaining("group_adults=3"),
  );
  expect(api.budgetHotelPreviews).not.toHaveBeenCalled();
});
it("waits for the Hotels section, then uses the complete trip and allowance without another form", async () => {
  const { rerender } = render(<HotelSearchPreview brief={brief} allowance={500} active={false} />);
  await new Promise((resolve) => setTimeout(resolve, 450));
  expect(api.hotelDestinations).not.toHaveBeenCalled();
  expect(api.budgetHotelPreviews).not.toHaveBeenCalled();
  rerender(<HotelSearchPreview brief={brief} allowance={500} active />);
  expect(await screen.findByText("Sandbox Hotel")).toBeVisible();
  expect(api.hotelDestinations).toHaveBeenCalledWith("Lisbon, Portugal", expect.any(AbortSignal));
  expect(api.budgetHotelPreviews).toHaveBeenCalledWith({
    city: "Lisbon",
    countryCode: "PT",
    guestNationality: "US",
    checkin: "2030-06-10",
    checkout: "2030-06-14",
    travelers: 3,
    budget: 500,
    currency: "EUR",
  });
  expect(screen.queryByLabelText("Destination country code")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Hotel search city")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Lead traveler's nationality code")).not.toBeInTheDocument();
  expect(screen.getByText(/sample traveler nationality: United States/)).toBeVisible();
  expect(screen.queryByRole("button", { name: /Book|Save|Select hotel/i })).not.toBeInTheDocument();
});
it("hides outdated results immediately and updates suggestions when the allowance changes", async () => {
  const { rerender } = render(<HotelSearchPreview brief={brief} allowance={500} active />);
  await screen.findByText("Sandbox Hotel");
  api.budgetHotelPreviews.mockResolvedValue(quote("Lower budget hotel", 250));
  rerender(<HotelSearchPreview brief={brief} allowance={300} active />);
  expect(screen.queryByText("Sandbox Hotel")).not.toBeInTheDocument();
  expect(await screen.findByText("Lower budget hotel")).toBeVisible();
  expect(api.budgetHotelPreviews).toHaveBeenLastCalledWith(
    expect.objectContaining({ budget: 300 }),
  );
});
it("ignores late replies from an older destination", async () => {
  let complete!: (value: unknown) => void;
  api.budgetHotelPreviews.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const { rerender } = render(<HotelSearchPreview brief={brief} allowance={500} active />);
  await waitFor(() => expect(api.budgetHotelPreviews).toHaveBeenCalledOnce());
  api.hotelDestinations.mockResolvedValue([
    { id: 2, city: "Porto", countryCode: "PT", country: "Portugal", label: "Porto, Portugal" },
  ]);
  api.budgetHotelPreviews.mockResolvedValue(quote("Porto hotel"));
  rerender(
    <HotelSearchPreview
      brief={{ ...brief, destination: "Porto, Portugal" }}
      allowance={500}
      active
    />,
  );
  await act(async () => {
    complete(quote("Old Lisbon results"));
  });
  expect(await screen.findByText("Porto hotel")).toBeVisible();
  expect(screen.queryByText("Old Lisbon results")).not.toBeInTheDocument();
});
it("keeps nationality optional and uses readable country names for test preferences", async () => {
  render(<HotelSearchPreview brief={brief} allowance={500} active />);
  await screen.findByText("Sandbox Hotel");
  fireEvent.click(screen.getByText("Search details (optional)"));
  fireEvent.change(screen.getByLabelText("Sample traveler nationality"), {
    target: { value: "DE" },
  });
  await waitFor(() =>
    expect(api.budgetHotelPreviews).toHaveBeenLastCalledWith(
      expect.objectContaining({ guestNationality: "DE", budget: 500 }),
    ),
  );
  expect(screen.getByText(/sample traveler nationality: Germany/)).toBeVisible();
});
it("does not search for a zero accommodation allowance", async () => {
  render(<HotelSearchPreview brief={brief} allowance={0} active />);
  expect(screen.getByText("Increase your hotel allowance to see suggestions.")).toBeVisible();
  await new Promise((resolve) => setTimeout(resolve, 450));
  expect(api.budgetHotelPreviews).not.toHaveBeenCalled();
});

it("never requests an adult-only hotel quote for a group with children", async () => {
  render(<HotelSearchPreview brief={{ ...brief, childrenAges: [3, 9] }} allowance={500} active />);
  expect(screen.getByText(/Child occupancy is not supported/)).toBeVisible();
  const link = screen.getByRole("link", { name: /Search family hotels/ });
  expect(new URL(link.getAttribute("href")!).searchParams.getAll("age")).toEqual(["3", "9"]);
  await new Promise((resolve) => setTimeout(resolve, 450));
  expect(api.hotelDestinations).not.toHaveBeenCalled();
  expect(api.budgetHotelPreviews).not.toHaveBeenCalled();
});
