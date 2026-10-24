import { describe, it, expect, vi } from "vitest";
import {
  createSerpHotelHandler,
  normalizeSerpHotels,
  liveHotelInput,
} from "../../supabase/functions/_shared/serpapi-hotels";
const query = {
  destination: "Berlin, Germany",
  checkin: "2030-06-10",
  checkout: "2030-06-12",
  adults: 2,
  childrenAges: [],
  currency: "EUR",
};
function payload() {
  return {
    search_metadata: { status: "Success", created_at: "2030-01-01 10:00:00 UTC" },
    search_parameters: {
      engine: "google_hotels",
      currency: "EUR",
      q: "Hotels in Berlin, Germany",
      check_in_date: query.checkin,
      check_out_date: query.checkout,
      adults: 2,
      children: 0,
    },
    properties: [
      {
        type: "hotel",
        name: "Real hotel",
        property_token: "hotel1",
        total_rate: { extracted_after_taxes_fees: 240, extracted_lowest: 220 },
        link: "https://hotel.example",
        images: [{ thumbnail: "https://images.example/hotel.jpg" }],
      },
    ],
  };
}
describe("Google Hotels results", () => {
  it("uses the whole-stay total including taxes and rejects nightly-only or mismatched search data", () => {
    expect(normalizeSerpHotels(payload(), query).offers[0]).toMatchObject({
      amount: 240,
      currency: "EUR",
      taxesIncluded: true,
    });
    expect(
      normalizeSerpHotels(
        {
          ...payload(),
          properties: [
            {
              type: "hotel",
              name: "Nightly only",
              property_token: "night",
              rate_per_night: { extracted_lowest: 50 },
            },
          ],
        },
        query,
      ).offers,
    ).toEqual([]);
    for (const search_parameters of [
      { ...payload().search_parameters, currency: "USD" },
      { ...payload().search_parameters, adults: 1 },
      { ...payload().search_parameters, check_out_date: "2030-06-13" },
    ])
      expect(() => normalizeSerpHotels({ ...payload(), search_parameters }, query)).toThrow();
    expect(liveHotelInput.safeParse({ ...query, checkin: "2030-02-30" }).success).toBe(false);
  });
  it("strips credential-bearing and unsafe links, deduplicates and never exposes provider metadata", () => {
    const data = payload();
    data.properties[0]!.link = "https://serpapi.com/search?api_key=secret";
    data.properties.push(data.properties[0]!);
    const result = normalizeSerpHotels(data, query);
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0]?.website).toBeNull();
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("verifies exact child ages instead of silently pricing adults only", () => {
    const family = { ...query, childrenAges: [4, 9] };
    expect(() => normalizeSerpHotels(payload(), family)).toThrow();
    expect(
      normalizeSerpHotels(
        {
          ...payload(),
          search_parameters: { ...payload().search_parameters, children: 2, children_ages: "4,9" },
        },
        family,
      ).offers,
    ).toHaveLength(1);
  });
});
describe("hotel API handler", () => {
  const origin = "https://wjlmaggie-sudo.github.io";
  const request = (body: unknown = query, site = origin) =>
    new Request("https://example.com", {
      method: "POST",
      headers: { origin: site },
      body: JSON.stringify(body),
    });
  it("shares concurrent/repeated searches and never returns the private key", async () => {
    const fetcher = vi.fn().mockImplementation(async () => {
      await Promise.resolve();
      return Response.json(payload());
    });
    const claim = vi.fn().mockResolvedValue(true);
    const handler = createSerpHotelHandler({
      apiKey: "private-test-key",
      allowedOrigins: [origin],
      claim,
      fetcher,
    });
    const responses = await Promise.all([handler(request()), handler(request())]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(claim).toHaveBeenCalledOnce();
    expect(await responses[0]!.text()).not.toContain("private-test-key");
    expect((await handler(request())).status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("makes no provider calls for missing config, invalid inputs, disallowed origins or quota failures", async () => {
    for (const scenario of ["key", "input", "origin", "quota", "database"]) {
      const fetcher = vi.fn();
      const handler = createSerpHotelHandler({
        apiKey: scenario === "key" ? undefined : "test-key",
        allowedOrigins: [origin],
        fetcher,
        claim: async () => {
          if (scenario === "database") throw Error("private-db-error");
          return scenario !== "quota";
        },
      });
      const response = await handler(
        request(
          scenario === "input" ? { ...query, adults: 0 } : query,
          scenario === "origin" ? "https://other.example" : origin,
        ),
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(fetcher).not.toHaveBeenCalled();
      expect(await response.text()).not.toContain("private-db-error");
    }
  });
  it("hides provider failures and recognizes the shared free limit", async () => {
    const handler = createSerpHotelHandler({
      apiKey: "test",
      allowedOrigins: [origin],
      claim: async () => true,
      fetcher: vi.fn().mockResolvedValue(Response.json({ error: "private provider details" })),
    });
    const result = await handler(request());
    expect(result.status).toBe(502);
    expect(await result.text()).not.toContain("private provider details");
  });
});
