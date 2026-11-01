import { z } from "zod";
import { finalBudgetSchema, finalTripBudget } from "./final-trip-budget";
import { endDate } from "./planning";
import type { PdfTrip } from "./trip-pdf";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => {
    const parsed = new Date(`${date}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  });
const stopSchema = z.object({
  id: z.string().min(1).max(200),
  day: z.number().int().min(1).max(30),
  time: z.string().max(10),
  title: z.string().trim().min(1).max(200),
  location: z.string().max(300),
  notes: z.string().max(2000),
  status: z.enum(["planned", "done", "skipped"]).default("planned"),
});
const expenseSchema = z.object({
  id: z.string().max(200),
  amount: z.number().finite().min(0).max(1000000),
  category: z.string().max(100),
  note: z.string().max(500),
  date: dateSchema,
});
const essentialSchema = z.object({
  id: z.string().max(200),
  title: z.string().trim().min(1).max(200),
  details: z.string().max(3000),
});
export const companionTripSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(200),
  sourceTripId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  destination: z.string().trim().min(1).max(200),
  start: dateSchema,
  days: z.number().int().min(1).max(30),
  travelers: z.number().int().min(1).max(20),
  currency: z.string().regex(/^[A-Z]{3}$/),
  budget: z.number().finite().min(0).max(1000000),
  timezone: z.string().max(100).refine(validTimezone),
  savedAt: z.string().datetime(),
  finalBudget: finalBudgetSchema.optional(),
  stops: z.array(stopSchema).max(1500),
  essentials: z.array(essentialSchema).max(100),
  packing: z.array(z.object({ name: z.string().max(200), packed: z.boolean() })).max(200),
  expenses: z.array(expenseSchema).max(5000),
  localExpenses: z.array(expenseSchema).max(1000).default([]),
  note: z.string().max(3000).default(""),
});
export type CompanionTrip = z.infer<typeof companionTripSchema>;
export type CompanionStop = z.infer<typeof stopSchema>;
const KEY = "travel-buddy-offline-trips-v1";
export const COMPANION_CHANGE = "travel-buddy-offline-change";

export function validTimezone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}
export function deviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
export function readCompanionTrips(): CompanionTrip[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry) => {
      const result = companionTripSchema.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}
function writeTrips(trips: CompanionTrip[]) {
  // Fail visibly on unavailable/full storage; never report a failed download as saved.
  localStorage.setItem(KEY, JSON.stringify(trips));
  window.dispatchEvent(new Event(COMPANION_CHANGE));
}
export function saveCompanionTrip(trip: CompanionTrip) {
  const checked = companionTripSchema.parse(trip);
  const others = readCompanionTrips().filter((item) => item.id !== checked.id);
  if (others.length >= 20)
    throw new Error("Remove an offline trip before saving another (20 maximum).");
  writeTrips([checked, ...others]);
  return checked;
}
export function removeCompanionTrip(id: string) {
  writeTrips(readCompanionTrips().filter((trip) => trip.id !== id));
}
export function clearAccountCopies(ownerId?: string) {
  writeTrips(
    readCompanionTrips().filter((trip) => !trip.ownerId || (ownerId && trip.ownerId === ownerId)),
  );
}

/** An explicit offline copy; re-downloading retains local progress and travel notes. */
export function makeCompanionTrip(
  plan: PdfTrip,
  source?: { tripId: string; ownerId: string },
): CompanionTrip {
  const id = source?.tripId ?? `guest:${plan.brief.destination.toLowerCase()}:${plan.brief.start}`;
  const previous = readCompanionTrips().find((trip) => trip.id === id);
  const stops = plan.days.flatMap((day) =>
    day.items.map((item, index) => {
      const sourceId = (item as { id?: string }).id;
      const stopId = sourceId ?? `${day.day}:${index}:${item.title}`.slice(0, 200);
      const old = previous?.stops.find((stop) => stop.id === stopId);
      return {
        id: stopId,
        day: day.day,
        time: item.time ?? "",
        title: item.title,
        location: item.location ?? "",
        notes: item.notes ?? "",
        status: old?.status ?? "planned",
      };
    }),
  );
  const bookingDetails: CompanionTrip["essentials"] = [];
  if (plan.stay && plan.stay.evidence !== "demo")
    bookingDetails.push({
      id: "selected-stay",
      title: plan.stay.name,
      details: `Selected accommodation · ${plan.stay.type}. This selection is not a booking. Add your confirmed address and reservation reference separately.`,
    });
  if (plan.journey?.selectedFlight && plan.journey.selectedFlight.evidence !== "demo")
    bookingDetails.push({
      id: "selected-flight",
      title: plan.journey.selectedFlight.label,
      details: "Selected flight search result. This is not a ticket or confirmed reservation.",
    });
  if (plan.journey?.selectedCar)
    bookingDetails.push({
      id: "selected-car",
      title: "Car rental selection",
      details: `${plan.journey.selectedCar.pickup} · ${plan.journey.selectedCar.pickupDate} ${plan.journey.selectedCar.pickupTime} to ${plan.journey.selectedCar.dropoffDate}. Confirm pickup and booking with the rental provider.`,
    });
  return companionTripSchema.parse({
    version: 1,
    id,
    ...(source ? { sourceTripId: source.tripId, ownerId: source.ownerId } : {}),
    destination: plan.brief.destination,
    start: plan.brief.start,
    days: plan.brief.days,
    travelers: plan.brief.travelers,
    budget: plan.brief.budget,
    currency: plan.brief.currency,
    timezone: previous?.timezone ?? deviceTimezone(),
    finalBudget: plan.journey ? finalTripBudget(plan.brief, plan.journey, plan.stay) : undefined,
    savedAt: new Date().toISOString(),
    stops,
    essentials: [
      ...bookingDetails,
      ...(previous?.essentials.filter((e) => !e.id.startsWith("selected-")) ?? []),
    ],
    packing: [
      ...new Set([...(plan.packing ?? []), ...(previous?.packing.map((item) => item.name) ?? [])]),
    ].map((name) => ({
      name,
      packed: previous?.packing.find((item) => item.name === name)?.packed ?? false,
    })),
    expenses:
      plan.expenses?.map((expense, index) => ({
        id: `cloud:${index}`,
        amount: Number(expense.amount),
        category: expense.category,
        note: expense.note ?? "",
        date: expense.spent_on,
      })) ?? [],
    localExpenses: previous?.localExpenses ?? [],
    note: previous?.note ?? "",
  });
}
export function tripDate(trip: Pick<CompanionTrip, "start">, day: number) {
  return endDate(trip.start, day);
}
export function dateInZone(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((part) => parts.find((p) => p.type === part)?.value)
    .join("-");
}
export function currentTripDay(trip: CompanionTrip, now = new Date()) {
  const offset =
    Math.round((Date.parse(dateInZone(now, trip.timezone)) - Date.parse(trip.start)) / 86400000) +
    1;
  return Math.max(1, Math.min(trip.days, offset));
}
export function nextStop(trip: CompanionTrip, day: number) {
  return trip.stops.find((stop) => stop.day === day && stop.status === "planned");
}
export function directionsUrl(
  stop: Pick<CompanionStop, "location" | "title">,
  destination: string,
  mode: "walk" | "transit" | "drive",
) {
  const target = `${stop.location || stop.title}, ${destination}`;
  return `https://maps.apple.com/?${new URLSearchParams({ daddr: target, dirflg: { walk: "w", transit: "r", drive: "d" }[mode] })}`;
}
export function companionText(trip: CompanionTrip) {
  return [
    `${trip.destination} · Travel Buddy`,
    `${trip.start} · ${trip.days} days · times in ${trip.timezone}`,
    ...Array.from(
      { length: trip.days },
      (_, i) =>
        `\nDay ${i + 1} · ${tripDate(trip, i + 1)}\n${trip.stops
          .filter((s) => s.day === i + 1)
          .map((s) => `${s.time || "Flexible"} · ${s.title}${s.location ? ` · ${s.location}` : ""}`)
          .join("\n")}`,
    ),
  ].join("\n");
}

/** Resolve a wall-clock trip time without using the Mac/iPhone's current timezone. */
export function stopInstant(date: string, time: string, zone: string): Date | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const desired = Date.parse(`${date}T${time}:00Z`);
  let value = desired;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(value));
    const p = (name: string) => parts.find((part) => part.type === name)!.value;
    const wall = Date.parse(
      `${p("year")}-${p("month")}-${p("day")}T${p("hour")}:${p("minute")}:00Z`,
    );
    const correction = desired - wall;
    if (!correction) return new Date(value);
    value += correction;
  }
  return null; // A nonexistent DST wall time must not create a wrong reminder.
}
