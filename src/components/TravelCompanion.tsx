import { companionActivityPlace } from "@/lib/companion-place";
import { loadCityGuide } from "@/lib/city-guides";
import { PlacePhoto } from "./PlacePhoto";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Compass,
  Download,
  MapPin,
  Navigation,
  RefreshCw,
  Share2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  COMPANION_CHANGE,
  currentTripDay,
  dateInZone,
  directionsUrl,
  makeCompanionTrip,
  nextStop,
  readCompanionTrips,
  removeCompanionTrip,
  saveCompanionTrip,
  tripDate,
  validTimezone,
  type CompanionStop,
  type CompanionTrip,
} from "@/lib/travel-companion";
import {
  cancelTripReminder,
  isNative,
  NATIVE_APP,
  remindAboutStop,
  shareItinerary,
} from "@/lib/native-app";
import { supabase } from "@/integrations/supabase/client";
import { tripDays, tripQuery } from "@/lib/trips";
import { dailyMoney as money } from "./DailyBudget";
import { preferencesQuery, DEFAULT_PREFERENCES } from "@/lib/travel-preferences";
import { journeyQuery } from "@/lib/journey-planning";
import { readStayChoice } from "@/lib/stay-planning";
import { PRODUCTS } from "@/lib/travel-data";
import { dailyBudgets } from "@/lib/planning";
import { publicAsset } from "@/lib/deployment";
import { MobileNavigation } from "./MobileNavigation";
import { FinalBudgetSummary } from "./FinalTripBudget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";
const displayDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

export function TravelCompanion({ requestedId }: { requestedId: string | undefined }) {
  const [trips, setTrips] = useState(readCompanionTrips);
  const [selected, setSelected] = useState(requestedId);
  const trip = trips.find((value) => value.id === selected) ?? trips[0];
  const arrivalDay = trip ? currentTripDay(trip) : 1;
  const [day, setDay] = useState(arrivalDay);
  const [view, setView] = useState("plan");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const update = () => setTrips(readCompanionTrips());
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener(COMPANION_CHANGE, update);
    window.addEventListener("storage", update);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      window.removeEventListener(COMPANION_CHANGE, update);
      window.removeEventListener("storage", update);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);
  useEffect(() => {
    if (requestedId) setSelected(requestedId);
  }, [requestedId]);
  useEffect(() => {
    setDay(arrivalDay);
    setEditing(null);
  }, [trip?.id, arrivalDay]);

  function persist(next: CompanionTrip, cancelReminder = false) {
    try {
      saveCompanionTrip(next);
      if (cancelReminder)
        void cancelTripReminder(next).catch(() =>
          toast.error(
            "Could not cancel the previous reminder. Check iPhone notification settings.",
          ),
        );
      return true;
    } catch {
      toast.error("Could not save on this device. Free some storage and try again.");
      return false;
    }
  }
  function updateStop(stop: CompanionStop) {
    if (trip)
      persist(
        { ...trip, stops: trip.stops.map((item) => (item.id === stop.id ? stop : item)) },
        true,
      );
  }
  async function refresh() {
    if (!trip?.sourceTripId || busy) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== trip.ownerId)
        throw new Error("Sign in with the account that saved this trip to download its updates.");
      const [data, preferences, journey, stay] = await Promise.all([
        queryClient.fetchQuery({ ...tripQuery(trip.sourceTripId), staleTime: 0 }),
        queryClient.fetchQuery({ ...preferencesQuery(), staleTime: 0 }),
        queryClient.fetchQuery({ ...journeyQuery(trip.sourceTripId), staleTime: 0 }),
        readStayChoice(trip.sourceTripId),
      ]);
      const preference = preferences[data.trip.id] ?? DEFAULT_PREFERENCES;
      const days = tripDays(data.trip.start_date, data.trip.end_date);
      const copy = makeCompanionTrip(
        {
          brief: {
            destination: data.trip.destination,
            start: data.trip.start_date,
            days,
            budget: Number(data.trip.budget),
            currency: data.trip.currency,
            ...preference,
          },
          days: Array.from({ length: days }, (_, i) => ({
            day: i + 1,
            items: data.activities.filter((a) => a.day === i + 1),
          })),
          journey,
          stay,
          expenses: data.expenses,
          packing: preference.packing.map(
            (id) => PRODUCTS.find((item) => item.id === id)?.name ?? id,
          ),
        },
        { tripId: trip.sourceTripId, ownerId: user.id },
      );
      if (persist(copy, true))
        toast.success(
          "Latest saved plan downloaded. Your progress and device-only spending are kept.",
        );
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }
  const guide = useQuery({
    queryKey: ["visual-city-guide", trip?.destination],
    queryFn: () => loadCityGuide(trip!.destination),
    enabled: !!trip && view === "plan" && !/^(lisbon|lisboa)(,|$)/i.test(trip.destination.trim()),
    staleTime: 1800000,
    retry: false,
  });
  function activityPhoto(item: CompanionStop) {
    const place = trip && companionActivityPlace(trip.destination, item, guide.data?.days.flat());
    return place ? (
      <div className="companion-activity-photo">
        <PlacePhoto place={place} />
      </div>
    ) : null;
  }
  const stop = trip && nextStop(trip, day);
  const dayStops = trip?.stops.filter((item) => item.day === day) ?? [];
  const done = dayStops.filter((item) => item.status === "done").length;
  const finished = dayStops.filter((item) => item.status !== "planned").length;
  const today = trip ? dateInZone(new Date(), trip.timezone) : "";

  return (
    <div className="companion-page">
      <header className="companion-header">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <img src={publicAsset("ai-travel-logo.svg")} className="h-7 w-7" alt="" />
          Travel Buddy
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? "Online" : "Offline"}
        </span>
      </header>
      <main className="companion-main">
        {!trip ? (
          <section className="companion-empty">
            <div className="companion-icon">
              <Compass size={32} />
            </div>
            <p className="companion-eyebrow">YOUR TRIP, IN YOUR POCKET</p>
            <h1>
              Less searching.
              <br />
              More being there.
            </h1>
            <p>
              Bring your plan along. Your next stop, daily itinerary and travel details, even
              without a connection.
            </p>
            <Button size="lg" asChild>
              <Link to="/">
                Plan a trip <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/trips">Open my saved trips</Link>
            </Button>
            <div className="companion-card text-left">
              <Download className="mb-3 text-secondary" />
              <h2 className="text-lg">Ready when you are</h2>
              <p className="mt-2 text-sm">
                Open a plan and tap <strong>Follow this plan</strong> to keep an offline copy here.
                No account is needed for a guest plan.
              </p>
            </div>
          </section>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="companion-eyebrow">LET THE DAY UNFOLD</p>
              <button
                className="text-sm text-secondary underline"
                onClick={() => setDay(currentTripDay(trip))}
              >
                Jump to today
              </button>
            </div>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">{trip.destination}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {displayDate(trip.start)} · {trip.days} {trip.days === 1 ? "day" : "days"} ·{" "}
              {trip.travelers} {trip.travelers === 1 ? "traveller" : "travellers"}
            </p>
            {trips.length > 1 && (
              <label className="mt-4 block text-sm">
                Switch offline trip
                <select
                  aria-label="Switch offline trip"
                  className="companion-select mt-1"
                  value={trip.id}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    void navigate({
                      to: "/on-trip",
                      search: { trip: event.target.value },
                      replace: true,
                    });
                  }}
                >
                  {trips.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.destination} · {item.start}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="mt-2 flex items-center gap-2 text-xs text-secondary">
              <Check size={14} />
              {NATIVE_APP ? "Saved offline on this device" : "Saved on this device"}
            </p>
            <div className="companion-tabs" role="tablist" aria-label="Trip companion sections">
              {[
                ["plan", "My day"],
                ["essentials", "Essentials"],
                ["budget", "Spending"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  id={`tab-${id}`}
                  aria-controls={`panel-${id}`}
                  aria-selected={view === id}
                  onClick={() => setView(id!)}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === "plan" && (
              <section role="tabpanel" id="panel-plan" aria-labelledby="tab-plan">
                {stop ? (
                  <section className="companion-next mt-4" aria-label="Next activity">
                    <p className="companion-eyebrow">
                      UP NEXT · DAY {day} · {stop.time || "AT YOUR PACE"}
                    </p>
                    {activityPhoto(stop)}
                    <h2 className="mt-3 text-3xl font-semibold">{stop.title}</h2>
                    <p className="mt-2 flex items-start gap-1.5 text-sm">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      {stop.location || trip.destination}
                    </p>
                    <div className="mt-5 flex gap-2">
                      <Button asChild className="flex-1">
                        <a
                          href={directionsUrl(stop, trip.destination, "walk")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation size={16} className="mr-2" />
                          Go there
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateStop({ ...stop, status: "done" })}
                      >
                        <Check size={16} className="mr-1" />
                        Done
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <a
                        className="underline"
                        href={directionsUrl(stop, trip.destination, "transit")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Public transport
                      </a>
                      <a
                        className="underline"
                        href={directionsUrl(stop, trip.destination, "drive")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Driving
                      </a>
                      {isNative() && (
                        <button
                          className="flex items-center gap-1 underline"
                          onClick={() => {
                            void remindAboutStop(trip, stop)
                              .then(() =>
                                toast.success(
                                  "Reminder set for 15 minutes before this stop. Changing the plan cancels it; set it again after edits.",
                                ),
                              )
                              .catch((error) => toast.error(message(error)));
                          }}
                        >
                          <Bell size={14} />
                          Remind me
                        </button>
                      )}
                    </div>
                  </section>
                ) : (
                  <section className="companion-card mt-4">
                    <Check className="text-secondary" />
                    <h2 className="mt-2 text-2xl">
                      {dayStops.length ? "A day well travelled." : "Room for a little discovery."}
                    </h2>
                    <p className="mt-2 text-sm">
                      {dayStops.length
                        ? "Every stop is done or skipped. You can undo any choice below."
                        : "There are no stops for this day yet. Add them in the planner."}
                    </p>
                  </section>
                )}
                <div className="companion-days" aria-label="Itinerary days">
                  {Array.from({ length: trip.days }, (_, i) => (
                    <button
                      key={i}
                      aria-pressed={day === i + 1}
                      onClick={() => {
                        setDay(i + 1);
                        setEditing(null);
                      }}
                    >
                      <span>Day {i + 1}</span>
                      <small>{displayDate(tripDate(trip, i + 1))}</small>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {tripDate(trip, day) === today ? "Today" : displayDate(tripDate(trip, day))} ·
                  Times in {trip.timezone}. Change the timezone in Essentials.
                </p>
                <div className="mb-4 mt-7 flex items-center justify-between">
                  <h2 className="text-xl">The day's plan</h2>
                  <span className="text-xs text-muted-foreground">
                    {done} done · {finished}/{dayStops.length} settled
                  </span>
                </div>
                <ol className="companion-timeline">
                  {dayStops.map((item, index) => (
                    <li
                      key={item.id}
                      className={`companion-stop ${item.status !== "planned" ? "is-settled" : ""}`}
                    >
                      <span className="companion-stop-number">
                        {item.status === "done" ? <Check size={14} /> : index + 1}
                      </span>
                      {editing === item.id ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            updateStop({
                              ...item,
                              title: String(form.get("title")).trim(),
                              time: String(form.get("time")),
                              location: String(form.get("location")),
                              notes: String(form.get("notes")),
                            });
                            setEditing(null);
                          }}
                          className="space-y-3"
                        >
                          <Label htmlFor={`title-${item.id}`}>Activity</Label>
                          <Input
                            id={`title-${item.id}`}
                            name="title"
                            required
                            maxLength={200}
                            defaultValue={item.title}
                          />
                          <Label htmlFor={`time-${item.id}`}>Time</Label>
                          <Input
                            id={`time-${item.id}`}
                            name="time"
                            type="time"
                            defaultValue={/^\d\d:\d\d$/.test(item.time) ? item.time : ""}
                          />
                          <Label htmlFor={`location-${item.id}`}>Location</Label>
                          <Input
                            id={`location-${item.id}`}
                            name="location"
                            maxLength={300}
                            defaultValue={item.location}
                          />
                          <Label htmlFor={`notes-${item.id}`}>Notes</Label>
                          <Textarea
                            id={`notes-${item.id}`}
                            name="notes"
                            maxLength={2000}
                            defaultValue={item.notes}
                          />
                          <p className="text-xs">
                            These edits stay in the offline copy. Downloading the saved plan again
                            replaces its activity text and times.
                          </p>
                          <Button type="submit">Save on device</Button>
                          <Button variant="ghost" type="button" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between gap-3">
                            <p className="text-xs font-semibold text-secondary">
                              {item.time || "Flexible"}
                            </p>
                            <span className="text-xs capitalize text-muted-foreground">
                              {item.status === "planned" ? "" : item.status}
                            </span>
                          </div>
                          {activityPhoto(item)}
                          <h3 className="mt-1 font-sans text-base font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.location}</p>
                          {item.notes && (
                            <details className="mt-2 text-sm">
                              <summary className="cursor-pointer text-secondary">
                                Notes & details
                              </summary>
                              <p className="mt-2 whitespace-pre-wrap">{item.notes}</p>
                            </details>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                            <button className="underline" onClick={() => setEditing(item.id)}>
                              Edit stop
                            </button>
                            {item.status === "planned" ? (
                              <>
                                <button
                                  className="underline"
                                  onClick={() => updateStop({ ...item, status: "done" })}
                                >
                                  Mark done
                                </button>
                                <button
                                  className="underline"
                                  onClick={() => updateStop({ ...item, status: "skipped" })}
                                >
                                  Skip
                                </button>
                              </>
                            ) : (
                              <button
                                className="underline"
                                onClick={() => updateStop({ ...item, status: "planned" })}
                              >
                                Undo {item.status}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-xs text-muted-foreground">
                  Directions, live maps and transport information need internet or offline maps
                  downloaded separately in Apple Maps. Saved times are your plan, not verified
                  travel times.
                </p>
              </section>
            )}

            {view === "essentials" && (
              <section
                role="tabpanel"
                id="panel-essentials"
                aria-labelledby="tab-essentials"
                className="space-y-5"
              >
                <section className="companion-card">
                  <h2 className="text-xl">Travel details, close at hand</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hotel addresses, flight details and reservation references you enter stay on
                    this device. Do not store passwords or payment card details.
                  </p>
                  <div className="mt-4 space-y-3">
                    {trip.essentials.map((item) => (
                      <div key={item.id} className="rounded-xl border p-3">
                        <h3 className="font-sans text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                          {item.details}
                        </p>
                        {!item.id.startsWith("selected-") && (
                          <button
                            className="mt-2 text-xs text-destructive underline"
                            onClick={() =>
                              persist({
                                ...trip,
                                essentials: trip.essentials.filter((e) => e.id !== item.id),
                              })
                            }
                          >
                            Remove detail
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <form
                    className="mt-5 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      if (
                        persist({
                          ...trip,
                          essentials: [
                            ...trip.essentials,
                            {
                              id: crypto.randomUUID(),
                              title: String(form.get("title")).trim(),
                              details: String(form.get("details")),
                            },
                          ],
                        })
                      )
                        event.currentTarget.reset();
                    }}
                  >
                    <Label htmlFor="essential-title">Title</Label>
                    <Input
                      id="essential-title"
                      name="title"
                      placeholder="Hotel address or booking reference"
                      required
                      maxLength={200}
                    />
                    <Label htmlFor="essential-details">Details</Label>
                    <Textarea
                      id="essential-details"
                      name="details"
                      maxLength={3000}
                      placeholder="Address, check-in time, reference…"
                    />
                    <Button variant="outline">Add travel detail</Button>
                  </form>
                </section>
                <section className="companion-card">
                  <h2 className="text-xl">Packing, sorted</h2>
                  <div className="mt-3 space-y-3">
                    {trip.packing.map((item, i) => (
                      <label className="flex items-center gap-3 text-sm" key={`${i}:${item.name}`}>
                        <input
                          type="checkbox"
                          checked={item.packed}
                          onChange={(e) =>
                            persist({
                              ...trip,
                              packing: trip.packing.map((p, index) =>
                                index === i ? { ...p, packed: e.target.checked } : p,
                              ),
                            })
                          }
                        />
                        {item.name}
                      </label>
                    ))}
                  </div>
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      if (
                        persist({
                          ...trip,
                          packing: [
                            ...trip.packing,
                            { name: String(form.get("item")).trim(), packed: false },
                          ],
                        })
                      )
                        e.currentTarget.reset();
                    }}
                  >
                    <Input
                      aria-label="Packing item"
                      name="item"
                      required
                      maxLength={200}
                      placeholder="Add a packing item"
                    />
                    <Button variant="outline">Add</Button>
                  </form>
                </section>
                <section className="companion-card">
                  <h2 className="text-xl">Trip timezone</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Currently {trip.timezone}. Initially this uses your device timezone. Set the
                    destination's timezone before using reminders.
                  </p>
                  <form
                    className="mt-3 flex gap-2"
                    key={trip.id}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const zone = String(new FormData(event.currentTarget).get("zone")).trim();
                      if (!validTimezone(zone)) {
                        toast.error("Use a timezone such as Europe/Lisbon or Asia/Tokyo.");
                        return;
                      }
                      if (persist({ ...trip, timezone: zone }, true))
                        toast.success("Timezone updated. Set any reminder again.");
                    }}
                  >
                    <Input
                      aria-label="Trip timezone"
                      name="zone"
                      required
                      defaultValue={trip.timezone}
                      list="trip-timezones"
                    />
                    <datalist id="trip-timezones">
                      {[
                        "Europe/Lisbon",
                        "Europe/Berlin",
                        "Europe/London",
                        "Europe/Paris",
                        "Asia/Tokyo",
                        "Asia/Shanghai",
                        "Asia/Bangkok",
                        "America/New_York",
                        "America/Los_Angeles",
                        "Australia/Sydney",
                        "UTC",
                      ].map((zone) => (
                        <option key={zone}>{zone}</option>
                      ))}
                    </datalist>
                    <Button variant="outline">Set</Button>
                  </form>
                </section>
                <section className="companion-card">
                  <Label htmlFor="trip-notes" className="font-display text-xl">
                    A little reminder to yourself
                  </Label>
                  <Textarea
                    id="trip-notes"
                    className="mt-3"
                    maxLength={3000}
                    value={trip.note}
                    onChange={(event) => persist({ ...trip, note: event.target.value })}
                    placeholder="Things to remember on the way…"
                  />
                </section>
              </section>
            )}

            {view === "budget" && (
              <section
                role="tabpanel"
                id="panel-budget"
                aria-labelledby="tab-budget"
                className="space-y-5"
              >
                {trip.finalBudget && (
                  <FinalBudgetSummary review={trip.finalBudget} savedAt={trip.savedAt} />
                )}
                <section className="companion-next">
                  <p className="companion-eyebrow">YOUR GROUP BUDGET</p>
                  <h2 className="mt-3 text-3xl">{money(trip.budget, trip.currency)}</h2>
                  <p className="mt-2 text-sm">
                    {money(
                      [...trip.expenses, ...trip.localExpenses].reduce(
                        (total, item) => total + item.amount,
                        0,
                      ),
                      trip.currency,
                    )}{" "}
                    recorded spending
                  </p>
                  <p className="mt-2 text-sm">
                    {money(
                      trip.budget -
                        [...trip.expenses, ...trip.localExpenses].reduce(
                          (total, item) => total + item.amount,
                          0,
                        ),
                      trip.currency,
                    )}{" "}
                    remaining against recorded expenses
                  </p>
                  <p className="mt-3 text-xs">
                    Unrecorded payments are excluded. Planning estimates and selected offers are not
                    actual expenses.
                  </p>
                </section>
                <section className="companion-card">
                  <h2 className="text-xl">Log something on the go</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    These entries work offline and stay only on this device. They are separate from
                    the cloud spending tracker.
                  </p>
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const amount = Number(form.get("amount"));
                      if (!Number.isFinite(amount) || amount <= 0) return;
                      if (
                        persist({
                          ...trip,
                          localExpenses: [
                            ...trip.localExpenses,
                            {
                              id: crypto.randomUUID(),
                              amount: Math.round(amount * 100) / 100,
                              category: String(form.get("category")),
                              note: String(form.get("note")),
                              date: String(form.get("date")),
                            },
                          ],
                        })
                      ) {
                        event.currentTarget.reset();
                        toast.success("Expense saved on this device.");
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="expense-amount">Amount ({trip.currency})</Label>
                        <Input
                          id="expense-amount"
                          name="amount"
                          type="number"
                          min="0.01"
                          max="1000000"
                          step="0.01"
                          inputMode="decimal"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-date">Date</Label>
                        <Input
                          id="expense-date"
                          name="date"
                          type="date"
                          defaultValue={today}
                          required
                        />
                      </div>
                    </div>
                    <Label htmlFor="expense-category">Category</Label>
                    <select className="companion-select" id="expense-category" name="category">
                      {["food", "stay", "transport", "activities", "other"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <Label htmlFor="expense-note">Note</Label>
                    <Input
                      id="expense-note"
                      name="note"
                      maxLength={500}
                      placeholder="Coffee, lunch, train tickets…"
                    />
                    <Button>Save expense on device</Button>
                  </form>
                </section>
                <section className="companion-card">
                  <h2 className="text-xl">Recorded on this device</h2>
                  {!trip.localExpenses.length && (
                    <p className="mt-3 text-sm">No device-only expenses yet.</p>
                  )}
                  {trip.localExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="mt-3 flex items-start justify-between gap-3 border-b pb-3 text-sm"
                    >
                      <div>
                        <p>{expense.note || expense.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date} · device only
                        </p>
                      </div>
                      <div className="text-right">
                        <p>{money(expense.amount, trip.currency)}</p>
                        <button
                          className="text-xs text-destructive underline"
                          onClick={() =>
                            persist({
                              ...trip,
                              localExpenses: trip.localExpenses.filter(
                                (item) => item.id !== expense.id,
                              ),
                            })
                          }
                        >
                          Remove expense
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
                <section className="companion-card">
                  <h2 className="text-xl">Daily group allowances</h2>
                  <p className="mt-2 text-xs">
                    Even allocation of the whole group budget, including accommodation and travel.
                    These are estimates.
                  </p>
                  {dailyBudgets(trip.budget, trip.days, trip.travelers, trip.start).map(
                    (entry, i) => (
                      <div key={i} className="mt-3 flex justify-between text-sm">
                        <span>Day {i + 1}</span>
                        <span>{money(entry.amount, trip.currency)}</span>
                      </div>
                    ),
                  )}
                </section>
              </section>
            )}

            <section className="companion-card mt-6 space-y-3">
              <button
                className="flex min-h-11 w-full items-center justify-between text-sm"
                onClick={() => {
                  void shareItinerary(trip)
                    .then(() =>
                      toast.success(
                        "Itinerary shared or copied. Private travel details are excluded.",
                      ),
                    )
                    .catch((error) => {
                      if (!(error instanceof Error && error.name === "AbortError"))
                        toast.error("Could not share. Try again.");
                    });
                }}
              >
                <span className="flex items-center gap-2">
                  <Share2 size={17} />
                  Share itinerary
                </span>
                <ChevronRight size={16} />
              </button>
              {trip.sourceTripId && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy || !online}
                    onClick={() => void refresh()}
                  >
                    <RefreshCw size={15} className={`mr-2 ${busy ? "animate-spin" : ""}`} />
                    {busy ? "Downloading…" : "Download saved plan again"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Replaces offline activity edits with the cloud plan. Keeps progress, device
                    expenses, notes and added reservation details.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/trips/$tripId" params={{ tripId: trip.sourceTripId }}>
                      Open full planner & tools
                    </Link>
                  </Button>
                </>
              )}
              {!trip.sourceTripId && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/">Open planner & all travel tools</Link>
                </Button>
              )}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer py-2">Offline storage & privacy</summary>
                <p className="mt-2">
                  The itinerary, notes, packing and spending remain on this device until removed.
                  Maps, photos, live searches, weather, currency and cloud edits need internet.
                  Local edits do not sync to other devices. Signing out removes account trip copies;
                  guest copies remain until you remove them.
                </p>
                {!NATIVE_APP && (
                  <p className="mt-3">
                    On the website, keep this page open before going offline. Reopening the website
                    needs a connection. The installed iPhone app can reopen its downloaded itinerary
                    offline.
                  </p>
                )}
                <button
                  className="mt-4 min-h-11 text-destructive underline"
                  onClick={() => {
                    void cancelTripReminder(trip);
                    try {
                      removeCompanionTrip(trip.id);
                      setSelected(undefined);
                      void navigate({ to: "/on-trip", search: {}, replace: true });
                    } catch {
                      toast.error("Could not remove this copy. Please try again.");
                    }
                  }}
                >
                  Remove offline copy and its device-only details
                </button>
              </details>
            </section>
          </>
        )}
      </main>
      {!NATIVE_APP && <MobileNavigation />}
    </div>
  );
}
