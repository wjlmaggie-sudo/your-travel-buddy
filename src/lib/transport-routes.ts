import {
  transportInput,
  transportResult,
  type TransportInput,
} from "../../supabase/functions/_shared/transport-routes";

export function transportEndpoint() {
  const value = import.meta.env["VITE_TRANSPORT_ROUTES_URL"] as string | undefined;
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

export async function fetchTransport(input: TransportInput, signal: AbortSignal) {
  const endpoint = transportEndpoint();
  if (!endpoint)
    throw new Error("Transport comparison is not connected yet. Use the Google Maps links below.");
  const body = transportInput.parse(input);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    if (response.status === 429)
      throw new Error("Today's transport limit has been reached. Use Google Maps below.");
    if (response.status === 400)
      throw new Error("Check the locations and choose a departure within the next 100 days.");
    throw new Error("Transport comparison is unavailable right now. Use Google Maps below.");
  }
  const result = transportResult.parse(await response.json());
  if (result.mode !== body.mode)
    throw new Error("The provider returned an unexpected travel mode.");
  return result;
}

export function transportLink(origin: string, destination: string, mode: TransportInput["mode"]) {
  return (
    "https://www.google.com/maps/dir/?" +
    new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: { TRANSIT: "transit", WALK: "walking", DRIVE: "driving" }[mode],
    })
  );
}
