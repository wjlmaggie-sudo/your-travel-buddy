import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { openAIPlan, PlanProviderError } from "../_shared/openai-plan.ts";
import { ideaSchema, tripIdeaInput, tripIdeaPrompt } from "../_shared/trip-ideas.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-travel-authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  const url = Deno.env.get("TRAVEL_AUTH_URL") || Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("TRAVEL_AUTH_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return reply({ error: "The backend is not configured." }, 503);
  const authorization =
    request.headers.get("x-travel-authorization") || request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer "))
    return reply({ error: "Please sign in to generate ideas." }, 401);
  try {
    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: user, error: authError } = await auth.auth.getUser(authorization.slice(7));
    if (authError || !user.user)
      return reply({ error: "Your session expired. Please sign in again." }, 401);
    const text = await request.text();
    if (text.length > 10000) return reply({ error: "Request is too large." }, 413);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return reply({ error: "Invalid JSON request." }, 400);
    }
    const parsed = tripIdeaInput.safeParse(body);
    if (!parsed.success)
      return reply({ error: "Check your destination, budget, and travel details." }, 400);
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!openAIKey && !apiKey)
      return reply(
        {
          error:
            "Live AI is not connected yet. The project owner needs to add OPENAI_API_KEY in Edge Function secrets.",
        },
        503,
      );
    const backend = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const quota = await backend.rpc("claim_ai_request", { request_user: user.user.id });
    if (quota.error)
      return reply(
        { error: "AI usage controls are not installed. Apply the AI usage migration." },
        503,
      );
    if (!quota.data)
      return reply(
        { error: "Your daily AI limit has been reached. Please try again tomorrow." },
        429,
      );
    if (openAIKey)
      return reply({
        ideas: await openAIPlan(
          parsed.data,
          openAIKey,
          Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini",
        ),
        error: null,
      });
    if (!apiKey)
      return reply(
        { error: "AI setup is pending: configure LOVABLE_API_KEY in your backend secrets." },
        503,
      );
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions:
        "You are a friendly travel planner. Create realistic day-by-day itineraries with 3-5 items per day. Times as HH:MM. Keep notes to one short sentence.",
      prompt: tripIdeaPrompt(parsed.data),
      output: Output.object({ schema: ideaSchema }),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(120000),
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
    return reply({ ideas: await result.output, error: null });
  } catch (error) {
    if (error instanceof PlanProviderError)
      return reply({ error: error.message }, error.statusCode === 401 ? 503 : error.statusCode);
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 429)
      return reply({ error: "Too many requests. Please wait a moment and try again." }, 429);
    if (status === 402) return reply({ error: "AI credits have run out for this workspace." }, 402);
    if (status === 403) return reply({ error: "AI access is blocked for this workspace." }, 403);
    return reply({ error: "Could not generate ideas right now. Please try again." }, 502);
  }
});
