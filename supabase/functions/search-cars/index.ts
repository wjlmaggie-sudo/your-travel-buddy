import { createClient } from "@supabase/supabase-js";
import { createCarHandler } from "../_shared/car-search.ts";
const database = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(
  createCarHandler({
    apiKey: Deno.env.get("SCRAPPA_API_KEY"),
    allowedOrigins: ["https://wjlmaggie-sudo.github.io"],
    claim: async () => {
      const { data, error } = await database.rpc("claim_car_search");
      if (error) throw error;
      return data === true;
    },
  }),
);
