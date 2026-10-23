import {
  hotelSearchInput,
  hotelSearchResult,
  type HotelSearchInput,
} from "../../supabase/functions/_shared/hotel-search";

export function hotelSearchEndpoint() {
  const endpoint = import.meta.env["VITE_HOTEL_SEARCH_URL"] as string | undefined;
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function searchHotelPreviews(input: HotelSearchInput, signal: AbortSignal) {
  const endpoint = hotelSearchEndpoint();
  if (!endpoint)
    throw new Error(
      "Hotel previews are not connected yet. Explore the demonstration hotels below or search on Booking.com.",
    );
  const body = hotelSearchInput.parse(input);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    if (response.status === 429)
      throw new Error(
        "Today's hotel preview limit has been reached. Try again tomorrow or search on Booking.com.",
      );
    if (response.status === 400)
      throw new Error(
        "Check the city, country codes, dates and traveler details before searching again.",
      );
    throw new Error(
      "Hotel previews are unavailable right now. Your plan is unchanged; the demo hotels and external search still work.",
    );
  }
  const result = hotelSearchResult.safeParse(await response.json());
  if (
    !result.success ||
    result.data.offers.some(
      (offer) => offer.currency !== body.currency || offer.amount > body.budget,
    )
  )
    throw new Error("The hotel provider returned an unsupported preview. Your plan is unchanged.");
  return result.data;
}
