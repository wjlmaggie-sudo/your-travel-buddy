import { useState } from "react";
import { Check, ExternalLink, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { PRODUCTS } from "@/lib/travel-data";
import { useTripPreferences } from "@/lib/travel-preferences";
import { money } from "@/lib/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TravelShop({ tripId, destination }: { tripId: string; destination: string }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState(destination);
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const prefs = useTripPreferences(tripId);
  const products = PRODUCTS.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      `${p.name} ${p.description} ${p.category}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  async function toggle(id: string) {
    setBusy(true);
    try {
      await prefs.save({
        ...prefs.preference,
        packing: prefs.preference.packing.includes(id)
          ? prefs.preference.packing.filter((item) => item !== id)
          : [...prefs.preference.packing, id],
      });
    } catch {
      toast.error("Could not save your packing list. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Good things for the journey
        </h2>
        <div className="mt-4 grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label htmlFor="product-search">Search products</Label>
            <Input
              id="product-search"
              className="mt-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Backpack, camera, skincare…"
            />
          </div>
          <div>
            <Label htmlFor="shop-location">Shopping near</Label>
            <Input
              id="shop-location"
              className="mt-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <Button asChild variant="secondary" disabled={!location.trim()}>
            <a
              aria-disabled={!location.trim()}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${search.trim() || "travel essentials shops"} ${location}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find local shops <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {["All", "Bags", "Tech", "Comfort", "Care"].map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "secondary" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <article className="rounded-xl border bg-card p-5 shadow-card" key={p.id}>
              <div className="mb-4 rounded-lg bg-muted p-6 text-center text-4xl" aria-hidden="true">
                {p.emoji}
              </div>
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.category} · estimated {money(p.price, "EUR")}
              </p>
              <p className="my-3 text-sm text-muted-foreground">{p.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggle(p.id)}
                  disabled={busy || prefs.isPending || prefs.isError}
                >
                  {prefs.preference.packing.includes(p.id) ? (
                    <Check className="mr-1 h-4 w-4" />
                  ) : null}
                  {prefs.preference.packing.includes(p.id) ? "Packed" : "Add to packing list"}
                </Button>
                <a
                  className="text-sm text-primary underline"
                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(p.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find product ↗
                </a>
              </div>
            </article>
          ))}
          {products.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-muted-foreground sm:col-span-2">
              No matching essentials. Try another keyword or use local shop search.
            </p>
          )}
        </div>
        <aside className="self-start rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-2xl font-semibold">Packing list</h2>
          {prefs.isError ? (
            <p className="mt-4 text-sm text-destructive">
              Your packing list could not load.{" "}
              <button className="underline" onClick={() => prefs.refetch()}>
                Try again
              </button>
            </p>
          ) : prefs.isPending ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading your list…</p>
          ) : (
            <ul className="mt-4 divide-y">
              {prefs.preference.packing.map((id) => {
                const product = PRODUCTS.find((p) => p.id === id);
                return product ? (
                  <li key={id} className="flex items-center justify-between gap-2 py-3 text-sm">
                    <span>{product.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${product.name}`}
                      disabled={busy}
                      onClick={() => toggle(id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ) : null;
              })}
            </ul>
          )}
          {!prefs.isPending && !prefs.preference.packing.length && (
            <p className="mt-4 text-sm text-muted-foreground">
              Add essentials for this trip. Your list is saved to your account.
            </p>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Example products and estimated EUR prices. Links open external shop searches; verify
            current prices and availability.
          </p>
        </aside>
      </div>
    </div>
  );
}
