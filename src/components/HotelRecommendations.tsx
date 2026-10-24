import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { useId } from "react";
import { Building2, Check, Star } from "lucide-react";
import { connectedBudget, demoHotels } from "@/lib/travel-workspace";
import type { Journey } from "@/lib/journey-planning";
import {
  bookingSearch,
  requestedRooms,
  stayScope,
  type StayBrief,
  type StayChoice,
} from "@/lib/stay-planning";
import { HotelSearchPreview } from "./HotelSearchPreview";
import { hotelSearchEndpoint } from "@/lib/hotel-search";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
export function HotelRecommendations({
  brief,
  journey,
  stay,
  onChoose,
  onRoomsChange,
  active = false,
}: {
  brief: StayBrief;
  journey: Journey;
  stay?: StayChoice | null | undefined;
  onChoose: (next: StayChoice | null) => void;
  active?: boolean;
  onRoomsChange?: (rooms: number) => void;
}) {
  const id = useId();
  brief = { ...brief, hotelRooms: journey.hotelRooms ?? brief.hotelRooms };
  const rooms = requestedRooms(brief);
  const adults = Math.max(1, brief.travelers - childCount(brief));
  const allowance = connectedBudget(brief, journey).original.allowance;
  if (brief.days === 1)
    return (
      <div className="rounded-xl border p-5">
        <h2 className="text-2xl">No overnight stay needed.</h2>
        <p className="mt-2 text-sm">This is a day trip. Your hotel allocation is zero.</p>
      </div>
    );
  return (
    <section className="space-y-5" aria-label="Hotel recommendations">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Your home away from home
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Find a stay that fits.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {brief.destination} · {brief.days - 1} nights · {brief.travelers} travelers · whole-stay
          totals
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <label htmlFor={`${id}-rooms`} className="text-sm font-medium">
          Rooms needed
        </label>
        <select
          id={`${id}-rooms`}
          className="mt-2 block h-10 w-full rounded-md border bg-background px-3 sm:max-w-48"
          value={rooms}
          onChange={(event) => onRoomsChange?.(Number(event.target.value))}
          disabled={!onRoomsChange}
        >
          {Array.from({ length: adults }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1} {i === 0 ? "room" : "rooms"}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted-foreground">
          The hotel allowance covers all rooms for the entire stay. At least one adult per room;
          confirm occupancy and child ages with the provider. Changing rooms makes earlier hotel
          quotes out of date.
        </p>
      </div>
      <HotelSearchPreview
        key={`${stayScope(brief)}:${allowance}`}
        brief={brief}
        allowance={allowance}
        active={active}
      />
      {!hotelSearchEndpoint() && !childCount(brief) && (
        <details open className="space-y-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Try demonstration hotels (optional)
          </summary>
          <p className="rounded-xl border border-amber-600/30 bg-amber-100/30 p-4 text-sm">
            <strong>Demonstration hotels · fictional properties.</strong> Names, locations, ratings
            and prices are simulated. Illustrations are not property photographs. Use the booking
            search or add a current quote below for a real stay.
          </p>
          <div className="offer-grid grid gap-4">
            {demoHotels(brief, journey).map((option, index) => {
              const active =
                stay?.scope === stayScope(brief) &&
                stay?.name === option.name &&
                stay.amount === option.amount &&
                stay.evidence === "demo";
              return (
                <article
                  className={`overflow-hidden rounded-2xl border bg-card shadow-card ${active ? "ring-2 ring-secondary" : ""}`}
                  key={option.name}
                >
                  <div
                    role="img"
                    aria-label={`Illustration of a fictional hotel, not ${brief.destination} property photography`}
                    className={`flex h-40 flex-col items-center justify-center gap-3 ${index === 0 ? "bg-amber-100/50" : index === 1 ? "bg-secondary/15" : "bg-sky-100/60"}`}
                  >
                    <Building2 className="h-14 w-14 text-secondary/60" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Illustration · fictional stay
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-secondary">{option.tag}</p>
                    <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-950">
                      DEMO · no live availability
                    </span>
                    <h3 className="mt-3 text-xl font-semibold">{option.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {option.location}, {brief.destination}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 text-primary" />
                      {option.rating}
                    </p>
                    <p className="mt-4 text-2xl font-semibold">
                      {dailyMoney(option.amount, brief.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dailyMoney(option.amount / (brief.days - 1), brief.currency)} / night · group
                      · simulated
                      <span className="block">Entire stay · whole group · simulated total</span>
                    </p>
                    <Button
                      className="mt-4 w-full"
                      variant={active ? "secondary" : "outline"}
                      onClick={() => onChoose(option)}
                    >
                      {active ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Selected demo hotel
                        </>
                      ) : (
                        "Try this demo hotel"
                      )}
                    </Button>
                    <a
                      className="mt-3 block text-center text-xs text-secondary underline"
                      href={bookingSearch(brief, option.rooms)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Search real hotels on Booking.com ↗
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          {stay?.evidence === "demo" && stay.scope === stayScope(brief) && (
            <div className="rounded-xl bg-secondary/10 p-4 text-sm">
              Selected demo:{" "}
              <strong>
                {stay.name} · {dailyMoney(stay.amount + stay.extras, brief.currency)}
              </strong>
              . This saved selection keeps its quoted price.
            </div>
          )}
          {stay?.evidence === "demo" && (
            <Button variant="ghost" onClick={() => onChoose(null)}>
              Clear demo hotel selection
            </Button>
          )}
        </details>
      )}
      {hotelSearchEndpoint() && stay?.evidence === "demo" && (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p>
            {stay.scope === stayScope(brief)
              ? `Your previous demo selection, ${stay.name}, is still included in the budget. It is not a provider offer.`
              : `Your previous demo selection, ${stay.name}, no longer matches your requested rooms or trip details. The hotel allowance is used instead until you choose a matching quote.`}
          </p>
          <Button variant="ghost" onClick={() => onChoose(null)}>
            Clear demo hotel selection
          </Button>
        </div>
      )}
    </section>
  );
}
