import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });
export const hotelSearchInput = z
  .object({
    city: z.string().trim().min(2).max(120),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    guestNationality: z.string().regex(/^[A-Z]{2}$/),
    checkin: date,
    checkout: date,
    travelers: z.number().int().min(1).max(20),
    currency: z.string().regex(/^[A-Z]{3}$/),
    budget: z.number().finite().min(0).max(1000000),
  })
  .refine(
    (value) => {
      const nights = (Date.parse(value.checkout) - Date.parse(value.checkin)) / 86400000;
      return nights >= 1 && nights <= 29;
    },
    { message: "Choose a stay of 1–29 nights." },
  );
export type HotelSearchInput = z.infer<typeof hotelSearchInput>;

export const hotelPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  photo: z.string().url().nullable(),
  stars: z.number().min(0).max(5).nullable(),
  amount: z.number().finite().positive(),
  currency: z.string(),
});
export const hotelSearchResult = z.object({
  sandbox: z.literal(true),
  checkedAt: z.string().datetime(),
  offers: z.array(hotelPreviewSchema).max(3),
});
export type HotelSearchResult = z.infer<typeof hotelSearchResult>;

export function hotelRateRequest(input: HotelSearchInput) {
  let adults = input.travelers;
  const occupancies = [];
  while (adults > 0) {
    occupancies.push({ adults: Math.min(adults, 2), children: [] });
    adults -= 2;
  }
  return {
    cityName: input.city,
    countryCode: input.countryCode,
    guestNationality: input.guestNationality,
    checkin: input.checkin,
    checkout: input.checkout,
    currency: input.currency,
    occupancies,
    includeHotelData: true,
    limit: 20,
    maxRatesPerHotel: 1,
    timeout: 6,
  };
}

const money = z.object({ amount: z.number().finite().positive(), currency: z.string() });
const providerResponse = z.object({
  sandbox: z.literal(true),
  hotels: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(300),
      address: z.string().max(500).optional(),
      country_code: z.string(),
      main_photo: z.string().optional(),
      stars: z.number().min(0).max(5).optional(),
    }),
  ),
  data: z.array(
    z.object({
      hotelId: z.string(),
      roomTypes: z.array(
        z.object({
          offerRetailRate: z.array(money),
          rates: z.array(z.object({ adultCount: z.number().int(), childCount: z.number().int() })),
        }),
      ),
    }),
  ),
});

/** Only documented whole-offer prices. Never substitute a single-room or other-currency rate. */
export function normalizeHotelPreview(raw: unknown, input: HotelSearchInput): HotelSearchResult {
  const response = providerResponse.parse(raw);
  const offers = response.data.flatMap((hotel) => {
    const info = response.hotels.find((item) => item.id === hotel.hotelId);
    if (!info || info.country_code.toUpperCase() !== input.countryCode) return [];
    const amounts = hotel.roomTypes.flatMap((room) => {
      if (
        room.rates.length !== Math.ceil(input.travelers / 2) ||
        room.rates.reduce((sum, rate) => sum + rate.adultCount, 0) !== input.travelers ||
        room.rates.some((rate) => rate.childCount !== 0)
      )
        return [];
      return room.offerRetailRate
        .filter((price) => price.currency === input.currency && price.amount <= input.budget)
        .map((price) => price.amount);
    });
    if (!amounts.length) return [];
    const photo =
      info.main_photo?.startsWith("https://") && z.string().url().safeParse(info.main_photo).success
        ? info.main_photo
        : null;
    return [
      {
        id: info.id,
        name: info.name,
        address: info.address ?? "Address not supplied",
        photo,
        stars: info.stars ?? null,
        amount: Math.min(...amounts),
        currency: input.currency,
      },
    ];
  });
  const unique = [...new Map(offers.map((offer) => [offer.id, offer])).values()];
  return {
    sandbox: true,
    checkedAt: new Date().toISOString(),
    offers: unique.sort((a, b) => a.amount - b.amount).slice(0, 3),
  };
}

type SearchDependencies = {
  enabled: boolean;
  apiKey: string | undefined;
  allowedOrigins: string[];
  claim: () => Promise<boolean>;
  fetcher?: typeof fetch;
};

export function createHotelSearchHandler(deps: SearchDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin") ?? "";
    if (!origin || !deps.allowedOrigins.includes(origin))
      return new Response(null, { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
    if (!deps.enabled || !deps.apiKey)
      return reply(
        {
          error:
            "Hotel previews are not connected yet. You can still use the demo hotels or search on Booking.com.",
        },
        503,
      );
    try {
      const text = await request.text();
      if (text.length > 4096) return reply({ error: "Search request is too large." }, 413);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return reply({ error: "Send a valid hotel search request." }, 400);
      }
      const input = hotelSearchInput.safeParse(body);
      const today = new Date().toISOString().slice(0, 10);
      if (!input.success || input.data.checkin < today)
        return reply(
          { error: "Check your city, country codes, future dates, travelers and allowance." },
          400,
        );
      // Durable, shared quota: database failure never falls back to an unlimited provider call.
      if (!(await deps.claim()))
        return reply(
          {
            error:
              "Hotel preview limit reached for today. Try again tomorrow or use the external hotel search.",
          },
          429,
        );
      const response = await (deps.fetcher ?? fetch)(
        "https://api.liteapi.travel/v3.0/hotels/rates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": deps.apiKey },
          body: JSON.stringify(hotelRateRequest(input.data)),
          signal: AbortSignal.timeout(12000),
        },
      );
      if (!response.ok)
        return reply(
          { error: "The hotel provider could not complete this preview. Please try later." },
          502,
        );
      // Reject production responses, missing sandbox flags and incomplete totals.
      return reply(normalizeHotelPreview(await response.json(), input.data));
    } catch {
      // Do not return upstream bodies, credentials, booking tokens or internal database errors.
      return reply(
        { error: "Hotel previews are unavailable right now. Your plan is unchanged." },
        503,
      );
    }
  };
}
