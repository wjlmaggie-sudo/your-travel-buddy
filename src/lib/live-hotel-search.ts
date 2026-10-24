import {
  liveHotelInput,
  liveHotelResult,
  type LiveHotelInput,
} from "../../supabase/functions/_shared/serpapi-hotels";
import { hotelSearchEndpoint } from "./hotel-search";
export async function searchLiveHotels(input: LiveHotelInput, signal: AbortSignal) {
  const endpoint = hotelSearchEndpoint();
  if (!endpoint) throw new Error("Hotel search is not connected yet.");
  const query = liveHotelInput.parse(input);
  const key = import.meta.env["VITE_AI_GATEWAY_KEY"] as string | undefined;
  if (!key) throw new Error("Hotel search gateway is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, apikey: key },
    body: JSON.stringify(query),
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "The shared free hotel and flight search allowance has been reached. Try again after it resets."
        : response.status === 400
          ? "Check your destination, dates and guest details."
          : "Hotel search is unavailable right now. Please try again later.",
    );
  const result = liveHotelResult.parse(await response.json());
  if (
    JSON.stringify(result.query) !== JSON.stringify(query) ||
    result.offers.some((o) => o.currency !== query.currency)
  )
    throw new Error("The hotel results do not match your search.");
  return result;
}
