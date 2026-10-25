import {
  liveHotelInput,
  liveHotelResult,
  type LiveHotelInput,
} from "../../supabase/functions/_shared/serpapi-hotels";
import { hotelSearchEndpoint } from "./hotel-search";
async function requestLiveHotels(input: LiveHotelInput, signal: AbortSignal) {
  const endpoint = hotelSearchEndpoint();
  if (!endpoint) throw new Error("Hotel search is not connected yet.");
  const query = liveHotelInput.parse(input);
  const key = import.meta.env["VITE_AI_GATEWAY_KEY"] as string | undefined;
  if (!key) throw new Error("Hotel search gateway is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, apikey: key },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(55000),
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

const memory = new Map<
  string,
  { until: number; result: Awaited<ReturnType<typeof requestLiveHotels>> }
>();
const pending = new Map<string, Promise<Awaited<ReturnType<typeof requestLiveHotels>>>>();
export async function searchLiveHotels(input: LiveHotelInput, signal: AbortSignal) {
  signal.throwIfAborted();
  const key = JSON.stringify([hotelSearchEndpoint(), liveHotelInput.parse(input)]),
    cached = memory.get(key);
  if (cached && cached.until > Date.now()) return cached.result;
  let task = pending.get(key);
  if (!task) {
    task = requestLiveHotels(input, signal).then((result) => {
      if (memory.size >= 50) memory.delete(memory.keys().next().value!);
      memory.set(key, { until: Date.now() + 600000, result });
      return result;
    });
    pending.set(key, task);
    void task.finally(() => pending.delete(key)).catch(() => {});
  }
  const result = await task;
  signal.throwIfAborted();
  return result;
}
