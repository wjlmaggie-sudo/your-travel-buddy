// Produce one reproducible Edge Function file for Supabase's dashboard editor.
// Private credentials are never read by this script.
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
const result = await build({
  entryPoints: ["supabase/functions/generate-trip-ideas/index.ts"],
  bundle: true,
  platform: "neutral",
  format: "esm",
  write: false,
  external: ["@supabase/supabase-js", "@ai-sdk/openai", "ai", "zod"],
});
let source = result.outputFiles[0].text;
for (const [name, version] of Object.entries({
  "@supabase/supabase-js": "2.118.0",
  "@ai-sdk/openai": "4.0.95",
  ai: "7.0.142",
  zod: "3.25.76",
}))
  source = source.replaceAll(JSON.stringify(name), JSON.stringify(`npm:${name}@${version}`));
const target = process.argv[2] || "/tmp/travel-ai-function.ts";
writeFileSync(target, source);
console.log(`Prepared ${target}; paste into Supabase's function editor.`);
