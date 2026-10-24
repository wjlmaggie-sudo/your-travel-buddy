import { createClient } from "@supabase/supabase-js";
import { createTransportHandler } from "../_shared/transport-routes.ts";

const url = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const database =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

Deno.serve(
  createTransportHandler({
    enabled: Deno.env.get("GOOGLE_ROUTES_ENABLED") === "true",
    apiKey: Deno.env.get("GOOGLE_ROUTES_API_KEY"),
    allowedOrigins: (Deno.env.get("TRANSPORT_ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    claim: async () => {
      if (!database) throw new Error("Missing quota database.");
      const { data, error } = await database.rpc("claim_transport_request");
      if (error) throw error;
      return data === true;
    },
  }),
);
