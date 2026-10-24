import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadCityGuide, type VisualPlace } from "@/lib/city-guides";
import { extraPlaces, type PlannedPlace } from "@/lib/extra-places";
import { admissionFor } from "@/lib/visit-logistics";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export function MorePlaces({
  destination,
  days,
  day = 1,
  current,
  active = true,
  disabled = false,
  maxPerDay,
  unavailableDays = [],
  openRequest = 0,
  onAdd,
}: {
  destination: string;
  days: number;
  day?: number;
  current: PlannedPlace[];
  active?: boolean;
  disabled?: boolean;
  maxPerDay?: number;
  unavailableDays?: number[];
  openRequest?: number;
  onAdd: (place: VisualPlace, day: number) => boolean | Promise<boolean>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openRequest > 0) setOpen(true);
  }, [openRequest]);
  const [search, setSearch] = useState("");
  const [targetDay, setTargetDay] = useState(day);
  const [limit, setLimit] = useState(6);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => {
    setTargetDay(day);
  }, [day]);
  const query = useQuery({
    queryKey: ["visual-city-guide", destination],
    queryFn: () => loadCityGuide(destination),
    enabled: active && open,
    staleTime: 1800000,
    retry: false,
  });
  const options = query.data
    ? extraPlaces(query.data, destination, current, search).filter((p) => !added.includes(p.name))
    : [];
  useEffect(() => {
    const remaining = added.filter(
      (name) => !current.some((item) => item.location === name || item.title === name),
    );
    if (remaining.length !== added.length) setAdded(remaining);
  }, [current, added]);
  const unavailable = unavailableDays.includes(targetDay);
  const full =
    maxPerDay !== undefined && current.filter((p) => p.day === targetDay).length >= maxPerDay;
  async function add(place: VisualPlace) {
    if (busy || disabled || full || unavailable) return;
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      const accepted = await onAdd(place, targetDay);
      if (accepted) {
        setAdded((items) => [...items, place.name]);
        setMessage(
          `${place.name} added to day ${targetDay}. You can edit or remove it in your itinerary.`,
        );
      } else setFailure("This place could not be added. Check the selected day and try again.");
    } catch {
      setFailure("Could not add this place. Your itinerary is unchanged; try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className="rounded-2xl border bg-card p-4"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer text-base font-semibold">
        <span>More places to explore</span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          Browse extra recommendations, choose a day and add your favorites.
        </span>
      </summary>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Explore places outside your current plan, including options beyond your persona
            recommendations. Add only the ones you want.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <div>
              <label className="text-sm" htmlFor={`${id}-search`}>
                Find another place
              </label>
              <Input
                id={`${id}-search`}
                placeholder="Search names or interests"
                maxLength={150}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(6);
                }}
              />
            </div>
            <div>
              <label className="text-sm" htmlFor={`${id}-day`}>
                Add to day
              </label>
              <select
                id={`${id}-day`}
                className="h-10 w-full rounded-md border bg-background px-3"
                value={targetDay}
                onChange={(e) => setTargetDay(Number(e.target.value))}
              >
                {Array.from({ length: days }, (_, index) => (
                  <option key={index} value={index + 1}>
                    Day {index + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Adding a place does not book tickets or change your activity allowance. Check costs,
            travel time, opening hours and suitability before visiting; some options may exceed your
            budget.
          </p>
          {unavailable && (
            <p className="text-sm text-muted-foreground">
              Day {targetDay} is already saved. Choose an unsaved day here, or add places from your
              saved itinerary.
            </p>
          )}
          {full && (
            <p className="text-sm text-muted-foreground">
              Day {targetDay} already has {maxPerDay} activities. Choose another day or remove an
              activity first.
            </p>
          )}
          <p role="status" className="text-sm text-secondary">
            {message || (query.isFetching ? "Finding more places…" : "")}
          </p>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
          {query.isError ? (
            <div className="text-sm">
              <p>More places are unavailable right now. Your plan is unchanged.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={() => query.refetch()}
              >
                Try loading places again
              </Button>
            </div>
          ) : (
            query.data && (
              <>
                <p className="text-xs text-muted-foreground">
                  {options.length
                    ? `Showing ${Math.min(limit, options.length)} of ${options.length} additional places.`
                    : "No additional matches in the available local directory. Try another search or add your own activity."}
                </p>
                <div className="grid max-h-[28rem] gap-3 overflow-y-auto sm:grid-cols-2">
                  {options.slice(0, limit).map((place) => {
                    const ticket = admissionFor(place.name);
                    return (
                      <article
                        key={place.name}
                        className="flex min-w-0 flex-col rounded-xl border bg-background p-4"
                      >
                        <h4 className="font-semibold">{place.name}</h4>
                        <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                          {place.description}
                        </p>
                        <p className="mt-2 text-xs">
                          {ticket?.price === 0
                            ? "Public-space visit · food, transport and paid extras separate"
                            : ticket?.price !== undefined
                              ? `Reference admission: €${ticket.price.toFixed(2)} per adult · confirm your group total`
                              : "Ticket price unverified · check with the venue"}
                        </p>
                        <div className="my-3 flex flex-wrap gap-3 text-xs">
                          <a
                            className="text-secondary underline"
                            href={place.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Place details
                          </a>
                          <a
                            className="text-secondary underline"
                            href={ticket?.url ?? place.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Tickets & access
                          </a>
                          <a
                            className="text-secondary underline"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${destination}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Map
                          </a>
                        </div>
                        <Button
                          type="button"
                          className="mt-auto h-auto whitespace-normal py-2"
                          variant="outline"
                          disabled={busy || disabled || full || unavailable}
                          onClick={() => void add(place)}
                        >
                          Add {place.name} to day {targetDay}
                        </Button>
                      </article>
                    );
                  })}
                </div>
                {options.length > limit && (
                  <Button type="button" variant="ghost" onClick={() => setLimit((n) => n + 6)}>
                    Show more places
                  </Button>
                )}
              </>
            )
          )}
        </div>
      )}
    </details>
  );
}
