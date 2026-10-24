import { LiveHotelSearch } from "./LiveHotelSearch";
import { childCount, childAgeDescription } from "../../supabase/functions/_shared/travel-persona";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { hotelSearchEndpoint, hotelSearchMode } from "@/lib/hotel-search";
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
import { bookingSearch, requestedRooms, type StayBrief } from "@/lib/stay-planning";
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

/** Search results stay in session memory until a separate booking integration is available. */
function HotelProviderPreview({
  brief,
  allowance,
  active = false,
}: {
  brief: StayBrief;
  allowance: number;
  active?: boolean;
}) {
  const id = useId();
  const production = hotelSearchMode() === "production";
  const [nationality, setNationality] = useState(production ? "" : "US");
  const [override, setOverride] = useState<{ destination: string; id: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<Preview | null>(null);
  const lastInput = useRef<HotelSearchInput | null>(null);
  const configured = !!hotelSearchEndpoint();
  const rooms = requestedRooms(brief);
  const hasChildren = childCount(brief) > 0;
  const context = useMemo(
    () => ({
      destination: brief.destination,
      start: brief.start,
      days: brief.days,
      travelers: brief.travelers,
      rooms,
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
      rooms,
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
  const busy =
    current?.phase === "loading" ||
    (active && configured && !!nationality && allowance > 0 && !current);

  useEffect(() => {
    if (
      !active ||
      !configured ||
      !context.nationality ||
      hasChildren ||
      context.allowance <= 0 ||
      context.days <= 1
    )
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
          rooms: context.rooms,
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
          {brief.travelers} travelers in {rooms} {rooms === 1 ? "room" : "rooms"}, including
          children aged {childAgeDescription(brief)}.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Child occupancy is not supported by the current hotel integration. Your itinerary uses the
          entered ages, but we will not show adult-only quotes as family prices. Confirm room
          arrangements and the complete price with the booking provider.
        </p>
        <a
          className="mt-3 inline-block text-sm text-secondary underline"
          href={bookingSearch(brief, rooms)}
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
            Up to {dailyMoney(allowance, brief.currency)} total · {brief.days - 1} nights · {rooms}{" "}
            {rooms > 1 ? "rooms" : "room"}
          </p>
          {configured && (
            <p className="mt-2 text-xs text-muted-foreground">
              {production
                ? "Live rates from Nuitee · prices and availability can change."
                : `Sandbox prices · sample traveler nationality: ${countryName(nationality)} · no booking or payment.`}
            </p>
          )}
        </div>
      </div>
      {configured && (
        <>
          {production && (
            <div className="mt-4">
              <Label htmlFor={`${id}-live-nationality`}>Lead traveler’s nationality</Label>
              <select
                id={`${id}-live-nationality`}
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={nationality}
                onChange={(event) => setNationality(event.target.value)}
              >
                <option value="">Choose nationality to search live rates</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Hotels may set rates by nationality. Use the lead traveler’s actual nationality.
              </p>
            </div>
          )}
          <div aria-live="polite" aria-busy={busy} className="mt-4 min-h-6 text-sm">
            {allowance <= 0 ? (
              <p>Increase your hotel allowance to see suggestions.</p>
            ) : !nationality ? (
              <p>Choose the lead traveler’s nationality above to find hotels.</p>
            ) : busy ? (
              <p>Finding hotels in {brief.destination} within your planned hotel budget…</p>
            ) : current?.error ? (
              <p role="alert">{current.error}</p>
            ) : result ? (
              <p>
                {result.offers.length
                  ? `${result.offers.length} ${result.sandbox ? "sandbox" : "live"} hotel suggestions within your hotel budget.`
                  : "No hotels in the returned results fit this hotel budget. Adjust your trip budget, or compare on the external search."}
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
                Country information is matched from your trip destination. Adults are divided evenly
                across your requested rooms. Results do not change your saved budget or PDF. Rates
                must be confirmed before booking.
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
              {!production && (
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
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || !nationality || allowance <= 0}
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
                  <p className="text-xs font-semibold text-secondary">
                    {result.sandbox ? "SANDBOX · not bookable" : "LIVE · Nuitee"}
                  </p>
                  <h4 className="font-semibold">{offer.name}</h4>
                  <p className="text-xs text-muted-foreground">{offer.address}</p>
                  {offer.stars !== null && (
                    <p className="text-xs">{offer.stars} property stars · provider supplied</p>
                  )}
                  <p className="text-xl font-semibold">
                    {dailyMoney(offer.amount, offer.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.sandbox ? "Test total" : "Provider total"} · all requested rooms ·
                    entire stay. Local taxes may be extra.
                  </p>
                </div>
              </article>
            ))}
          <p className="text-xs text-muted-foreground lg:col-span-3">
            Checked {new Date(result.checkedAt).toLocaleString()}.{" "}
            {result.sandbox
              ? "Test prices do not confirm real availability."
              : "Prices and availability can change. Confirm taxes, cancellation terms and the final price before booking."}{" "}
            No reservation has been made.
          </p>
        </div>
      )}
      {(!configured || !!current?.error || result?.offers.length === 0) && (
        <a
          className="mt-4 inline-block text-sm text-secondary underline"
          target="_blank"
          rel="noreferrer"
          href={bookingSearch(brief, rooms)}
        >
          Search hotels on Booking.com ↗
        </a>
      )}
    </section>
  );
}

export function HotelSearchPreview(props: {
  brief: StayBrief;
  allowance: number;
  active?: boolean;
}) {
  return import.meta.env["VITE_HOTEL_SEARCH_MODE"] === "serpapi" ? (
    <LiveHotelSearch {...props} />
  ) : (
    <HotelProviderPreview {...props} />
  );
}
