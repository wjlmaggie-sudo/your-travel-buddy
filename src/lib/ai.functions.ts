import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ideaSchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      items: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          location: z.string(),
          notes: z.string(),
        }),
      ),
    }),
  ),
});

export type TripIdeas = z.infer<typeof ideaSchema>;

export const generateTripIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      destination: string;
      days: number;
      interests: string;
      travelers: number;
      budget: number;
      currency: string;
      style: string;
    }) => ({
      destination: String(d.destination).slice(0, 200),
      days: Math.min(14, Math.max(1, Number(d.days) || 1)),
      interests: String(d.interests ?? "").slice(0, 500),
      travelers: Math.min(20, Math.max(1, Number(d.travelers) || 1)),
      budget: Math.min(1000000, Math.max(0, Number(d.budget) || 0)),
      currency: String(d.currency ?? "EUR").slice(0, 3),
      style: String(d.style ?? "Balanced").slice(0, 20),
    }),
  )
  .handler(async ({ data }): Promise<{ ideas: TripIdeas | null; error: string | null }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ideas: null, error: "AI is not configured." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions:
          "You are a friendly travel planner. Create realistic day-by-day itineraries with 3-5 items per day. Times as HH:MM. Keep notes to one short sentence.",
        prompt: `Plan ${data.days} day(s) in ${data.destination}. Interests: ${data.interests || "a good mix of sights, food and local culture"}. Group: ${data.travelers} travelers. Total group budget excluding flights: ${data.budget} ${data.currency}. Travel style: ${data.style}. Keep recommendations within that budget, treat prices as estimates, and do not claim live availability.`,
        output: Output.object({ schema: ideaSchema }),
        maxRetries: 0,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const ideas = await result.output;
      return { ideas, error: null };
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("AI ideas failed", err);
      if (status === 429)
        return { ideas: null, error: "Too many requests — please wait a moment and try again." };
      if (status === 402)
        return { ideas: null, error: "AI credits have run out for this workspace." };
      if (status === 403)
        return { ideas: null, error: "AI access is currently blocked for this workspace." };
      return { ideas: null, error: "Couldn't generate ideas right now." };
    }
  });
