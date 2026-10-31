import { useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  understandDiscovery,
  discoverDestinations,
  discoveryInterest,
  type DiscoveryNeeds,
} from "@/lib/destination-discovery";

type Props = {
  start: string;
  onStartChange?: (start: string) => void;
  onChoose: (choice: {
    destination: string;
    days: number;
    interest: string;
    persona?: "family";
  }) => void;
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
    const complete = !!next.days && (next.warm !== undefined || !!next.activity);
    setReady(complete);
    const matches = discoverDestinations(next, start);
    const reply = !next.days
      ? "Roughly how many days do you have? Try ‘5 days’ or ‘one week’. I can plan up to 30 days."
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
              if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) onStartChange(event.target.value);
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
                onClick={() =>
                  onChoose({
                    destination: place.destination,
                    days: needs.days!,
                    interest: discoveryInterest(needs.activity),
                    ...(needs.activity === "family" ? { persona: "family" as const } : {}),
                  })
                }
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
