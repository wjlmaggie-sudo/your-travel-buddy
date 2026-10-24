import type { VisualPlace } from "./city-guides";
export type AttractionSuggestion = {
  label: string;
  detail: string;
  place: VisualPlace | null;
  search: string;
};
export function balancedAttractionSuggestions(
  places: VisualPlace[],
  family: boolean,
  ageBands: string[] = [],
): AttractionSuggestion[] {
  const unique = [...new Map(places.map((p) => [p.name.toLowerCase(), p])).values()],
    used = new Set<string>();
  const categories = family
    ? [
        {
          label: "For children",
          detail: "Play, animals or hands-on discovery, matched to your children’s ages.",
          pattern: ageBands.includes("0-3")
            ? /playground|park|garden|jardim/i
            : ageBands.includes("4-6")
              ? /aquarium|zoo|oceanario/i
              : /aquarium|science|interactive|playground|zoo|children|oceanario|conhecimento/i,
          search: "family activities science aquarium playground",
        },
        {
          label: "For grown-ups",
          detail: "A short culture, history or food stop with time for the adults too.",
          pattern:
            /museum|cathedral|castle|historic|history|heritage|art|market|neighbou?rhood|monastery|convent|alfama|chiado/i,
          search: "history art local culture",
        },
        {
          label: "Together",
          detail: "An easy outdoor stop, with room for a break and shared discovery.",
          pattern: /park|garden|square|promenade|waterfront|jardim|praca|alameda/i,
          search: "park garden waterfront",
        },
      ]
    : [
        {
          label: "Culture & stories",
          detail: "Get to know the city through its history and culture.",
          pattern: /museum|cathedral|castle|historic|history|heritage|art/i,
          search: "museums historic attractions",
        },
        {
          label: "Outside & unhurried",
          detail: "Make time for a park, a view or a walk by the water.",
          pattern: /park|garden|square|promenade|waterfront|river|view|jardim|praca|alameda/i,
          search: "parks viewpoints waterfront",
        },
        {
          label: "Local discovery",
          detail: "Try a neighborhood, market or hands-on experience.",
          pattern: /market|neighbou?rhood|aquarium|science|interactive/i,
          search: "local markets experiences",
        },
      ];
  return categories.map((category) => {
    const place =
      unique.find(
        (p) =>
          !used.has(p.name) &&
          category.pattern.test(
            `${p.name} ${p.kind ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          ),
      ) ?? undefined;
    if (place) used.add(place.name);
    return {
      label: category.label,
      detail: category.detail,
      place: place ?? null,
      search: category.search,
    };
  });
}
