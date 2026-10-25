import {
  carSearchInput,
  carSearchResult,
  type CarSearchInput,
} from "../../supabase/functions/_shared/car-search";
export function carEndpoint() {
  const base = import.meta.env["VITE_AI_GATEWAY_URL"] as string | undefined;
  // Use the same configured project as the existing hotel integration.
  const hotel = import.meta.env["VITE_HOTEL_SEARCH_URL"] as string | undefined;
  try {
    const url = new URL(hotel || base || "");
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) return null;
    return `${url.origin}/functions/v1/search-cars`;
  } catch {
    return null;
  }
}
export async function searchCars(input: CarSearchInput, signal: AbortSignal) {
  const endpoint = carEndpoint(),
    key = import.meta.env["VITE_AI_GATEWAY_KEY"] as string | undefined;
  if (!endpoint || !key) throw new Error("Car rental search is awaiting activation.");
  const query = carSearchInput.parse(input);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, apikey: key },
    body: JSON.stringify(query),
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "The free car rental search allowance has been reached. Try again next month."
        : response.status === 503 || response.status === 404
          ? "Car rental search is awaiting activation. No live offers are available yet."
          : response.status === 504
            ? "The rental provider took too long to respond. Please try again later."
            : response.status === 400
              ? "Check your pickup airport, dates and driver details."
              : "Car rental search is unavailable. Please try again later.",
    );
  const result = carSearchResult.parse(await response.json());
  if (JSON.stringify(result.query) !== JSON.stringify(query))
    throw new Error("Car offers do not match your search.");
  return result;
}

export async function carSearchAvailable(signal: AbortSignal) {
  const endpoint = carEndpoint(),
    key = import.meta.env["VITE_AI_GATEWAY_KEY"] as string | undefined;
  if (!endpoint || !key) return false;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    signal,
  });
  if (!response.ok) throw new Error("Car rental connection could not be checked.");
  const body = await response.json();
  return body.available === true;
}
