import { findWeatherPlaces } from "./weather";
import { searchHotelPreviews } from "./hotel-search";
import type {
  HotelSearchInput,
  HotelSearchResult,
} from "../../supabase/functions/_shared/hotel-search";

export type HotelDestination = {
  id: number;
  city: string;
  country: string;
  countryCode: string;
  label: string;
};
const places = new Map<string, { until: number; value: HotelDestination[] }>();
const quotes = new Map<string, { until: number; value?: HotelSearchResult; error?: string }>();
const pending = new Map<string, Promise<HotelSearchResult>>();
function trimCache(cache: Map<string, unknown>) {
  if (cache.size >= 20) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}
export async function hotelDestinations(
  destination: string,
  signal: AbortSignal,
): Promise<HotelDestination[]> {
  const key = destination.trim().toLowerCase();
  const stored = places.get(key);
  if (stored && stored.until > Date.now()) return stored.value;
  const seen = new Set<string>();
  const resolved = (await findWeatherPlaces(destination, signal)).flatMap((place) => {
    if (!place.country_code || !place.country) return [];
    const identity = `${place.name}:${place.admin1 ?? ""}:${place.country_code}`;
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [
      {
        id: place.id,
        city: place.name,
        country: place.country,
        countryCode: place.country_code,
        label: [place.name, place.admin1 !== place.name ? place.admin1 : "", place.country]
          .filter(Boolean)
          .join(", "),
      },
    ];
  });
  if (resolved.length) {
    trimCache(places);
    places.set(key, { value: resolved, until: Date.now() + 30 * 60 * 1000 });
  }
  return resolved;
}

// Session memory only, never browser/account storage. Identical concurrent searches
// share one provider request even when a view closes while the request is running.
export async function budgetHotelPreviews(input: HotelSearchInput): Promise<HotelSearchResult> {
  const key = JSON.stringify(input);
  const stored = quotes.get(key);
  if (stored && stored.until > Date.now()) {
    if (stored.error) throw new Error(stored.error);
    if (stored.value) return stored.value;
  }
  const current = pending.get(key);
  if (current) return current;
  const request = searchHotelPreviews(input, AbortSignal.timeout(18000))
    .then((value) => {
      trimCache(quotes);
      quotes.set(key, { value, until: Date.now() + 5 * 60 * 1000 });
      return value;
    })
    .catch((cause: unknown) => {
      const message =
        cause instanceof Error
          ? cause.message
          : "Hotel suggestions are unavailable. Please try later.";
      trimCache(quotes);
      quotes.set(key, { error: message, until: Date.now() + 60 * 1000 });
      throw new Error(message);
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
export function forgetHotelPreviews(input: HotelSearchInput) {
  quotes.delete(JSON.stringify(input));
}
