import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { tripsQuery, money } from "@/lib/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({
    meta: [
      { title: "My trips — Wayfarer" },
      { name: "description", content: "All your planned trips in one place." },
      { property: "og:title", content: "My trips — Wayfarer" },
      { property: "og:description", content: "All your planned trips." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tripsQuery()),
  component: TripsPage,
});

function TripsPage() {
  const { data: trips } = useSuspenseQuery(tripsQuery());
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between">
          <h1 className="text-4xl font-semibold">My trips</h1>
          <NewTripDialog />
        </div>
        {trips.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            No trips yet. Where to first?
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {trips.map((t) => {
              const pct = t.budget > 0 ? Math.min(100, (t.spent / Number(t.budget)) * 100) : 0;
              return (
                <Link key={t.id} to="/trips/$tripId" params={{ tripId: t.id }} className="rounded-xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5">
                  <h2 className="text-2xl font-semibold">{t.destination}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> {t.start_date} → {t.end_date}
                  </p>
                  <div className="mt-5 flex justify-between text-sm">
                    <span>{money(t.spent, t.currency)} spent</span>
                    <span className="text-muted-foreground">of {money(Number(t.budget), t.currency)}</span>
                  </div>
                  <Progress value={pct} className="mt-2" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function NewTripDialog() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ destination: "", start_date: "", end_date: "", budget: "", currency: "USD" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (f.end_date < f.start_date) return toast.error("End date must be after start date");
    const { data, error } = await supabase
      .from("trips")
      .insert({ ...f, budget: Number(f.budget) || 0, currency: f.currency.toUpperCase() })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["trips"] });
    setOpen(false);
    navigate({ to: "/trips/$tripId", params: { tripId: data.id } });
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> New trip</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl">New trip</DialogTitle></DialogHeader>
        <form onSubmit={create} className="space-y-4">
          <div className="space-y-1.5"><Label>Destination</Label><Input required value={f.destination} onChange={set("destination")} placeholder="Lisbon, Portugal" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start</Label><Input type="date" required value={f.start_date} onChange={set("start_date")} /></div>
            <div className="space-y-1.5"><Label>End</Label><Input type="date" required value={f.end_date} onChange={set("end_date")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Budget</Label><Input type="number" min="0" value={f.budget} onChange={set("budget")} /></div>
            <div className="space-y-1.5"><Label>Currency</Label><Input maxLength={3} value={f.currency} onChange={set("currency")} /></div>
          </div>
          <Button type="submit" className="w-full">Create trip</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
