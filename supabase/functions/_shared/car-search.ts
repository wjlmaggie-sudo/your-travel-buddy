import { z } from "zod";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  });
export const carSearchInput = z
  .object({
    pickup: z.string().regex(/^[A-Z]{3}$/),
    pickupDate: date,
    dropoffDate: date,
    pickupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    dropoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    age: z.number().int().min(18).max(99),
    residence: z.string().regex(/^[A-Z]{2}$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
    travelers: z.number().int().min(1).max(20),
  })
  .strict()
  .refine((q) => {
    const days =
      (Date.parse(`${q.dropoffDate}T${q.dropoffTime}:00Z`) -
        Date.parse(`${q.pickupDate}T${q.pickupTime}:00Z`)) /
      86400000;
    return days > 0 && days <= 30;
  });
export type CarSearchInput = z.infer<typeof carSearchInput>;
export const carOfferSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  supplier: z.string().min(1).max(200),
  amount: z.number().finite().positive().max(1000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  seats: z.number().int().min(1).max(20),
  transmission: z.string().max(50),
  mileage: z.string().max(100),
  fuelPolicy: z.string().max(100),
  cancellation: z.boolean().nullable(),
  deposit: z.number().finite().nonnegative().nullable(),
});
export const carSearchResult = z.object({
  query: carSearchInput,
  checkedAt: z.string().datetime(),
  provider: z.literal("scrappa-rentalcars"),
  offers: z.array(carOfferSchema).max(12),
});
export type CarSearchResult = z.infer<typeof carSearchResult>;
export function normalizeCars(raw: unknown, query: CarSearchInput): CarSearchResult {
  const source = z
    .object({
      search_parameters: z.object({
        pickup_location: z.string(),
        pickup_datetime: z.string(),
        dropoff_datetime: z.string(),
        drivers_age: z.number(),
        currency: z.string(),
        market: z.string(),
      }),
      offers: z.array(z.unknown()),
    })
    .parse(raw);
  const p = source.search_parameters;
  if (
    p.pickup_location !== query.pickup ||
    p.pickup_datetime.slice(0, 16) !== `${query.pickupDate}T${query.pickupTime}` ||
    p.dropoff_datetime.slice(0, 16) !== `${query.dropoffDate}T${query.dropoffTime}` ||
    p.drivers_age !== query.age ||
    p.currency !== query.currency ||
    p.market.toUpperCase() !== query.residence
  )
    throw new Error("Car search mismatch");
  const offer = z.object({
    vehicle_id: z.string(),
    supplier: z.object({ name: z.string() }),
    car: z.object({
      make_and_model: z.string(),
      seats: z.number(),
      transmission: z.string().optional(),
    }),
    price: z.object({
      total: z.number(),
      currency: z.string(),
      deposit: z.number().nullable().optional(),
    }),
    mileage: z.object({ type: z.string() }).optional(),
    fuel_policy: z.object({ type: z.string() }).optional(),
    free_cancellation: z.boolean().nullable().optional(),
  });
  const offers = source.offers.flatMap((value) => {
    const item = offer.safeParse(value);
    if (!item.success) return [];
    const v = item.data;
    const normalized = carOfferSchema.safeParse({
      id: v.vehicle_id,
      name: v.car.make_and_model,
      supplier: v.supplier.name,
      amount: v.price.total,
      currency: v.price.currency,
      seats: v.car.seats,
      transmission: v.car.transmission ?? "Not supplied",
      mileage: v.mileage?.type ?? "Not supplied",
      fuelPolicy: v.fuel_policy?.type ?? "Not supplied",
      cancellation: v.free_cancellation ?? null,
      deposit: v.price.deposit ?? null,
    });
    return normalized.success &&
      normalized.data.currency === query.currency &&
      normalized.data.seats >= query.travelers
      ? [normalized.data]
      : [];
  });
  return {
    query,
    checkedAt: new Date().toISOString(),
    provider: "scrappa-rentalcars",
    offers: [...new Map(offers.map((o) => [o.id, o])).values()]
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 12),
  };
}
export function createCarHandler(options: {
  apiKey: string | undefined;
  claim: () => Promise<boolean>;
  allowedOrigins: string[];
  fetcher?: typeof fetch;
}) {
  const cache = new Map<string, { until: number; result: CarSearchResult }>();
  const pending = new Map<string, Promise<CarSearchResult | null>>();
  return async (request: Request) => {
    const origin = request.headers.get("Origin") ?? "";
    if (!options.allowedOrigins.includes(origin)) return new Response(null, { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type, authorization, apikey",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method === "GET") return reply({ available: !!options.apiKey });
    if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
    if (!options.apiKey)
      return reply({ error: "Car rental connection is awaiting activation." }, 503);
    let query: CarSearchInput;
    try {
      const body = await request.text();
      if (body.length > 2048) return reply({ error: "Request too large" }, 413);
      query = carSearchInput.parse(JSON.parse(body));
      if (query.pickupDate < new Date().toISOString().slice(0, 10)) throw new Error("Past date");
    } catch {
      return reply({ error: "Check pickup, dates and driver details." }, 400);
    }
    const key = JSON.stringify(query),
      stored = cache.get(key);
    if (stored && stored.until > Date.now()) return reply(stored.result);
    try {
      let task = pending.get(key);
      if (!task) {
        task = (async () => {
          if (!(await options.claim())) return null;
          const url = new URL("https://scrappa.co/api/rentalcars/search");
          url.search = new URLSearchParams({
            pickup_location: query.pickup,
            pickup_date: query.pickupDate,
            dropoff_date: query.dropoffDate,
            pickup_time: query.pickupTime,
            dropoff_time: query.dropoffTime,
            drivers_age: String(query.age),
            cor: query.residence.toLowerCase(),
            currency: query.currency,
            sort: "PRICE",
            sort_ascending: "true",
            per_page: "50",
          }).toString();
          const response = await (options.fetcher ?? fetch)(url, {
            headers: { "X-API-KEY": options.apiKey!, Accept: "application/json" },
            signal: AbortSignal.timeout(45000),
          });
          // Never follow payment challenges, buy credits or retry automatically.
          if (!response.ok) throw new Error("Provider unavailable");
          const result = normalizeCars(await response.json(), query);
          for (const [id, entry] of cache) if (entry.until <= Date.now()) cache.delete(id);
          if (cache.size >= 100) cache.delete(cache.keys().next().value!);
          cache.set(key, { until: Date.now() + 600000, result });
          return result;
        })();
        pending.set(key, task);
        void task.finally(() => pending.delete(key)).catch(() => {});
      }
      const result = await task;
      return result
        ? reply(result)
        : reply({ error: "The free car search allowance has been reached." }, 429);
    } catch {
      return reply({ error: "Car rental search unavailable. No offers have been added." }, 502);
    }
  };
}
