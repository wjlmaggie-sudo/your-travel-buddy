import { OfferImage } from "./OfferImage";
import { useEffect, useRef, useState } from "react";
import { CarFront, Users, BriefcaseBusiness, Settings2, Check } from "lucide-react";
import { carSearchInput, type CarSearchResult } from "../../supabase/functions/_shared/car-search";
import { resolveFlightAirport } from "@/lib/flight-airports";
import { carSearchAvailable, searchCars } from "@/lib/car-rental";
import { endDate } from "@/lib/planning";
import { carScope, type CarChoice } from "@/lib/travel-workspace";
import type { StayBrief } from "@/lib/stay-planning";
import { CityAirportInput } from "./CityAirportInput";
import { dailyMoney } from "./DailyBudget";
import { Button } from "./ui/button";
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
    .split(" ")
    .map((code) => ({ code, name: countryNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
export function CarRental({
  brief,
  active = false,
  standalone = false,
  allowance,
  chosen,
  onChoose,
}: {
  brief: StayBrief;
  active?: boolean;
  standalone?: boolean;
  allowance: number;
  chosen?: CarChoice | undefined;
  onChoose: (choice: CarChoice | undefined) => void;
}) {
  const [travelers, setTravelers] = useState(brief.travelers),
    [currency, setCurrency] = useState(brief.currency);
  const [pickup, setPickup] = useState(brief.destination),
    [age, setAge] = useState(""),
    [residence, setResidence] = useState("");
  const [pickupDate, setPickupDate] = useState(brief.start),
    [dropoffDate, setDropoffDate] = useState(endDate(brief.start, brief.days));
  const [pickupTime, setPickupTime] = useState("10:00"),
    [dropoffTime, setDropoffTime] = useState("10:00");
  const [visibleOffers, setVisibleOffers] = useState(3);
  const [result, setResult] = useState<CarSearchResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [resolved, setResolved] = useState("");
  const controller = useRef<AbortController | null>(null),
    scope = carScope(brief);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setResult(null);
    setError("");
    setBusy(false);
    setPickup(brief.destination);
    setPickupDate(brief.start);
    setDropoffDate(endDate(brief.start, brief.days));
  }, [scope, brief.destination, brief.start, brief.days]);
  const [available, setAvailable] = useState<boolean | null>(null),
    [connectionError, setConnectionError] = useState(false);
  useEffect(() => {
    if (!active) return;
    const signal = new AbortController();
    void carSearchAvailable(signal.signal)
      .then((value) => {
        if (!signal.signal.aborted) {
          setAvailable(value);
          setConnectionError(false);
        }
      })
      .catch(() => {
        if (!signal.signal.aborted) {
          setAvailable(false);
          setConnectionError(true);
        }
      });
    return () => signal.abort();
  }, [active]);
  const money = (n: number) => dailyMoney(n, result?.query.currency ?? currency),
    selected = chosen?.scope === scope ? chosen : null;
  return (
    <section aria-label="Car rental search" className="space-y-5">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary">
          <CarFront className="h-4 w-4" />
          GO A LITTLE FURTHER
        </p>
        <h2 className="mt-2 text-3xl font-semibold">A car for your kind of trip.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {standalone
            ? "Choose an airport and dates. Compare real rental offers, with no account needed."
            : "Your trip details are ready. Confirm your pickup and driver details."}
        </p>
        {!standalone && (
          <p className="mt-2 text-sm">
            Transport allowance: <strong>{money(allowance)}</strong> · rental cost is added
            separately.
          </p>
        )}
      </div>
      {available !== true && (
        <p role="status" className="rounded-xl border bg-muted/30 p-4 text-sm">
          {available === null
            ? "Checking car rental connection…"
            : connectionError
              ? "Car rental search is temporarily unavailable. Your trip is unchanged."
              : "Live car rental searches are awaiting activation. No demonstration prices are shown."}
        </p>
      )}
      <form
        className="space-y-4 rounded-2xl border bg-card p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          controller.current?.abort();
          const current = new AbortController();
          controller.current = current;
          setBusy(true);
          setError("");
          setResult(null);
          setVisibleOffers(3);
          try {
            const airport = await resolveFlightAirport(pickup, current.signal);
            setResolved(`${airport.name} (${airport.code})`);
            const query = carSearchInput.parse({
              pickup: airport.code,
              pickupDate,
              dropoffDate,
              pickupTime,
              dropoffTime,
              age: Number(age),
              residence: residence.toUpperCase(),
              currency: standalone ? currency : brief.currency,
              travelers: standalone ? travelers : brief.travelers,
            });
            const next = await searchCars(query, current.signal);
            if (!current.signal.aborted) setResult(next);
          } catch (cause) {
            if (!current.signal.aborted)
              setError(
                cause instanceof Error && cause.name !== "ZodError"
                  ? cause.message
                  : "Check dates, driver age and country of residence.",
              );
          } finally {
            if (!current.signal.aborted) setBusy(false);
          }
        }}
      >
        <CityAirportInput
          label="Pickup airport"
          value={pickup}
          onChange={setPickup}
          onSelect={() => {}}
        />
        <p className="text-xs text-muted-foreground">Pick up and return at the same airport.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {standalone && (
            <>
              <label className="min-w-0 text-sm">
                Travelers
                <input
                  aria-label="Car travelers"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                  type="number"
                  min={1}
                  max={20}
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  required
                />
              </label>
            </>
          )}

          <label className="min-w-0 text-sm">
            Pickup date
            <input
              aria-label="Car pickup date"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </label>
          <label className="min-w-0 text-sm">
            Return date
            <input
              aria-label="Car return date"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              required
            />
          </label>

          <label className="min-w-0 text-sm">
            Driver age
            <input
              aria-label="Driver age"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </label>
          <label className="min-w-0 text-sm">
            Country of residence
            <select
              aria-label="Driver country of residence"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              required
            >
              <option value="">Choose your country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details className="rounded-xl border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Pickup times & currency{" "}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {pickupTime} → {dropoffTime} · {standalone ? currency : brief.currency}
            </span>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="min-w-0 text-sm">
              Pickup time
              <input
                aria-label="Car pickup time"
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
            </label>
            <label className="min-w-0 text-sm">
              Return time
              <input
                aria-label="Car return time"
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                type="time"
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
                required
              />
            </label>
            {standalone && (
              <label className="min-w-0 text-sm">
                Currency
                <select
                  aria-label="Car currency"
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {["EUR", "GBP", "USD", "CHF", "AUD", "CAD", "JPY"].map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </details>
        <p className="text-xs text-muted-foreground">
          Driver age and residence affect prices. Search details are sent to Scrappa to find real
          offers.
        </p>
        <Button disabled={busy || available !== true} type="submit">
          {busy ? "Comparing rental cars…" : "Find cars"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}
      {selected && (
        <div className="rounded-xl border border-secondary bg-secondary/10 p-4 text-sm">
          <p>
            Selected: {selected.name} · {selected.supplier} · {money(selected.amount)} for the
            rental. Not booked.
          </p>
          <Button variant="link" onClick={() => onChoose(undefined)}>
            Remove rental from budget
          </Button>
        </div>
      )}
      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Your rental options
              </p>
              <h3 className="mt-1 text-2xl font-semibold">Find your perfect set of wheels.</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {resolved} · {result.query.pickupDate} → {result.query.dropoffDate} ·{" "}
                {result.query.travelers} travelers
              </p>
            </div>
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs text-secondary">
              {result.offers.length} priced options
            </span>
          </div>
          {!result.offers.length && (
            <p>
              No suitable priced cars were returned for your group. Try another airport or dates.
            </p>
          )}
          <div className="offer-grid grid gap-4">
            {result.offers.slice(0, visibleOffers).map((offer) => (
              <article
                key={offer.id}
                className={`visual-offer flex flex-col overflow-hidden rounded-2xl border bg-card ${selected?.id === offer.id ? "ring-2 ring-secondary" : ""}`}
              >
                <OfferImage src={offer.photo} alt={`${offer.name} rental model`} vehicle />
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-secondary">{offer.supplier}</p>
                  <h3 className="mt-2 text-xl font-semibold">{offer.name} or similar</h3>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {offer.seats} seats
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Settings2 className="h-3.5 w-3.5" />
                      {offer.transmission.toLowerCase()}
                    </span>
                    {offer.bags != null && (
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {offer.bags} bags
                      </span>
                    )}
                  </div>
                  {offer.cancellation === true && (
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-secondary">
                      <Check className="h-3.5 w-3.5" />
                      Free cancellation reported
                    </p>
                  )}
                  <p className="mt-3 text-2xl font-semibold">{money(offer.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Whole rental ·{" "}
                    {standalone
                      ? "Advertised price"
                      : offer.amount <= allowance
                        ? "Within local transport allowance"
                        : "Above local transport allowance"}
                  </p>
                  <details className="my-4 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium">Rental conditions</summary>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        Mileage: {offer.mileage.toLowerCase().replaceAll("_", " ")}. Fuel:{" "}
                        {offer.fuelPolicy === "RETURN_SAME"
                          ? "Return with the same fuel level"
                          : offer.fuelPolicy.toLowerCase().replaceAll("_", " ")}
                        .
                      </p>
                      <p>
                        Security deposit:{" "}
                        {offer.deposit === null ? "confirm with provider" : money(offer.deposit)}.
                        This is a separate hold, not the rental price.
                      </p>
                      <p>
                        Confirm insurance, excess, cancellation conditions and optional extras
                        before booking.
                      </p>
                    </div>
                  </details>
                  {!standalone && (
                    <Button
                      className="mt-4"
                      onClick={() =>
                        onChoose({
                          ...offer,
                          scope,
                          checkedAt: result.checkedAt,
                          pickup: resolved,
                          pickupDate: result.query.pickupDate,
                          dropoffDate: result.query.dropoffDate,
                          pickupTime: result.query.pickupTime,
                          dropoffTime: result.query.dropoffTime,
                        })
                      }
                    >
                      {selected?.id === offer.id ? "Selected car" : "Select car"}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {visibleOffers < result.offers.length && (
            <Button variant="outline" onClick={() => setVisibleOffers((count) => count + 3)}>
              Show more cars
            </Button>
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">Price source & details</summary>
            <p className="mt-2">
              Rentalcars.com via independent provider Scrappa · checked{" "}
              {new Date(result.checkedAt).toLocaleString()}. Photos show a representative model.
              Confirm prices, availability and terms with the provider.
            </p>
          </details>
          <a
            className="inline-block text-sm text-secondary underline"
            href="https://www.rentalcars.com/"
            target="_blank"
            rel="noreferrer"
          >
            Search and book on Rentalcars.com ↗
          </a>
          <p className="text-xs text-muted-foreground">
            External search link; the exact displayed car and price are not reserved or preselected.
          </p>
        </div>
      )}
    </section>
  );
}
