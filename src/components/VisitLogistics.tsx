import { admissionFor, routeLegs } from "@/lib/visit-logistics";
import type { VisualPlace } from "@/lib/city-guides";
export function AdmissionDetails({
  place,
  travelers = 1,
  date,
}: {
  place: VisualPlace;
  travelers?: number;
  date?: string | undefined;
}) {
  const ticket = admissionFor(place.name);
  const closed =
    ticket?.closedDay !== undefined &&
    date &&
    new Date(`${date}T12:00:00Z`).getUTCDay() === ticket.closedDay;
  if (!ticket)
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Admission price and booking rules have not been verified. Check the attraction’s official
        website.
      </p>
    );
  return (
    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
      <p className="font-semibold">
        {ticket.label}
        {ticket.price !== undefined ? ` · €${ticket.price.toFixed(2)} / adult` : ""}
      </p>
      {ticket.price !== undefined && ticket.price > 0 && (
        <p className="mt-1">
          €{(ticket.price * travelers).toFixed(2)} for {travelers} adults. Child, resident and
          concession rates may differ.
        </p>
      )}
      {closed && (
        <p className="mt-2 font-semibold text-destructive">
          Normally closed on this day. Move this visit and check the official calendar.
        </p>
      )}
      <p className="mt-2">{ticket.note}</p>
      <a
        className="mt-2 inline-block text-secondary underline"
        href={ticket.url}
        target="_blank"
        rel="noreferrer"
      >
        Official tickets & how to buy
      </a>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Published visitor information checked {ticket.checkedAt ?? "17 Oct 2026"} · reconfirm before
        buying.
      </p>
    </div>
  );
}
export function RouteLogistics({
  places,
  destination,
  day,
}: {
  places: VisualPlace[];
  destination: string;
  day: number;
}) {
  const legs = routeLegs(places);
  return (
    <details className="rounded-xl border bg-background/40 p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Distances, transport & tickets
      </summary>
      <p className="mt-3 text-xs text-muted-foreground">
        These are suggested stops; edits to your itinerary do not reroute this preview. Distances
        below are straight-line calculations. Walking times assume a 30% detour at 4 km/h; hills,
        access and real routes can change them.
      </p>
      <ol className="mt-3 space-y-3 text-sm">
        {legs.map((leg) => (
          <li key={leg.to.name}>
            <p className="font-medium">
              {leg.from.name} → {leg.to.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {leg.km.toFixed(1)} km straight-line ·{" "}
              {leg.km < 3
                ? `roughly ${leg.walkingMinutes} min walking; check the actual route`
                : "compare local transport; a fare and journey time have not been retrieved"}
            </p>
            <a
              href={leg.url}
              className="mt-1 inline-block text-xs text-secondary underline"
              target="_blank"
              rel="noreferrer"
            >
              Check route, transport & departure times
            </a>
          </li>
        ))}
      </ol>
      {/^(lisbon|lisboa)(,|$)/i.test(destination.trim()) && (
        <div className="mt-4 border-t pt-3 text-xs leading-relaxed">
          <p className="font-semibold">Lisbon transport · published 2026 fares</p>
          <p className="mt-1">
            Carris/Metro single €1.90 per person · 24-hour Carris/Metro €7.25 · 24-hour
            Carris/Metro/CP €11.40. These are alternatives, not added together. The right ticket
            depends on how many rides you take.
          </p>
          <p className="mt-2">
            Buy at Metro vending machines or ticket offices. Each traveler needs their own travel
            card or eligible payment device. For contactless Metro payment, check the separate
            current fare and use the same card/device to enter and exit.
          </p>
          {(day - 1) % 5 === 3 && (
            <p className="mt-2">
              For this Sintra day: take a CP Sintra-line train from Lisbon (for example Rossio),
              then check bus 434 for Pena Palace. The combined 24-hour ticket includes eligible CP
              urban trains; bus 434 is separate and its fare has not been verified. The route
              distances above cover only the Sintra stops, not the transfer from Lisbon.
            </p>
          )}
          <a
            className="mt-2 inline-block text-secondary underline"
            target="_blank"
            rel="noreferrer"
            href="https://www.metrolisboa.pt/comprar/"
          >
            Official fares & where to buy
          </a>
        </div>
      )}
    </details>
  );
}
