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
  let remaining = Math.round(total * 100);
  return ["Stays", "Food", "Experiences", "Local transport", "Shopping & buffer"].map(
    (label, index) => {
      const cents = index === 4 ? remaining : Math.round(total * 100 * (weights[index] ?? 0));
      remaining -= cents;
      return { label, amount: cents / 100 };
    },
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
