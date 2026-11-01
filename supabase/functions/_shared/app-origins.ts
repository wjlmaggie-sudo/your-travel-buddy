/** Exact origins only. The installed iOS bundle is served by Capacitor locally. */
export function appOrigins(configured: string | undefined, fallback = "https://wjlmaggie-sudo.github.io") {
  return [...new Set([
    ...(configured ?? fallback).split(",").map((value) => value.trim()).filter(Boolean),
    "capacitor://localhost",
  ])];
}
