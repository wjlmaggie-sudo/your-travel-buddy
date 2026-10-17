import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  searchDestinations,
  nearbyPlaces,
  type Destination,
  type Place,
} from "@/lib/place-directory";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DestinationExplorer({
  destination,
  tripId,
  days,
  refresh,
}: {
  destination: string;
  tripId: string;
  days: number;
  refresh: () => void;
}) {
  const [query, setQuery] = useState(destination);
  const [locations, setLocations] = useState<Destination[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Destination | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [keyword, setKeyword] = useState("");
  const [day, setDay] = useState(1);
  const [adding, setAdding] = useState<string | null>(null);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSelected(null);
    setPlaces([]);
    setLocations([]);
    setSearched(true);
    try {
      const result = await searchDestinations(query);
      setLocations(result);
      if (!result.length) setError("No matching destination found. Try a city name.");
    } catch (e) {
      setError("Could not search destinations. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  async function choose(location: Destination) {
    setSelected(location);
    setPlaces([]);
    setBusy(true);
    setError("");
    try {
      setPlaces(await nearbyPlaces(location));
    } catch (e) {
      setError(
        "Could not reach the place directory. Please try again later, or use the shop search tab.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function add(place: Place) {
    setAdding(place.id);
    try {
      const { data, error: countError } = await supabase
        .from("activities")
        .select("position")
        .eq("trip_id", tripId)
        .eq("day", day)
        .order("position", { ascending: false })
        .limit(1);
      if (countError) throw countError;
      const { error: saveError } = await supabase
        .from("activities")
        .insert({
          trip_id: tripId,
          day,
          position: (data?.[0]?.position ?? -1) + 1,
          title: place.name,
          location: `${place.name}, ${selected?.name ?? destination}`,
          notes: [
            place.kind,
            place.address,
            `Source: ${place.source}`,
            place.openingHours
              ? `Listed opening hours: ${place.openingHours}. Check before visiting.`
              : "Check current opening hours before visiting.",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      if (saveError) throw saveError;
      toast.success(`Added to Day ${day}`);
      refresh();
    } catch {
      toast.error("Could not save this place. Please try again.");
    } finally {
      setAdding(null);
    }
  }
  const matches = places.filter(
    (p) =>
      (filter === "All" || p.category === filter) &&
      `${p.name} ${p.kind} ${p.address}`.toLowerCase().includes(keyword.toLowerCase()),
  );
  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-2xl font-semibold">Discover real places</h2>
        <p className="mt-2 text-muted-foreground">
          Search a destination, then browse mapped attractions, shops, cafés, and restaurants where
          listed.
        </p>
        <form onSubmit={search} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor="directory-destination">Destination</Label>
            <Input
              id="directory-destination"
              value={query}
              maxLength={150}
              minLength={2}
              required
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Find places
          </Button>
        </form>
        {locations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {locations.map((location) => (
              <Button
                variant={selected?.name === location.name ? "secondary" : "outline"}
                size="sm"
                key={location.source}
                onClick={() => choose(location)}
                disabled={busy}
              >
                {location.name}
              </Button>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {busy && selected && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Searching the place directory…
          </p>
        )}
      </section>
      {selected && !busy && !error && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="place-keyword">Search names or product types</Label>
              <Input
                id="place-keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Museum, books, clothes, bakery…"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="place-day">Add places to</Label>
              <select
                id="place-day"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {Array.from({ length: days }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Day {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Attractions", "Shops", "Food & drink"].map((category) => (
              <Button
                size="sm"
                variant={filter === category ? "secondary" : "outline"}
                key={category}
                onClick={() => setFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((place) => (
              <article
                key={place.id}
                className="space-y-3 rounded-xl border bg-card p-5 shadow-card"
              >
                <p className="text-xs capitalize text-muted-foreground">
                  {place.category} · {place.kind}
                </p>
                <h3 className="text-xl font-semibold">{place.name}</h3>
                {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.lat},${place.lon}`)}`}
                  >
                    View map
                  </a>
                  <a
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={place.source}
                  >
                    Source
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => add(place)}
                  disabled={adding !== null}
                >
                  {adding === place.id ? "Saving…" : `Add to Day ${day}`}
                </Button>
              </article>
            ))}
          </div>
          {matches.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
              No matching mapped places within 4 km. Try another search or use the shop search tab.
            </p>
          )}
        </>
      )}
      {(searched || selected) && (
        <p className="text-xs text-muted-foreground">
          Destination coordinates:{" "}
          <a
            href="https://www.wikipedia.org/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia
          </a>
          . Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap contributors (ODbL)
          </a>
          , via Overpass, with Wikipedia nearby places as a fallback. Coverage varies; verify
          opening hours and product availability with each business.
        </p>
      )}
    </div>
  );
}
