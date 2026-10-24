import { describe, expect, it, vi } from "vitest";
import {
  createHotelSearchHandler,
  hotelRateRequest,
  hotelSearchInput,
  normalizeHotelPreview,
  isSandboxHotelKey,
} from "../../supabase/functions/_shared/hotel-search";

const input = {
  city: "Lisbon",
  countryCode: "PT",
  guestNationality: "DE",
  checkin: "2030-06-10",
  checkout: "2030-06-14",
  travelers: 3,
  currency: "EUR",
  budget: 500,
};
const testSandboxKey = "sand_00000000-0000-0000-0000-000000000000";
function payload(amount = 400, currency = "EUR") {
  return {
    sandbox: true,
    hotels: [
      {
        id: "hotel1",
        name: "Provider test property",
        country_code: "PT",
        stars: 4,
        main_photo: "https://example.com/hotel.jpg",
      },
    ],
    data: [
      {
        hotelId: "hotel1",
        roomTypes: [
          {
            offerRetailRate: [{ amount, currency }],
            rates: [
              { adultCount: 2, childCount: 0 },
              { adultCount: 1, childCount: 0 },
            ],
          },
        ],
      },
    ],
  };
}
describe("hotel provider adapter", () => {
  it("accepts observed object totals and missing flags only with verified sandbox provenance", () => {
    const response = {
      ...payload(),
      sandbox: undefined,
      data: [
        {
          hotelId: "hotel1",
          roomTypes: [
            {
              offerRetailRate: { amount: 400, currency: "EUR" },
              rates: [
                { adultCount: 2, childCount: 0 },
                { adultCount: 1, childCount: 0 },
              ],
            },
          ],
        },
      ],
    };
    expect(() => normalizeHotelPreview(response, input)).toThrow();
    expect(normalizeHotelPreview(response, input, true).offers[0]?.amount).toBe(400);
    expect(() => normalizeHotelPreview({ ...response, sandbox: false }, input, true)).toThrow();
    expect(isSandboxHotelKey(testSandboxKey)).toBe(true);
    expect(isSandboxHotelKey(`${testSandboxKey}Copy`)).toBe(false);
    expect(isSandboxHotelKey(testSandboxKey.replace("sand_", "prod_"))).toBe(false);
  });
  it("validates calendar dates and stay duration and builds the documented multi-room request", () => {
    expect(hotelSearchInput.safeParse({ ...input, checkin: "2030-02-30" }).success).toBe(false);
    expect(hotelSearchInput.safeParse({ ...input, checkout: input.checkin }).success).toBe(false);
    expect(hotelSearchInput.safeParse({ ...input, travelers: 0 }).success).toBe(false);
    expect(hotelRateRequest(input)).toMatchObject({
      cityName: "Lisbon",
      countryCode: "PT",
      occupancies: [
        { adults: 2, children: [] },
        { adults: 1, children: [] },
      ],
      limit: 20,
    });
  });
  it("uses a whole-offer amount once and filters incorrect currency, budget and occupancy", () => {
    expect(normalizeHotelPreview(payload(), input).offers[0]?.amount).toBe(400);
    expect(normalizeHotelPreview(payload(501), input).offers).toEqual([]);
    expect(normalizeHotelPreview(payload(400, "USD"), input).offers).toEqual([]);
    const incomplete = payload();
    incomplete.data[0]!.roomTypes[0]!.rates.pop();
    expect(normalizeHotelPreview(incomplete, input).offers).toEqual([]);
    expect(() => normalizeHotelPreview({ ...payload(), sandbox: false }, input)).toThrow();
    expect(() => normalizeHotelPreview({ ...payload(), sandbox: undefined }, input)).toThrow();
  });
});
describe("guest hotel endpoint", () => {
  const origin = "https://wjlmaggie-sudo.github.io";
  const request = (body: unknown = input, site = origin) =>
    new Request("https://test.supabase.co/functions/v1/search-hotels", {
      method: "POST",
      headers: { origin: site, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  function setup(overrides = {}) {
    const fetcher = vi.fn().mockResolvedValue(Response.json(payload()));
    const claim = vi.fn().mockResolvedValue(true);
    const handler = createHotelSearchHandler({
      enabled: true,
      apiKey: testSandboxKey,
      allowedOrigins: [origin],
      fetcher,
      claim,
      ...overrides,
    });
    return { handler, fetcher, claim };
  }
  it("makes no provider calls for disabled setup, missing key, invalid inputs or other origins", async () => {
    for (const overrides of [
      { enabled: false },
      { apiKey: undefined },
      { apiKey: "not-a-sandbox-credential" },
      { apiKey: `${testSandboxKey}Copy` },
    ]) {
      const { handler, fetcher, claim } = setup(overrides);
      expect((await handler(request())).status).toBe(503);
      expect(fetcher).not.toHaveBeenCalled();
      expect(claim).not.toHaveBeenCalled();
    }
    const { handler, fetcher, claim } = setup();
    expect((await handler(request(input, "https://unapproved.example"))).status).toBe(403);
    expect((await handler(request({ ...input, travelers: 21 }))).status).toBe(400);
    expect(
      (await handler(request({ ...input, checkin: "2020-06-10", checkout: "2020-06-14" }))).status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    expect(claim).not.toHaveBeenCalled();
  });
  it("fails closed when quota is exhausted or the quota database fails", async () => {
    for (const claim of [
      vi.fn().mockResolvedValue(false),
      vi.fn().mockRejectedValue(new Error("Database unavailable")),
    ]) {
      const { handler, fetcher } = setup({ claim });
      expect([429, 503]).toContain((await handler(request())).status);
      expect(fetcher).not.toHaveBeenCalled();
    }
  });
  it("permits guest search without login and returns only safe sandbox previews", async () => {
    const { handler, fetcher, claim } = setup();
    const response = await handler(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    const body = await response.text();
    expect(JSON.parse(body).offers[0].amount).toBe(400);
    expect(body).not.toContain(testSandboxKey);
    expect(claim).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.liteapi.travel/v3.0/hotels/rates");
  });
  it("rejects a production response and hides raw upstream failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ ...payload(), sandbox: false, secret: "private-upstream-value" }),
      );
    const { handler } = setup({ fetcher });
    const response = await handler(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-upstream-value");
  });
});
it("uses the requested room count and accepts only the complete matching occupancy", () => {
  const requested = { ...input, rooms: 3 };
  expect(hotelRateRequest(requested).occupancies).toEqual([
    { adults: 1, children: [] },
    { adults: 1, children: [] },
    { adults: 1, children: [] },
  ]);
  expect(hotelSearchInput.safeParse({ ...input, rooms: 4 }).success).toBe(false);
  expect(hotelSearchInput.safeParse({ ...input, rooms: 0 }).success).toBe(false);
  expect(normalizeHotelPreview(payload(), requested).offers).toEqual([]);
  const match = payload();
  match.data[0]!.roomTypes[0]!.rates = Array.from({ length: 3 }, () => ({
    adultCount: 1,
    childCount: 0,
  }));
  expect(normalizeHotelPreview(match, requested)).toMatchObject({
    rooms: 3,
    offers: [{ amount: 400 }],
  });
  expect(hotelRateRequest({ ...input, travelers: 4, rooms: 1 }).occupancies).toEqual([
    { adults: 4, children: [] },
  ]);
});
