import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowDown, ArrowUp, Trash2, MapPin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { tripQuery, tripDays, money, CATEGORIES } from "@/lib/trips";
import { generateTripIdeas, type TripIdeas } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Trip plan — Wayfarer" },
      { name: "description", content: "Itinerary, budget and AI ideas for your trip." },
      { property: "og:title", content: "Trip plan — Wayfarer" },
      { property: "og:description", content: "Itinerary, budget and AI ideas." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tripQuery(params.tripId)),
  component: TripPage,
});

type Data = Awaited<ReturnType<NonNullable<ReturnType<typeof tripQuery>["queryFn"]>>>;

function TripPage() {
  const { tripId } = Route.useParams();
  const { data } = useSuspenseQuery(tripQuery(tripId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => qc.invalidateQueries({ queryKey: ["trip", tripId] });
  const { trip } = data;

  async function deleteTrip() {
    if (!confirm("Delete this trip?")) return;
    await supabase.from("trips").delete().eq("id", tripId);
    await qc.invalidateQueries({ queryKey: ["trips"] });
    navigate({ to: "/trips" });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/trips" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All trips
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">{trip.destination}</h1>
            <p className="text-muted-foreground">{trip.start_date} → {trip.end_date}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={deleteTrip}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
        </div>
        <Tabs defaultValue="itinerary" className="mt-8">
          <TabsList>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="ideas">AI Ideas</TabsTrigger>
          </TabsList>
          <TabsContent value="itinerary"><Itinerary data={data} refresh={refresh} /></TabsContent>
          <TabsContent value="budget"><Budget data={data} refresh={refresh} /></TabsContent>
          <TabsContent value="ideas"><Ideas data={data} refresh={refresh} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Itinerary({ data, refresh }: { data: Data; refresh: () => void }) {
  const days = tripDays(data.trip.start_date, data.trip.end_date);
  return (
    <div className="mt-6 space-y-6">
      {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
        const items = data.activities.filter((a) => a.day === day);
        return <DayCard key={day} day={day} items={items} tripId={data.trip.id} refresh={refresh} />;
      })}
    </div>
  );
}

function DayCard({ day, items, tripId, refresh }: { day: number; items: Data["activities"]; tripId: string; refresh: () => void }) {
  const [f, setF] = useState({ time: "", title: "", location: "", notes: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const { error } = await supabase.from("activities").insert({ ...f, trip_id: tripId, day, position: items.length });
    if (error) return toast.error(error.message);
    setF({ time: "", title: "", location: "", notes: "" });
    refresh();
  }
  async function move(idx: number, dir: -1 | 1) {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("activities").update({ position: idx + dir }).eq("id", a.id),
      supabase.from("activities").update({ position: idx }).eq("id", b.id),
    ]);
    refresh();
  }
  async function remove(id: string) {
    await supabase.from("activities").delete().eq("id", id);
    refresh();
  }

  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-2xl font-semibold">Day {day}</h2>
      <ul className="mt-4 divide-y">
        {items.map((a, i) => (
          <li key={a.id} className="flex items-start gap-4 py-3">
            <span className="w-14 shrink-0 font-medium text-primary">{a.time || "—"}</span>
            <div className="flex-1">
              <p className="font-medium">{a.title}</p>
              {a.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{a.location}</p>}
              {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
            </div>
            <div className="flex">
              <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[90px_1fr_1fr_auto]">
        <Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
        <Input placeholder="Activity" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Place" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <Button type="submit" variant="secondary">Add</Button>
      </form>
    </section>
  );
}

function Budget({ data, refresh }: { data: Data; refresh: () => void }) {
  const { trip, expenses } = data;
  const [f, setF] = useState({ amount: "", category: "food", note: "" });
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const budget = Number(trip.budget);
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const byCat = CATEGORIES.map((c) => ({ c, v: expenses.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0) }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0) return toast.error("Enter an amount");
    const { error } = await supabase.from("expenses").insert({ trip_id: trip.id, amount, category: f.category, note: f.note || null });
    if (error) return toast.error(error.message);
    setF({ amount: "", category: f.category, note: "" });
    refresh();
  }
  async function remove(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Spent</p>
        <p className="font-display text-4xl font-semibold">{money(total, trip.currency)}</p>
        <p className="text-sm text-muted-foreground">of {money(budget, trip.currency)} · {money(Math.max(0, budget - total), trip.currency)} left</p>
        <Progress value={pct} className="mt-4" />
        <ul className="mt-6 space-y-2">
          {byCat.map(({ c, v }) => (
            <li key={c} className="flex justify-between text-sm capitalize"><span>{c}</span><span>{money(v, trip.currency)}</span></li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-[100px_130px_1fr_auto]">
          <Input type="number" min="0" step="0.01" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <Button type="submit" variant="secondary">Add</Button>
        </form>
        <ul className="mt-4 divide-y">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="capitalize font-medium">{e.category}</span>{e.note && <span className="text-muted-foreground"> · {e.note}</span>}</span>
              <span className="flex items-center gap-2">{money(Number(e.amount), trip.currency)}
                <Button variant="ghost" size="icon" onClick={() => remove(e.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </span>
            </li>
          ))}
          {expenses.length === 0 && <li className="py-6 text-center text-muted-foreground">No expenses yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Ideas({ data, refresh }: { data: Data; refresh: () => void }) {
  const gen = useServerFn(generateTripIdeas);
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<TripIdeas | null>(null);
  const days = tripDays(data.trip.start_date, data.trip.end_date);

  async function run() {
    setLoading(true);
    try {
      const res = await gen({ data: { destination: data.trip.destination, days, interests } });
      if (res.error) toast.error(res.error);
      else setIdeas(res.ideas);
    } catch {
      toast.error("Couldn't generate ideas right now.");
    } finally {
      setLoading(false);
    }
  }

  async function addDay(d: TripIdeas["days"][number]) {
    const existing = data.activities.filter((a) => a.day === d.day).length;
    const { error } = await supabase.from("activities").insert(
      d.items.map((it, i) => ({ ...it, trip_id: data.trip.id, day: Math.min(d.day, days), position: existing + i })),
    );
    if (error) return toast.error(error.message);
    toast.success(`Added to Day ${d.day}`);
    refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-2xl font-semibold">Need inspiration?</h2>
        <p className="text-muted-foreground">Tell us what you love and we'll sketch a {days}-day plan for {data.trip.destination}.</p>
        <Textarea className="mt-4" placeholder="e.g. street food, hiking, museums, slow mornings" value={interests} onChange={(e) => setInterests(e.target.value)} />
        <Button className="mt-3" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {loading ? "Planning…" : "Generate ideas"}
        </Button>
      </section>
      {ideas?.days.map((d) => (
        <section key={d.day} className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Day {d.day}</h3>
            <Button size="sm" variant="secondary" onClick={() => addDay(d)}>Add to itinerary</Button>
          </div>
          <ul className="mt-3 space-y-2">
            {d.items.map((it, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="w-12 shrink-0 font-medium text-primary">{it.time}</span>
                <span><span className="font-medium">{it.title}</span> <span className="text-muted-foreground">· {it.location} — {it.notes}</span></span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
