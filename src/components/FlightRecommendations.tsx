import { LiveFlightSearch } from "./LiveFlightSearch";
import { flightScope } from "@/lib/travel-workspace";
import type { Journey } from "@/lib/journey-planning";
import type { StayBrief } from "@/lib/stay-planning";
import { Button } from "./ui/button";
export function FlightRecommendations({
  brief,
  journey,
  onChange,
  active = false,
  onContinue,
  onEditTrip,
}: {
  brief: StayBrief;
  journey: Journey;
  onChange: (next: Journey, route?: { departure: string; destination: string }) => void;
  active?: boolean;
  onContinue?: (() => void) | undefined;
  onEditTrip?: (() => void) | undefined;
}) {
  if (journey.flightsRequired === false)
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-2xl font-semibold">A trip without flights</h2>
        <p className="my-3 text-sm">Your plan does not include air travel.</p>
        <Button onClick={onContinue}>Continue to hotels →</Button>
        <Button variant="ghost" onClick={onEditTrip}>
          Edit trip details
        </Button>
      </section>
    );
  return (
    <LiveFlightSearch
      key={flightScope(brief, journey.departure)}
      brief={brief}
      departure={journey.departure}
      active={active}
      chosen={journey.selectedFlight}
      onChoose={(choice, route) => onChange({ ...journey, selectedFlight: choice }, route)}
      onContinue={onContinue}
      onEditTrip={onEditTrip}
    />
  );
}
