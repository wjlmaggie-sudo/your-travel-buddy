import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Bus, Car, Footprints, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchTransport, transportEndpoint, transportLink } from "@/lib/transport-routes";
import {
  transportModes,
  type TransportResult,
} from "../../supabase/functions/_shared/transport-routes";
import type { VisualPlace } from "@/lib/city-guides";

const labels = { TRANSIT: "Public transport", WALK: "Walking", DRIVE: "Car" };
const icons = { TRANSIT: Bus, WALK: Footprints, DRIVE: Car };
type Entry = { mode: TransportResult["mode"]; result?: TransportResult; error?: string };

export function TransportComparison({
  places,
  destination,
  day,
}: {
  places: VisualPlace[];
  destination: string;
  day: number;
}) {
  const id = useId();
  const defaults = places.slice(0, 2).map((place) => `${place.name}, ${destination}`);
  const [origin, setOrigin] = useState(defaults[0] ?? destination);
  const [to, setTo] = useState(defaults[1] ?? destination);
  const [departure, setDeparture] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const connected = Boolean(transportEndpoint());
  const scope = JSON.stringify([
    places.map((place) => [place.name, place.lat, place.lon]),
    destination,
  ]);
  useEffect(() => {
    active.current?.abort();
    setOrigin(defaults[0] ?? destination);
    setTo(defaults[1] ?? destination);
    setEntries([]);
    setBusy(false);
    setError("");
    return () => active.current?.abort();
    // Coordinate strings are stable across equivalent place objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  function clear() {
    active.current?.abort();
    active.current = null;
    setBusy(false);
    setEntries([]);
    setError("");
  }
  async function compare() {
    clear();
    if (origin.trim().length < 3 || to.trim().length < 3 || origin.trim() === to.trim()) {
      setError("Choose different start and destination locations.");
      return;
    }
    const time = departure ? new Date(departure).getTime() : Date.now();
    if (!Number.isFinite(time) || time < Date.now() - 60000 || time > Date.now() + 100 * 86400000) {
      setError("Choose a departure within the next 100 days, or leave it empty for now.");
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    // Manual searches only. No background requests, retries or persistent route caches.
    const results = await Promise.all(
      transportModes.map(async (mode): Promise<Entry> => {
        try {
          return {
            mode,
            result: await fetchTransport(
              {
                origin: resolveLocation(origin),
                destination: resolveLocation(to),
                mode,
                departureTime: new Date(time).toISOString(),
              },
              controller.signal,
            ),
          };
        } catch (cause) {
          return { mode, error: cause instanceof Error ? cause.message : "Route unavailable." };
        }
      }),
    );
    if (!controller.signal.aborted && active.current === controller) {
      setEntries(results);
      setBusy(false);
    }
  }
  function resolveLocation(value: string) {
    const place = places.find((item) => `${item.name}, ${destination}` === value.trim());
    return place ? `${place.lat},${place.lon}` : value.trim();
  }
  const hasResults = entries.some((entry) => entry.result);
  const shortName = (value: string) =>
    value.endsWith(`, ${destination}`) ? value.slice(0, -destination.length - 2) : value;
  // Design examples belong only to the reviewed Lisbon pair, never to other trips
  // or provider results. Keep them out of the route data/save/PDF contracts.
  const showExample =
    !connected &&
    /^(lisbon|lisboa)(,|$)/i.test(destination.trim()) &&
    shortName(origin) === "Alfama" &&
    shortName(to) === "Lisbon Cathedral";
  const examples = {
    WALK: { minutes: 9, detail: "0.5 km" },
    TRANSIT: { minutes: 12, detail: "Walk + bus" },
    DRIVE: { minutes: 5, detail: "0.7 km" },
  };
  return (
    <section
      aria-label={`Transport comparison for day ${day}`}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Getting around</h4>
        {showExample && (
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Design preview
          </span>
        )}
        {connected && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void compare()}
          >
            {busy && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />}
            {busy ? "Checking…" : "Compare transport"}
          </Button>
        )}
      </div>
      <details className="group mb-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 break-words">{shortName(origin)}</span>
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 break-words">{shortName(to)}</span>
          <span className="ml-1 flex shrink-0 items-center gap-1 text-secondary">
            <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Change route</span>
          </span>
        </summary>
        <div className="space-y-3 pb-1 pt-3">
          <p className="text-xs text-muted-foreground">
            Choose suggested stops or enter a hotel, airport or full address with the city.
          </p>
          <datalist id={`${id}-places`}>
            {places.map((place) => (
              <option key={`${place.lat},${place.lon}`} value={`${place.name}, ${destination}`}>
                {place.name}
              </option>
            ))}
          </datalist>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${id}-from`}>From</Label>
              <Input
                id={`${id}-from`}
                list={`${id}-places`}
                maxLength={300}
                value={origin}
                onChange={(event) => {
                  clear();
                  setOrigin(event.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor={`${id}-to`}>To</Label>
              <Input
                id={`${id}-to`}
                list={`${id}-places`}
                maxLength={300}
                value={to}
                onChange={(event) => {
                  clear();
                  setTo(event.target.value);
                }}
              />
            </div>
          </div>
          {connected && (
            <div>
              <Label htmlFor={`${id}-departure`}>Departure (optional)</Label>
              <Input
                id={`${id}-departure`}
                type="datetime-local"
                value={departure}
                onChange={(event) => {
                  clear();
                  setDeparture(event.target.value);
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty for now. Times use your device’s timezone (
                {Intl.DateTimeFormat().resolvedOptions().timeZone}), independently of trip dates.
                Future driving times are predictions.
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Changing this route leaves your itinerary and budget as they are.
          </p>
        </div>
      </details>
      {error && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          {error}
        </p>
      )}
      <div aria-live="polite" className="grid grid-cols-3 gap-2">
        {(["WALK", "TRANSIT", "DRIVE"] as const).map((mode) => {
          const entry = entries.find((item) => item.mode === mode);
          const route = entry?.result?.route;
          const Icon = icons[mode];
          return (
            <article
              key={mode}
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-4 text-center"
            >
              <Icon aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.7} />
              <span className="text-xs font-medium">{labels[mode]}</span>
              {route || showExample ? (
                <>
                  <span className="text-2xl font-semibold leading-tight tracking-tight text-secondary">
                    {route ? Math.max(1, Math.ceil(route.seconds / 60)) : examples[mode].minutes}
                    <span className="ml-1 text-xs font-normal tracking-normal">min</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {route ? `${(route.meters / 1000).toFixed(1)} km` : examples[mode].detail}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-semibold leading-tight text-muted-foreground">
                    —
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {busy
                      ? "Checking…"
                      : entry?.result
                        ? "No route found"
                        : entry?.error
                          ? "Unavailable"
                          : connected
                            ? "Not checked"
                            : "Not connected"}
                  </span>
                </>
              )}
            </article>
          );
        })}
      </div>
      {!connected && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {showExample
            ? "Example times for this design preview · not live route data."
            : "In-app journey times are not connected yet. Directions are available below."}
        </p>
      )}
      {hasResults && (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p
            translate="no"
            className="whitespace-nowrap font-sans text-sm font-normal tracking-normal"
          >
            Google Maps
          </p>
          <p>
            Walking routes may be missing sidewalks or pedestrian paths. Check conditions and
            access.
          </p>
        </div>
      )}
      <details className="mt-3 border-t pt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Journey details & information</summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          {showExample && (
            <p>
              The displayed minutes and distances are design examples for this route, not calculated
              journeys or schedules. They are not saved to your itinerary, budget or PDF.
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(["WALK", "TRANSIT", "DRIVE"] as const).map((mode) => (
              <a
                key={mode}
                aria-label={`Open ${labels[mode].toLowerCase()} directions`}
                href={transportLink(resolveLocation(origin), resolveLocation(to), mode)}
                target="_blank"
                rel="noreferrer"
                className="text-secondary underline"
              >
                {labels[mode]} directions ↗
              </a>
            ))}
          </div>
          {entries.map((entry) => (
            <div key={entry.mode}>
              <p className="font-medium text-foreground">{labels[entry.mode]}</p>
              {entry.error && <p role="status">{entry.error}</p>}
              {entry.result && !entry.result.route && (
                <p>No route was returned for this mode and departure time.</p>
              )}
              {entry.result?.route && (
                <>
                  {entry.mode === "DRIVE" && (
                    <p>Traffic-aware estimate. Fuel, parking and toll costs are not included.</p>
                  )}
                  {entry.mode === "TRANSIT" && (
                    <>
                      {entry.result.route.transfers !== null && (
                        <p>{entry.result.route.transfers} transfer(s)</p>
                      )}
                      {entry.result.route.walkingMeters !== null && (
                        <p>
                          {(entry.result.route.walkingMeters / 1000).toFixed(1)} km walking included
                        </p>
                      )}
                      {entry.result.route.lines.length > 0 && (
                        <p>{entry.result.route.lines.join(" → ")}</p>
                      )}
                      <p>Check fares and service disruptions with the operator.</p>
                    </>
                  )}
                  {entry.result.route.warnings.map((warning, index) => (
                    <p key={index}>{warning}</p>
                  ))}
                </>
              )}
            </div>
          ))}
          {hasResults && (
            <p>
              Checked{" "}
              {new Date(entries.find((entry) => entry.result)!.result!.checkedAt).toLocaleString()}{" "}
              · {departure ? "Selected departure time" : "Departing now"}.
            </p>
          )}
          <p>
            Direction links open the chosen mode in Google Maps. Confirm the route, access and
            departure time there.
          </p>
          <p>
            In-app comparisons send the two locations, travel modes and departure time through our
            backend to Google Maps. Results stay in this view and are not saved to your trip or PDF.
          </p>
          <p>
            <a
              className="underline"
              href="https://maps.google.com/help/terms_maps/"
              target="_blank"
              rel="noreferrer"
            >
              Google Maps Terms
            </a>
            {" · "}
            <a
              className="underline"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Google Privacy Policy
            </a>
          </p>
        </div>
      </details>
    </section>
  );
}
