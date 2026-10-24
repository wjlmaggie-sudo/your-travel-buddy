import { MorePlaces } from "@/components/MorePlaces";
import { extraActivity } from "@/lib/extra-places";
import { DownloadTripPdf } from "@/components/DownloadTripPdf";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, MapPin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readStayChoice, stayBudget, type StayChoice } from "@/lib/stay-planning";
import { TripBudgetDashboard } from "@/components/TripBudgetDashboard";
import { FlightRecommendations } from "@/components/FlightRecommendations";
import { HotelRecommendations } from "@/components/HotelRecommendations";
import { LocalShopping } from "@/components/LocalShopping";
import { flightCost, connectedBudget, type TravelSection } from "@/lib/travel-workspace";
import { saveStayChoice } from "@/lib/stay-planning";
import { TravelWorkspace, WorkspacePanel, BudgetSummary } from "@/components/TravelWorkspace";
import { TravelTools } from "@/components/TravelTools";
import { JourneyPlanner } from "@/components/JourneyPlanner";
import { journeyQuery, journeyBudget, saveJourney, type Journey } from "@/lib/journey-planning";
import { AccommodationPlanner } from "@/components/AccommodationPlanner";
import { AppHeader } from "@/components/AppHeader";
import { tripQuery, tripDays, money, CATEGORIES } from "@/lib/trips";
import { TripSuggestions } from "@/components/TripSuggestions";
import { DailyBudget, DayBudgetSummary, dailyMoney } from "@/components/DailyBudget";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { ItineraryDay as DayCard } from "@/components/ItineraryDay";
import { Button } from "@/components/ui/button";
import { TravelShop } from "@/components/TravelShop";
import { TripSettings } from "@/components/TripSettings";
import { useTripPreferences } from "@/lib/travel-preferences";
import { PRODUCTS } from "@/lib/travel-data";
import { budgetAllocation, dailyBudgets } from "@/lib/planning";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Trip plan — AI Travel" },
      { name: "description", content: "Itinerary, budget and AI ideas for your trip." },
      { property: "og:title", content: "Trip plan — AI Travel" },
      { property: "og:description", content: "Itinerary, budget and AI ideas." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { suggest?: boolean } =>
    search["suggest"] === true || search["suggest"] === "true" ? { suggest: true } : {},
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tripQuery(params.tripId)),
  component: TripPage,
});

type Data = Awaited<ReturnType<NonNullable<ReturnType<typeof tripQuery>["queryFn"]>>>;

function TripPage() {
  const { tripId } = Route.useParams();
  const { suggest } = Route.useSearch();
  const [tab, setTab] = useState("ideas");
  const [selectionBusy, setSelectionBusy] = useState(false);
  const { data } = useSuspenseQuery(tripQuery(tripId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["trip", tripId] });
    void qc.invalidateQueries({ queryKey: ["trips"] });
  };
  const { trip } = data;
  const stay = useQuery({
    queryKey: ["stay-choice", tripId],
    queryFn: () => readStayChoice(tripId),
  });
  const preferences = useTripPreferences(tripId);
  const journey = useQuery(journeyQuery(tripId));
  const brief = {
    hotelRooms: journey.data?.hotelRooms,
    destination: trip.destination,
    start: trip.start_date,
    days: tripDays(trip.start_date, trip.end_date),
    travelers: preferences.preference.travelers,
    budget: Number(trip.budget),
    currency: trip.currency,
    style: preferences.preference.style,
    persona: preferences.preference.persona,
    childrenAges: preferences.preference.childrenAges,
    childrenAgeRanges: preferences.preference.childrenAgeRanges,
  };
  async function updateJourney(next: Journey) {
    setSelectionBusy(true);
    try {
      await saveJourney(tripId, next);
      await qc.invalidateQueries({ queryKey: ["journey-settings", tripId] });
    } catch {
      toast.error("Your selection could not save. The previous budget is kept; please try again.");
    } finally {
      setSelectionBusy(false);
    }
  }
  async function updateStay(next: StayChoice | null) {
    setSelectionBusy(true);
    try {
      await saveStayChoice(tripId, next);
      await qc.invalidateQueries({ queryKey: ["stay-choice", tripId] });
    } catch {
      toast.error("Your hotel choice could not save. Please try again.");
    } finally {
      setSelectionBusy(false);
    }
  }
  const sectionMap: Record<string, TravelSection> = {
    ideas: "planner",
    flights: "flights",
    hotels: "hotels",
    itinerary: "attractions",
    shop: "shopping",
    budget: "planner",
    places: "planner",
    currency: "currency",
  };
  const tabMap: Record<TravelSection, string> = {
    planner: "ideas",
    flights: "flights",
    hotels: "hotels",
    attractions: "itinerary",
    shopping: "shop",
    currency: "currency",
  };

  async function deleteTrip() {
    if (!confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["trips"] });
    navigate({ to: "/trips" });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All trips
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">{trip.destination}</h1>
            <p className="text-muted-foreground">
              {trip.start_date} → {trip.end_date}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DownloadTripPdf
              disabled={
                preferences.isPending ||
                preferences.isError ||
                journey.isPending ||
                stay.isPending ||
                selectionBusy
              }
              trip={{
                brief,
                interest: preferences.preference.interest,
                journey: journey.data,
                stay: stay.data,
                days: Array.from({ length: brief.days }, (_, i) => ({
                  day: i + 1,
                  items: data.activities.filter((a) => a.day === i + 1),
                })),
                expenses: data.expenses,
                packing: preferences.preference.packing.map(
                  (id) => PRODUCTS.find((p) => p.id === id)?.name ?? id,
                ),
              }}
            />
            <Button variant="ghost" size="sm" onClick={deleteTrip}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <TravelWorkspace
            section={sectionMap[tab] ?? "planner"}
            onChange={(next) => setTab(tabMap[next])}
            title={`${trip.destination} · ${brief.days} days`}
            summary={
              selectionBusy ? (
                "Saving…"
              ) : journey.data ? (
                <BudgetSummary
                  {...connectedBudget(brief, journey.data, stay.data)}
                  currency={brief.currency}
                />
              ) : (
                "Saved trip"
              )
            }
          >
            <WorkspacePanel active={tab === "flights"} label="Flights">
              {journey.data && (
                <fieldset
                  disabled={
                    selectionBusy ||
                    stay.isPending ||
                    stay.isError ||
                    preferences.isPending ||
                    preferences.isError
                  }
                  className="min-w-0"
                >
                  <FlightRecommendations
                    brief={brief}
                    journey={journey.data}
                    onChange={updateJourney}
                  />
                </fieldset>
              )}
              {!journey.isPending && !journey.isError && (
                <details className="mt-5 rounded-xl border bg-card p-4" open={!journey.data}>
                  <summary className="cursor-pointer text-sm font-medium">
                    Edit route, flight requirement & allowance
                  </summary>
                  <JourneyPlanner
                    brief={brief}
                    journey={journey.data}
                    stay={stay.data}
                    tripId={trip.id}
                  />
                </details>
              )}
            </WorkspacePanel>
            <WorkspacePanel active={tab === "hotels"} label="Hotels">
              {journey.data && (
                <fieldset
                  disabled={selectionBusy || stay.isPending || stay.isError}
                  className="min-w-0"
                >
                  <HotelRecommendations
                    active={
                      tab === "hotels" &&
                      !selectionBusy &&
                      !stay.isPending &&
                      !stay.isError &&
                      !preferences.isPending &&
                      !preferences.isError
                    }
                    brief={brief}
                    journey={journey.data}
                    stay={stay.data}
                    onChoose={updateStay}
                  />
                </fieldset>
              )}
              <details className="rounded-xl border bg-card p-4" open={!journey.data}>
                <summary className="cursor-pointer text-sm font-medium">
                  Use a real hotel quote or browse providers
                </summary>
                <AccommodationPlanner
                  tripId={trip.id}
                  brief={{
                    ...brief,
                    ...(journey.data
                      ? {
                          flightBudget: flightCost(brief, journey.data),
                          hotelComfort: journey.data.hotelComfort,
                        }
                      : {}),
                  }}
                />
              </details>
            </WorkspacePanel>
            <WorkspacePanel active={tab === "itinerary"} label="Attractions & Activities">
              <Itinerary
                data={data}
                refresh={refresh}
                stay={stay.data}
                journey={journey.data}
                active={tab === "itinerary"}
              />
            </WorkspacePanel>
            <WorkspacePanel active={tab === "budget"} label="Spending tracker">
              <DailyBudget
                trip={trip}
                travelers={preferences.preference.travelers}
                includesFlights={!!journey.data}
                expenses={data.expenses}
              />
              <Budget data={data} refresh={refresh} />
            </WorkspacePanel>
            <WorkspacePanel active={tab === "ideas"} label="AI Travel Planner">
              {journey.data && !stay.isPending && !stay.isError && (
                <fieldset disabled={selectionBusy} className="min-w-0">
                  <TripBudgetDashboard
                    brief={brief}
                    journey={journey.data}
                    stay={stay.data}
                    onChange={updateJourney}
                  />
                </fieldset>
              )}
              {selectionBusy && (
                <p role="status" className="mt-2 text-sm">
                  Saving your selection…
                </p>
              )}
              {!journey.isPending && !journey.isError && !journey.data && (
                <div className="my-5 rounded-xl border bg-card p-5">
                  <p className="text-sm">
                    This existing trip keeps its original budget. Enable connected planning to use
                    hotel-comfort allocations and the shared dashboard. Flights start as optional,
                    with zero cost.
                  </p>
                  <Button
                    disabled={selectionBusy}
                    className="mt-3"
                    onClick={() =>
                      updateJourney({
                        departure: "",
                        flightBudget: 0,
                        flightsRequired: false,
                        hotelComfort: "Comfortable",
                      })
                    }
                  >
                    Enable connected planning
                  </Button>
                </div>
              )}
              {(journey.isError || stay.isError) && (
                <p role="alert" className="text-sm text-destructive">
                  Selections could not load. Refresh before changing your budget.
                </p>
              )}
              <details className="mb-5 rounded-xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Trip details, budget & preferences
                </summary>
                <TripSettings key={trip.id} trip={trip} includesFlights={!!journey.data} />
              </details>
              <div className="mb-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setTab("budget")}>
                  Spending tracker
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTab("places")}>
                  Explore place directory
                </Button>
              </div>
              <TripSuggestions
                key={tripId}
                journey={journey.data}
                stayChoice={stay.data}
                trip={trip}
                activities={data.activities}
                autoGenerate={suggest === true && data.activities.length === 0}
                onSaved={refresh}
                onApplied={() => {
                  refresh();
                  setTab("itinerary");
                  void navigate({
                    to: "/trips/$tripId",
                    params: { tripId },
                    search: {},
                    replace: true,
                    resetScroll: false,
                  });
                }}
              />
            </WorkspacePanel>
            <WorkspacePanel active={tab === "places"} label="Places directory">
              <DestinationExplorer
                tripId={tripId}
                destination={trip.destination}
                days={tripDays(trip.start_date, trip.end_date)}
                refresh={refresh}
              />
            </WorkspacePanel>
            <WorkspacePanel active={tab === "shop"} label="Local Shopping">
              <LocalShopping destination={trip.destination} />
              <details className="mt-6 rounded-xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Packing list & travel essentials
                </summary>
                <TravelShop tripId={tripId} destination={trip.destination} />
              </details>
            </WorkspacePanel>
            <TravelTools section={sectionMap[tab] ?? "planner"} currency={trip.currency} />
          </TravelWorkspace>
        </div>
      </main>
    </div>
  );
}

function Itinerary({
  active,
  data,
  refresh,
  stay,
  journey,
}: {
  active: boolean;
  data: Data;
  refresh: () => void;
  stay?: StayChoice | null | undefined;
  journey?: Journey | null | undefined;
}) {
  const [activeDay, setActiveDay] = useState(1);
  const days = tripDays(data.trip.start_date, data.trip.end_date);
  const preferences = useTripPreferences(data.trip.id);
  const connected = journey
    ? connectedBudget(
        {
          destination: data.trip.destination,
          start: data.trip.start_date,
          days,
          travelers: preferences.preference.travelers,
          budget: Number(data.trip.budget),
          currency: data.trip.currency,
          style: preferences.preference.style,
          persona: preferences.preference.persona,
          childrenAges: preferences.preference.childrenAges,
          childrenAgeRanges: preferences.preference.childrenAgeRanges,
        },
        journey,
        stay,
      )
    : null;
  const stayPlan = stayBudget(
    {
      ...(journey
        ? {
            flightBudget: flightCost(
              {
                destination: data.trip.destination,
                start: data.trip.start_date,
                days,
                travelers: preferences.preference.travelers,
                budget: Number(data.trip.budget),
                currency: data.trip.currency,
                style: preferences.preference.style,
                persona: preferences.preference.persona,
                childrenAges: preferences.preference.childrenAges,
                childrenAgeRanges: preferences.preference.childrenAgeRanges,
              },
              journey,
            ),
            hotelComfort: journey.hotelComfort,
          }
        : {}),
      destination: data.trip.destination,
      start: data.trip.start_date,
      days,
      travelers: preferences.preference.travelers,
      budget: Number(data.trip.budget),
      currency: data.trip.currency,
      style: preferences.preference.style,
      persona: preferences.preference.persona,
      childrenAges: preferences.preference.childrenAges,
      childrenAgeRanges: preferences.preference.childrenAgeRanges,
    },
    stay,
  );
  const daily = dailyBudgets(
    Number(data.trip.budget),
    days,
    preferences.preference.travelers,
    data.trip.start_date,
  );
  return (
    <div className="mt-6 space-y-6">
      <div>
        <label htmlFor="saved-itinerary-day" className="mr-3 text-sm font-medium">
          Explore a day
        </label>
        <select
          id="saved-itinerary-day"
          className="h-10 rounded-xl border bg-background px-3"
          value={activeDay}
          onChange={(e) => setActiveDay(Number(e.target.value))}
        >
          {Array.from({ length: days }, (_, i) => (
            <option key={i} value={i + 1}>
              Day {i + 1} · {daily[i]?.date}
            </option>
          ))}
        </select>
      </div>
      <MorePlaces
        key={data.trip.id}
        destination={data.trip.destination}
        days={days}
        day={activeDay}
        active={active}
        current={data.activities}
        disabled={preferences.isPending || preferences.isError}
        onAdd={async (place, day) => {
          const { error } = await supabase.from("activities").insert({
            ...extraActivity(place),
            trip_id: data.trip.id,
            day,
            position:
              Math.max(
                -1,
                ...data.activities.filter((item) => item.day === day).map((item) => item.position),
              ) + 1,
          });
          if (error) throw error;
          refresh();
          return true;
        }}
      />
      {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
        const items = data.activities.filter((a) => a.day === day);
        return (
          <div key={day} hidden={day !== activeDay}>
            <p className="mb-2 text-sm text-muted-foreground">{daily[day - 1]?.date}</p>
            <DayBudgetSummary
              afterStay={
                journey || stayPlan.quoted !== null || !stayPlan.nights
                  ? stayPlan.daily[day - 1]?.amount
                  : undefined
              }
              includesFlights={!!journey}
              amount={daily[day - 1]?.amount ?? 0}
              travelers={preferences.preference.travelers}
              currency={data.trip.currency}
              style={preferences.preference.style}
            />
            <DayCard
              personaDetails={preferences.preference}
              active={active && day === activeDay}
              ticketBudget={
                data.trip.currency === "EUR" && journey
                  ? (connected?.estimates.activities ?? 0) / days
                  : undefined
              }
              travelers={preferences.preference.travelers}
              date={daily[day - 1]?.date}
              day={day}
              items={items}
              tripId={data.trip.id}
              refresh={refresh}
              destination={data.trip.destination}
              style={preferences.preference.style}
              foodPerPerson={
                data.trip.currency === "EUR"
                  ? journey
                    ? (connected?.estimates.food ?? 0) / days / preferences.preference.travelers
                    : (budgetAllocation(
                        daily[day - 1]?.amount ?? 0,
                        preferences.preference.style,
                      ).find((item) => item.label === "Food")?.amount ?? 0) /
                      preferences.preference.travelers
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function Budget({ data, refresh }: { data: Data; refresh: () => void }) {
  const { trip, expenses } = data;
  const [f, setF] = useState({ amount: "", category: "food", note: "", spent_on: trip.start_date });
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const budget = Number(trip.budget);
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const byCat = CATEGORIES.map((c) => ({
    c,
    v: expenses.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0),
  }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      trip_id: trip.id,
      amount,
      category: f.category,
      note: f.note || null,
      spent_on: f.spent_on,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setF({ amount: "", category: f.category, note: "", spent_on: f.spent_on });
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Spent</p>
        <p className="font-display text-4xl font-semibold">{money(total, trip.currency)}</p>
        <p className="text-sm text-muted-foreground">
          of {money(budget, trip.currency)} · {money(Math.max(0, budget - total), trip.currency)}{" "}
          left
        </p>
        <Progress value={pct} className="mt-4" />
        <ul className="mt-6 space-y-2">
          {byCat.map(({ c, v }) => (
            <li key={c} className="flex justify-between text-sm capitalize">
              <span>{c}</span>
              <span>{money(v, trip.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-2">
          <Input
            aria-label="Expense date"
            type="date"
            required
            value={f.spent_on}
            onChange={(e) => setF({ ...f, spent_on: e.target.value })}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            aria-label="Expense amount"
            placeholder="Amount"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })}
          />
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Note"
            value={f.note}
            onChange={(e) => setF({ ...f, note: e.target.value })}
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        <ul className="mt-4 divide-y">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="capitalize font-medium">{e.category}</span>
                {e.note && <span className="text-muted-foreground"> · {e.note}</span>}
                <span className="block text-xs text-muted-foreground">{e.spent_on}</span>
              </span>
              <span className="flex items-center gap-2">
                {money(Number(e.amount), trip.currency)}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(e.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            </li>
          ))}
          {expenses.length === 0 && (
            <li className="py-6 text-center text-muted-foreground">No expenses yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
