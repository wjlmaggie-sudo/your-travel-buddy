import { afterEach, expect, it, vi } from "vitest";
import { searchFlights } from "@/lib/flight-search";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("shares an in-flight flight request when one panel unmounts and returns cached results on back-navigation", async () => {
  vi.stubEnv("VITE_FLIGHT_SEARCH_URL", "https://cache.example/search-flights");
  vi.stubEnv("VITE_AI_GATEWAY_KEY", "public-gateway");
  const query = {
    origin: "BER",
    destination: "LIS",
    outbound: "2030-02-01",
    returning: "2030-02-05",
    adults: 2,
    children: 0,
    infants: 0,
    currency: "EUR",
  };
  const result = {
    query,
    offers: [],
    checkedAt: "2030-01-01T12:00:00Z",
    sourceTime: null,
    searchUrl: "https://www.google.com/travel/flights",
  };
  let complete!: (value: Response) => void;
  const fetcher = vi.fn(
    (_url: RequestInfo | URL, _options?: RequestInit) =>
      new Promise<Response>((resolve) => {
        complete = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  const first = new AbortController(),
    second = new AbortController();
  const a = searchFlights(query, first.signal).catch((error) => error),
    b = searchFlights(query, second.signal);
  first.abort();
  complete(Response.json(result));
  expect(await a).toMatchObject({ name: "AbortError" });
  await expect(b).resolves.toMatchObject({ query });
  await expect(searchFlights(query, new AbortController().signal)).resolves.toMatchObject({
    query,
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[1]?.headers).toEqual({
    "Content-Type": "application/json",
    Authorization: "Bearer public-gateway",
    apikey: "public-gateway",
  });
});
