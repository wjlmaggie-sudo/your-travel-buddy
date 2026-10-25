import { useState } from "react";
import { Search, MapPin, ShoppingBag, Loader2, Navigation } from "lucide-react";
import {
  nearbyPlaces,
  searchDestinations,
  type Destination,
  type Place,
} from "@/lib/place-directory";
import { Button } from "./ui/button";
export function LocalShopping({ destination }: { destination: string }) {
  const [product, setProduct] = useState(""),
    [area, setArea] = useState(destination),
    [locations, setLocations] = useState<Destination[]>([]),
    [stores, setStores] = useState<Place[]>([]),
    [location, setLocation] = useState<Destination | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [searched, setSearched] = useState(false),
    [submitted, setSubmitted] = useState("");
  async function choose(place: Destination, term = submitted) {
    setBusy(true);
    setLocation(place);
    setError("");
    setStores([]);
    try {
      const all = (await nearbyPlaces(place)).filter((item) => item.category === "Shops");
      const words = term
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);
      const beauty = /skin|beauty|cosmetic|cream|sunscreen|serum/i.test(term);
      setStores(
        all
          .sort((a, b) => {
            const score = (item: Place) =>
              words.filter((word) => `${item.name} ${item.kind}`.toLowerCase().includes(word))
                .length + (beauty && /cosmetic|chemist|pharmacy|beauty/i.test(item.kind) ? 2 : 0);
            return score(b) - score(a);
          })
          .slice(0, 9),
      );
    } catch {
      setError("The local directory is unavailable. Try again or use the map search below.");
    } finally {
      setBusy(false);
    }
  }
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${submitted || product || "shops"} in ${location?.name || area || destination}`)}`;
  return (
    <section className="space-y-5" aria-labelledby="shopping-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
          A little local discovery
        </p>
        <h2 id="shopping-heading" className="mt-2 text-3xl font-semibold">
          Find something worth bringing home.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Find a product, a local specialty or a favorite brand.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Shopping ideas">
        {["Skincare", "Coffee beans", "Souvenirs"].map((idea) => (
          <Button
            key={idea}
            variant={product === idea ? "secondary" : "outline"}
            size="sm"
            onClick={() => setProduct(idea)}
          >
            {idea}
          </Button>
        ))}
      </div>
      <form
        className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setSubmitted(product);
          setSearched(true);
          setError("");
          setStores([]);
          setLocation(null);
          try {
            const found = await searchDestinations(area);
            setLocations(found);
            if (!found.length) setError("No destination found. Try a city and country.");
            else if (found.length === 1) await choose(found[0]!, product);
          } catch {
            setError(
              "Could not search the place directory. Use the external map search or try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label htmlFor="local-product" className="text-sm font-medium">
            Product or store
          </label>
          <input
            id="local-product"
            className="mt-2 h-11 w-full rounded-md border bg-background px-3"
            placeholder="e.g. skincare or a brand"
            maxLength={150}
            required
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="local-area" className="text-sm font-medium">
            Shopping destination
          </label>
          <input
            id="local-area"
            className="mt-2 h-11 w-full rounded-md border bg-background px-3"
            required
            maxLength={150}
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>
        <Button className="h-11 self-end" disabled={busy} type="submit">
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Find local shops
        </Button>
      </form>
      <details className="rounded-xl bg-secondary/10 p-4 text-xs">
        <summary className="cursor-pointer font-medium">
          Shop locations · stock & prices unverified
        </summary>
        <p className="mt-2 leading-relaxed">
          Mapped stores may be relevant, but product stock and prices have not been verified.
          Confirm the exact product, size, price and opening hours with the shop.
        </p>
      </details>
      {busy && (
        <p role="status" className="text-sm">
          Looking up local places…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!!locations.length && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Choose the search area</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {locations.map((place) => (
              <Button
                key={`${place.name}-${place.lat}`}
                variant={location?.name === place.name ? "secondary" : "outline"}
                size="sm"
                disabled={busy}
                onClick={() => choose(place)}
              >
                {place.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      {location && (
        <p className="text-xs text-muted-foreground">
          General stores near {location.name}, ranked by matching name or shop type. A result is not
          evidence that it carries “{submitted}”.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => (
          <article key={store.id} className="rounded-2xl border bg-card p-5 shadow-card">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="mt-3 inline-block rounded-full bg-muted px-2 py-1 text-[10px]">
              General store · stock unverified
            </span>
            <h3 className="mt-2 text-xl font-semibold">{store.name}</h3>
            <p className="mt-2 flex gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {store.address ||
                `${store.lat.toFixed(4)}, ${store.lon.toFixed(4)} · ${location?.name}`}
            </p>
            <p className="mt-2 text-xs">
              {store.kind} · Product availability unknown · Price unknown
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {store.openingHours
                ? `Directory hours: ${store.openingHours} · confirm before visiting`
                : "Opening hours unavailable"}
            </p>
            <div className="mt-4 flex gap-4 text-xs text-secondary underline">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                Directions ↗
              </a>
              <a href={store.source} target="_blank" rel="noreferrer">
                Directory source ↗
              </a>
            </div>
          </article>
        ))}
      </div>
      {searched && location && !busy && !stores.length && !error && (
        <p className="text-sm text-muted-foreground">
          No mapped shops were returned in this area. Try a nearby area or search the map.
        </p>
      )}
      <a
        href={maps}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-secondary"
      >
        <Navigation className="h-4 w-4" />
        Search this product on Google Maps ↗
      </a>
    </section>
  );
}
