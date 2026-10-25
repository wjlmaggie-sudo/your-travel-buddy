import type { VisualPlace } from "./city-guides";
import lisbon from "./lisbon-places.json";
import {
  activityAgeBands,
  childCount,
  type PersonaDetails,
} from "../../supabase/functions/_shared/travel-persona";

const garden: VisualPlace = {
  name: "Jardim da Estrela",
  lat: 38.7147,
  lon: -9.1605,
  description:
    "A garden with playgrounds and ponds, listed by Lisbon tourism. A play-and-nature choice for younger children; supervise around water and check current access.",
  source: "https://www.visitlisboa.com/en/places/jardim-da-estrela",
  image: {
    url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Jardim_da_Estrela_01.jpg/960px-Jardim_da_Estrela_01.jpg",
    credit: "GualdimG",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Jardim_da_Estrela_01.jpg",
  },
};
const aquarium: VisualPlace = {
  name: "Oceanário de Lisboa",
  lat: 38.7635,
  lon: -9.0939,
  description:
    "Marine-life exhibits in Parque das Nações. Chosen for animal discovery rather than a monument tour. Timed, age-dependent paid admission; confirm the full family price.",
  source: "https://oceanario.pt/en/plan-your-visit/",
};
const science: VisualPlace = {
  name: "Pavilhão do Conhecimento",
  lat: 38.7624,
  lon: -9.09555,
  description:
    "Hands-on science exhibitions in Parque das Nações. Chosen for curious school-age children and teenagers. Confirm current exhibits, age requirements, tickets and opening dates.",
  source: "https://pavconhecimento.pt/en/visit-us/general-information",
};
const river: VisualPlace = {
  name: "Jardim Parque das Nações",
  lat: 38.764,
  lon: -9.0926,
  description:
    "Riverside gardens near the aquarium and science centre. Optional outdoor break in the same area; supervise children near water and choose only a manageable section.",
  source: "https://www.visitlisboa.com/en/places/jardim-parque-das-nacoes",
};
const square: VisualPlace = {
  name: "Praça do Comércio",
  lat: 38.7077,
  lon: -9.1365,
  description:
    "A public riverfront square for a self-guided history stop. Visiting the public square does not include paid arch viewpoints, tours or exhibitions.",
  source: "https://www.visitlisboa.com/pt-pt/locais/praca-do-comercio-terreiro-do-paco",
};
const alameda: VisualPlace = {
  name: "Alameda dos Oceanos",
  lat: 38.7641,
  lon: -9.0959,
  description:
    "A public promenade with water features and art in Parque das Nações. An optional short outdoor walk; not a promise that a particular route is step-free.",
  source: "https://www.lisboa.pt/pontos-de-interesse/detalhe/alameda-dos-oceanos",
};
const known = (name: string) => lisbon.find((p) => p.name === name)! as VisualPlace;
export const PERSONA_LISBON_PLACES = [garden, aquarium, science, river, square, alameda];

/** Named, sourced stop sets, selected by purpose. Never use another city's catalogue. */
export function curatedPersonaDay(
  destination: string,
  day: number,
  details: PersonaDetails & { start?: string | undefined; startDate?: string | undefined },
): VisualPlace[] | null {
  if (!details.persona || !/^(lisbon|lisboa)(,|$)/i.test(destination.trim())) return null;
  const bands = activityAgeBands(details);
  if (details.persona === "family") {
    const sets = !childCount(details)
      ? [[garden], [river, alameda], [square]]
      : bands.includes("0-3")
        ? [[garden], [aquarium, river], [science, alameda], [river], [square]]
        : bands.includes("4-6")
          ? [[aquarium, river], [garden], [science, alameda], [river], [square]]
          : [[science, alameda], [aquarium, river], [garden], [square], [river]];
    const selected = sets[(day - 1) % sets.length]!;
    const start = details.start ?? details.startDate;
    if (start && selected.some((p) => p.name === science.name)) {
      const date = new Date(`${start}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + day - 1);
      const iso = date.toISOString().slice(0, 10);
      // Published winter 2026 calendar; future years remain unverified.
      if (
        (iso >= "2026-09-07" && iso < "2027-01-01" && date.getUTCDay() === 1) ||
        ["2026-12-24", "2026-12-25", "2026-12-31", "2027-01-01"].includes(iso)
      )
        return [garden];
    }
    return selected;
  }
  // Budget days avoid the paid castle, palaces and lift ride; public areas are the activities.
  if (details.persona === "budget-travel") {
    const sets = [
      [known("Alfama"), square],
      [known("Chiado"), known("Time Out Market Lisboa")],
      [river, alameda],
      [garden],
      [square, known("Chiado")],
    ];
    return sets[(day - 1) % sets.length]!;
  }
  // One short outdoor stop per workday, not an out-of-town palace excursion.
  const sets = [
    [square],
    [known("Chiado")],
    [alameda],
    [garden],
    [known("Time Out Market Lisboa")],
  ];
  return sets[(day - 1) % sets.length]!;
}

export function personaReason(details: PersonaDetails) {
  if (details.persona === "family")
    return childCount(details)
      ? "Chosen for play, animals or hands-on learning, with a rest break and at most one optional nearby stop. Age ranges guide interests, not certified venue eligibility."
      : "Chosen for a relaxed shared visit; no children are assumed.";
  if (details.persona === "business")
    return "One optional short visit around editable work blocks. Confirm distance from your actual workplace; no meeting location is inferred.";
  return "Public-space and self-guided stops come first; entry to paid interiors, food, purchases and transport are separate.";
}

export function rankPersonaPlaces<
  T extends { name: string; description?: string | undefined; kind?: string | undefined },
>(places: T[], details: PersonaDetails): T[] {
  if (!details.persona) return places;
  const youngest = activityAgeBands(details);
  const terms =
    details.persona === "family" && childCount(details)
      ? youngest.includes("0-3")
        ? /playground|park|garden|aquarium/i
        : youngest.includes("4-6")
          ? /aquarium|zoo|playground|park|garden|science|interactive|children/i
          : /science|interactive|children|aquarium|zoo|park|garden/i
      : details.persona === "business"
        ? /square|promenade|market|garden|park/i
        : /park|garden|square|promenade|neighbou?rhood|market/i;
  return places.filter((p) => terms.test(`${p.kind ?? ""} ${p.description ?? ""} ${p.name}`));
}
