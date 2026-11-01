import { z } from "zod";
import { connectedBudget, type WorkspaceJourney } from "./travel-workspace";
import type { StayBrief, StayChoice } from "./stay-planning";

const amount = z.number().finite().nonnegative();
export const finalBudgetSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    travelers: z.number().int().min(1).max(20),
    days: z.number().int().min(1).max(30),
    budget: amount,
    total: amount,
    selectedTotal: amount,
    estimatedTotal: amount,
    remaining: z.number().finite(),
    missing: z.array(z.string().max(200)).max(5),
    rows: z
      .array(
        z.object({
          id: z.string().max(30),
          label: z.string().max(100),
          amount,
          kind: z.enum(["selected", "estimate", "not-needed", "missing"]),
          detail: z.string().max(500),
        }),
      )
      .max(10),
  })
  .refine((review) => {
    const sum = (kind?: string) =>
      review.rows
        .filter((row) => !kind || row.kind === kind)
        .reduce((total, row) => total + Math.round(row.amount * 100), 0);
    return (
      sum() === Math.round(review.total * 100) &&
      sum("selected") === Math.round(review.selectedTotal * 100) &&
      Math.round(review.selectedTotal * 100) + Math.round(review.estimatedTotal * 100) ===
        Math.round(review.total * 100) &&
      Math.round(review.budget * 100) - Math.round(review.total * 100) ===
        Math.round(review.remaining * 100)
    );
  }, "Budget totals must reconcile to the itemized costs.");
export type FinalBudget = z.infer<typeof finalBudgetSchema>;

/** Same scoped quotes and allowances as the live workspace, summed once in integer cents. */
export function finalTripBudget(
  brief: StayBrief,
  journey: WorkspaceJourney,
  stay?: StayChoice | null,
): FinalBudget {
  const costs = connectedBudget(brief, journey, stay);
  const flight = costs.flightChoice;
  const realFlight = !!flight && flight.evidence !== "demo";
  const realHotel = costs.hotelChosen && stay?.evidence !== "demo";
  const noFlights = journey.flightsRequired === false;
  const noStay = brief.days <= 1;
  const missing: string[] = [];
  if (!noFlights && !realFlight) missing.push("Choose a flight or enter a quote");
  if (!noStay && !realHotel) missing.push("Choose accommodation or enter a quote");
  if (journey.selectedCar && !costs.carChoice)
    missing.push("Re-select or remove the car rental that no longer matches this trip");
  const rows: FinalBudget["rows"] = [
    {
      id: "flights",
      label: "Return flights · whole group",
      amount: costs.flight,
      kind: noFlights ? "not-needed" : realFlight ? "selected" : "estimate",
      detail: noFlights
        ? "Flights not required"
        : realFlight
          ? `${flight.label} · ${flight.evidence === "live-search" ? "selected advertised price" : "entered quote"}`
          : journey.selectedFlight && !flight
            ? "Previous selection does not match this route, dates or group; allowance used"
            : "Allowance only; no real flight selected",
    },
    {
      id: "hotel",
      label: "Accommodation · whole stay",
      amount: costs.hotel,
      kind: noStay ? "not-needed" : realHotel ? "selected" : "estimate",
      detail: noStay
        ? "No overnight stay in this plan"
        : realHotel
          ? `${stay!.name} · ${Math.max(0, brief.days - 1)} nights · ${stay!.rooms} rooms · includes entered extras`
          : stay && !costs.hotelChosen
            ? "Previous accommodation quote no longer matches; allowance used"
            : "Accommodation allowance; no real stay selected",
    },
    ...(costs.carChoice
      ? [
          {
            id: "car",
            label: "Car rental",
            amount: costs.car,
            kind: "selected" as const,
            detail:
              "Selected advertised rental total; fuel, parking, deposits and optional extras may be separate",
          },
        ]
      : journey.selectedCar
        ? [
            {
              id: "car",
              label: "Car rental · selection needs review",
              amount: 0,
              kind: "missing" as const,
              detail:
                "Excluded from total because the currency, destination, dates or group no longer match",
            },
          ]
        : []),
    {
      id: "activities",
      label: "Activities & tickets",
      amount: costs.estimates.activities,
      kind: "estimate",
      detail: "Whole-group planning estimate; check child fares and current ticket prices",
    },
    {
      id: "food",
      label: "Food & drinks",
      amount: costs.estimates.food,
      kind: "estimate",
      detail: "Whole-group estimate for all trip days",
    },
    {
      id: "transport",
      label: "Local transport",
      amount: costs.estimates.transport,
      kind: "estimate",
      detail: costs.carChoice
        ? "Additional to the selected rental; review this allowance for transfers, fuel, parking and other transport"
        : "Whole-group estimate for transfers and local journeys",
    },
    {
      id: "shopping",
      label: "Shopping & buffer",
      amount: costs.estimates.shopping,
      kind: "estimate",
      detail: "Whole-trip allowance; browsing products does not add an unverified product price",
    },
  ];
  const totalCents = rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  const selectedCents = rows
    .filter((row) => row.kind === "selected")
    .reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  return finalBudgetSchema.parse({
    currency: brief.currency,
    travelers: brief.travelers,
    days: brief.days,
    budget: brief.budget,
    total: totalCents / 100,
    selectedTotal: selectedCents / 100,
    estimatedTotal: (totalCents - selectedCents) / 100,
    remaining: (Math.round(brief.budget * 100) - totalCents) / 100,
    missing,
    rows,
  });
}

export function exactPersonSplit(review: Pick<FinalBudget, "total" | "travelers">) {
  const cents = Math.round(review.total * 100);
  return {
    base: Math.floor(cents / review.travelers) / 100,
    extraPeople: cents % review.travelers,
  };
}
