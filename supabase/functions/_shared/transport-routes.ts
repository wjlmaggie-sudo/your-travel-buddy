import { z } from "zod";

export const transportModes = ["TRANSIT", "WALK", "DRIVE"] as const;
export const transportInput = z
  .object({
    origin: z.string().trim().min(3).max(300),
    destination: z.string().trim().min(3).max(300),
    mode: z.enum(transportModes),
    departureTime: z.string().datetime().optional(),
  })
  .strict()
  .refine((value) => value.origin.toLowerCase() !== value.destination.toLowerCase(), {
    message: "Choose different start and destination locations.",
  });
export type TransportInput = z.infer<typeof transportInput>;
export const transportResult = z.object({
  mode: z.enum(transportModes),
  checkedAt: z.string().datetime(),
  departureTime: z.string().datetime(),
  route: z
    .object({
      seconds: z.number().nonnegative(),
      meters: z.number().nonnegative(),
      normalSeconds: z.number().nonnegative().nullable(),
      walkingMeters: z.number().nonnegative().nullable(),
      transfers: z.number().int().nonnegative().nullable(),
      lines: z.array(z.string()),
      warnings: z.array(z.string()),
    })
    .nullable(),
});
export type TransportResult = z.infer<typeof transportResult>;

function waypoint(address: string) {
  const match = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(address);
  if (match) {
    const latitude = Number(match[1]),
      longitude = Number(match[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180)
      return { location: { latLng: { latitude, longitude } } };
  }
  return { address };
}

export function googleRouteRequest(input: TransportInput) {
  return {
    origin: waypoint(input.origin),
    destination: waypoint(input.destination),
    travelMode: input.mode,
    languageCode: "en",
    units: "METRIC",
    ...(input.mode === "DRIVE" ? { routingPreference: "TRAFFIC_AWARE" } : {}),
    ...(input.mode !== "WALK" && input.departureTime ? { departureTime: input.departureTime } : {}),
  };
}

const seconds = z
  .string()
  .regex(/^\d+(\.\d+)?s$/)
  .transform((value) => Number(value.slice(0, -1)));
const googleResponse = z.object({
  routes: z
    .array(
      z.object({
        duration: seconds,
        distanceMeters: z.number().nonnegative().default(0),
        staticDuration: seconds.optional(),
        warnings: z.array(z.string().max(2000)).default([]),
        legs: z
          .array(
            z.object({
              steps: z
                .array(
                  z.object({
                    travelMode: z.string().optional(),
                    distanceMeters: z.number().nonnegative().default(0),
                    transitDetails: z
                      .object({
                        transitLine: z
                          .object({
                            nameShort: z.string().optional(),
                            name: z.string().optional(),
                          })
                          .optional(),
                      })
                      .optional(),
                  }),
                )
                .default([]),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

export function normalizeTransport(raw: unknown, input: TransportInput): TransportResult {
  const route = googleResponse.parse(raw).routes[0];
  const steps = route?.legs.flatMap((leg) => leg.steps) ?? [];
  const transit = steps.filter((step) => step.travelMode === "TRANSIT");
  return {
    mode: input.mode,
    checkedAt: new Date().toISOString(),
    departureTime: input.departureTime ?? new Date().toISOString(),
    route: route
      ? {
          seconds: route.duration,
          meters: route.distanceMeters,
          normalSeconds: input.mode === "DRIVE" ? (route.staticDuration ?? null) : null,
          walkingMeters:
            input.mode === "TRANSIT" && steps.length
              ? steps
                  .filter((step) => step.travelMode === "WALK")
                  .reduce((sum, step) => sum + step.distanceMeters, 0)
              : null,
          transfers:
            input.mode === "TRANSIT" && transit.length ? Math.max(0, transit.length - 1) : null,
          lines: transit.flatMap((step) => {
            const line = step.transitDetails?.transitLine;
            return line?.nameShort || line?.name ? [line.nameShort || line.name!] : [];
          }),
          warnings: route.warnings,
        }
      : null,
  };
}

type Dependencies = {
  enabled: boolean;
  apiKey: string | undefined;
  allowedOrigins: string[];
  claim: () => Promise<boolean>;
  fetcher?: typeof fetch;
};

export function createTransportHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin") ?? "";
    if (!origin || !deps.allowedOrigins.includes(origin))
      return new Response(null, { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
    if (!deps.enabled || !deps.apiKey)
      return reply({ error: "Transport comparison is not connected yet." }, 503);
    try {
      const text = await request.text();
      if (text.length > 2048) return reply({ error: "Request too large." }, 413);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return reply({ error: "Invalid JSON." }, 400);
      }
      const parsed = transportInput.safeParse(body);
      if (!parsed.success)
        return reply({ error: "Check start, destination and travel mode." }, 400);
      const input = parsed.data;
      const now = Date.now();
      if (
        input.departureTime &&
        (Date.parse(input.departureTime) < now - 60000 ||
          Date.parse(input.departureTime) > now + 100 * 86400000)
      )
        return reply({ error: "Choose a departure within the next 100 days." }, 400);
      if (input.mode !== "WALK" && !input.departureTime)
        input.departureTime = new Date().toISOString();
      // One durable claim per upstream call, including failures. No retries or unlimited fallback.
      if (!(await deps.claim()))
        return reply({ error: "Daily transport comparison limit reached." }, 429);
      const response = await (deps.fetcher ?? fetch)(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": deps.apiKey,
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.staticDuration,routes.warnings,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.transitDetails.transitLine",
          },
          body: JSON.stringify(googleRouteRequest(input)),
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok)
        return reply({ error: "Google Routes could not complete this request." }, 502);
      return reply(normalizeTransport(await response.json(), input));
    } catch {
      return reply({ error: "Transport comparison is unavailable. Try Google Maps." }, 503);
    }
  };
}
