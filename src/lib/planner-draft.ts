import { z } from "zod";
import { journeySchema } from "./journey-planning";
import { stayChoiceSchema } from "./stay-planning";
import { INTERESTS } from "./planning";
import { ideaSchema } from "../../supabase/functions/_shared/trip-ideas";

const KEY = "ai-travel-planning-draft";
export const plannerDraftSchema = z.object({
  destination: z.string().trim().min(1).max(200),
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T12:00:00Z`);
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }),
  days: z.number().int().min(1).max(30),
  travelers: z.number().int().min(1).max(20),
  budget: z.number().finite().min(0).max(1000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  style: z.enum(["Budget", "Balanced", "Luxury"]),
  interest: z.string().refine((value) => INTERESTS.includes(value)),
  ideas: ideaSchema.optional(),
  stay: stayChoiceSchema.optional(),
  journey: journeySchema.optional(),
});
export type PlannerDraft = z.infer<typeof plannerDraftSchema>;

export function readPlannerDraft(): PlannerDraft | null {
  try {
    if (typeof window === "undefined") return null;
    const result = plannerDraftSchema.safeParse(JSON.parse(sessionStorage.getItem(KEY) ?? "null"));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function savePlannerDraft(draft: PlannerDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(plannerDraftSchema.parse(draft)));
    return true;
  } catch {
    return false;
  }
}

export function clearPlannerDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // The trip has already saved; storage availability must not block navigation.
  }
}

// Simulations are tab-session only and separate from the explicit sign-in handoff.
const SIMULATION_KEY = "travel-buddy-guest-simulation";
export function readGuestSimulation(): PlannerDraft | null {
  try {
    if (typeof window === "undefined") return null;
    const result = plannerDraftSchema.safeParse(
      JSON.parse(sessionStorage.getItem(SIMULATION_KEY) ?? "null"),
    );
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
export function saveGuestSimulation(draft: PlannerDraft) {
  try {
    sessionStorage.setItem(SIMULATION_KEY, JSON.stringify(plannerDraftSchema.parse(draft)));
  } catch {
    /* In-memory planning continues when session storage is unavailable. */
  }
}
