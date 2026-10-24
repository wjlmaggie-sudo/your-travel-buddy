import { WorkspacePanel } from "./TravelWorkspace";
import { CurrencyConverter } from "./CurrencyConverter";
import type { TravelSection } from "@/lib/travel-workspace";

export function TravelTools({ section, currency }: { section: TravelSection; currency: string }) {
  return (
    <WorkspacePanel active={section === "currency"} label="Currency">
      <CurrencyConverter currency={currency} active={section === "currency"} />
    </WorkspacePanel>
  );
}
