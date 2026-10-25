import { SuggestedBudgetNotice } from "./SuggestedBudgetNotice";
import type { Journey } from "@/lib/journey-planning";
import { connectedBudget } from "@/lib/travel-workspace";
import type { StayBrief, StayChoice } from "@/lib/stay-planning";
import { LiveHotelSearch } from "./LiveHotelSearch";
import { Button } from "./ui/button";
export function HotelRecommendations({
  brief,
  journey,
  stay,
  onChoose,
  active = false,
  onContinue,
  onEditTrip,
}: {
  brief: StayBrief;
  journey: Journey;
  stay?: StayChoice | null | undefined;
  onChoose: (choice: StayChoice | null) => void;
  active?: boolean;
  onContinue?: (() => void) | undefined;
  onEditTrip?: (() => void) | undefined;
}) {
  const effective = { ...brief, hotelRooms: journey.hotelRooms ?? brief.hotelRooms };
  if (brief.days === 1)
    return (
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-2xl">No overnight stay needed.</h2>
        <Button className="mt-4" onClick={onContinue}>
          Continue to attractions →
        </Button>
      </div>
    );
  const budget = connectedBudget(brief, journey, stay);
  const allowance = Math.max(0, brief.budget - budget.flight - budget.estimated);
  return (
    <>
      {journey.budgetSuggestion?.amount === brief.budget &&
        journey.budgetSuggestion.currency === brief.currency && (
          <SuggestedBudgetNotice suggestion={journey.budgetSuggestion} compact />
        )}
      <LiveHotelSearch
        brief={effective}
        allowance={allowance}
        active={active}
        chosen={stay}
        onChoose={onChoose}
        onContinue={onContinue}
        onEditTrip={onEditTrip}
      />
    </>
  );
}
