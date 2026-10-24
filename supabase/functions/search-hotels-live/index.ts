import { createClient } from "@supabase/supabase-js";
import { createSerpHotelHandler } from "../_shared/serpapi-hotels.ts";
const database = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
Deno.serve(
  createSerpHotelHandler({
    apiKey: Deno.env.get("SERPAPI_API_KEY"),
    allowedOrigins: (Deno.env.get("HOTEL_ALLOWED_ORIGINS") ?? "https://wjlmaggie-sudo.github.io")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    claim: async () => {
      // Shared with flights: at most 200 upstream requests per UTC month in total.
      const { data, error } = await database.rpc("claim_flight_search");
      if (error) throw error;
      return data === true;
    },
  }),
);
