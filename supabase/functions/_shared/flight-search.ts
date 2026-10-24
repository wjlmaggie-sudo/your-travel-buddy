import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T12:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  });
export const flightInput = z
  .object({
    origin: z.string().regex(/^[A-Z]{3}$/),
    destination: z.string().regex(/^[A-Z]{3}$/),
    outbound: date,
    returning: date,
    adults: z.number().int().min(1).max(9),
    children: z.number().int().min(0).max(8),
    infants: z.number().int().min(0).max(8),
    currency: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict()
  .refine(
    (v) =>
      v.origin !== v.destination &&
      v.returning > v.outbound &&
      v.adults + v.children + v.infants <= 9 &&
      v.infants <= v.adults,
  );
export type FlightInput = z.infer<typeof flightInput>;
const airport = z.object({
  id: z.string().regex(/^[A-Z]{3}$/),
  name: z.string().max(250),
  time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
});
const offer = z.object({
  flights: z
    .array(
      z.object({
        departure_airport: airport,
        arrival_airport: airport,
        airline: z.string().max(200),
        flight_number: z.string().max(80),
        duration: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(8),
  total_duration: z.number().nonnegative(),
  price: z.number().positive(),
  type: z.literal("Round trip"),
});
export const flightResult = z.object({
  query: flightInput,
  checkedAt: z.string().datetime(),
  sourceTime: z.string().max(80).nullable(),
  offers: z.array(offer).max(12),
  searchUrl: z.string().url(),
});
export type FlightResult = z.infer<typeof flightResult>;
export function normalizeFlights(raw: unknown, query: FlightInput): FlightResult {
  const data = z
    .object({
      error: z.string().optional(),
      search_metadata: z
        .object({
          created_at: z.string().optional(),
          google_flights_url: z.string().optional(),
        })
        .optional(),
      best_flights: z.array(z.unknown()).optional(),
      other_flights: z.array(z.unknown()).optional(),
    })
    .parse(raw);
  if (data.error) throw new Error("Provider error");
  const offers = [...(data.best_flights ?? []), ...(data.other_flights ?? [])]
    .flatMap((value) => {
      const parsed = offer.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    })
    .filter(
      (value) =>
        value.flights[0]?.departure_airport.id === query.origin &&
        value.flights.at(-1)?.arrival_airport.id === query.destination &&
        value.flights[0]?.departure_airport.time.slice(0, 10) === query.outbound,
    )
    .slice(0, 12);
  let searchUrl = `https://www.google.com/travel/flights?${new URLSearchParams({ q: `Return flights ${query.origin} to ${query.destination} ${query.outbound} to ${query.returning}, ${query.adults} adults, ${query.children} children, ${query.infants} infants`, curr: query.currency })}`;
  if (data.search_metadata?.google_flights_url) {
    const url = new URL(data.search_metadata.google_flights_url);
    if (
      url.origin === "https://www.google.com" &&
      url.pathname.startsWith("/travel/flights") &&
      !url.username &&
      !url.password
    )
      searchUrl = url.href;
  }
  return {
    query,
    checkedAt: new Date().toISOString(),
    sourceTime: data.search_metadata?.created_at ?? null,
    offers,
    searchUrl,
  };
}
export function createFlightHandler(options: {
  apiKey: string | undefined;
  allowedOrigins: string[];
  claim: () => Promise<boolean>;
  fetcher?: typeof fetch;
}) {
  const cache = new Map<string, { until: number; result: FlightResult }>();
  const pending = new Map<string, Promise<FlightResult | null>>();
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin") ?? "";
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization, apikey",
      "Cache-Control": "no-store",
    };
    const respond = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    if (!options.allowedOrigins.includes(origin)) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
    if (!options.apiKey) return respond({ error: "Flight search is not configured" }, 503);
    let query: FlightInput;
    try {
      const text = await request.text();
      if (text.length > 2000) return respond({ error: "Invalid search" }, 400);
      query = flightInput.parse(JSON.parse(text));
      if (query.outbound < new Date().toISOString().slice(0, 10))
        return respond({ error: "Choose future travel dates" }, 400);
    } catch {
      return respond({ error: "Invalid search" }, 400);
    }
    const key = JSON.stringify(query);
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return respond(cached.result);
    try {
      let task = pending.get(key);
      if (!task) {
        task = (async () => {
          if (!(await options.claim())) return null;
          const url = new URL("https://serpapi.com/search.json");
          url.search = new URLSearchParams({
            engine: "google_flights",
            api_key: options.apiKey!,
            departure_id: query.origin,
            arrival_id: query.destination,
            outbound_date: query.outbound,
            return_date: query.returning,
            adults: String(query.adults),
            children: String(query.children),
            infants_in_seat: String(query.infants),
            currency: query.currency,
            type: "1",
            hl: "en",
            gl: "de",
          }).toString();
          const response = await (options.fetcher ?? fetch)(url, {
            signal: AbortSignal.timeout(45000),
          });
          if (!response.ok) throw new Error("Flight search unavailable");
          const result = normalizeFlights(await response.json(), query);
          for (const [id, value] of cache) if (value.until <= Date.now()) cache.delete(id);
          if (cache.size >= 100) cache.delete(cache.keys().next().value!);
          cache.set(key, { until: Date.now() + 10 * 60 * 1000, result });
          return result;
        })();
        pending.set(key, task);
        void task.finally(() => pending.delete(key)).catch(() => {});
      }
      const result = await task;
      return result ? respond(result) : respond({ error: "Free search allowance reached" }, 429);
    } catch {
      return respond({ error: "Flight search unavailable. Please try again later." }, 502);
    }
  };
}
