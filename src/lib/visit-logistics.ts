import type { VisualPlace } from "./city-guides";
export type Admission = {
  price?: number;
  checkedAt?: string;
  label: string;
  note: string;
  url: string;
  closedDay?: number;
};
const tickets: Record<string, Admission> = {
  "Oceanário de Lisboa": {
    label: "Paid · age and time-dependent tickets",
    note: "Buy through the official aquarium ticket link. Exact ages and the visit time determine the full family total; a 0–3 planning range crosses the free/paid age boundary. Check before booking.",
    url: "https://oceanario.pt/en/plan-your-visit/",
    checkedAt: "24 Oct 2026",
  },
  "Pavilhão do Conhecimento": {
    label: "Paid · science centre",
    note: "Use the official visit page for tickets, age conditions and the dated opening calendar. Some days are closed; do not assume an exhibition or child fare is available.",
    url: "https://pavconhecimento.pt/en/visit-us/general-information",
    checkedAt: "24 Oct 2026",
  },
  "Jardim da Estrela": {
    price: 0,
    label: "Public garden visit",
    note: "A public-garden/playground visit; food and separately organized events are extra. Check access before visiting.",
    url: "https://www.visitlisboa.com/en/places/jardim-da-estrela",
    checkedAt: "24 Oct 2026",
  },
  "Jardim Parque das Nações": {
    price: 0,
    label: "Public riverside garden walk",
    note: "A walk in the public gardens, not a ticket to nearby attractions. Closures, meals and transport are separate.",
    url: "https://www.visitlisboa.com/en/places/jardim-parque-das-nacoes",
    checkedAt: "24 Oct 2026",
  },
  "Alameda dos Oceanos": {
    price: 0,
    label: "Public promenade",
    note: "Public-space walking and art viewing; food, transport and paid nearby attractions are separate.",
    url: "https://www.lisboa.pt/pontos-de-interesse/detalhe/alameda-dos-oceanos",
    checkedAt: "24 Oct 2026",
  },
  "Praça do Comércio": {
    price: 0,
    label: "Public square visit",
    note: "Self-guided visit to the public square. The arch viewpoint, museums and tours are not included.",
    url: "https://www.visitlisboa.com/pt-pt/locais/praca-do-comercio-terreiro-do-paco",
    checkedAt: "24 Oct 2026",
  },

  "São Jorge Castle": {
    price: 17,
    label: "Paid admission",
    note: "Standard adult ticket. Buy through the official castle page or its box office; BOL is its authorized online platform.",
    url: "https://castelodesaojorge.pt/como-visitar/escolher-o-bilhete/",
  },
  "Lisbon Cathedral": {
    price: 7,
    label: "Paid tourist visit",
    note: "Standard adult visit. Access rules changed in May 2026; check the current visit calendar and free prayer areas.",
    url: "https://www.sedelisboa.pt/normas-de-visita/",
  },
  "Jerónimos Monastery": {
    price: 18,
    label: "Paid monument visit",
    note: "Standard adult admission. Closed Mondays; check the official calendar and ticket link before planning an interior visit.",
    url: "https://www.museusemonumentos.pt/en/museus-e-monumentos/mosteiro-dos-jeronimos-e-capela-de-sao-jeronimo",
    closedDay: 1,
  },
  "Belém Tower": {
    label: "Opening status needs checking",
    note: "Published adult tariff is €15. Opening and restoration status is not verified; do not assume interior tickets are available.",
    url: "https://www.museusemonumentos.pt/en/pagina/tickets",
  },
  "Sintra National Palace": {
    price: 13,
    label: "Paid · Essential visit",
    note: "Standard adult Essential ticket; check the official visit page to buy and select the correct date.",
    url: "https://www.parquesdesintra.pt/en/parks-monuments/national-palace-of-sintra/essential-visit/",
  },
  "Pena Palace": {
    price: 20,
    label: "Paid · Essential palace visit",
    note: "Standard adult Essential ticket. A specific palace entry time is required. The €12 park-only ticket does not include the palace interior. Transfers cost extra.",
    url: "https://www.parquesdesintra.pt/en/parks-monuments/park-and-national-palace-of-pena",
  },
  "Carmo Convent": {
    price: 7,
    label: "Paid museum visit",
    note: "Standard adult ticket. Buy at museum reception (cash EUR, cards or MB Way). Closed Sundays; check other closure dates.",
    url: "https://www.museuarqueologicodocarmo.arqueologos.pt/info.html",
    closedDay: 0,
  },
  "Santa Justa Lift": {
    label: "Ride ticket & service status unverified",
    note: "Check CARRIS for the current fare and lift service before travelling. A view from the street does not include a lift ride.",
    url: "https://www.carris.pt/en/",
  },
  Alfama: {
    price: 0,
    label: "No neighborhood entry ticket",
    note: "Walking public streets has no attraction admission charge; tours, museums and food cost extra.",
    url: "https://www.visitlisboa.com/en/places/alfama",
  },
  Chiado: {
    price: 0,
    label: "No neighborhood entry ticket",
    note: "Public street exploration; paid attractions, tours and purchases are separate.",
    url: "https://www.visitlisboa.com/en/places/chiado",
  },
  "Time Out Market Lisboa": {
    price: 0,
    label: "No entry ticket to browse",
    note: "Food, drinks and events cost extra. Check individual event conditions.",
    url: "https://www.timeout.com/time-out-market-lisboa",
  },
};
export function admissionFor(name: string): Admission | undefined {
  return tickets[name];
}
export function distanceKm(
  a: Pick<VisualPlace, "lat" | "lon">,
  b: Pick<VisualPlace, "lat" | "lon">,
) {
  const rad = Math.PI / 180;
  const dlat = (b.lat - a.lat) * rad,
    dlon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function routeLegs(places: VisualPlace[]) {
  return places.slice(1).map((to, index) => {
    const from = places[index]!;
    const km = distanceKm(from, to);
    return {
      from,
      to,
      km,
      walkingMinutes: Math.max(1, Math.ceil(((km * 1.3) / 4) * 60)),
      url:
        "https://www.google.com/maps/dir/?" +
        new URLSearchParams({
          api: "1",
          origin: `${from.lat},${from.lon}`,
          destination: `${to.lat},${to.lon}`,
          travelmode: km < 2 ? "walking" : "transit",
        }),
    };
  });
}

export function admissionEstimate(places: VisualPlace[], travelers: number) {
  const known = places.map((place) => admissionFor(place.name));
  return {
    total:
      Math.round(known.reduce((sum, item) => sum + (item?.price ?? 0), 0) * travelers * 100) / 100,
    unknown: known.filter((item) => item?.price === undefined).length,
  };
}
