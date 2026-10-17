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
  .inputValidator((d: { destination: string; days: number; interests: string }) => ({
    destination: String(d.destination).slice(0, 200),
    days: Math.min(14, Math.max(1, Number(d.days) || 1)),
    interests: String(d.interests ?? "").slice(0, 500),
  }))
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
        prompt: `Plan ${data.days} day(s) in ${data.destination}. Interests: ${data.interests || "a good mix of sights, food and local culture"}.`,
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
      if (status === 429) return { ideas: null, error: "Too many requests — please wait a moment and try again." };
      if (status === 402) return { ideas: null, error: "AI credits have run out for this workspace." };
      if (status === 403) return { ideas: null, error: "AI access is currently blocked for this workspace." };
      return { ideas: null, error: "Couldn't generate ideas right now." };
    }
  });
