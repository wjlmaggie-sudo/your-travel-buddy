import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { tripsQuery, money } from "@/lib/trips";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NewTripDialog } from "@/components/NewTripDialog";
import { TripTemplates } from "@/components/TripTemplates";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({
    meta: [
      { title: "My trips — AI Travel" },
      { name: "description", content: "All your planned trips in one place." },
      { property: "og:title", content: "My trips — AI Travel" },
      { property: "og:description", content: "All your planned trips." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tripsQuery()),
  component: TripsPage,
});

function TripsPage() {
  const { data: trips } = useSuspenseQuery(tripsQuery());
  const [dialog, setDialog] = useState(false);
  const [templateId, setTemplateId] = useState("");
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between">
          <h1 className="text-4xl font-semibold">My trips</h1>
          <Button
            onClick={() => {
              setTemplateId("");
              setDialog(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New trip
          </Button>
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
                <Link
                  key={t.id}
                  to="/trips/$tripId"
                  params={{ tripId: t.id }}
                  className="rounded-xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5"
                >
                  <h2 className="text-2xl font-semibold">{t.destination}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> {t.start_date} → {t.end_date}
                  </p>
                  <div className="mt-5 flex justify-between text-sm">
                    <span>{money(t.spent, t.currency)} spent</span>
                    <span className="text-muted-foreground">
                      of {money(Number(t.budget), t.currency)}
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2" />
                </Link>
              );
            })}
          </div>
        )}
        <TripTemplates
          onSelect={(id) => {
            setTemplateId(id);
            setDialog(true);
          }}
        />
        {dialog && (
          <NewTripDialog
            key={templateId}
            open={dialog}
            onOpenChange={setDialog}
            templateId={templateId}
          />
        )}
      </main>
    </div>
  );
}
