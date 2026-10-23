import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findWeatherPlaces: vi.fn(), searchHotelPreviews: vi.fn() }));
vi.mock("@/lib/weather", () => ({ findWeatherPlaces: mocks.findWeatherPlaces }));
vi.mock("@/lib/hotel-search", () => ({ searchHotelPreviews: mocks.searchHotelPreviews }));
const input = {
  city: "Lisbon",
  countryCode: "PT",
  guestNationality: "US",
  checkin: "2030-06-10",
  checkout: "2030-06-14",
  travelers: 3,
  currency: "EUR",
  budget: 500,
};
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
it("resolves country information from the trip destination, caches it and rejects incomplete matches", async () => {
  const { hotelDestinations } = await import("@/lib/hotel-suggestions");
  mocks.findWeatherPlaces.mockResolvedValue([
    { id: 1, name: "Lisbon", country_code: "PT", country: "Portugal", admin1: "Lisbon" },
    { id: 2, name: "Lisbon", country: "Unknown" },
  ]);
  const places = await hotelDestinations("Lisbon, Portugal", new AbortController().signal);
  expect(places).toEqual([
    { id: 1, city: "Lisbon", countryCode: "PT", country: "Portugal", label: "Lisbon, Portugal" },
  ]);
  await hotelDestinations("Lisbon, Portugal", new AbortController().signal);
  expect(mocks.findWeatherPlaces).toHaveBeenCalledOnce();
});
it("deduplicates concurrent requests and repeated visits but separates different trip budgets and dates", async () => {
  const { budgetHotelPreviews } = await import("@/lib/hotel-suggestions");
  mocks.searchHotelPreviews.mockResolvedValue({
    sandbox: true,
    offers: [],
    checkedAt: "2030-01-01T10:00:00Z",
  });
  await Promise.all([budgetHotelPreviews(input), budgetHotelPreviews(input)]);
  await budgetHotelPreviews(input);
  expect(mocks.searchHotelPreviews).toHaveBeenCalledOnce();
  await budgetHotelPreviews({ ...input, budget: 300 });
  await budgetHotelPreviews({ ...input, checkin: "2030-06-11", checkout: "2030-06-15" });
  expect(mocks.searchHotelPreviews).toHaveBeenCalledTimes(3);
});
it("does not repeatedly spend the quota after failures and only refreshes on explicit retry", async () => {
  const { budgetHotelPreviews, forgetHotelPreviews } = await import("@/lib/hotel-suggestions");
  mocks.searchHotelPreviews.mockRejectedValue(new Error("Preview limit reached"));
  await expect(budgetHotelPreviews(input)).rejects.toThrow("Preview limit reached");
  await expect(budgetHotelPreviews(input)).rejects.toThrow("Preview limit reached");
  expect(mocks.searchHotelPreviews).toHaveBeenCalledOnce();
  forgetHotelPreviews(input);
  mocks.searchHotelPreviews.mockResolvedValue({
    sandbox: true,
    offers: [],
    checkedAt: "2030-01-01T10:00:00Z",
  });
  await budgetHotelPreviews(input);
  expect(mocks.searchHotelPreviews).toHaveBeenCalledTimes(2);
});
