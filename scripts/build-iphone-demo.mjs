import { execFileSync } from "node:child_process";
import { cp, rm, readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";

const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const base = (env.PAGES_BASE_PATH || "/your-travel-buddy/").replace(/\/?$/, "/");
execFileSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--config", "vite.native.config.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, NATIVE_BASE_PATH: `${base}app-demo/`, NATIVE_OUT_DIR: "dist-app-demo" },
  },
);
await cp("dist-app-demo", "dist/app-demo", { recursive: true });
// The outer viewer belongs at the site root; avoid copying a nested viewer.
await rm("dist/app-demo/iphone-demo.html", { force: true });
console.log("Interactive iPhone demo included in the website artifact.");

// A fresh viewer must also request a fresh app index, rather than a cached iframe.
const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const viewer = await readFile("dist/iphone-demo.html", "utf8");
await writeFile(
  "dist/iphone-demo.html",
  viewer.replace('const revision = "development";', `const revision = "${revision}";`),
);
