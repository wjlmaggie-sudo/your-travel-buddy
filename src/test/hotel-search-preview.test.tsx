import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { HotelSearchPreview } from "@/components/HotelSearchPreview";
const api = vi.hoisted(() => ({ hotelSearchEndpoint: vi.fn(), searchHotelPreviews: vi.fn() }));
vi.mock("@/lib/hotel-search", () => api);
const brief = {
  destination: "Lisbon, Portugal",
  start: "2030-06-10",
  days: 5,
  travelers: 3,
  currency: "EUR",
  budget: 1500,
  style: "Balanced" as const,
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps unconfigured guest planning usable without any network request", () => {
  api.hotelSearchEndpoint.mockReturnValue(null);
  render(<HotelSearchPreview brief={brief} allowance={500} />);
  expect(screen.getByText(/Provider connection pending/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Search hotels on Booking.com/ })).toHaveAttribute(
    "href",
    expect.stringContaining("group_adults=3"),
  );
  expect(api.searchHotelPreviews).not.toHaveBeenCalled();
});
it("only searches after submission, labels sandbox data and discards results when criteria change", async () => {
  api.hotelSearchEndpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
  api.searchHotelPreviews.mockResolvedValue({
    sandbox: true,
    checkedAt: "2030-06-01T10:00:00Z",
    offers: [
      {
        id: "1",
        name: "Sandbox Hotel",
        address: "Test address",
        photo: null,
        stars: 4,
        amount: 450,
        currency: "EUR",
      },
    ],
  });
  render(<HotelSearchPreview brief={brief} allowance={500} />);
  expect(api.searchHotelPreviews).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Try a provider sandbox search"));
  fireEvent.change(screen.getByLabelText("Destination country code"), { target: { value: "pt" } });
  fireEvent.change(screen.getByLabelText("Lead traveler's nationality code"), {
    target: { value: "de" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search test hotels" }));
  expect(await screen.findByText("Sandbox Hotel")).toBeVisible();
  expect(screen.getByText("SANDBOX · not bookable")).toBeVisible();
  expect(api.searchHotelPreviews).toHaveBeenCalledWith(
    expect.objectContaining({
      city: "Lisbon",
      countryCode: "PT",
      guestNationality: "DE",
      checkout: "2030-06-14",
      travelers: 3,
      budget: 500,
    }),
    expect.any(AbortSignal),
  );
  expect(screen.queryByRole("button", { name: /Select|Book|Save/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Hotel search city"), { target: { value: "Porto" } });
  expect(screen.queryByText("Sandbox Hotel")).not.toBeInTheDocument();
});
it("cancels outdated searches so late replies cannot replace the edited criteria", async () => {
  api.hotelSearchEndpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
  let complete!: (value: unknown) => void;
  api.searchHotelPreviews.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  render(<HotelSearchPreview brief={brief} allowance={500} />);
  fireEvent.click(screen.getByText("Try a provider sandbox search"));
  fireEvent.change(screen.getByLabelText("Destination country code"), { target: { value: "PT" } });
  fireEvent.change(screen.getByLabelText("Lead traveler's nationality code"), {
    target: { value: "DE" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search test hotels" }));
  fireEvent.change(screen.getByLabelText("Hotel search city"), { target: { value: "Porto" } });
  expect(api.searchHotelPreviews.mock.calls[0]?.[1].aborted).toBe(true);
  complete({
    sandbox: true,
    checkedAt: "2030-06-01T10:00:00Z",
    offers: [{ id: "old", name: "Old results" }],
  });
  await waitFor(() => expect(screen.queryByText("Old results")).not.toBeInTheDocument());
});
