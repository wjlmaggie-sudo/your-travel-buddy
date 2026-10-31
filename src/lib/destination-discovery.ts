import countries from "./discovery-countries.json";
export type DiscoveryNeeds = {
  days?: number | undefined;
  warm?: boolean;
  activity?: string | undefined;
  activities?: string[];
  unsupported?: boolean;
  departure?: string;
  start?: string;
  travelers?: number;
  adults?: number;
  childrenCount?: number;
  childrenAges?: number[];
  budget?: number;
  currency?: string;
  budgetPerPerson?: boolean;
  family?: boolean;
  region?: string | undefined;
  country?: string | undefined;
  excludedCountries?: string[];
};
export const ACTIVITY_PATTERNS = [
  ["hiking", /\b(hikes?|hiking|trekking|walks?|walking|mountains?|nature|trails?)\b/i],
  ["beach", /\b(beach(es)?|swim(ming)?|seaside|sunbathing|relax(ing)?)\b/i],
  ["culture", /\b(culture|history|museums?|food|cooking|temples?|art)\b/i],
  ["family", /\b(children|child|kids?|family|aquarium|playground)\b/i],
  ["surfing", /\bsurf(ing)?\b/i],
  ["skiing", /\b(ski|skiing|snowboarding)\b/i],
  ["diving", /\b(diving|scuba|snorkeling|snorkelling)\b/i],
  ["golf", /\bgolf\b/i],
  ["tennis", /\btennis\b/i],
] as const;
const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
};
function validDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function understandDiscovery(message: string, previous: DiscoveryNeeds): DiscoveryNeeds {
  const text = message
    .toLowerCase()
    .replace(
      /\b(twenty)[ -](one|two|three|four|five|six|seven|eight|nine)\b/g,
      (_, a: string, b: string) => String(numberWords[a]! + numberWords[b]!),
    )
    .replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty)\b/g,
      (word) => String(numberWords[word]),
    );
  const next: DiscoveryNeeds = { ...previous };
  const duration = text.match(/\b(\d{1,3})\s*(days?|nights?|weeks?)\b/);
  const days = duration
    ? Number(duration[1]) * (duration[2]!.startsWith("week") ? 7 : 1) +
      (duration[2]!.startsWith("night") ? 1 : 0)
    : /^\d{1,2}$/.test(text.trim())
      ? Number(text.trim())
      : /\ba week\b/.test(text)
        ? 7
        : /weekend/.test(text)
          ? 3
          : undefined;
  if (days !== undefined) next.days = days >= 1 && days <= 30 ? days : undefined;
  if (/not warm|no heat|cool weather|cold|snow|ski/.test(text)) next.warm = false;
  else if (/\b(warm|sunny|sunshine|hot|sunbathing)\b/.test(text)) next.warm = true;
  const positive = text.replace(/\b(no|not|without|avoid)\s+(\w+)(?:\s+or\s+\w+)?/g, "");
  const matched = ACTIVITY_PATTERNS.filter(([, pattern]) => pattern.test(positive)).map(
    ([tag]) => tag,
  );
  let activities = [...(previous.activities ?? (previous.activity ? [previous.activity] : []))];
  for (const [tag, pattern] of ACTIVITY_PATTERNS) {
    const negations = [...text.matchAll(/\b(?:no|not|without|avoid)\s+(\w+(?:\s+or\s+\w+)?)/g)].map(
      (m) => m[1]!,
    );
    if (negations.some((v) => pattern.test(v))) activities = activities.filter((v) => v !== tag);
  }
  if (/instead|rather than|change.*activit/.test(text) && matched.some((tag) => tag !== "family"))
    activities = [];
  next.activities = [...new Set([...activities, ...matched.filter((v) => v !== "family")])];
  next.activity = next.activities[0];
  if (matched.includes("family")) next.family = true;
  if (next.family && !next.activity) next.activity = "family";
  const unsupported = /\bsafari\b/.test(positive);
  if (unsupported) next.unsupported = true;
  else if (matched.length || next.warm !== previous.warm) next.unsupported = false;
  const adults = text.match(/\b(\d{1,2})\s*adults?\b/);
  const children = text.match(/\b(\d{1,2})\s*(?:children|kids?|child)\b/);
  const ages = text.match(
    /\b(?:aged?|ages?)\s*[:=]?\s*(\d{1,2}\b(?!\s*(?:days?|nights?|weeks?|adults?|people)\b)(?:\s*(?:,|and|&)\s*\d{1,2}\b(?!\s*(?:days?|nights?|weeks?|adults?|people)\b))*)/,
  );
  if (adults && Number(adults[1]) >= 1 && Number(adults[1]) <= 20) next.adults = Number(adults[1]);
  if (children && Number(children[1]) <= 19) {
    next.childrenCount = Number(children[1]);
    if (next.childrenAges?.length !== next.childrenCount) delete next.childrenAges;
    next.family = next.childrenCount > 0;
  }
  if (ages && /child|kid|family/.test(text + (next.family ? " family" : ""))) {
    const values = ages[1]!.match(/\d+/g)!.map(Number);
    if (values.every((age) => age >= 0 && age <= 17) && values.length <= 19) {
      next.childrenAges = values;
      next.childrenCount = values.length;
      next.family = true;
    }
  }
  const travelers =
    text.match(/\b(\d{1,2})\s*(?:people|travelers?|travellers?|persons?)\b/) ??
    text.match(/\b(?:we are|there are|group of)\s*(\d{1,2})\b/);
  if (travelers && Number(travelers[1]) >= 1 && Number(travelers[1]) <= 20)
    next.travelers = Number(travelers[1]);
  else if (/\b(alone|solo|just me)\b/.test(text)) {
    next.travelers = 1;
    next.adults = 1;
    next.childrenCount = 0;
    delete next.childrenAges;
    next.family = false;
  } else if (next.adults && next.adults + (next.childrenCount ?? 0) <= 20)
    next.travelers = next.adults + (next.childrenCount ?? 0);
  const budget =
    text.match(/([€$£])\s*([\d.,]+)/) ??
    text.match(
      /\b(?:budget(?: is| of)?|under|up to)\s*(?:eur|usd|gbp)?\s*([\d.,]+)\s*(eur|euros?|usd|dollars?|gbp|pounds?)?\b/,
    ) ??
    text.match(/\b([\d.,]+)\s*(eur|euros?|usd|dollars?|gbp|pounds?)\b/);
  if (budget) {
    const symbol = /^[€$£]$/.test(budget[1]!);
    const raw = (symbol ? budget[2]! : budget[1]!).replace(/[.,]+$/, "");
    const normalized = /^\d{1,3}(?:[.,]\d{3})+$/.test(raw)
      ? raw.replace(/[.,]/g, "")
      : /^\d+,\d{1,2}$/.test(raw)
        ? raw.replace(",", ".")
        : raw.replaceAll(",", "");
    const amount = Number(normalized);
    if (amount > 0 && amount <= 1000000) {
      next.budget = amount;
      const unit = symbol ? budget[1]! : (budget[2] ?? budget[0]);
      if (/€|eur/.test(unit)) next.currency = "EUR";
      if (/\$|usd|dollar/.test(unit)) next.currency = "USD";
      if (/£|gbp|pound/.test(unit)) next.currency = "GBP";
      next.budgetPerPerson = /per person|each/.test(text);
    }
  }
  const departure = message.match(
    /\b(?:from|departing(?: from)?|leaving)\s+([\p{L}][\p{L} .'-]{1,70}?)(?=\s+(?:to|for|with|on|in|and|budget|want|would|have|we|somewhere)\b|[,;.!]|$)/iu,
  );
  if (
    departure &&
    !/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+day|january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(
      departure[1]!.trim(),
    )
  )
    next.departure = departure[1]!.trim();
  const date = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (date && validDate(date[1]!)) next.start = date[1]!;
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const named = text.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/,
  );
  if (named) {
    const value = `${named[3]}-${String(months.indexOf(named[2]!) + 1).padStart(2, "0")}-${named[1]!.padStart(2, "0")}`;
    if (validDate(value)) next.start = value;
  }
  const regions = ["Europe", "Asia", "Africa", "Americas", "Oceania", "Antarctica"];
  if (/\b(anywhere|worldwide|any country|any region)\b/.test(text)) {
    delete next.region;
    delete next.country;
  }
  for (const region of regions) {
    if (
      new RegExp(
        `\\b(?:in|to|prefer|only|within)\\s+${region}\\b|\\b${region}\\s+only\\b`,
        "i",
      ).test(text)
    ) {
      next.region = region;
      delete next.country;
    }
  }
  for (const country of [...new Set(Object.values(countries).map((d) => d.name))]) {
    const escaped = country.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alias =
      country === "United Arab Emirates"
        ? "(?:united arab emirates|uae|dubai)"
        : country === "United States"
          ? "(?:united states|usa|u\\.s\\.)"
          : country === "United Kingdom"
            ? "(?:united kingdom|uk|britain)"
            : escaped;
    if (
      new RegExp(`\\b(?:not(?: in)?|no|avoid|except|outside|exclude)\\s+${alias}\\b`, "i").test(
        text,
      )
    ) {
      next.excludedCountries = [...new Set([...(next.excludedCountries ?? []), country])];
      if (next.country === country) delete next.country;
    } else if (
      new RegExp(`\\b(?:in|to|prefer|only|visit)\\s+${alias}\\b|\\b${alias}\\s+only\\b`, "i").test(
        text,
      )
    ) {
      next.country = country;
      delete next.region;
      next.excludedCountries = (next.excludedCountries ?? []).filter((c) => c !== country);
    }
  }
  return next;
}
export function discoveryMissing(needs: DiscoveryNeeds) {
  if (!needs.days)
    return "Roughly how many days do you have? Try ‘5 days’ or ‘one week’. I can plan up to 30 days.";
  if (needs.childrenCount && needs.childrenAges?.length !== needs.childrenCount)
    return `What are the ages of the ${needs.childrenCount} children? For example, ‘children aged 4 and 8’. I won't guess their ages.`;
  if (needs.childrenCount && !needs.travelers)
    return "How many adults are coming? I'll include the children in the total group size.";
  if (needs.childrenCount && needs.travelers && needs.travelers <= needs.childrenCount)
    return "Please include at least one adult. How many adults and children are traveling?";
  if (needs.budgetPerPerson && !needs.travelers)
    return "How many people are coming? I'll convert the per-person budget to your whole-group budget.";
  if (needs.warm === undefined && !needs.activity && !needs.family)
    return "What sounds good: warm weather, hiking, beaches, surfing, culture, or activities with children?";
  return null;
}
export function discoveryInterest(activity?: string) {
  return activity === "beach" || activity === "surfing"
    ? "Beach escapes"
    : ["hiking", "skiing", "diving", "golf", "tennis"].includes(activity ?? "")
      ? "Nature & adventure"
      : "Food & culture";
}

export type DiscoveryChoice = {
  destination: string;
  days: number;
  interest: string;
  persona?: "family";
  start?: string;
  departure?: string;
  travelers?: number;
  childrenAges?: number[];
  budget?: number;
  currency?: string;
};
export function discoveryChoice(needs: DiscoveryNeeds, destination: string): DiscoveryChoice {
  return {
    destination,
    days: needs.days!,
    interest: discoveryInterest(needs.activity),
    ...(needs.family || needs.activity === "family" ? { persona: "family" as const } : {}),
    ...(needs.start ? { start: needs.start } : {}),
    ...(needs.departure ? { departure: needs.departure } : {}),
    ...(needs.travelers ? { travelers: needs.travelers } : {}),
    ...(needs.childrenAges || needs.childrenCount === 0
      ? { childrenAges: needs.childrenAges ?? [] }
      : {}),
    ...(needs.budget
      ? { budget: needs.budget * (needs.budgetPerPerson ? needs.travelers! : 1) }
      : {}),
    ...(needs.currency ? { currency: needs.currency } : {}),
  };
}
