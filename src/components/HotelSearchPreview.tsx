import { childCount, childAgeDescription } from "../../supabase/functions/_shared/travel-persona";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { hotelSearchEndpoint } from "@/lib/hotel-search";
import {
  budgetHotelPreviews,
  forgetHotelPreviews,
  hotelDestinations,
  type HotelDestination,
} from "@/lib/hotel-suggestions";
import { COUNTRIES, countryName } from "@/lib/countries";
import type {
  HotelSearchInput,
  HotelSearchResult,
} from "../../supabase/functions/_shared/hotel-search";
import { endDate } from "@/lib/planning";
import { bookingSearch, type StayBrief } from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

type Preview = {
  key: string;
  phase: "loading" | "ready" | "error";
  locations: HotelDestination[];
  location: HotelDestination | null;
  result: HotelSearchResult | null;
  error: string;
};

/** Provider test offers stay in session memory; they never become saved quotes or PDF prices. */
export function HotelSearchPreview({
  brief,
  allowance,
  active = false,
}: {
  brief: StayBrief;
  allowance: number;
  active?: boolean;
}) {
  const id = useId();
  // A disclosed test profile, never an inference from departure, language or location.
  const [nationality, setNationality] = useState("US");
  const [override, setOverride] = useState<{ destination: string; id: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<Preview | null>(null);
  const lastInput = useRef<HotelSearchInput | null>(null);
  const configured = !!hotelSearchEndpoint();
  const hasChildren = childCount(brief) > 0;
  const context = useMemo(
    () => ({
      destination: brief.destination,
      start: brief.start,
      days: brief.days,
      travelers: brief.travelers,
      childrenAges: brief.childrenAges,
      childrenAgeRanges: brief.childrenAgeRanges,
      currency: brief.currency,
      allowance,
      nationality,
    }),
    [
      brief.destination,
      brief.start,
      brief.days,
      brief.travelers,
      brief.childrenAges,
      brief.childrenAgeRanges,
      brief.currency,
      allowance,
      nationality,
    ],
  );
  const chosenId = override?.destination === context.destination ? override.id : null;
  const key = JSON.stringify([context, chosenId]);
  const current = view?.key === key ? view : null;
  const result = current?.result;
  const busy = current?.phase === "loading" || (active && configured && allowance > 0 && !current);

  useEffect(() => {
    if (!active || !configured || hasChildren || context.allowance <= 0 || context.days <= 1)
      return;
    const controller = new AbortController();
    // Comfort/budget controls can change rapidly. Only the settled visible plan is searched.
    const timer = window.setTimeout(() => {
      const loading: Preview = {
        key,
        phase: "loading",
        locations: [],
        location: null,
        result: null,
        error: "",
      };
      setView(loading);
      void (async () => {
        const locations = await hotelDestinations(context.destination, controller.signal);
        if (controller.signal.aborted) return;
        const location = locations.find((place) => place.id === chosenId) ?? locations[0];
        if (!location)
          throw new Error(
            "We couldn't match your trip destination to a hotel location. You can use the external hotel search, or choose a more specific destination in your trip details.",
          );
        setView({ ...loading, locations, location });
        const input: HotelSearchInput = {
          city: location.city,
          countryCode: location.countryCode,
          guestNationality: context.nationality,
          checkin: context.start,
          checkout: endDate(context.start, context.days),
          travelers: context.travelers,
          currency: context.currency,
          budget: context.allowance,
        };
        lastInput.current = input;
        const next = await budgetHotelPreviews(input);
        if (!controller.signal.aborted)
          setView({ ...loading, phase: "ready", locations, location, result: next });
      })().catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setView((previous) => ({
            ...loading,
            ...(previous?.key === key ? previous : {}),
            phase: "error",
            result: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Hotel suggestions are unavailable. Please try later.",
          }));
      });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, configured, hasChildren, context, chosenId, key, attempt]);

  if (hasChildren)
    return (
      <section aria-label="Hotel provider preview" className="rounded-2xl border bg-card p-5">
        <h3 className="text-lg font-semibold">A stay for your whole family</h3>
        <p className="mt-2 text-sm">
          Hotel budget: {dailyMoney(allowance, brief.currency)} for {brief.days - 1} nights and{" "}
          {brief.travelers} travelers, including children aged {childAgeDescription(brief)}.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Child occupancy is not supported by the current hotel test API. Your itinerary uses the
          entered ages, but we will not show adult-only quotes as family prices. Confirm room
          arrangements and the complete price with the booking provider.
        </p>
        <a
          className="mt-3 inline-block text-sm text-secondary underline"
          href={bookingSearch(brief, Math.ceil(brief.travelers / 2))}
          target="_blank"
          rel="noreferrer"
        >
          Search family hotels on Booking.com ↗
        </a>
      </section>
    );

  return (
    <section aria-label="Hotel provider preview" className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
        <div>
          <h3 className="text-lg font-semibold">Hotels within your plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {configured
              ? "Your destination, dates and travelers are already included."
              : "Provider connection pending · live hotel offers are not available yet."}
          </p>
          <p className="mt-2 text-sm font-medium text-secondary">
            Up to {dailyMoney(allowance, brief.currency)} total · {brief.days - 1} nights ·{" "}
            {Math.ceil(brief.travelers / 2)} {brief.travelers > 2 ? "rooms" : "room"}
          </p>
          {configured && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sandbox prices · sample traveler nationality: {countryName(nationality)} · no booking
              or payment.
            </p>
          )}
        </div>
      </div>
      {configured && (
        <>
          <div aria-live="polite" aria-busy={busy} className="mt-4 min-h-6 text-sm">
            {allowance <= 0 ? (
              <p>Increase your hotel allowance to see suggestions.</p>
            ) : busy ? (
              <p>Finding hotels in {brief.destination} within your planned hotel budget…</p>
            ) : current?.error ? (
              <p role="alert">{current.error}</p>
            ) : result ? (
              <p>
                {result.offers.length
                  ? `${result.offers.length} sandbox hotel suggestions within your hotel budget.`
                  : "No test hotels in the returned sample fit this hotel budget. Adjust your trip budget, or compare on the external search."}
              </p>
            ) : (
              <p>Suggestions load automatically when you open Hotels.</p>
            )}
          </div>
          {current?.location && (
            <p className="mt-2 text-xs text-muted-foreground">
              Hotel location: {current.location.label}
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-secondary">
              Search details (optional)
            </summary>
            <div className="mt-3 space-y-3 rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Country information is matched from your trip destination. Searches use two adults
                per room, with a separate room for an odd traveler. Results are test quotes and do
                not change your saved budget or PDF.
              </p>
              {!!current?.locations.length && current.locations.length > 1 && (
                <div>
                  <Label htmlFor={`${id}-location`}>Matched location</Label>
                  <select
                    id={`${id}-location`}
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={String(current.location?.id ?? "")}
                    onChange={(event) =>
                      setOverride({
                        destination: brief.destination,
                        id: Number(event.target.value),
                      })
                    }
                  >
                    {current.locations.map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor={`${id}-nationality`}>Sample traveler nationality</Label>
                <select
                  id={`${id}-nationality`}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={nationality}
                  onChange={(event) => setNationality(event.target.value)}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  A sample profile is used for sandbox pricing. You can change it to compare test
                  quotes. Real booking would require accurate traveler information.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || allowance <= 0}
                onClick={() => {
                  if (lastInput.current) forgetHotelPreviews(lastInput.current);
                  setAttempt((value) => value + 1);
                }}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh hotel suggestions
              </Button>
              <a
                className="block text-xs text-secondary underline"
                href="https://open-meteo.com/en/docs/geocoding-api"
                target="_blank"
                rel="noreferrer"
              >
                Location matching: Open-Meteo / GeoNames
              </a>
            </div>
          </details>
        </>
      )}
      {result && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {result.offers
            .filter((offer) => offer.currency === brief.currency && offer.amount <= allowance)
            .map((offer) => (
              <article className="overflow-hidden rounded-xl border" key={offer.id}>
                <div className="flex h-36 items-center justify-center bg-secondary/10">
                  {offer.photo ? (
                    <img
                      src={offer.photo}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
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
                  <p className="text-xl font-semibold">
                    {dailyMoney(offer.amount, offer.currency)}
                  </p>
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
      {(!configured || !!current?.error || result?.offers.length === 0) && (
        <a
          className="mt-4 inline-block text-sm text-secondary underline"
          target="_blank"
          rel="noreferrer"
          href={bookingSearch(brief, Math.ceil(brief.travelers / 2))}
        >
          Search hotels on Booking.com ↗
        </a>
      )}
    </section>
  );
}
