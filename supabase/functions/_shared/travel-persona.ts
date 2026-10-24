import { z } from "zod";

export const personaFields = {
  persona: z.enum(["business", "family", "budget-travel"]).optional(),
  childrenAges: z.array(z.number().int().min(0).max(17)).max(19).optional(),
};
export type PersonaDetails = {
  persona?: "business" | "family" | "budget-travel" | undefined;
  childrenAges?: number[] | undefined;
};
export function validParty(value: PersonaDetails & { travelers: number }) {
  return (value.childrenAges?.length ?? 0) < value.travelers;
}
