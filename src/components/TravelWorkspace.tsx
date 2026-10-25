import type { ReactNode } from "react";
import { dailyMoney } from "./DailyBudget";
import { TravelNavigation } from "./TravelNavigation";
import { SECTIONS, type TravelSection } from "@/lib/travel-workspace";

/** Panels stay mounted to preserve edits; their content scrolls with the document. */
export function TravelWorkspace({
  section,
  onChange,
  children,
  title,
  summary,
}: {
  section: TravelSection;
  onChange: (section: TravelSection) => void;
  children: ReactNode;
  title?: string;
  summary?: ReactNode;
}) {
  return (
    <div className="travel-workspace" data-testid="travel-workspace">
      <aside className="workspace-navigation">
        <TravelNavigation section={section} onChange={onChange} />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="workspace-heading">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[.18em] text-secondary">
              {title || "Your travel workspace"}
            </p>
            <h2 className="mt-1 truncate font-sans text-lg font-semibold">
              {SECTIONS.find((item) => item.id === section)?.label}
            </h2>
          </div>
          <div className="w-32 shrink-0 text-right text-xs text-muted-foreground sm:w-40">
            {summary || "Explore freely"}
          </div>
        </header>
        <div className="workspace-views">{children}</div>
      </div>
    </div>
  );
}
export function WorkspacePanel({
  active,
  label,
  children,
  className = "",
}: {
  active: boolean;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      hidden={!active}
      aria-label={label}
      tabIndex={0}
      className={`workspace-panel ${className}`}
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">{children}</div>
    </section>
  );
}

export type BudgetSnapshot = { planned: number; remaining: number; currency: string };
export function BudgetSummary({ planned, remaining, currency }: BudgetSnapshot) {
  return (
    <div role="status" aria-label="Trip budget summary" className="space-y-1 tabular-nums">
      <p className="font-semibold text-foreground">{dailyMoney(planned, currency)} planned</p>
      <p className={remaining < 0 ? "text-destructive" : "text-secondary"}>
        {dailyMoney(Math.abs(remaining), currency)} {remaining < 0 ? "over budget" : "remaining"}
      </p>
    </div>
  );
}
