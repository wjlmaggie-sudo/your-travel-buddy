import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, MapPin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readStayChoice, stayBudget, type StayChoice } from "@/lib/stay-planning";
import { AccommodationPlanner } from "@/components/AccommodationPlanner";
import { AppHeader } from "@/components/AppHeader";
import { tripQuery, tripDays, money, CATEGORIES } from "@/lib/trips";
import { TripSuggestions } from "@/components/TripSuggestions";
import { DailyBudget, DayBudgetSummary, dailyMoney } from "@/components/DailyBudget";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { TripWeather } from "@/components/TripWeather";
import { ItineraryDay as DayCard } from "@/components/ItineraryDay";
import { Button } from "@/components/ui/button";
import { TravelShop } from "@/components/TravelShop";
import { TripSettings } from "@/components/TripSettings";
import { useTripPreferences } from "@/lib/travel-preferences";
import { PRODUCTS } from "@/lib/travel-data";
import { downloadText, budgetAllocation, dailyBudgets } from "@/lib/planning";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tab, setTab] = useState(suggest ? "ideas" : "itinerary");
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
  function exportTrip() {
    const p = preferences.preference;
    const spent = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const text = [
      "AI Travel — " + trip.destination,
      `${trip.start_date} → ${trip.end_date} | ${tripDays(trip.start_date, trip.end_date)} days | ${p.travelers} travelers`,
      `${p.style} | ${p.interest}`,
      `Group budget: ${money(Number(trip.budget), trip.currency)}`,
      `Per person: ${money(Number(trip.budget) / p.travelers, trip.currency)}`,
      `Actual spending: ${money(spent, trip.currency)}`,
      stay.data
        ? `Chosen accommodation: ${stay.data.name} · amount ${stay.data.amount} ${trip.currency} / ${stay.data.unit}. Verify quote dates, guests and fees in the app.`
        : "Accommodation not quoted yet.",
      "",
      "SUGGESTED ALLOCATION (flights excluded)",
      ...budgetAllocation(Number(trip.budget), p.style).map(
        (b) => `${b.label}: ${money(b.amount, trip.currency)}`,
      ),
      "",
      ...Array.from({ length: tripDays(trip.start_date, trip.end_date) }, (_, index) =>
        [
          `DAY ${index + 1} · ${dailyMoney(dailyBudgets(Number(trip.budget), tripDays(trip.start_date, trip.end_date), p.travelers, trip.start_date)[index]?.amount ?? 0, trip.currency)} group daily budget`,
          ...data.activities
            .filter((a) => a.day === index + 1)
            .map((a) => `${a.time ?? ""} ${a.title} — ${a.location ?? ""}\n${a.notes ?? ""}`),
          "",
        ].join("\n"),
      ),
      "PACKING LIST",
      ...p.packing.map((id) => PRODUCTS.find((product) => product.id === id)?.name ?? id),
      "",
      "Suggested costs are estimates. Check local availability and opening hours.",
    ].join("\n");
    downloadText("ai-travel-plan.txt", text);
  }

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
      <main className="mx-auto max-w-5xl px-6 py-8">
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportTrip}
              disabled={preferences.isPending || preferences.isError}
            >
              Export plan
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteTrip}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
        <TripSettings key={trip.id} trip={trip} />
        <AccommodationPlanner
          tripId={trip.id}
          brief={{
            destination: trip.destination,
            start: trip.start_date,
            days: tripDays(trip.start_date, trip.end_date),
            travelers: preferences.preference.travelers,
            budget: Number(trip.budget),
            currency: trip.currency,
            style: preferences.preference.style,
          }}
        />
        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="ideas">Full-trip suggestions</TabsTrigger>
            <TabsTrigger value="places">Places directory</TabsTrigger>
            <TabsTrigger value="shop">Shops & packing</TabsTrigger>
          </TabsList>
          <TabsContent value="itinerary">
            <div className="my-5">
              <TripWeather
                key={`${trip.destination}-${trip.start_date}-${trip.end_date}`}
                destination={trip.destination}
                startDate={trip.start_date}
                days={tripDays(trip.start_date, trip.end_date)}
              />
            </div>
            <Itinerary data={data} refresh={refresh} stay={stay.data} />
          </TabsContent>
          <TabsContent value="budget">
            <DailyBudget
              trip={trip}
              travelers={preferences.preference.travelers}
              expenses={data.expenses}
            />
            <Budget data={data} refresh={refresh} />
          </TabsContent>
          <TabsContent value="ideas" forceMount className="data-[state=inactive]:hidden">
            <TripSuggestions
              key={tripId}
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
                });
              }}
            />
          </TabsContent>
          <TabsContent value="places">
            <DestinationExplorer
              tripId={tripId}
              destination={trip.destination}
              days={tripDays(trip.start_date, trip.end_date)}
              refresh={refresh}
            />
          </TabsContent>
          <TabsContent value="shop">
            <TravelShop tripId={tripId} destination={trip.destination} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Itinerary({
  data,
  refresh,
  stay,
}: {
  data: Data;
  refresh: () => void;
  stay?: StayChoice | null | undefined;
}) {
  const days = tripDays(data.trip.start_date, data.trip.end_date);
  const preferences = useTripPreferences(data.trip.id);
  const stayPlan = stayBudget(
    {
      destination: data.trip.destination,
      start: data.trip.start_date,
      days,
      travelers: preferences.preference.travelers,
      budget: Number(data.trip.budget),
      currency: data.trip.currency,
      style: preferences.preference.style,
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
      {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
        const items = data.activities.filter((a) => a.day === day);
        return (
          <div key={day}>
            <p className="mb-2 text-sm text-muted-foreground">{daily[day - 1]?.date}</p>
            <DayBudgetSummary
              afterStay={
                stayPlan.quoted !== null || !stayPlan.nights
                  ? stayPlan.daily[day - 1]?.amount
                  : undefined
              }
              amount={daily[day - 1]?.amount ?? 0}
              travelers={preferences.preference.travelers}
              currency={data.trip.currency}
              style={preferences.preference.style}
            />
            <DayCard
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
                  ? (budgetAllocation(
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
