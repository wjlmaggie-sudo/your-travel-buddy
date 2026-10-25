import {
  flightInput,
  flightResult,
  type FlightInput,
} from "../../supabase/functions/_shared/flight-search";
export function flightEndpoint() {
  const value = import.meta.env["VITE_FLIGHT_SEARCH_URL"] as string | undefined;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
      ? url.href
      : null;
  } catch {
    return null;
  }
}
async function requestFlights(input: FlightInput, signal: AbortSignal) {
  const endpoint = flightEndpoint();
  if (!endpoint) throw new Error("Flight search is not connected yet.");
  const query = flightInput.parse(input);
  const gatewayKey = import.meta.env["VITE_AI_GATEWAY_KEY"] as string | undefined;
  if (!gatewayKey) throw new Error("Flight search gateway is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gatewayKey}`,
      apikey: gatewayKey,
    },
    body: JSON.stringify(query),
    signal: AbortSignal.timeout(55000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "The free flight-search allowance has been reached. Please try again after it resets."
        : response.status === 400
          ? "Check your airports, dates and passenger counts."
          : "Flight search is unavailable right now. Please try again later.",
    );
  const result = flightResult.parse(await response.json());
  if (JSON.stringify(result.query) !== JSON.stringify(query))
    throw new Error("The results do not match this search.");
  return result;
}

const memory = new Map<
  string,
  { until: number; result: Awaited<ReturnType<typeof requestFlights>> }
>();
const pending = new Map<string, Promise<Awaited<ReturnType<typeof requestFlights>>>>();
export async function searchFlights(input: FlightInput, signal: AbortSignal) {
  signal.throwIfAborted();
  const key = JSON.stringify([flightEndpoint(), flightInput.parse(input)]),
    cached = memory.get(key);
  if (cached && cached.until > Date.now()) return cached.result;
  let task = pending.get(key);
  if (!task) {
    task = requestFlights(input, signal).then((result) => {
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
