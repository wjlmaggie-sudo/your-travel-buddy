import { assertPagesRelease } from "./pages-release.mjs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, existsSync, readdirSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const output = path.resolve("dist");
if (!existsSync(path.join(output, "index.html")) || !existsSync(path.join(output, ".nojekyll"))) {
  throw new Error("Run npm run build:pages before publishing.");
}
const git = (args, cwd = process.cwd()) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
const remote = git(["remote", "get-url", "github"]);
git(["fetch", "github", "main"]);
let release;
try {
  release = JSON.parse(readFileSync(path.join(output, "release.json"), "utf8"));
} catch {
  /* Missing metadata fails closed below. */
}
assertPagesRelease({
  head: git(["rev-parse", "HEAD"]),
  main: git(["rev-parse", "github/main"]),
  dirty: !!git(["status", "--porcelain"]),
  release,
});
const existing = git(["ls-remote", remote, "refs/heads/gh-pages"]);
const checkout = mkdtempSync(path.join(tmpdir(), "ai-travel-pages-"));
try {
  if (existing) {
    git(["clone", "--single-branch", "--branch", "gh-pages", remote, checkout]);
    for (const name of readdirSync(checkout))
      if (name !== ".git") rmSync(path.join(checkout, name), { force: true, recursive: true });
  } else {
    git(["init", "-b", "gh-pages", checkout]);
    git(["remote", "add", "origin", remote], checkout);
  }
  for (const name of readdirSync(output))
    cpSync(path.join(output, name), path.join(checkout, name), { recursive: true });
  git(["config", "user.name", git(["show", "-s", "--format=%an"])], checkout);
  git(["config", "user.email", git(["show", "-s", "--format=%ae"])], checkout);
  git(["add", "--all"], checkout);
  if (!git(["status", "--porcelain"], checkout)) {
    console.log("The published artifact already matches this build.");
  } else {
    git(
      ["commit", "-m", `Publish static app from ${git(["rev-parse", "--short", "HEAD"])}`],
      checkout,
    );
    git(["push", "origin", "HEAD:gh-pages"], checkout);
    console.log("Published artifact commit: " + git(["rev-parse", "HEAD"], checkout));
  }
} finally {
  rmSync(checkout, { recursive: true, force: true });
}
