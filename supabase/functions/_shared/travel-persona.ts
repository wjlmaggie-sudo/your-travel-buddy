import { z } from "zod";

export const CHILD_AGE_RANGES = ["0-3", "4-6", "7-10", "11-15", "16-17"] as const;
export const personaFields = {
  persona: z.enum(["business", "family", "budget-travel"]).optional(),
  // Retained for existing plans and exact-age external searches; ranges never fabricate ages.
  childrenAges: z.array(z.number().int().min(0).max(17)).max(19).optional(),
  childrenAgeRanges: z.array(z.enum(CHILD_AGE_RANGES)).max(19).optional(),
};
export type PersonaDetails = {
  persona?: "business" | "family" | "budget-travel" | undefined;
  childrenAges?: number[] | undefined;
  childrenAgeRanges?: (typeof CHILD_AGE_RANGES)[number][] | undefined;
};
export function childCount(value: PersonaDetails) {
  return value.childrenAgeRanges?.length || value.childrenAges?.length || 0;
}
export function childAgeDescription(value: PersonaDetails) {
  return value.childrenAgeRanges?.length
    ? value.childrenAgeRanges.map((range) => range.replace("-", "–")).join(", ")
    : (value.childrenAges ?? []).join(", ");
}
export function activityAgeBands(value: PersonaDetails) {
  return value.childrenAgeRanges?.length
    ? value.childrenAgeRanges
    : (value.childrenAges ?? []).map((age) =>
        CHILD_AGE_RANGES.find((range) => age <= Number(range.split("-")[1]))!,
      );
}
export function validParty(value: PersonaDetails & { travelers: number }) {
  return (
    childCount(value) < value.travelers &&
    !(value.childrenAgeRanges?.length && value.childrenAges?.length)
  );
}
