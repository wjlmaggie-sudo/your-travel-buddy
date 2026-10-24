import { z } from "zod";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });
export const liveHotelInput = z
  .object({
    destination: z.string().trim().min(2).max(160),
    checkin: date,
    checkout: date,
    adults: z.number().int().min(1).max(6),
    childrenAges: z.array(z.number().int().min(0).max(17)).max(6),
    currency: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict()
  .refine((v) => {
    const nights = (Date.parse(v.checkout) - Date.parse(v.checkin)) / 86400000;
    return nights >= 1 && nights <= 29;
  });
export type LiveHotelInput = z.infer<typeof liveHotelInput>;
const secureUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.searchParams.has("api_key") &&
      !url.searchParams.has("key") &&
      !/(^|\.)serpapi\.com$/i.test(url.hostname)
    );
  });
export const liveHotelResult = z.object({
  query: liveHotelInput,
  provider: z.literal("serpapi-google-hotels"),
  checkedAt: z.string().datetime(),
  sourceTime: z.string().max(80).nullable(),
  searchUrl: secureUrl,
  offers: z
    .array(
      z.object({
        id: z.string().max(500),
        name: z.string().min(1).max(300),
        description: z.string().max(1500),
        photo: secureUrl.nullable(),
        amount: z.number().finite().positive(),
        currency: z.string().regex(/^[A-Z]{3}$/),
        taxesIncluded: z.boolean(),
        stars: z.number().min(0).max(5).nullable(),
        rating: z.number().min(0).max(5).nullable(),
        website: secureUrl.nullable(),
      }),
    )
    .max(12),
});
export type LiveHotelResult = z.infer<typeof liveHotelResult>;
function safeUrl(value: unknown) {
  const result = secureUrl.safeParse(value);
  return result.success ? result.data : null;
}
export function googleHotelSearch(query: LiveHotelInput) {
  return (
    "https://www.google.com/travel/hotels?" +
    new URLSearchParams({
      q: `Hotels in ${query.destination} ${query.checkin} to ${query.checkout}, ${query.adults} adults${query.childrenAges.length ? `, children ages ${query.childrenAges.join(", ")}` : ""}`,
      curr: query.currency,
    })
  );
}
const property = z.object({
  type: z.literal("hotel"),
  name: z.string().min(1).max(300),
  property_token: z.string().max(500),
  description: z.string().max(1500).optional(),
  link: z.string().optional(),
  total_rate: z.object({
    extracted_after_taxes_fees: z.number().finite().positive().optional(),
    extracted_lowest: z.number().finite().positive().optional(),
  }),
  extracted_hotel_class: z.number().min(0).max(5).optional(),
  overall_rating: z.number().min(0).max(5).optional(),
  images: z.array(z.object({ thumbnail: z.string().optional() })).optional(),
});
export function normalizeSerpHotels(raw: unknown, query: LiveHotelInput): LiveHotelResult {
  const response = z
    .object({
      error: z.string().optional(),
      search_metadata: z.object({
        status: z.literal("Success"),
        created_at: z.string().optional(),
      }),
      search_parameters: z.object({
        engine: z.literal("google_hotels"),
        currency: z.string(),
        q: z.string(),
        check_in_date: z.string(),
        check_out_date: z.string(),
        adults: z.coerce.number(),
        children: z.coerce.number().optional(),
        children_ages: z.string().optional(),
      }),
      properties: z.array(z.unknown()).optional(),
    })
    .parse(raw);
  const p = response.search_parameters;
  if (
    response.error ||
    p.currency !== query.currency ||
    p.q !== `Hotels in ${query.destination}` ||
    p.check_in_date !== query.checkin ||
    p.check_out_date !== query.checkout ||
    p.adults !== query.adults ||
    (p.children ?? 0) !== query.childrenAges.length ||
    (query.childrenAges.length > 0 && p.children_ages !== query.childrenAges.join(","))
  )
    throw new Error("Hotel results do not match the search.");
  const offers = (response.properties ?? []).flatMap((value) => {
    const parsed = property.safeParse(value);
    if (!parsed.success) return [];
    const item = parsed.data;
    const amount = item.total_rate.extracted_after_taxes_fees ?? item.total_rate.extracted_lowest;
    if (!amount) return [];
    return [
      {
        id: item.property_token,
        name: item.name,
        description: item.description ?? "",
        photo: safeUrl(item.images?.[0]?.thumbnail),
        amount,
        currency: query.currency,
        taxesIncluded: item.total_rate.extracted_after_taxes_fees !== undefined,
        stars: item.extracted_hotel_class ?? null,
        rating: item.overall_rating ?? null,
        website: safeUrl(item.link),
      },
    ];
  });
  return {
    query,
    provider: "serpapi-google-hotels",
    checkedAt: new Date().toISOString(),
    sourceTime: response.search_metadata.created_at ?? null,
    searchUrl: googleHotelSearch(query),
    offers: [...new Map(offers.map((offer) => [offer.id, offer])).values()]
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 12),
  };
}
export function createSerpHotelHandler(options: {
  apiKey: string | undefined;
  allowedOrigins: string[];
  claim: () => Promise<boolean>;
  fetcher?: typeof fetch;
}) {
  const cache = new Map<string, { until: number; result: LiveHotelResult }>();
  const pending = new Map<string, Promise<LiveHotelResult | null>>();
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin") ?? "";
    if (!origin || !options.allowedOrigins.includes(origin))
      return new Response(null, { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type, authorization, apikey",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
    if (!options.apiKey) return reply({ error: "Hotel search is not connected yet." }, 503);
    let query: LiveHotelInput;
    try {
      const body = await request.text();
      if (body.length > 4096) return reply({ error: "Search request is too large." }, 413);
      query = liveHotelInput.parse(JSON.parse(body));
      if (query.checkin < new Date().toISOString().slice(0, 10)) throw new Error("Past dates");
    } catch {
      return reply({ error: "Check destination, dates and guest details." }, 400);
    }
    const key = JSON.stringify(query);
    const stored = cache.get(key);
    if (stored && stored.until > Date.now()) return reply(stored.result);
    try {
      let task = pending.get(key);
      if (!task) {
        task = (async () => {
          if (!(await options.claim())) return null;
          const url = new URL("https://serpapi.com/search.json");
          url.search = new URLSearchParams({
            engine: "google_hotels",
            api_key: options.apiKey!,
            q: `Hotels in ${query.destination}`,
            check_in_date: query.checkin,
            check_out_date: query.checkout,
            adults: String(query.adults),
            children: String(query.childrenAges.length),
            ...(query.childrenAges.length ? { children_ages: query.childrenAges.join(",") } : {}),
            currency: query.currency,
            hl: "en",
            gl: "de",
          }).toString();
          const response = await (options.fetcher ?? fetch)(url, {
            signal: AbortSignal.timeout(45000),
          });
          if (!response.ok) throw new Error("Provider unavailable");
          const result = normalizeSerpHotels(await response.json(), query);
          for (const [id, entry] of cache) if (entry.until <= Date.now()) cache.delete(id);
          if (cache.size >= 100) cache.delete(cache.keys().next().value!);
          cache.set(key, { until: Date.now() + 10 * 60 * 1000, result });
          return result;
        })();
        pending.set(key, task);
        void task.finally(() => pending.delete(key)).catch(() => {});
      }
      const result = await task;
      return result
        ? reply(result)
        : reply(
            { error: "The shared free hotel and flight search allowance has been reached." },
            429,
          );
    } catch {
      return reply({ error: "Hotel search is unavailable. Please try again later." }, 502);
    }
  };
}
