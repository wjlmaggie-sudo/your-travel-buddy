// Explicit opt-in only. Uses the non-commercial public services, never a paid provider.
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resetGlobalDiscoveryCache, searchGlobalDestinations } from "@/lib/global-discovery";
it.runIf(process.env["RUN_PUBLIC_DISCOVERY_LIVE"] === "1")(
  "checks one actual global public-data batch",
  async () => {
    resetGlobalDiscoveryCache();
    const request: typeof fetch = (input, init) =>
      String(input).endsWith("global-cities.json")
        ? Promise.resolve(
            Response.json(JSON.parse(readFileSync("public/data/global-cities.json", "utf8"))),
          )
        : fetch(input, init);
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
