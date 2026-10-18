import { streetMapWays, streetMapSvg } from "./pdf-street-map";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { dayGuide, loadCityGuide, type VisualPlace } from "./city-guides";
import { curatedStory, fetchPlaceStory, type PlaceStory } from "./place-stories";
import { fetchPlacePhoto } from "./place-photos";
import { admissionFor, routeLegs } from "./visit-logistics";
import { budgetAllocation, dailyBudgets, endDate } from "./planning";
import { connectedBudget, demoFlights, demoHotels } from "./travel-workspace";
import { bookingSearch, stayCost, type StayBrief, type StayChoice } from "./stay-planning";
import { flightSearch, journeyBudget, type Journey } from "./journey-planning";

export type PdfTrip = {
  brief: StayBrief;
  summary?: string | undefined;
  interest?: string;
  journey?: Journey | null | undefined;
  stay?: StayChoice | null | undefined;
  days: {
    day: number;
    items: {
      time?: string | null;
      title: string;
      location?: string | null;
      notes?: string | null;
    }[];
  }[];
  packing?: string[];
  expenses?: { amount: number; category: string; note: string | null; spent_on: string }[];
};
type PlaceMedia = {
  story: PlaceStory | null;
  photo: VisualPlace["image"] | null;
  data: string | null;
};
const safeLink = (url: string) => (/^https:\/\//i.test(url) ? url : undefined);
const link = (text: string, url: string): Content => ({
  text,
  link: safeLink(url),
  color: "#17685d",
  fontSize: 9,
  margin: [0, 2, 0, 6],
});
const heading = (text: string): Content => ({ text, style: "heading" });
// Omit bracketed IPA pronunciation guides that the bundled reading font cannot render.
const readable = (text: string) => text.replace(/\[[^\]]*[ˈˌɐɨɯəɛɔʃʒθðʊɑʁʎɲ][^\]]*\]/gu, "");
const paragraph = (text: string): Content => ({
  text: readable(text) || "-",
  margin: [0, 0, 0, 7],
});
const keyFor = (p: VisualPlace) => `${p.name}:${p.lat}:${p.lon}`;

/** Embed bytes, not remote URLs: downloaded photos remain visible offline. */
export async function pdfImage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let objectUrl: string | undefined;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Geographic overview independent of the on-screen map/hidden panel. No tile API/key required. */
export function routeDiagram(places: VisualPlace[]): Content {
  const xs = places.map((p) => p.lon * Math.cos(((places[0]?.lat ?? 0) * Math.PI) / 180));
  const ys = places.map((p) => p.lat);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 0.002),
    spanY = Math.max(maxY - minY, 0.002);
  const scale = Math.min(430 / spanX, 130 / spanY);
  const points = places.map((_, i) => ({
    x: 40 + (xs[i]! - minX) * scale,
    y: 160 - (ys[i]! - minY) * scale,
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="499" height="190"><rect width="499" height="190" fill="#eef5f3"/>${points
    .slice(1)
    .map(
      (point, i) =>
        `<line x1="${points[i]!.x}" y1="${points[i]!.y}" x2="${point.x}" y2="${point.y}" stroke="#17685d" stroke-width="2"/>`,
    )
    .join(
      "",
    )}${points.map((point, i) => `<circle cx="${point.x}" cy="${point.y}" r="11" fill="#17685d"/><text x="${point.x}" y="${point.y + 4}" text-anchor="middle" font-family="Roboto" font-size="11" fill="white">${i + 1}</text>`).join("")}</svg>`;
  // Labels are normal PDF text (place names are never interpolated into markup).
  return {
    stack: [
      { svg, width: 499 },
      {
        text: "N ↑ · Geographic stop overview; lines are not road routes.",
        fontSize: 8,
        color: "#52655f",
        margin: [0, 4, 0, 6],
      },
      ...places.map((p, i) =>
        link(
          `${i + 1}. ${p.name} (${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})`,
          `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
        ),
      ),
    ],
  };
}

export async function buildTripPdf(
  trip: PdfTrip,
  progress: (message: string) => void = () => {},
): Promise<{ definition: TDocumentDefinitions; missingPhotos: number; missingMaps: number }> {
  const { brief: b, journey, stay } = trip;
  const money = (n: number) => `${n.toFixed(2)} ${b.currency}`;
  progress("Loading all days and stories…");
  const directory = await loadCityGuide(b.destination).catch(() => null);
  const guides = Array.from({ length: b.days }, (_, i) =>
    directory
      ? dayGuide(directory, b.destination, i + 1, b.style)
      : { places: [], restaurants: [] },
  );
  const mapKey = (places: VisualPlace[]) => places.map(keyFor).join("|");
  const mapSets = [
    ...new Map(
      guides.filter((g) => g.places.length).map((g) => [mapKey(g.places), g.places]),
    ).entries(),
  ];
  const maps = new Map<string, string | null>();
  let mapCursor = 0;
  const mapTask = Promise.all(
    Array.from({ length: Math.min(2, mapSets.length) }, async () => {
      while (mapCursor < mapSets.length) {
        const [key, places] = mapSets[mapCursor++]!;
        const svg = await streetMapWays(places)
          .then((ways) => streetMapSvg(places, ways))
          .catch(() => null);
        maps.set(key, svg);
      }
    }),
  );
  const unique = [...new Map(guides.flatMap((g) => g.places).map((p) => [keyFor(p), p])).values()];
  const media = new Map<string, PlaceMedia>();
  let cursor = 0,
    completed = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, unique.length) }, async () => {
      while (cursor < unique.length) {
        const place = unique[cursor++]!;
        const [story, photo] = await Promise.all([
          curatedStory(place.name) ?? fetchPlaceStory(place).catch(() => null),
          place.image ?? fetchPlacePhoto(place, AbortSignal.timeout(12000)).catch(() => null),
        ]);
        const data = photo ? await pdfImage(photo.url) : null;
        media.set(keyFor(place), { story, photo, data });
        progress(`Preparing photos and stories ${++completed}/${unique.length}…`);
      }
    }),
  );
  progress("Embedding daily street maps…");
  await mapTask;
  const content: Content[] = [
    {
      text: "TRAVEL BUDDY / YOUR TRAVEL GUIDE",
      color: "#17685d",
      fontSize: 10,
      characterSpacing: 2,
    },
    { text: b.destination, fontSize: 34, bold: true, margin: [0, 14, 0, 8] },
    paragraph(
      `${b.start} to ${endDate(b.start, b.days)} · ${b.days} days · ${b.travelers} travelers · ${b.style}`,
    ),
    paragraph(trip.interest ?? ""),
    paragraph(trip.summary ?? "Your editable travel itinerary and destination reference guide."),
    {
      text: "Planning estimates, not bookings. Free template suggestions are not live AI offers. Demo flight/hotel names, schedules, ratings and prices are fictional. Entered quotes are not independently verified. Check current tickets, opening hours, fares and availability before travelling.",
      style: "notice",
    },
    heading("Budget overview"),
    paragraph(
      `Total group budget: ${money(b.budget)} · Per person: ${money(b.budget / b.travelers)}`,
    ),
  ];
  const connected = journey ? connectedBudget(b, journey, stay) : null;
  const parts = journey
    ? journeyBudget(b, journey, stay).parts
    : budgetAllocation(b.budget, b.style);
  content.push({
    table: {
      widths: ["*", 120],
      body: [
        ["Allocation / estimate", "Group total"],
        ...parts.map((p) => [p.label, money(p.amount)]),
      ],
    },
    layout: "lightHorizontalLines",
    margin: [0, 5, 0, 12],
  });
  if (connected)
    content.push(
      paragraph(
        `Planned total: ${money(connected.planned)} · Remaining: ${money(connected.remaining)}${connected.remaining < 0 ? " · OVER BUDGET" : ""}`,
      ),
    );
  content.push(heading("Flights & accommodation"));
  if (journey && journey.flightsRequired !== false) {
    content.push(
      paragraph(
        `Departure: ${journey.departure} · Flight cost / allowance: ${money(connected!.flight)} · ${connected!.flightChoice ? `${connected!.flightChoice.label} (${connected!.flightChoice.evidence === "demo" ? "DEMONSTRATION" : "entered quote"})` : "Unselected group return-flight allowance"}`,
      ),
      link(
        "Search current return flights (external search, not a quote)",
        flightSearch(b, journey.departure),
      ),
    );
    content.push(heading("Flight comparison · DEMONSTRATION ONLY"));
    demoFlights(b, journey).forEach((f) =>
      content.push(
        paragraph(
          `${f.label}: ${f.airline} · ${f.dates} · outbound ${f.depart} to ${f.arrive}, ${f.duration}, ${f.route} · inbound ${f.inbound} · ${money(f.amount)} group return total (fictional)`,
        ),
      ),
    );
  } else content.push(paragraph("No flights selected or included in this plan."));
  if (stay)
    content.push(
      paragraph(
        `Selected stay: ${stay.name} (${stay.evidence === "demo" ? "DEMONSTRATION ONLY" : "entered quote, unverified"}) · ${stay.type} · ${stay.rooms} rooms · ${money(stay.amount)} / ${stay.unit} + ${money(stay.extras)} extras · ${stayCost(stay, b) === null ? "Quote does not match this trip; allowance used instead" : `${money(stayCost(stay, b)!)} whole group / stay`}`,
      ),
    );
  else content.push(paragraph("No hotel quote selected. Accommodation allocation is an estimate."));
  if (b.days > 1) {
    content.push(
      link(
        "Search hotels for these dates and travelers",
        bookingSearch(
          b,
          stay?.rooms ?? Math.ceil(b.travelers / 2),
          stay?.evidence === "entered" ? stay.name : undefined,
        ),
      ),
    );
    if (journey) {
      content.push(heading("Hotel comparison · FICTIONAL PROPERTIES"));
      demoHotels(b, journey).forEach((h) =>
        content.push(
          paragraph(
            `${h.tag}: ${h.name} · ${h.location} · ${h.rating} · ${money(h.amount / (b.days - 1))} / night · ${money(h.amount)} whole group / ${b.days - 1} nights (simulated)`,
          ),
        ),
      );
    }
  }
  const budgets = dailyBudgets(b.budget, b.days, b.travelers, b.start);
  const operating = connected
    ? dailyBudgets(connected.estimated, b.days, b.travelers, b.start)
    : null;
  guides.forEach((guide, index) => {
    const day = index + 1;
    content.push(
      { text: `Day ${day} / ${budgets[index]!.date}`, style: "day", pageBreak: "before" },
      paragraph(
        `Group daily share of total budget: ${money(budgets[index]!.amount)} · Per person: ${money(budgets[index]!.perPerson)}${operating ? `\nDaily food, activities, local transport & shopping estimate: ${money(operating[index]!.amount)} (flights/hotel separate)` : ""}`,
      ),
    );
    if (guide.places.length) {
      const svg = maps.get(mapKey(guide.places));
      content.push({
        stack: [
          heading(`Day ${day} map · suggested stops`),
          ...(svg
            ? [{ svg, width: 499 } as Content]
            : [
                paragraph(
                  "Street map unavailable at export time. Geographic stop diagram below; use the links for an online map.",
                ),
                routeDiagram(guide.places),
              ]),
          ...(svg
            ? [
                link(
                  "Map data © OpenStreetMap contributors · ODbL",
                  "https://www.openstreetmap.org/copyright",
                ),
                paragraph(
                  "Numbered pins match the suggested stops below. Dotted lines show visit order, not walking or driving routes. These reference stops are separate from your edited itinerary.",
                ),
              ]
            : []),
        ],
      });
      if (svg)
        guide.places.forEach((p, i) =>
          content.push(
            link(
              `${i + 1}. ${p.name}`,
              `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
            ),
          ),
        );
    }
    if (!guide.places.length)
      content.push(
        heading(`Day ${day} map`),
        paragraph(
          "Street map unavailable: no mapped stop coordinates could be loaded for this day.",
        ),
        link(
          "Open destination map",
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.destination)}`,
        ),
      );
    content.push(heading("Your itinerary"));
    const items = trip.days.find((d) => d.day === day)?.items ?? [];
    if (!items.length) content.push(paragraph("No activities added for this day."));
    items.forEach((item) =>
      content.push({
        stack: [
          { text: `${item.time ?? ""}  ${item.title}`, bold: true, margin: [0, 6, 0, 3] },
          paragraph(item.location ?? ""),
          paragraph(item.notes ?? ""),
        ],
      }),
    );
    content.push(
      heading("Destination references · suggested stops"),
      paragraph(
        "These reference stops and restaurants are suggestions, separate from your edited itinerary above. Ticket estimates are EUR adult prices, not an additional automatic budget charge.",
      ),
    );
    if (!guide.places.length)
      content.push(
        paragraph(
          "Destination photos, place stories and stop references are unavailable. Your itinerary is included in full.",
        ),
      );

    guide.places.forEach((place, i) => {
      const m = media.get(keyFor(place))!;
      content.push({
        stack: [
          heading(`${i + 1}. ${place.name}`),
          ...(m.data
            ? [
                {
                  image: `photo-${unique.findIndex((p) => keyFor(p) === keyFor(place))}`,
                  fit: [499, 230] as [number, number],
                  margin: [0, 4, 0, 5] as [number, number, number, number],
                },
              ]
            : [paragraph("Photo unavailable at export time.")]),
          ...(m.photo
            ? [
                link(
                  `Photo: ${m.photo.credit} · ${m.photo.license}${m.data ? "" : " · open source to view"}`,
                  m.photo.source,
                ),
              ]
            : []),
        ],
      });
      content.push(
        paragraph(place.description),
        paragraph(
          `Opening hours: ${place.openingHours ?? "Unverified; check official visitor information."}`,
        ),
      );
      if (m.story)
        content.push(
          heading("The story behind this place"),
          paragraph(m.story.text),
          link(m.story.credit, m.story.source),
        );
      else
        content.push(
          paragraph(
            "Further historical story unavailable. The description and source are provided above/below.",
          ),
        );
      content.push(link("Place information / source", place.source));
      const admission = admissionFor(place.name);
      content.push(
        paragraph(
          admission
            ? `${admission.label}${admission.price !== undefined ? ` · ${admission.price.toFixed(2)} EUR / adult · ${(admission.price * b.travelers).toFixed(2)} EUR / group` : " · current price unverified"}. ${admission.note}`
            : "Admission, ticket requirements and current opening status are unverified; check the venue before visiting.",
        ),
      );
      if (admission) content.push(link("Official ticket / visitor information", admission.url));
    });
    if (guide.places.length > 1) {
      content.push(heading("Getting between suggested stops"));
      routeLegs(guide.places).forEach((leg) =>
        content.push(
          paragraph(
            `${leg.from.name} to ${leg.to.name}: ${leg.km.toFixed(1)} km straight-line distance; approx. ${leg.walkingMinutes} min walking estimate. This is not a measured road route. Check transit schedules and fares.`,
          ),
          link("Open walking / public transport directions", leg.url),
        ),
      );
    }
    if (guide.restaurants.length) content.push(heading("Restaurants & local food"));
    guide.restaurants.forEach((r) =>
      content.push(
        paragraph(
          `${r.name} · ${r.kind}\n${r.address}\n${r.price ?? "Prices and availability unverified; check current menu."}`,
        ),
        link("Restaurant information / menu", r.source),
      ),
    );
  });
  content.push(
    { text: "Your trip checklist", style: "day", pageBreak: "before" },
    heading("Packing list"),
    paragraph(trip.packing?.length ? trip.packing.join("\n") : "No packing items selected."),
  );
  if (trip.expenses) {
    content.push(
      heading("Recorded expenses"),
      paragraph(
        `Actual recorded spending: ${money(trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0))} (separate from planning estimates)`,
      ),
    );
    trip.expenses.forEach((e) =>
      content.push(
        paragraph(`${e.spent_on} · ${e.category} · ${money(Number(e.amount))} · ${e.note ?? ""}`),
      ),
    );
  }
  content.push(
    heading("Shopping, weather & currency"),
    link(
      `Find local shops in ${b.destination}`,
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`shops in ${b.destination}`)}`,
    ),
    paragraph(
      "Product stock and prices are not verified. Currency conversions and weather are time-sensitive tools in the app; this PDF does not claim live exchange rates or forecasts. All trip budget amounts use the currency printed beside them; EUR ticket references have not been converted.",
    ),
    paragraph(
      `Exported ${new Date().toISOString().slice(0, 10)}. Photos are embedded where the source permits downloading. Source links require internet access.`,
    ),
  );
  const images: Record<string, string> = {};
  unique.forEach((p, i) => {
    const data = media.get(keyFor(p))?.data;
    if (data) images[`photo-${i}`] = data;
  });
  return {
    missingMaps: guides.filter((g) => !g.places.length || !maps.get(mapKey(g.places))).length,
    missingPhotos: unique.filter((p) => !media.get(keyFor(p))?.data).length,
    definition: {
      pageSize: "A4",
      pageMargins: [48, 48, 48, 48],
      content,
      images,
      info: { title: `${b.destination} - Travel Buddy plan`, author: "Travel Buddy" },
      defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.25, color: "#243d37" },
      styles: {
        heading: { fontSize: 15, bold: true, color: "#17685d", margin: [0, 15, 0, 7] },
        day: { fontSize: 25, bold: true, color: "#17685d", margin: [0, 0, 0, 14] },
        notice: { fontSize: 9, color: "#6b5023", fillColor: "#fff4dc", margin: [0, 10, 0, 12] },
      },
      footer: (page, count) => ({
        text: `TRAVEL BUDDY  ·  ${page} / ${count}`,
        alignment: "center",
        fontSize: 8,
        color: "#61746e",
        margin: [0, 16, 0, 0],
      }),
    },
  };
}

export async function downloadTripPdf(trip: PdfTrip, progress?: (message: string) => void) {
  const [{ default: pdfMake }, { default: fonts }, result] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
    buildTripPdf(trip, progress),
  ]);

  progress?.("Creating your PDF…");
  const blob = await new Promise<Blob>((resolve) =>
    pdfMake
      .createPdf(
        result.definition,
        undefined,
        undefined,
        fonts as unknown as Record<string, string>,
      )
      .getBlob(resolve),
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${trip.brief.destination.replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 80) || "trip"}-travel-plan.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  return {
    missingPhotos: result.missingPhotos,
    missingMaps: result.missingMaps,
    url,
    filename: anchor.download,
  };
}
