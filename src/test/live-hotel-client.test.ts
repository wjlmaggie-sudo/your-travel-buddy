import { afterEach, it, expect, vi } from "vitest";
import { searchLiveHotels } from "@/lib/live-hotel-search";
const input = {
  destination: "Berlin",
  checkin: "2030-06-10",
  checkout: "2030-06-12",
  adults: 2,
  childrenAges: [],
  currency: "EUR",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("sends only public gateway credentials and rejects mismatched replies", async () => {
  vi.stubEnv(
    "VITE_HOTEL_SEARCH_URL",
    "https://example.supabase.co/functions/v1/search-hotels-live",
  );
  vi.stubEnv("VITE_AI_GATEWAY_KEY", "public-gateway-token");
  const result = {
    query: input,
    provider: "serpapi-google-hotels",
    checkedAt: "2030-01-01T10:00:00Z",
    sourceTime: null,
    searchUrl: "https://www.google.com/travel/hotels",
    offers: [],
  };
  const fetcher = vi.fn().mockResolvedValue(Response.json(result));
  vi.stubGlobal("fetch", fetcher);
  await expect(searchLiveHotels(input, new AbortController().signal)).resolves.toMatchObject({
    provider: "serpapi-google-hotels",
  });
  expect(fetcher.mock.calls[0]?.[1].headers).toEqual({
    "Content-Type": "application/json",
    Authorization: "Bearer public-gateway-token",
    apikey: "public-gateway-token",
  });
  fetcher.mockResolvedValue(Response.json({ ...result, query: { ...input, adults: 1 } }));
  await expect(searchLiveHotels(input, new AbortController().signal)).rejects.toThrow(
    /do not match/,
  );
  fetcher.mockResolvedValue(Response.json({ error: "limit" }, { status: 429 }));
  await expect(searchLiveHotels(input, new AbortController().signal)).rejects.toThrow(
    /shared free/,
  );
});
