import { useState } from "react";
import { MapPin, Shuffle } from "lucide-react";
import { TEMPLATES } from "@/lib/travel-data";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/trips";

export function TripTemplates({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All trips");
  return (
    <section className="mt-10 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold">Find your next story</h2>
          <p className="text-muted-foreground">Six starting points, ready to make your own.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
            if (t) onSelect(t.id);
          }}
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Surprise me
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {["All trips", "City breaks", "Beach escapes", "Nature & adventure", "Food & culture"].map(
          (category) => (
            <Button
              key={category}
              size="sm"
              variant={filter === category ? "secondary" : "outline"}
              onClick={() => setFilter(category)}
            >
              {category}
            </Button>
          ),
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.filter((t) => filter === "All trips" || t.category === filter).map((t) => (
          <article key={t.id} className="overflow-hidden rounded-xl border bg-card shadow-card">
            <img
              className="h-40 w-full object-cover"
              src={`https://images.unsplash.com/${t.image}?auto=format&fit=crop&w=650&q=80`}
              alt={`${t.destination} travel inspiration`}
              loading="lazy"
            />
            <div className="space-y-3 p-5">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {t.destination}
              </p>
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <p className="text-sm">
                {t.days} days · estimated {money(t.price, "EUR")} / person
              </p>
              <Button variant="outline" className="w-full" onClick={() => onSelect(t.id)}>
                Use template
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Template prices are illustrative EUR estimates, excluding flights. Check local costs and
        availability.
      </p>
    </section>
  );
}
