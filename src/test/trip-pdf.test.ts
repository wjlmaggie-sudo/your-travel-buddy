import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTripPdf, type PdfTrip } from "@/lib/trip-pdf";
const hotelEndpoint = vi.hoisted(() => vi.fn());
vi.mock("@/lib/hotel-search", () => ({ hotelSearchEndpoint: hotelEndpoint }));
vi.mock("@/lib/city-guides", () => ({
  loadCityGuide: vi.fn(async () => ({})),
  itineraryGuide: () => ({
    places: [
      {
        name: "Pena Palace",
        lat: 38.78,
        lon: -9.39,
        description: "A palace reference",
        source: "https://example.org/palace",
      },
    ],
    restaurants: [
      {
        name: "Local café",
        kind: "Café",
        address: "Main road",
        price: "Check menu",
        source: "https://example.org/menu",
      },
    ],
  }),
}));
vi.mock("@/lib/pdf-street-map", () => ({
  streetMapWays: vi.fn(async () => []),
  streetMapSvg: vi.fn(
    () =>
      '<svg xmlns="http://www.w3.org/2000/svg" width="998" height="500"><rect width="998" height="500" fill="white"/></svg>',
  ),
}));
vi.mock("@/lib/place-stories", () => ({
  curatedStory: () => ({
    text: "Complete history story including 1838.",
    source: "https://example.org/history",
    credit: "Official history",
  }),
  fetchPlaceStory: vi.fn(),
}));
vi.mock("@/lib/place-photos", () => ({ fetchPlacePhoto: vi.fn(async () => null) }));
const trip: PdfTrip = {
  brief: {
    destination: "Lisbon",
    start: "2026-11-01",
    days: 2,
    travelers: 2,
    budget: 1500,
    currency: "EUR",
    style: "Balanced",
  },
  journey: { departure: "Berlin", flightBudget: 350, hotelComfort: "Comfortable" },
  days: [
    { day: 1, items: [{ title: "Edited activity", notes: "My full notes" }] },
    { day: 2, items: [{ title: "Hidden second day", notes: "Long story ".repeat(300) }] },
  ],
  packing: ["Raincoat"],
  expenses: [{ amount: 23.5, category: "food", note: "Lunch", spent_on: "2026-11-01" }],
};
describe("complete PDF document", () => {
  it("includes the selected persona and child ages in the downloaded guide", async () => {
    const { definition } = await buildTripPdf({
      ...trip,
      brief: { ...trip.brief, travelers: 4, persona: "family", childrenAges: [3, 9] },
    });
    const text = JSON.stringify(definition);
    expect(text).toContain("Family planning");
    expect(text).toContain("Children's ages at travel: 3, 9");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    hotelEndpoint.mockReturnValue(null);
  });
  it("omits fictional hotel comparisons from exports when the hotel provider is connected", async () => {
    hotelEndpoint.mockReturnValue("https://test.supabase.co/functions/v1/search-hotels");
    const { definition } = await buildTripPdf(trip);
    const text = JSON.stringify(definition);
    expect(text).not.toContain("Hotel comparison · FICTIONAL PROPERTIES");
    expect(text).toContain("Search hotels for these dates and travelers");
    expect(text).toContain("Complete history story including 1838.");
  });
  it("exports every day, edits, full notes, stories, sources, tickets, restaurants and budget provenance", async () => {
    const { definition, missingPhotos } = await buildTripPdf(trip);
    const text = JSON.stringify(definition);
    for (const value of [
      "Edited activity",
      "Hidden second day",
      trip.days[1]!.items[0]!.notes!,
      "Complete history story including 1838.",
      "https://example.org/history",
      "20.00 EUR / adult",
      "Local café",
      "Raincoat",
      "23.50 EUR",
      "1500.00 EUR",
      "750.00 EUR",
      "Remaining:",
      "Only itinerary stops with known coordinates are marked",
    ])
      expect(text).toContain(value);
    expect(text).not.toContain("Flight comparison · DEMONSTRATION ONLY");
    expect(text).not.toContain("FICTIONAL PROPERTIES");
    expect(missingPhotos).toBe(1); // unique missing photo, not per repeated day
    expect(
      (definition.content as { pageBreak?: string }[]).filter((n) => n.pageBreak === "before"),
    ).toHaveLength(3);
  });
  it("keeps edited operating estimates and selected flight prices consistent", async () => {
    const { flightScope } = await import("@/lib/travel-workspace");
    const { definition } = await buildTripPdf({
      ...trip,
      journey: {
        ...trip.journey!,
        selectedFlight: {
          id: "quote",
          label: "My quote",
          evidence: "entered",
          amount: 420,
          scope: flightScope(trip.brief, "Berlin"),
        },
        estimates: { food: 100, activities: 100, transport: 100, shopping: 100 },
      },
    });
    const text = JSON.stringify(definition);
    expect(text).toContain("420.00 EUR");
    expect(text).toContain("entered quote");
    expect(text).toContain(
      "Daily food, activities, local transport & shopping estimate: 200.00 EUR",
    );
  });
  it("still exports itinerary when the place directory is unavailable", async () => {
    const { loadCityGuide } = await import("@/lib/city-guides");
    vi.mocked(loadCityGuide).mockRejectedValueOnce(new Error("offline"));
    const { definition, missingPhotos } = await buildTripPdf({ ...trip, journey: null });
    expect(JSON.stringify(definition)).toContain("Hidden second day");
    expect(JSON.stringify(definition)).toContain(
      "Destination photos, place stories and stop references are unavailable",
    );
    expect(missingPhotos).toBe(0);
  });
});

it("embeds a street map for every day, before the itinerary, even when days have not been opened", async () => {
  const { definition, missingMaps } = await buildTripPdf(trip);
  const text = JSON.stringify(definition);
  expect(missingMaps).toBe(0);
  expect(text.match(/<svg /g)?.length).toBe(2);
  expect(text.indexOf("Day 1 map")).toBeLessThan(text.indexOf("Edited activity"));
  expect(text).toContain("OpenStreetMap contributors");
});
it("retains visible fallback diagrams and reports missing street maps", async () => {
  const { streetMapWays } = await import("@/lib/pdf-street-map");
  vi.mocked(streetMapWays).mockRejectedValueOnce(new Error("offline"));
  const { definition, missingMaps } = await buildTripPdf(trip);
  expect(missingMaps).toBe(2);
  expect(JSON.stringify(definition)).toContain("Street map unavailable at export time");
  expect(JSON.stringify(definition)).toContain("Geographic stop overview");
});

it("exports requested rooms and carries them to the external hotel search", async () => {
  const { definition } = await buildTripPdf({
    ...trip,
    journey: { ...trip.journey!, hotelRooms: 2 },
  });
  const text = JSON.stringify(definition);
  expect(text).toContain("Rooms requested: 2");
  expect(text).toContain("no_rooms=2");
});
it("exports the suggested budget range and flight allowance as estimates", async () => {
  const { suggestBudget } = await import("@/lib/budget-suggestion");
  const suggestion = suggestBudget({ ...trip.brief, departure: "Berlin" });
  const { definition } = await buildTripPdf({
    ...trip,
    brief: { ...trip.brief, budget: suggestion.amount },
    journey: { ...trip.journey!, flightBudget: suggestion.flights, budgetSuggestion: suggestion },
  });
  expect(JSON.stringify(definition)).toContain("Suggested starting budget · planning estimate");
  expect(JSON.stringify(definition)).toContain("Not live prices or a surveyed average");
});
