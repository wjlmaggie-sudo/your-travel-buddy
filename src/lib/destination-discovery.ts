export type DiscoveryNeeds = {
  days?: number | undefined;
  warm?: boolean;
  activity?: string;
  unsupported?: boolean;
};
export const ACTIVITY_PATTERNS = [
  ["hiking", /hike|hiking|trek|walking|mountain|nature|trail/i],
  ["beach", /beach|swim|sea(side)?|sunbath|relax/i],
  ["culture", /culture|history|museum|food|cooking|temple|art\b/i],
  ["family", /child|kid|family|aquarium|playground/i],
  ["surfing", /surf/i],
] as const;
export function understandDiscovery(message: string, previous: DiscoveryNeeds): DiscoveryNeeds {
  const text = message.toLowerCase();
  const count = text.match(/\b(\d{1,2})\s*(days?|nights?|weeks?)\b/);
  const words = text.match(/\b(one|two|three|four|five|six|seven|ten)\s*(days?|weeks?)\b/);
  const numbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    ten: 10,
  };
  const days = count
    ? Number(count[1]) * (count[2]!.startsWith("week") ? 7 : 1)
    : words
      ? numbers[words[1]!]! * (words[2]!.startsWith("week") ? 7 : 1)
      : /^\d{1,2}$/.test(text.trim())
        ? Number(text.trim())
        : /\b(a|one) week\b/.test(text)
          ? 7
          : /weekend/.test(text)
            ? 3
            : undefined;
  const activity = ACTIVITY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0];
  const warm = /not warm|no heat|cool weather|cold|snow|ski/i.test(text)
    ? false
    : /warm|sunny|sunshine|hot weather|sunbath/.test(text)
      ? true
      : undefined;
  const unsupported = /ski|snow|scuba|diving|safari|golf|tennis/i.test(text);
  return {
    ...previous,
    ...(unsupported
      ? { unsupported: true }
      : activity || warm !== undefined
        ? { unsupported: false }
        : {}),
    ...(days !== undefined ? { days: days >= 1 && days <= 30 ? days : undefined } : {}),
    ...(warm !== undefined ? { warm } : {}),
    ...(activity ? { activity } : {}),
  };
}
const destinations = [
  {
    destination: "Tenerife, Spain",
    tags: ["beach", "hiking", "family", "surfing"],
    warmMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minDays: 4,
    idea: "Coastal time, volcanic landscapes and marked walking trails.",
    caution: "Mild coastal climate is not guaranteed swimming weather; mountain conditions differ.",
    source: "https://www.hellocanaryislands.com/tenerife/",
  },
  {
    destination: "Funchal, Madeira, Portugal",
    tags: ["hiking", "nature", "culture"],
    warmMonths: [5, 6, 7, 8, 9, 10],
    minDays: 4,
    idea: "A Funchal base with gardens and optional levada walks.",
    caution: "Check trail opening, reservations, weather and ability before choosing a walk.",
    source: "https://visitmadeira.com/en/",
  },
  {
    destination: "Lisbon, Portugal",
    tags: ["culture", "family", "surfing"],
    warmMonths: [5, 6, 7, 8, 9],
    minDays: 2,
    idea: "Historic neighborhoods, local food and an optional Oceanário visit.",
    caution:
      "Winter is a city-break option, not a reliably hot beach escape. Surf trips need a coastal transfer.",
    source: "https://oceanario.pt/en/",
  },
];
export function discoverDestinations(needs: DiscoveryNeeds, start: string) {
  if (needs.unsupported || (needs.warm === false && !needs.activity)) return [];
  const month = Number(start.slice(5, 7));
  return destinations
    .filter(
      (d) =>
        (!needs.activity || d.tags.includes(needs.activity)) &&
        (!needs.warm || d.warmMonths.includes(month)),
    )
    .map((d) => ({
      ...d,
      score:
        (needs.days && needs.days >= d.minDays ? 2 : 0) +
        (needs.warm && d.warmMonths.includes(month) ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score);
}
export function discoveryInterest(activity?: string) {
  return activity === "beach" || activity === "surfing"
    ? "Beach escapes"
    : activity === "hiking"
      ? "Nature & adventure"
      : "Food & culture";
}
