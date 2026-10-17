import { loadEnv } from "vite";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
for (const name of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
  if (!env[name])
    throw new Error(
      `Missing ${name}. Add it under GitHub Settings > Secrets and variables > Actions > Repository secrets.`,
    );
}
const url = new URL(env.VITE_SUPABASE_URL);
if (url.protocol !== "https:") throw new Error("VITE_SUPABASE_URL must use HTTPS.");
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (key.startsWith("sb_secret_"))
  throw new Error(
    "A private Supabase key cannot be used in a browser build. Use the publishable key.",
  );
if (key.startsWith("eyJ")) {
  const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
  if (payload.role !== "anon")
    throw new Error("Only an anon/publishable Supabase key is allowed in the browser.");
} else if (!key.startsWith("sb_publishable_"))
  throw new Error("Expected a Supabase publishable key.");
console.log("GitHub Pages browser configuration validated.");
