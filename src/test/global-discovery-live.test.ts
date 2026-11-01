// Explicit opt-in only. Uses the non-commercial public services, never a paid provider.
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resetGlobalDiscoveryCache, searchGlobalDestinations } from "@/lib/global-discovery";
it.runIf(process.env["RUN_PUBLIC_DISCOVERY_LIVE"] === "1")(
  "checks one actual global public-data batch",
  async () => {
    resetGlobalDiscoveryCache();
    const request: typeof fetch = async (input, init) => {
      if (String(input).endsWith("global-cities.json"))
        return Response.json(JSON.parse(readFileSync("public/data/global-cities.json", "utf8")));
      // Node's real fetch runs under jsdom here; identify this client explicitly.
      const headers = new Headers(init?.headers);
      headers.set(
        "User-Agent",
        "TravelBuddy/1.0 (+https://wjlmaggie-sudo.github.io/your-travel-buddy/)",
      );
      const response = await fetch(input, { ...init, headers });
      if (String(input).includes("en.wikipedia.org/w/api.php")) {
        const text = await response.clone().text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text.slice(0, 180) };
        }
        if (!response.ok || data.error || data.warnings)
          console.warn("Live geographic service diagnostic", {
            status: response.status,
            retryAfter: response.headers.get("retry-after"),
            error: data.error,
            warnings: data.warnings,
            message: data.message,
          });
      }
      return response;
    };
    const result = await searchGlobalDestinations(
      { days: 7, warm: true, activity: "hiking" },
      "2027-06-15",
      0,
      new AbortController().signal,
      request,
    );
    console.log(
      JSON.stringify({
        scanned: result.scanned,
        total: result.total,
        results: result.results.map((d) => ({
          destination: d.destination,
          evidence: d.evidence.map((e) => e.name),
          temperature: d.temperature,
        })),
      }),
    );
    expect(result.scanned).toBeLessThanOrEqual(12);
    expect(result.results.length).toBeGreaterThan(0);
  },
  90000,
);
