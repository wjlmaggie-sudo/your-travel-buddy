import { afterEach, expect, it, vi } from "vitest";
import { hotelSearchEndpoint, searchHotelPreviews } from "@/lib/hotel-search";
const input = {
  city: "Lisbon",
  countryCode: "PT",
  guestNationality: "DE",
  checkin: "2030-06-10",
  checkout: "2030-06-14",
  travelers: 2,
  currency: "EUR",
  budget: 500,
};
const signal = () => new AbortController().signal;
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("does not contact a backend when the optional public endpoint is missing or unsafe", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  for (const endpoint of [
    "",
    "http://test.example/search",
    "https://key:secret@test.example/search",
    "https://test.example/search?key=private",
  ]) {
    vi.stubEnv("VITE_HOTEL_SEARCH_URL", endpoint);
    expect(hotelSearchEndpoint()).toBeNull();
    await expect(searchHotelPreviews(input, signal())).rejects.toThrow(/not connected/);
  }
  expect(fetcher).not.toHaveBeenCalled();
});
it("sends no account or private provider credentials from the browser", async () => {
  vi.stubEnv("VITE_HOTEL_SEARCH_URL", "https://test.supabase.co/functions/v1/search-hotels");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({ sandbox: true, checkedAt: "2030-01-01T12:00:00Z", offers: [] }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect((await searchHotelPreviews(input, signal())).offers).toEqual([]);
  expect(fetcher.mock.calls[0]?.[1].headers).toEqual({ "Content-Type": "application/json" });
});
it("rejects production, over-budget or mismatched-currency previews", async () => {
  vi.stubEnv("VITE_HOTEL_SEARCH_URL", "https://test.supabase.co/functions/v1/search-hotels");
  const offer = {
    id: "1",
    name: "Test hotel",
    address: "Test address",
    photo: null,
    stars: null,
    amount: 400,
    currency: "EUR",
  };
  for (const response of [
    { sandbox: false, offers: [offer] },
    { sandbox: true, offers: [{ ...offer, amount: 501 }] },
    { sandbox: true, offers: [{ ...offer, currency: "USD" }] },
  ]) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ ...response, checkedAt: "2030-01-01T12:00:00Z" })),
    );
    await expect(searchHotelPreviews(input, signal())).rejects.toThrow(/unsupported preview/);
  }
});
