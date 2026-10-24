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
export async function searchFlights(input: FlightInput, signal: AbortSignal) {
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
    signal,
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
