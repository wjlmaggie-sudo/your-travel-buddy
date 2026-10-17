import { supabase } from "@/integrations/supabase/client";
import {
  ideaSchema,
  tripIdeaInput,
  type TripIdeas,
  type TripIdeaInput,
  type TripIdeaResult,
} from "../../supabase/functions/_shared/trip-ideas";
export type { TripIdeas };

/** GitHub Pages uses an authenticated Edge Function instead of a server RPC. */
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
    const { data: response, error } = await supabase.functions.invoke("generate-trip-ideas", {
      body: input.data,
    });
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
