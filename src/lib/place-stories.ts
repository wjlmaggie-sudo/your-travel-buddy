import type { VisualPlace } from "./city-guides";
export type PlaceStory = { text: string; source: string; credit: string };
const curated: Record<string, PlaceStory> = {
  "São Jorge Castle": {
    text: "Before it became a royal landmark, this hilltop fortification protected the Moorish citadel in the 11th century. After the conquest of Lisbon in 1147, the surrounding palace complex developed into a home for Portugal’s royal court. The surviving walls and archaeological remains let you read several layers of the city’s past in one visit.",
    source: "https://castelodesaojorge.pt/wp-content/uploads/2024/01/Press-kit_Eng_2024.pdf",
    credit: "Castelo de São Jorge · official history",
  },
  "Pena Palace": {
    text: "Pena’s romantic silhouette grew around an older monastery. Ferdinand II bought the former monastery in 1838 and transformed the site into a royal retreat. The palace’s mix of architectural references and its landscaped mountain setting make it a striking expression of 19th-century Romanticism.",
    source:
      "https://www.parquesdesintra.pt/pt/parques-monumentos/parque-e-palacio-nacional-da-pena/historia/",
    credit: "Parques de Sintra · official history",
  },
  "Jerónimos Monastery": {
    text: "Work on this monastery began in the early 16th century under King Manuel I, close to the Tagus waterfront. Its richly carved Manueline architecture became one of the defining expressions of that period. The long construction history is a reminder that the landmark was shaped by generations of craftspeople rather than a single moment.",
    source:
      "https://www.patrimoniocultural.gov.pt/pat_mun/mosteiros-dos-jeronimos-e-torre-de-belem-em-lisboa/",
    credit: "Património Cultural · official history",
  },
};
export function curatedStory(name: string) {
  return curated[name] ?? null;
}
export async function fetchPlaceStory(
  place: VisualPlace,
  signal?: AbortSignal,
  request: typeof fetch = fetch,
): Promise<PlaceStory | null> {
  const source = new URL(place.source);
  if (source.hostname !== "en.wikipedia.org" || !source.pathname.startsWith("/wiki/")) return null;
  const title = decodeURIComponent(source.pathname.slice(6));
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 8000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await request(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { signal: controller.signal },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.type === "disambiguation" || typeof data.extract !== "string") return null;
    const text = data.extract.trim().slice(0, 1800);
    if (!text) return null;
    return { text, source: place.source, credit: "Wikipedia · introductory background · CC BY-SA" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
