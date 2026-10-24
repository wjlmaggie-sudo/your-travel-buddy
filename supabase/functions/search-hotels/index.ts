import { createClient } from "@supabase/supabase-js";
import { createHotelSearchHandler } from "../_shared/hotel-search.ts";

const url = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const database =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const mode = Deno.env.get("HOTEL_SEARCH_MODE");

Deno.serve(
  createHotelSearchHandler({
    enabled: mode === "sandbox" || mode === "production",
    mode: mode === "production" ? "production" : "sandbox",
    apiKey: Deno.env.get(
      mode === "production" ? "NUITEE_PRODUCTION_API_KEY" : "NUITEE_SANDBOX_API_KEY",
    ),
    allowedOrigins: (Deno.env.get("HOTEL_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    claim: async () => {
      if (!database) throw new Error("Missing quota database.");
      const { data, error } = await database.rpc("claim_hotel_preview");
      if (error) throw error;
      return data === true;
    },
  }),
);
