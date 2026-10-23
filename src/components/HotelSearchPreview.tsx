import { useEffect, useId, useRef, useState } from "react";
import { Building2, Search } from "lucide-react";
import { hotelSearchEndpoint, searchHotelPreviews } from "@/lib/hotel-search";
import type { HotelSearchResult } from "../../supabase/functions/_shared/hotel-search";
import { endDate } from "@/lib/planning";
import { bookingSearch, type StayBrief } from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/** Deliberately session-only: test offers must never become saved quotes or PDF prices. */
export function HotelSearchPreview({ brief, allowance }: { brief: StayBrief; allowance: number }) {
  const id = useId();
  const [city, setCity] = useState(brief.destination.split(",")[0]?.trim() ?? "");
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HotelSearchResult | null>(null);
  const pending = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const configured = !!hotelSearchEndpoint();
  useEffect(
    () => () => {
      sequence.current++;
      pending.current?.abort();
    },
    [],
  );
  function reset() {
    sequence.current++;
    pending.current?.abort();
    setBusy(false);
    setResult(null);
    setError("");
  }
  async function search(event: React.FormEvent) {
    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const request = ++sequence.current;
    setBusy(true);
    setError("");
    setResult(null);
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    try {
      const response = await searchHotelPreviews(
        {
          city,
          countryCode: country,
          guestNationality: nationality,
          checkin: brief.start,
          checkout: endDate(brief.start, brief.days),
          travelers: brief.travelers,
          currency: brief.currency,
          budget: allowance,
        },
        controller.signal,
      );
      if (sequence.current === request) setResult(response);
    } catch (cause) {
      if (sequence.current === request)
        setError(
          controller.signal.aborted
            ? "The preview took too long. Please try again. Your plan is unchanged."
            : cause instanceof Error
              ? cause.message
              : "Hotel previews are unavailable. Please try later.",
        );
    } finally {
      window.clearTimeout(timeout);
      if (sequence.current === request) setBusy(false);
    }
  }
  return (
    <section aria-label="Hotel provider preview" className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
        <div>
          <h3 className="text-lg font-semibold">Hotel search preview</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {configured
              ? "Sandbox preview · test prices only, no booking or payment."
              : "Provider connection pending · live hotel offers are not available yet."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Hotel allowance {dailyMoney(allowance, brief.currency)} · whole group · {brief.days - 1}{" "}
            nights
          </p>
        </div>
      </div>
      {configured ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-secondary">
            Try a provider sandbox search
          </summary>
          <p className="mt-3 text-xs text-muted-foreground">
            Searches use two adults per room, with a separate room for an odd traveler. All
            travelers are adults. Preview results are not saved or included in your PDF, and do not
            change your budget.
          </p>
          <form className="mt-4 space-y-4" onSubmit={search}>
            <div>
              <Label htmlFor={`${id}-city`}>Hotel search city</Label>
              <Input
                id={`${id}-city`}
                value={city}
                minLength={2}
                maxLength={120}
                required
                onChange={(e) => {
                  reset();
                  setCity(e.target.value);
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${id}-country`}>Destination country code</Label>
                <Input
                  id={`${id}-country`}
                  placeholder="PT"
                  pattern="[A-Z]{2}"
                  minLength={2}
                  maxLength={2}
                  required
                  value={country}
                  onChange={(e) => {
                    reset();
                    setCountry(e.target.value.toUpperCase());
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Two letters, e.g. PT for Portugal.
                </p>
              </div>
              <div>
                <Label htmlFor={`${id}-nationality`}>Lead traveler's nationality code</Label>
                <Input
                  id={`${id}-nationality`}
                  placeholder="DE"
                  pattern="[A-Z]{2}"
                  minLength={2}
                  maxLength={2}
                  required
                  value={nationality}
                  onChange={(e) => {
                    reset();
                    setNationality(e.target.value.toUpperCase());
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Two letters, e.g. DE for Germany. Required for provider pricing.
                </p>
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={busy || allowance <= 0}>
              <Search className="mr-2 h-4 w-4" />
              {busy ? "Searching sandbox…" : "Search test hotels"}
            </Button>
            {allowance <= 0 && (
              <p className="text-xs">Increase your hotel allowance to compare test hotels.</p>
            )}
          </form>
        </details>
      ) : (
        <a
          className="mt-4 inline-block text-sm text-secondary underline"
          target="_blank"
          rel="noreferrer"
          href={bookingSearch(brief, Math.ceil(brief.travelers / 2))}
        >
          Search hotels on Booking.com ↗
        </a>
      )}
      <div aria-live="polite" aria-busy={busy} className="mt-3 min-h-6 text-sm">
        {busy && <p>Checking test availability within your hotel allowance…</p>}
        {error && <p role="alert">{error}</p>}
        {result && (
          <p>
            {result.offers.length
              ? `${result.offers.length} sandbox previews within your allowance.`
              : "No test hotels matched this allowance in the returned sample. Try another city or allowance, or use the external search."}
          </p>
        )}
      </div>
      {result && (
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {result.offers.map((offer) => (
            <article className="overflow-hidden rounded-xl border" key={offer.id}>
              <div className="flex h-36 items-center justify-center bg-secondary/10">
                {offer.photo ? (
                  <img
                    src={offer.photo}
                    alt={offer.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-secondary" />
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs font-semibold text-secondary">SANDBOX · not bookable</p>
                <h4 className="font-semibold">{offer.name}</h4>
                <p className="text-xs text-muted-foreground">{offer.address}</p>
                {offer.stars !== null && (
                  <p className="text-xs">{offer.stars} property stars · provider supplied</p>
                )}
                <p className="text-xl font-semibold">{dailyMoney(offer.amount, offer.currency)}</p>
                <p className="text-xs text-muted-foreground">
                  Test total · all requested rooms · entire stay. Local taxes may be extra.
                </p>
              </div>
            </article>
          ))}
          <p className="text-xs text-muted-foreground lg:col-span-3">
            Preview checked {new Date(result.checkedAt).toLocaleString()}. Test prices do not
            confirm real availability. No reservation has been made.
          </p>
        </div>
      )}
    </section>
  );
}
