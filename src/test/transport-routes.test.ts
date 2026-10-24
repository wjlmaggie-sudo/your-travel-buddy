import { describe, expect, it, vi } from "vitest";
import {
  createTransportHandler,
  googleRouteRequest,
  normalizeTransport,
  transportInput,
} from "../../supabase/functions/_shared/transport-routes";

const input = {
  origin: "Lisbon Airport, Portugal",
  destination: "Alfama, Lisbon, Portugal",
  mode: "TRANSIT" as const,
};
const payload = {
  routes: [
    {
      duration: "1800s",
      staticDuration: "1500s",
      distanceMeters: 8500,
      legs: [
        {
          steps: [
            { travelMode: "WALK", distanceMeters: 400 },
            { travelMode: "TRANSIT", transitDetails: { transitLine: { nameShort: "Metro Red" } } },
            { travelMode: "TRANSIT", transitDetails: { transitLine: { name: "Metro Green" } } },
            { travelMode: "WALK", distanceMeters: 200 },
          ],
        },
      ],
    },
  ],
};
const origin = "https://wjlmaggie-sudo.github.io";
const request = (body: unknown = input, site = origin) =>
  new Request("https://example.com/transport-routes", {
    method: "POST",
    headers: { origin: site, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function setup(overrides = {}) {
  const fetcher = vi.fn().mockResolvedValue(Response.json(payload));
  const claim = vi.fn().mockResolvedValue(true);
  const handler = createTransportHandler({
    enabled: true,
    apiKey: "private-test-key",
    allowedOrigins: [origin],
    claim,
    fetcher,
    ...overrides,
  });
  return { handler, claim, fetcher };
}
describe("Google Routes transport adapter", () => {
  it("builds mode-specific requests without traffic settings on walking or transit", () => {
    expect(googleRouteRequest(input)).not.toHaveProperty("routingPreference");
    expect(googleRouteRequest({ ...input, mode: "DRIVE" })).toHaveProperty(
      "routingPreference",
      "TRAFFIC_AWARE",
    );
    expect(
      googleRouteRequest({ ...input, mode: "WALK", departureTime: "2030-01-01T00:00:00Z" }),
    ).not.toHaveProperty("departureTime");
    expect(transportInput.safeParse({ ...input, mode: "TAXI" }).success).toBe(false);
    expect(transportInput.safeParse({ ...input, destination: input.origin }).success).toBe(false);
    expect(transportInput.safeParse({ ...input, origin: "x".repeat(301) }).success).toBe(false);
    expect(transportInput.safeParse({ ...input, apiKey: "override" }).success).toBe(false);
  });
  it("extracts transit walking and transfers and preserves unavailable routes", () => {
    expect(normalizeTransport(payload, input).route).toMatchObject({
      seconds: 1800,
      meters: 8500,
      walkingMeters: 600,
      transfers: 1,
      lines: ["Metro Red", "Metro Green"],
      normalSeconds: null,
    });
    expect(normalizeTransport(payload, { ...input, mode: "DRIVE" }).route).toMatchObject({
      normalSeconds: 1500,
      walkingMeters: null,
      transfers: null,
    });
    expect(normalizeTransport({}, input).route).toBeNull();
    expect(() => normalizeTransport({ routes: [{ duration: "unknown" }] }, input)).toThrow();
  });
  it("does not call Google for disabled, missing credentials, invalid, or disallowed requests", async () => {
    for (const overrides of [{ enabled: false }, { apiKey: undefined }]) {
      const { handler, claim, fetcher } = setup(overrides);
      expect((await handler(request())).status).toBe(503);
      expect(claim).not.toHaveBeenCalled();
      expect(fetcher).not.toHaveBeenCalled();
    }
    const { handler, fetcher } = setup();
    expect((await handler(request(input, "https://other.example"))).status).toBe(403);
    expect(
      (await handler(request({ ...input, departureTime: "2020-01-01T00:00:00Z" }))).status,
    ).toBe(400);
    expect(
      (await handler(request({ ...input, departureTime: "2099-01-01T00:00:00Z" }))).status,
    ).toBe(400);
    expect((await handler(request({ ...input, mode: "TAXI" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails closed on exhausted quota and database errors", async () => {
    for (const claim of [
      vi.fn().mockResolvedValue(false),
      vi.fn().mockRejectedValue(new Error("db")),
    ]) {
      const { handler, fetcher } = setup({ claim });
      expect([429, 503]).toContain((await handler(request())).status);
      expect(fetcher).not.toHaveBeenCalled();
    }
  });
  it("claims exactly once, keeps keys private and returns no-store results", async () => {
    const { handler, claim, fetcher } = setup();
    const response = await handler(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(await response.text()).not.toContain("private-test-key");
    expect(claim).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://routes.googleapis.com/directions/v2:computeRoutes");
    expect(options.headers["X-Goog-Api-Key"]).toBe("private-test-key");
    expect(JSON.parse(options.body)).toMatchObject({
      travelMode: "TRANSIT",
      origin: { address: input.origin },
    });
  });
  it("hides upstream errors and allows CORS preflight without spending quota", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(new Response("sensitive-provider-error", { status: 403 }));
    const { handler, claim } = setup({ fetcher: upstream });
    const preflight = await handler(
      new Request("https://example.com", { method: "OPTIONS", headers: { origin } }),
    );
    expect(preflight.status).toBe(204);
    expect(claim).not.toHaveBeenCalled();
    const response = await handler(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("sensitive-provider-error");
    expect(upstream).toHaveBeenCalledOnce();
  });
});
