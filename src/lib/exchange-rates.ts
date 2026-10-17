import { z } from "zod";
export const FX_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CNY",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "NZD",
  "INR",
  "IDR",
  "THB",
  "MYR",
  "KRW",
  "SGD",
  "HKD",
];
const rateSchema = z.object({
  base: z.string(),
  quote: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rate: z.number().finite().positive(),
});
export async function fetchExchangeRate(
  base: string,
  quote: string,
  signal?: AbortSignal,
  request: typeof fetch = fetch,
) {
  if (!FX_CURRENCIES.includes(base) || !FX_CURRENCIES.includes(quote) || base === quote)
    throw new Error("Choose two supported currencies.");
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 8000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await request(
      `https://api.frankfurter.dev/v2/providers/ecb/rate/${base.toLowerCase()}/${quote.toLowerCase()}`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error("Exchange rate unavailable.");
    const parsed = rateSchema.parse(await response.json());
    if (parsed.base.toUpperCase() !== base || parsed.quote.toUpperCase() !== quote)
      throw new Error("The rate does not match your currencies.");
    return parsed;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
