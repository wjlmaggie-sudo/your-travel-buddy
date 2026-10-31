import { useQuery } from "@tanstack/react-query";
import { searchGlobalDestinations, GLOBAL_DIRECTORY } from "@/lib/global-discovery";
import { useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  understandDiscovery,
  discoveryChoice,
  discoveryMissing,
  type DiscoveryChoice,
  type DiscoveryNeeds,
} from "@/lib/destination-discovery";

type Props = {
  active?: boolean;
  start: string;
  onStartChange?: (start: string) => void;
  onChoose: (choice: DiscoveryChoice) => void;
};
export function DestinationDiscovery({ start, onChoose, onStartChange, active = true }: Props) {
  const [input, setInput] = useState("");
  const [needs, setNeeds] = useState<DiscoveryNeeds>({});
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [visible, setVisible] = useState(3);
  const [offset, setOffset] = useState(0);
  const [ready, setReady] = useState(false);
  function send(text: string) {
    if (!text.trim()) return;
    const next = understandDiscovery(text, needs);
    setNeeds(next);
    setVisible(3);
    setOffset(0);
    if (next.start && next.start !== start) onStartChange?.(next.start);
    const missing = discoveryMissing(next);
    const complete = !missing && !next.unsupported;
    setReady(complete);
    const reply = missing
      ? missing
      : next.unsupported
        ? "Safari availability cannot be verified by this search. Try hiking, beaches, culture, family outings, surfing, skiing, diving, golf or tennis."
        : "I'll search the global city directory and check public geographic and weather data. The matching locations will appear below; they are not confirmed travel offers.";
    setMessages((current) => [
      ...current.slice(-8),
      { role: "You", text: text.trim().slice(0, 500) },
      { role: "Travel Buddy", text: reply },
    ]);
    setInput("");
  }
  const effectiveStart = onStartChange ? start : (needs.start ?? start);
  const discovery = useQuery({
    queryKey: ["global-discovery", needs, effectiveStart, offset],
    queryFn: ({ signal }) => searchGlobalDestinations(needs, effectiveStart, offset, signal),
    enabled: ready && active,
    staleTime: 600000,
    retry: false,
  });
  const matches = ready ? (discovery.data?.results ?? []) : [];
  return (
    <section aria-label="Destination discovery chat" className="mt-5 space-y-5">
      <div className="rounded-2xl border bg-muted/40 p-5">
        <MessageCircle className="mb-3 h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">No destination yet? Let's find your kind of trip.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell me your rough days and what you enjoy. For example: “5 days somewhere warm with
          hiking”.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Worldwide discovery · free public data, not generative AI. No account or paid key needed.
          Article coverage varies. Temperature references are labelled on each result.
        </p>
      </div>
      {onStartChange && (
        <div className="max-w-xs">
          <label htmlFor="discovery-start" className="text-sm font-medium">
            Rough departure date
          </label>
          <Input
            id="discovery-start"
            type="date"
            className="mt-2"
            value={start}
            onChange={(event) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) {
                onStartChange(event.target.value);
                setNeeds((current) => ({ ...current, start: event.target.value }));
              }
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Used for forecast or historical temperature matching; you can adjust it later.
          </p>
        </div>
      )}
      <div role="log" aria-label="Discovery conversation" aria-live="polite" className="space-y-3">
        {messages.map((message, i) => (
          <div
            key={i}
            className={
              message.role === "You"
                ? "ml-5 rounded-2xl bg-primary/10 p-4 text-sm"
                : "mr-5 rounded-2xl border p-4 text-sm"
            }
          >
            <strong className="mb-1 block text-xs text-muted-foreground">{message.role}</strong>
            {message.text}
          </div>
        ))}
      </div>
      {messages.length > 0 && (
        <aside aria-label="What I understood" className="rounded-2xl border bg-card p-4">
          <h4 className="font-semibold">What I understood</h4>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {[
              ["Duration", needs.days ? `${needs.days} days` : "Not provided"],
              [
                "Weather",
                needs.warm === true
                  ? "Warm / sunny preferred"
                  : needs.warm === false
                    ? "Less heat preferred"
                    : "No preference given",
              ],
              [
                "Activities",
                needs.activities?.length
                  ? needs.activities.join(", ")
                  : needs.family
                    ? "Family outings"
                    : "Not provided",
              ],
              ["Departure", needs.departure ?? "Not provided"],
              [
                "Travelers",
                needs.travelers
                  ? `${needs.travelers} people${needs.childrenCount ? ", including children" : ""}`
                  : "Use group size in the planner",
              ],
              [
                "Children",
                needs.childrenAges
                  ? needs.childrenAges.join(", ") + " years"
                  : needs.childrenCount
                    ? `${needs.childrenCount} · ages needed`
                    : "Not specified",
              ],
              [
                "Budget",
                needs.budget
                  ? `${needs.currency ?? "Planner currency"} ${needs.budget.toLocaleString()} ${needs.budgetPerPerson ? "per person" : "for the group"}`
                  : "Optional · suggest in planner",
              ],
              ["Departure date", needs.start ?? start],
              ["Destination area", needs.country ?? needs.region ?? "Any region"],
              ["Avoid countries", needs.excludedCountries?.join(", ") || "None specified"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Tell me a correction, such as “4 days instead”, “not Spain”, “Europe only”, or “budget
            €1,200”. These details only enter your trip when you choose a destination.
          </p>
        </aside>
      )}
      <details className="rounded-2xl border p-4 text-sm">
        <summary className="cursor-pointer font-medium">About this chat & live AI</summary>
        <p className="mt-3 text-muted-foreground">
          This chat works on the live website with no subscription or API charge. It recognizes
          supported travel phrases and remembers your details during this session. It is not a
          general-purpose AI model. Search draws from {GLOBAL_DIRECTORY.cities.toLocaleString()}{" "}
          city and town bases in {GLOBAL_DIRECTORY.countries} countries and territories in the
          GeoNames directory. Public geographic and weather checks run on up to 12 candidates per
          batch; this is not a claim to check the entire world at once. Choose a country or region,
          or search another batch to explore further. Nearby activities can be up to 30 km from the
          city. Article topic matches are not proof of opening, booking availability or child
          suitability. Warm means an average daily high of at least 20°C in the stated reference
          period. Outside the short forecast window, one completed year's historical month is a
          reference only, not a climate normal or a forecast.
        </p>
        <p className="mt-2 text-muted-foreground">
          A hosted AI model would require a separate provider and available usage allowance; a
          permanently free public service is not connected. Running an open model on your own
          computer avoids per-request provider fees but requires a model download and suitable
          hardware, and does not automatically serve other website visitors. Paid AI remains
          disabled.
        </p>
      </details>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="discovery-message" className="text-sm font-medium">
            Tell Travel Buddy what you have in mind
          </label>
          <Input
            id="discovery-message"
            className="mt-2 h-12"
            value={input}
            maxLength={500}
            placeholder="A week, warm weather, family activities…"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-12" disabled={!input.trim()}>
          Send
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {["5 days somewhere warm", "One week hiking", "3 days with family"].map((text) => (
          <Button type="button" key={text} size="sm" variant="outline" onClick={() => send(text)}>
            {text}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setNeeds({});
            setMessages([]);
            setReady(false);
            setOffset(0);
            setVisible(3);
            setInput("");
          }}
        >
          Start over
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Travel month:{" "}
        {new Date(`${start}T12:00:00Z`).toLocaleDateString("en", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })}{" "}
        · forecast or historical reference is labelled on each result. Short trips may be
        impractical with long flights; add your departure city before comparing travel options.
      </p>
      {ready && (
        <div aria-live="polite" className="rounded-2xl border p-4 text-sm">
          {discovery.isFetching ? (
            <p role="status">
              Checking a batch of global locations, nearby activity references and temperature
              references… This can take around 30 seconds.
            </p>
          ) : discovery.isError ? (
            <>
              <p role="alert">{discovery.error.message}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => void discovery.refetch()}
              >
                Retry public-data search
              </Button>
            </>
          ) : discovery.data ? (
            <>
              <p>
                Checked {discovery.data.scanned} city bases in this batch from{" "}
                {discovery.data.total.toLocaleString()} matching directory locations. This is a
                bounded search, not every destination worldwide.
              </p>
              {!matches.length && (
                <p className="mt-2">
                  No match was verified in this batch. Try another batch or refine your region,
                  country, activity or temperature preference. No demonstration destinations have
                  been substituted.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}
      {matches.length > 0 && (
        <div className="space-y-3" aria-label="Suggested destinations">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(visible, matches.length)} of {matches.length} matching destination
            ideas. Flight routes, prices and entry requirements still need checking.
          </p>
          {matches.slice(0, visible).map((place) => (
            <article key={place.destination} className="rounded-2xl border bg-card p-5">
              <h4 className="text-lg font-semibold">{place.destination}</h4>
              <p className="mt-1 text-xs font-medium text-primary">
                {needs.days} days · public-data match
                {needs.activity ? ` · ${needs.activity}` : ""}
              </p>
              <p className="mt-2 text-sm">{place.idea}</p>
              <ul
                className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground"
                aria-label={`Why ${place.destination} matches`}
              >
                {place.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {place.temperature && (
                <p className="mt-3 rounded-xl bg-secondary/5 p-3 text-xs">
                  {place.temperature.label}. Average daily high {place.temperature.high}°C / low{" "}
                  {place.temperature.low}°C across {place.temperature.days} returned days.{" "}
                  <a
                    className="underline"
                    href={place.temperature.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open-Meteo data
                  </a>
                  . Historical model data does not predict your trip.
                </p>
              )}
              {place.evidence.length > 0 && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer font-medium">
                    Nearby article references used for this match
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {place.evidence.map((e) => (
                      <li key={e.source + e.tag}>
                        <a className="underline" href={e.source} target="_blank" rel="noreferrer">
                          {e.name}
                        </a>{" "}
                        · {e.tag}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {place.reference && (
                <p className="mt-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                  Planner reference: €{place.reference.low.toLocaleString()}–€
                  {place.reference.high.toLocaleString()} for your group, including a broad €
                  {place.reference.flights.toLocaleString()} flight reserve. These are reusable
                  planning allowances, not researched local averages or verified offers.
                  {needs.currency && needs.currency !== "EUR"
                    ? " Your budget uses a different currency and has not been compared."
                    : ""}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {place.caution}
                {needs.days! < place.minDays
                  ? ` Better with at least ${place.minDays} days, excluding long transfers.`
                  : ""}
              </p>
              <a
                className="mt-3 inline-block text-xs underline"
                href={place.source}
                target="_blank"
                rel="noreferrer"
              >
                GeoNames location reference ↗
              </a>
              <Button
                type="button"
                className="mt-4 flex"
                onClick={() =>
                  onChoose(
                    discoveryChoice(
                      { ...needs, ...(needs.start ? { start: effectiveStart } : {}) },
                      place.destination,
                    ),
                  )
                }
              >
                Plan {place.destination.split(",")[0]} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </article>
          ))}
          {visible < matches.length && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisible((count) => count + 3)}
            >
              Show more destinations
            </Button>
          )}
        </div>
      )}
      {ready && discovery.data?.nextOffset != null && !discovery.isFetching && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOffset(discovery.data!.nextOffset!);
            setVisible(3);
          }}
        >
          Search another global batch
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        Location data:{" "}
        <a className="underline" href="https://www.geonames.org/" target="_blank" rel="noreferrer">
          GeoNames · CC BY 4.0
        </a>
        . Activity references:{" "}
        <a
          className="underline"
          href="https://en.wikipedia.org/wiki/Wikipedia:Copyrights"
          target="_blank"
          rel="noreferrer"
        >
          Wikipedia contributors · CC BY-SA
        </a>
        . Temperature data:{" "}
        <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        , free hosted API for non-commercial use within its limits.
      </p>
    </section>
  );
}
