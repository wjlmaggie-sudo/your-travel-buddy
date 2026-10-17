// Produce one reproducible Edge Function file for Supabase's dashboard editor.
// Private credentials are never read by this script.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
// Use the installed CLI: pnpm exposes transitive binaries without exposing their
// packages to direct imports from project scripts.
let source = execFileSync(
  path.resolve("node_modules/.bin/esbuild"),
  [
    "supabase/functions/generate-trip-ideas/index.ts",
    "--bundle",
    "--platform=neutral",
    "--format=esm",
    "--log-level=error",
    "--external:@supabase/supabase-js",
    "--external:@ai-sdk/openai",
    "--external:ai",
    "--external:zod",
  ],
  { encoding: "utf8" },
);
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
