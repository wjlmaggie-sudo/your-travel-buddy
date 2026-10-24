import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { childCount } from "../../supabase/functions/_shared/travel-persona";
import {
  liveHotelInput,
  googleHotelSearch,
  type LiveHotelResult,
} from "../../supabase/functions/_shared/serpapi-hotels";
import { searchLiveHotels } from "@/lib/live-hotel-search";
import { endDate } from "@/lib/planning";
import { bookingSearch, type StayBrief } from "@/lib/stay-planning";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
export function LiveHotelSearch({
  brief,
  allowance,
  active = false,
}: {
  brief: StayBrief;
  allowance: number;
  active?: boolean;
}) {
  const children = childCount(brief);
  const missingAges = !!brief.childrenAgeRanges?.length;
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
  const identity = JSON.stringify([query, missingAges]);
  const [state, setState] = useState<{
    identity: string;
    result?: LiveHotelResult;
    error?: string;
    busy?: boolean;
  } | null>(null);
  const current = state?.identity === identity ? state : null;
  const valid = liveHotelInput.safeParse(query).success && !missingAges;
  const offers = current?.result?.offers.filter((o) => o.amount <= allowance) ?? [];
  async function search() {
    setState({ identity, busy: true });
    try {
      const result = await searchLiveHotels(query, AbortSignal.timeout(55000));
      setState({ identity, result });
    } catch (cause) {
      setState({
        identity,
        error: cause instanceof Error ? cause.message : "Hotel search unavailable.",
      });
    }
  }
  return (
    <section aria-label="Live hotel search" className="rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-5 w-5 text-secondary" />
        <div>
          <h3 className="text-lg font-semibold">Hotels within your plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Hotels results via SerpApi · advertised prices, subject to change.
          </p>
          <p className="mt-2 text-sm font-medium text-secondary">
            Up to {dailyMoney(allowance, brief.currency)} · {brief.days - 1} nights · {query.adults}{" "}
            adults{children ? ` · ${children} children` : ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            One-room search. Confirm room capacity, taxes and final availability on the booking
            website.
          </p>
        </div>
      </div>
      {!valid && (
        <p className="mt-4 text-sm">
          {missingAges
            ? "Exact child ages are needed for live hotel prices. Your plan currently uses age ranges; use the family hotel search below."
            : "This search supports 1–6 adults and stays of 1–29 nights. Check your trip details, or use the external hotel search."}
        </p>
      )}
      {allowance <= 0 && (
        <p className="mt-4 text-sm">Increase your hotel allowance to see suggestions.</p>
      )}
      <Button
        className="mt-4"
        disabled={!active || !valid || allowance <= 0 || !!current?.busy}
        onClick={() => void search()}
      >
        <Search className="mr-2 h-4 w-4" />
        {current?.busy ? "Searching hotels…" : "Search real hotels"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Searches use the shared free hotel and flight allowance. No reservation or payment is made.
      </p>
      <div aria-live="polite" aria-busy={!!current?.busy}>
        {current?.error && (
          <p role="alert" className="mt-4 text-sm">
            {current.error}
          </p>
        )}
        {current?.result && (
          <>
            <p className="mt-4 text-sm">
              {offers.length
                ? `${offers.length} hotels within your allowance.`
                : "No hotels with complete stay prices in these results fit your allowance."}
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className="overflow-hidden rounded-xl border">
                  {offer.photo && (
                    <img
                      src={offer.photo}
                      alt={offer.name}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-semibold text-secondary">
                      GOOGLE HOTELS · via SerpApi
                    </p>
                    <h4 className="font-semibold">{offer.name}</h4>
                    {offer.description && (
                      <p className="text-xs text-muted-foreground">{offer.description}</p>
                    )}
                    {offer.stars !== null && (
                      <p className="text-xs">{offer.stars} property stars</p>
                    )}
                    {offer.rating !== null && (
                      <p className="text-xs">Guest rating {offer.rating}/5</p>
                    )}
                    <p className="text-xl font-semibold">
                      {dailyMoney(offer.amount, offer.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Entire stay · one room ·{" "}
                      {offer.taxesIncluded
                        ? "includes listed taxes and fees"
                        : "tax inclusion not confirmed"}
                      . Additional local charges may apply.
                    </p>
                    {offer.website && (
                      <a
                        className="inline-block text-sm text-secondary underline"
                        href={offer.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Property website ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Retrieved {new Date(current.result.checkedAt).toLocaleString()}
              {current.result.sourceTime ? ` · source time: ${current.result.sourceTime}` : ""}.
              Results may be cached. Prices must be reconfirmed before booking.
            </p>
            <a
              className="mt-3 inline-block text-sm text-secondary underline"
              href={current.result.searchUrl}
              target="_blank"
              rel="noreferrer"
            >
              Compare on Google Hotels ↗
            </a>
          </>
        )}
      </div>
      {(!valid || current?.error) && (
        <a
          className="mt-4 block text-sm text-secondary underline"
          href={bookingSearch(brief, Math.ceil(brief.travelers / 2))}
          target="_blank"
          rel="noreferrer"
        >
          Search {children ? "family " : ""}hotels on Booking.com ↗
        </a>
      )}
      {!current?.result && valid && (
        <a
          className="mt-3 block text-xs text-secondary underline"
          href={googleHotelSearch(query)}
          target="_blank"
          rel="noreferrer"
        >
          Open Google Hotels search ↗
        </a>
      )}
    </section>
  );
}
