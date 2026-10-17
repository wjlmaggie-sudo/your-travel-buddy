import { z } from "zod";

export const tripIdeaInput = z.object({
  destination: z.string().trim().min(1).max(200),
  days: z.number().int().min(1).max(14),
  interests: z.string().max(500),
  travelers: z.number().int().min(1).max(20),
  budget: z.number().min(0).max(1000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  style: z.enum(["Budget", "Balanced", "Luxury"]),
});
export const ideaSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.number().int().min(1).max(14),
        items: z
          .array(
            z.object({
              time: z.string().max(10),
              title: z.string().max(200),
              location: z.string().max(300),
              notes: z.string().max(1000),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(14),
});
export type TripIdeaInput = z.infer<typeof tripIdeaInput>;
export type TripIdeas = z.infer<typeof ideaSchema>;
export type TripIdeaResult = { ideas: TripIdeas | null; error: string | null };
export function tripIdeaPrompt(data: TripIdeaInput) {
  return `Plan ${data.days} day(s) in ${data.destination}. Interests: ${data.interests || "a good mix of sights, food and local culture"}. Group: ${data.travelers} travelers. Total group budget excluding flights: ${data.budget} ${data.currency}. Travel style: ${data.style}. Use consecutive day numbers from 1 through ${data.days}. Keep recommendations within that budget, treat prices as estimates, and do not claim live availability.`;
}
