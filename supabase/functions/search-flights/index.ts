import { createClient } from "@supabase/supabase-js";
import { createFlightHandler } from "../_shared/flight-search.ts";
const database = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(
  createFlightHandler({
    apiKey: Deno.env.get("SERPAPI_API_KEY"),
    allowedOrigins: (Deno.env.get("FLIGHT_ALLOWED_ORIGINS") ?? "https://wjlmaggie-sudo.github.io")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    claim: async () => {
      const { data, error } = await database.rpc("claim_flight_search");
      if (error) throw error;
      return data === true;
    },
  }),
);
