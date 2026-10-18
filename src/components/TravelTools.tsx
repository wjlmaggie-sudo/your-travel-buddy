import { useState } from "react";
import { WorkspacePanel } from "./TravelWorkspace";
import { CurrencyConverter } from "./CurrencyConverter";
import { TripWeather } from "./TripWeather";
import type { TravelSection } from "@/lib/travel-workspace";
export function TravelTools({
  section,
  currency,
  destination,
  start,
  days,
}: {
  section: TravelSection;
  currency: string;
  destination: string;
  start: string;
  days: number;
}) {
  const [location, setLocation] = useState(destination);
  return (
    <>
      <WorkspacePanel active={section === "currency"} label="Currency">
        <CurrencyConverter currency={currency} active={section === "currency"} />
      </WorkspacePanel>
      <WorkspacePanel active={section === "weather"} label="Weather">
        <div className="mx-auto max-w-3xl">
          <label className="block text-sm font-medium" htmlFor="tool-weather-destination">
            Weather destination
          </label>
          <input
            id="tool-weather-destination"
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="e.g. Lisbon, Portugal"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {start} · {days} days. Forecasts are available up to 16 days ahead.
          </p>
        </div>
        <TripWeather
          key={`${location.trim()}-${start}-${days}`}
          destination={location}
          startDate={start}
          days={days}
          active={section === "weather"}
        />
      </WorkspacePanel>
    </>
  );
}
