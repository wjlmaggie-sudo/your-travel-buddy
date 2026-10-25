import { OfferImage } from "./OfferImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { childCount } from "../../supabase/functions/_shared/travel-persona";
import {
  liveHotelInput,
  type LiveHotelResult,
} from "../../supabase/functions/_shared/serpapi-hotels";
import { searchLiveHotels } from "@/lib/live-hotel-search";
import { hotelSuggestions } from "@/lib/travel-suggestions";
import { endDate } from "@/lib/planning";
import {
  bookingSearch,
  requestedRooms,
  stayScope,
  type StayBrief,
  type StayChoice,
} from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
export function LiveHotelSearch({
  brief,
  allowance,
  active = false,
  chosen,
  onChoose,
  onContinue,
  onEditTrip,
}: {
  brief: StayBrief;
  allowance: number;
  active?: boolean;
  chosen?: StayChoice | null | undefined;
  onChoose?: (choice: StayChoice | null) => void;
  onContinue?: (() => void) | undefined;
  onEditTrip?: (() => void) | undefined;
}) {
  const rooms = requestedRooms(brief),
    children = childCount(brief),
    missingAges = !!brief.childrenAgeRanges?.length;
  const query = useMemo(
    () => ({
      destination: brief.destination,
      checkin: brief.start,
      checkout: endDate(brief.start, brief.days),
      adults: brief.travelers - children,
      childrenAges: brief.childrenAges ?? [],
      currency: brief.currency,
    }),
    [
      brief.destination,
      brief.start,
      brief.days,
      brief.travelers,
      children,
      brief.childrenAges,
      brief.currency,
    ],
  );
  const identity = JSON.stringify([query, missingAges, rooms]);
  const [state, setState] = useState<{
    identity: string;
    result?: LiveHotelResult;
    error?: string;
    busy?: boolean;
  } | null>(null);
  const [refresh, setRefresh] = useState(0),
    controller = useRef<AbortController | null>(null);
  const valid = liveHotelInput.safeParse(query).success && !missingAges && rooms === 1;
  useEffect(() => {
    if (!active || !valid) return;
    const current = new AbortController();
    controller.current = current;
    setState({ identity, busy: true });
    void searchLiveHotels(query, current.signal)
      .then((result) => {
        if (!current.signal.aborted) setState({ identity, result });
      })
      .catch((cause) => {
        if (!current.signal.aborted)
          setState({
            identity,
            error: cause instanceof Error ? cause.message : "Hotel search unavailable.",
          });
      });
    return () => current.abort();
  }, [active, identity, valid, refresh]);
  const current = state?.identity === identity ? state : null;
  const available = current?.result?.offers ?? [],
    within = available.filter((o) => o.amount <= allowance);
  const suggestions = hotelSuggestions(within.length >= 3 ? within : available);
  const matched =
    chosen &&
    chosen.scope === stayScope(brief) &&
    current?.result?.offers.some((o) => o.name === chosen.name && o.amount === chosen.amount);
  return (
    <section aria-label="Live hotel search" className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Step 3 · Hotels
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Three stays. Your choice.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {brief.destination} · {brief.days - 1} nights · {brief.travelers} travelers · {rooms}{" "}
          {rooms === 1 ? "room" : "rooms"}
        </p>
        <p className="mt-1 text-sm text-secondary">
          Hotel allowance: {dailyMoney(allowance, brief.currency)} for the whole stay
        </p>
      </div>
      {!valid && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          {missingAges
            ? "Exact child ages are needed for live hotel prices. Add them in trip preferences."
            : rooms > 1
              ? `You requested ${rooms} rooms. Live search currently supports one room; search all rooms together on Booking.com.`
              : "Check your travel dates and group size for hotel prices."}
          <Button variant="link" onClick={onEditTrip}>
            Edit trip details
          </Button>
          <a
            className="block text-secondary underline"
            href={bookingSearch(brief, rooms)}
            target="_blank"
            rel="noreferrer"
          >
            Search all guests on Booking.com ↗
          </a>
        </div>
      )}
      {current?.busy && (
        <div role="status" className="rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">Finding your three hotel suggestions…</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Comparing whole-stay prices and guest ratings.
          </p>
        </div>
      )}
      {current?.error && (
        <div role="alert" className="rounded-xl border p-4 text-sm">
          <p>{current.error}</p>
          <Button variant="outline" className="mt-3" onClick={() => setRefresh((v) => v + 1)}>
            Try hotel search again
          </Button>
        </div>
      )}
      {current?.result && (
        <>
          {!suggestions.length && (
            <p>
              No hotels with complete stay prices were returned. Try a nearby destination in your
              trip details.
            </p>
          )}
          {suggestions.length > 0 && suggestions.length < 3 && (
            <p className="text-sm text-muted-foreground">
              Only {suggestions.length} priced{" "}
              {suggestions.length === 1 ? "hotel was" : "hotels were"} returned for these dates.
            </p>
          )}
          <div className="offer-grid grid gap-4">
            {suggestions.map(({ label, detail, offer }) => {
              const selected =
                chosen?.name === offer.name &&
                chosen.amount === offer.amount &&
                chosen.scope === stayScope(brief);
              return (
                <article
                  key={offer.id}
                  className={`visual-offer flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card ${selected ? "ring-2 ring-secondary" : ""}`}
                >
                  <OfferImage src={offer.photo} alt={offer.name} />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                      {label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
                    <h3 className="mt-3 text-xl font-semibold">{offer.name}</h3>
                    <p className="mt-2 text-sm">
                      {offer.rating !== null
                        ? `${offer.rating}/5 guest rating`
                        : "Guest rating unavailable"}
                      {offer.stars !== null ? ` · ${offer.stars} stars` : ""}
                    </p>
                    <p className="mt-4 text-2xl font-semibold">
                      {dailyMoney(offer.amount, offer.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Entire stay · one room ·{" "}
                      {offer.taxesIncluded ? "listed taxes included" : "taxes to confirm"}
                    </p>
                    {offer.amount > allowance && (
                      <p className="mt-2 text-xs text-primary">
                        {dailyMoney(offer.amount - allowance, brief.currency)} above hotel allowance
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      <Button
                        className="w-full shrink-0 whitespace-nowrap px-3"
                        variant={selected ? "secondary" : "outline"}
                        onClick={() =>
                          onChoose?.({
                            name: offer.name,
                            type: "Hotel",
                            amount: offer.amount,
                            unit: "stay",
                            rooms: 1,
                            extras: 0,
                            scope: stayScope(brief),
                            evidence: "live-search",
                            checkedAt: current.result!.checkedAt,
                          })
                        }
                      >
                        {selected ? "Selected hotel" : "Choose this hotel"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Advertised whole-stay prices via Google Hotels · checked{" "}
            {new Date(current.result.checkedAt).toLocaleString()}. Room types, beds, cancellation
            terms and local charges must be confirmed before booking.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <a
              className="text-sm text-secondary underline"
              href={current.result.searchUrl}
              target="_blank"
              rel="noreferrer"
            >
              Compare all hotel prices ↗
            </a>
            <Button disabled={!matched} onClick={onContinue}>
              Continue to attractions →
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
