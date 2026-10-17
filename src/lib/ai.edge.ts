import { supabase } from "@/integrations/supabase/client";
import {
  ideaSchema,
  tripIdeaInput,
  type TripIdeas,
  type TripIdeaInput,
  type TripIdeaResult,
} from "../../supabase/functions/_shared/trip-ideas";
export type { TripIdeas };

/** Separate AI hosting can verify the existing travel account without moving trip data. */
export async function invokePlannerBackend(body: TripIdeaInput, token: string) {
  const base = import.meta.env["VITE_AI_FUNCTIONS_URL"];
  const gateway = import.meta.env["VITE_AI_GATEWAY_KEY"];
  if (!base) return supabase.functions.invoke("generate-trip-ideas", { body });
  if (!gateway)
    return {
      data: null,
      error: {
        context: Response.json({ error: "The AI gateway is not configured." }, { status: 503 }),
      },
    };
  const response = await fetch(`${base.replace(/\/+$/, "")}/generate-trip-ideas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: gateway,
      Authorization: `Bearer ${gateway}`,
      "x-travel-authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(125000),
  });
  if (!response.ok) return { data: null, error: { context: response } };
  return { data: await response.json(), error: null };
}

/** GitHub Pages keeps all private AI keys on the backend. */
export async function generateTripIdeas({
  data,
}: {
  data: TripIdeaInput;
}): Promise<TripIdeaResult> {
  const input = tripIdeaInput.safeParse(data);
  if (!input.success)
    return { ideas: null, error: "Check your destination, budget, and travel details." };
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session.session)
    return { ideas: null, error: "Please sign in to generate ideas." };
  try {
    const { data: response, error } = await invokePlannerBackend(
      input.data,
      session.session.access_token,
    );
    if (error) {
      let message = "AI planning is unavailable. Your saved trips and manual planner still work.";
      if (error.context instanceof Response) {
        const details = await error.context
          .clone()
          .json()
          .catch(() => null);
        if (details?.error && typeof details.error === "string") message = details.error;
        else if (error.context.status === 404)
          message =
            "AI setup is pending: deploy the generate-trip-ideas Edge Function in Lovable Cloud or Supabase.";
        else if (error.context.status === 401)
          message = "Your session expired. Please sign in again.";
      }
      return { ideas: null, error: message };
    }
    if (response?.error && typeof response.error === "string")
      return { ideas: null, error: response.error };
    const parsed = ideaSchema.safeParse(response?.ideas);
    if (
      !parsed.success ||
      parsed.data.days.length !== input.data.days ||
      parsed.data.days.some((day, index) => day.day !== index + 1)
    )
      return { ideas: null, error: "The AI returned an incomplete plan. Please try again." };
    return { ideas: parsed.data, error: null };
  } catch {
    return { ideas: null, error: "Could not reach AI planning. Please try again." };
  }
}
