import { WorkspacePanel } from "./TravelWorkspace";
import { TripWeather } from "./TripWeather";
import { CurrencyConverter } from "./CurrencyConverter";
import type { TravelSection } from "@/lib/travel-workspace";

export function TravelTools({
  section,
  currency,
  destination = "",
  startDate = "",
  days = 1,
}: {
  section: TravelSection;
  currency: string;
  destination?: string;
  startDate?: string;
  days?: number;
}) {
  return (
    <>
      <WorkspacePanel active={section === "currency"} label="Currency">
        <CurrencyConverter currency={currency} active={section === "currency"} />
      </WorkspacePanel>
      <WorkspacePanel active={section === "weather"} label="Weather">
        {destination.trim() ? (
          <TripWeather
            destination={destination}
            startDate={startDate}
            days={days}
            active={section === "weather"}
          />
        ) : (
          <p className="rounded-2xl border bg-card p-6">
            Enter a destination in the travel planner to see its weather.
          </p>
        )}
      </WorkspacePanel>
    </>
  );
}
