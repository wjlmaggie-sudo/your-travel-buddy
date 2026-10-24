import { execFileSync } from "node:child_process";
import { copyFile, writeFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
await copyFile("dist/index.html", "dist/404.html");
await writeFile("dist/.nojekyll", "");
// Private server modules must never appear in the static artifact.
for (const name of await readdir("dist/assets")) {
  if (!name.endsWith(".js")) continue;
  const source = await readFile(path.join("dist/assets", name), "utf8");
  if (
    /SUPABASE_SERVICE_ROLE_KEY|LOVABLE_API_KEY|GOOGLE_ROUTES_API_KEY|ai\.gateway\.lovable\.dev/.test(
      source,
    )
  ) {
    throw new Error(
      "The static build contains a private server module. Do not publish this artifact.",
    );
  }
}
const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
await writeFile(
  "dist/release.json",
  JSON.stringify({
    sourceCommit: git(["rev-parse", "HEAD"]),
    dirty: !!git(["status", "--porcelain"]),
    builtAt: new Date().toISOString(),
  }) + "\n",
);
console.log("Pages artifact ready in dist/; server-only modules excluded.");
