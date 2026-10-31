import { useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  understandDiscovery,
  discoverDestinations,
  discoveryChoice,
  discoveryMissing,
  type DiscoveryChoice,
  type DiscoveryNeeds,
} from "@/lib/destination-discovery";

type Props = {
  start: string;
  onStartChange?: (start: string) => void;
  onChoose: (choice: DiscoveryChoice) => void;
};
export function DestinationDiscovery({ start, onChoose, onStartChange }: Props) {
  const [input, setInput] = useState("");
  const [needs, setNeeds] = useState<DiscoveryNeeds>({});
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [ready, setReady] = useState(false);
  function send(text: string) {
    if (!text.trim()) return;
    const next = understandDiscovery(text, needs);
    setNeeds(next);
    if (next.start && next.start !== start) onStartChange?.(next.start);
    const missing = discoveryMissing(next);
    const complete = !missing;
    setReady(complete);
    const matches = discoverDestinations(next, next.start ?? start);
    const reply = missing
      ? missing
      : next.unsupported || (next.warm === false && !next.activity)
        ? "What would you like to do? My current collection covers hiking, beaches, surfing, culture and family outings. That specific activity is not covered yet; I won't suggest an unrelated destination."
        : !complete
          ? "What sounds good: warm weather, hiking, beaches, surfing, culture, or activities with children?"
          : !matches.length
            ? "I couldn't match all those preferences in my small destination collection for this month. Try another activity or change your departure date in the planner."
            : `${matches.length === 1 ? "Here is 1 idea" : `Here are ${matches.length} ideas`} for ${next.days} days, using the travel month shown below. Tell me another preference to refine them, or choose a destination.`;
    setMessages((current) => [
      ...current.slice(-8),
      { role: "You", text: text.trim().slice(0, 500) },
      { role: "Travel Buddy", text: reply },
    ]);
    setInput("");
  }
  const matches = ready ? discoverDestinations(needs, start) : [];
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
          Free guided chat · curated matching, not live AI. No account or API key needed. Seasonal
          guidance is not a forecast or a price quote.
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
            Used for seasonal matching; you can adjust it later.
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
                  ? `${needs.travelers} people, including children`
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
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Tell me a correction, such as “4 days instead”, “from Berlin”, or “budget €1,200”. These
            details only enter your trip when you choose a destination.
          </p>
        </aside>
      )}
      <details className="rounded-2xl border p-4 text-sm">
        <summary className="cursor-pointer font-medium">About this chat & live AI</summary>
        <p className="mt-3 text-muted-foreground">
          This chat works on the live website with no subscription or API charge. It recognizes
          supported travel phrases and remembers your details during this session. It is not a
          general-purpose AI model. Its current destination collection is Lisbon, Madeira and
          Tenerife.
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
        · seasonal guidance only. Short trips may be impractical with long flights; add your
        departure city before comparing travel options.
      </p>
      {matches.length > 0 && (
        <div className="space-y-3" aria-label="Suggested destinations">
          {matches.map((place) => (
            <article key={place.destination} className="rounded-2xl border bg-card p-5">
              <h4 className="text-lg font-semibold">{place.destination}</h4>
              <p className="mt-1 text-xs font-medium text-primary">
                {needs.days} days{needs.warm ? " · seasonal warmth shortlist" : ""}
                {needs.activity ? ` · ${needs.activity}` : ""}
              </p>
              <p className="mt-2 text-sm">{place.idea}</p>
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
                Official visitor information ↗
              </a>
              <Button
                type="button"
                className="mt-4 flex"
                onClick={() => onChoose(discoveryChoice(needs, place.destination))}
              >
                Plan {place.destination.split(",")[0]} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
