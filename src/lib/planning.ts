import { TEMPLATES, type TravelStyle } from "./travel-data";

export const STYLES: TravelStyle[] = ["Budget", "Balanced", "Luxury"];
export const INTERESTS = ["Food & culture", "Nature & adventure", "Beach escapes", "City breaks"];
export function endDate(start: string, days: number) {
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days - 1);
  return date.toISOString().slice(0, 10);
}
export function estimatedBudget(days: number, travelers: number, style: TravelStyle) {
  return days * travelers * { Budget: 70, Balanced: 150, Luxury: 300 }[style];
}
export function budgetAllocation(total: number, style: TravelStyle) {
  const weights = {
    Budget: [0.35, 0.25, 0.15, 0.1, 0.15],
    Balanced: [0.4, 0.25, 0.15, 0.1, 0.1],
    Luxury: [0.5, 0.2, 0.15, 0.1, 0.05],
  }[style];
  const cents = Math.max(0, Math.round(total * 100));
  const amounts = weights.map((weight) => Math.floor(cents * weight));
  let remaining = cents - amounts.reduce((sum, amount) => sum + amount, 0);
  const order = weights
    .map((weight, index) => ({ index, fraction: cents * weight - (amounts[index] ?? 0) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const entry of order) {
    if (remaining <= 0) break;
    amounts[entry.index] = (amounts[entry.index] ?? 0) + 1;
    remaining--;
  }
  return ["Stays", "Food", "Experiences", "Local transport", "Shopping & buffer"].map(
    (label, index) => ({ label, amount: (amounts[index] ?? 0) / 100 }),
  );
}
export function templateActivities(id: string, days: number) {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) return [];
  return Array.from({ length: days }, (_, index) => {
    const activity = template.activities[index] ?? [
      "Your own discoveries",
      "Leave room for independent shops, a neighborhood café, or a local experience.",
    ];
    return {
      day: index + 1,
      time: "10:00",
      title: activity[0] ?? "Explore",
      location: template.destination,
      notes: activity[1] ?? "",
      position: 0,
    };
  });
}
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Split a group's budget exactly; remainder cents go to the earliest days. */
export function dailyBudgets(total: number, days: number, travelers: number, start: string) {
  const count = Math.max(1, Math.floor(days));
  const cents = Math.max(0, Math.round(total * 100));
  const base = Math.floor(cents / count);
  const extra = cents % count;
  return Array.from({ length: count }, (_, index) => {
    const amount = (base + (index < extra ? 1 : 0)) / 100;
    return {
      day: index + 1,
      date: endDate(start, index + 1),
      amount,
      perPerson: amount / Math.max(1, travelers),
    };
  });
}
