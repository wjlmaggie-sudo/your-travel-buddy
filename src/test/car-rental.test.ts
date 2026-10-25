import { expect, it, vi } from "vitest";
import {
  carSearchInput,
  createCarHandler,
  normalizeCars,
  type CarSearchInput,
} from "../../supabase/functions/_shared/car-search";
import { carScope, connectedBudget } from "@/lib/travel-workspace";
import { journeySchema } from "@/lib/journey-planning";
const query: CarSearchInput = {
  pickup: "BER",
  pickupDate: "2026-12-01",
  dropoffDate: "2026-12-04",
  pickupTime: "10:00",
  dropoffTime: "10:00",
  age: 35,
  residence: "DE",
  currency: "EUR",
  travelers: 2,
};
const raw = () => ({
  search_parameters: {
    pickup_location: "BER",
    pickup_datetime: "2026-12-01T10:00:00",
    dropoff_datetime: "2026-12-04T10:00:00",
    drivers_age: 35,
    currency: "EUR",
    market: "de",
  },
  offers: [
    {
      vehicle_id: "1",
      supplier: { name: "Example supplier" },
      car: { make_and_model: "Example car", seats: 5, transmission: "MANUAL" },
      price: { total: 120, currency: "EUR" },
    },
  ],
});
const request = (body: unknown = query, origin = "https://wjlmaggie-sudo.github.io") =>
  new Request("https://example.com/search-cars", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
it("rejects invalid dates, missing driver details and zero-length rentals", () => {
  expect(carSearchInput.safeParse({ ...query, pickupDate: "2026-02-30" }).success).toBe(false);
  expect(carSearchInput.safeParse({ ...query, age: 0 }).success).toBe(false);
  expect(carSearchInput.safeParse({ ...query, dropoffDate: query.pickupDate }).success).toBe(false);
});
it("keeps actual whole-rental prices and excludes wrong currencies or insufficient seats", () => {
  const source = raw();
  source.offers.push({
    ...source.offers[0]!,
    vehicle_id: "2",
    price: { total: 50, currency: "USD" },
  });
  expect(normalizeCars(source, query).offers).toHaveLength(1);
  expect(normalizeCars(source, { ...query, travelers: 6 }).offers).toHaveLength(0);
  expect(normalizeCars(source, query).offers[0]?.amount).toBe(120);
  expect(normalizeCars(source, query).offers[0]?.deposit).toBeNull();
});
it("refuses mismatched rental dates or driver pricing context", () => {
  expect(() => normalizeCars(raw(), { ...query, age: 21 })).toThrow();
  expect(() => normalizeCars(raw(), { ...query, residence: "FR" })).toThrow();
  expect(() => normalizeCars(raw(), { ...query, pickupTime: "12:00" })).toThrow();
});
it("requires activation and an allowed origin before quota or provider calls", async () => {
  const claim = vi.fn(),
    fetcher = vi.fn();
  const handler = createCarHandler({
    apiKey: undefined,
    claim,
    fetcher,
    allowedOrigins: ["https://wjlmaggie-sudo.github.io"],
  });
  expect((await handler(request())).status).toBe(503);
  expect((await handler(request(query, "https://other.test"))).status).toBe(403);
  expect(claim).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});
it("stops at the hard quota without a provider request", async () => {
  const fetcher = vi.fn();
  const handler = createCarHandler({
    apiKey: "test",
    claim: async () => false,
    fetcher,
    allowedOrigins: ["https://wjlmaggie-sudo.github.io"],
  });
  expect((await handler(request())).status).toBe(429);
  expect(fetcher).not.toHaveBeenCalled();
});
it("caches repeated searches and keeps the key only in upstream headers", async () => {
  const claim = vi.fn(async () => true),
    fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(raw()));
  const handler = createCarHandler({
    apiKey: "private-test",
    claim,
    fetcher: fetcher as typeof fetch,
    allowedOrigins: ["https://wjlmaggie-sudo.github.io"],
  });
  const response = await handler(request());
  expect(response.status).toBe(200);
  expect(await response.text()).not.toContain("private-test");
  expect((await handler(request())).status).toBe(200);
  expect(claim).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("private-test");
});
it("fails closed on provider payment challenges, without retries or simulated offers", async () => {
  const fetcher = vi.fn(async () => new Response(null, { status: 402 }));
  const handler = createCarHandler({
    apiKey: "test",
    claim: async () => true,
    fetcher: fetcher as typeof fetch,
    allowedOrigins: ["https://wjlmaggie-sudo.github.io"],
  });
  expect((await handler(request())).status).toBe(502);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("adds rental costs exactly once, preserves local transport, restores selection and ignores stale scopes", () => {
  const brief = {
    destination: "Berlin",
    start: "2026-12-01",
    days: 4,
    travelers: 2,
    budget: 1000,
    currency: "EUR",
    style: "Balanced" as const,
  };
  const base = {
    departure: "",
    flightsRequired: false,
    flightBudget: 0,
    hotelComfort: "Comfortable" as const,
  };
  const original = connectedBudget(brief, base);
  const selectedCar = {
    ...normalizeCars(raw(), query).offers[0]!,
    scope: carScope(brief),
    checkedAt: new Date().toISOString(),
    pickup: "BER",
    pickupDate: query.pickupDate,
    dropoffDate: query.dropoffDate,
    pickupTime: query.pickupTime,
    dropoffTime: query.dropoffTime,
  };
  const restored = journeySchema.parse({ ...base, selectedCar });
  const next = connectedBudget(brief, restored);
  expect(next.planned).toBe(original.planned + 120);
  expect(next.estimates.transport).toBe(original.estimates.transport);
  expect(next.remaining).toBe(original.remaining - 120);
  expect(connectedBudget({ ...brief, currency: "USD" }, restored).car).toBe(0);
  expect(connectedBudget({ ...brief, days: 5 }, restored).car).toBe(0);
});
it("keeps provider vehicle photos and reads the security hold separately from rental payment", () => {
  const source = raw();
  Object.assign(source.offers[0]!, {
    car: {
      ...source.offers[0]!.car,
      image_url: "https://cdn2.rcstatic.com/images/car_images/web/opel/insignia_lrg.jpg",
      suitcase_count: 3,
    },
    price: { total: 120, currency: "EUR", deposit: 120 },
    deposit: { amount: 750, currency: "EUR" },
  });
  const offer = normalizeCars(source, query).offers[0]!;
  expect(offer.photo).toBe("https://cdn2.rcstatic.com/images/car_images/web/opel/insignia_lrg.jpg");
  expect(offer.bags).toBe(3);
  expect(offer.deposit).toBe(750);
});
it("never treats an upfront payment as the security deposit and rejects unsafe image URLs", () => {
  const source = raw();
  Object.assign(source.offers[0]!, {
    car: { ...source.offers[0]!.car, image_url: "https://cdn2.rcstatic.com.evil.test/car.jpg" },
    price: { total: 120, currency: "EUR", deposit: 120 },
  });
  const offer = normalizeCars(source, query).offers[0]!;
  expect(offer.photo).toBeNull();
  expect(offer.deposit).toBeNull();
});
