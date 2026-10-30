import { TripCover } from "./TripCover";
import { CarRental } from "./CarRental";
import { MorePlaces } from "./MorePlaces";
import { extraActivity } from "@/lib/extra-places";
import { personaSummary } from "@/lib/travel-personas";
import { DownloadTripPdf } from "./DownloadTripPdf";
import { WorkspacePanel, type BudgetSnapshot } from "./TravelWorkspace";
import { SavePlanButton } from "./SavePlanButton";
import { TripBudgetDashboard } from "./TripBudgetDashboard";
import { FlightRecommendations } from "./FlightRecommendations";
import { HotelRecommendations } from "./HotelRecommendations";
import { LocalShopping } from "./LocalShopping";
import {
  flightCost,
  flightScope,
  connectedBudget,
  type TravelSection,
} from "@/lib/travel-workspace";

import { createJourneyIdeas } from "@/lib/journey-plan";
import type { Journey } from "@/lib/journey-planning";

import { stayCost, stayBudget, type StayChoice } from "@/lib/stay-planning";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { TripIdeas } from "../../supabase/functions/_shared/trip-ideas";
import { savePlannerDraft, saveGuestSimulation, type PlannerDraft } from "@/lib/planner-draft";
import { dailyBudgets, budgetAllocation } from "@/lib/planning";
import { DayVisuals } from "./DayVisuals";
import { DayWeather } from "./DayWeather";
import { DayBudgetSummary } from "./DailyBudget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function InstantPlan({
  brief,
  initialIdeas,
  onEdited,
  section = "planner",
  onSectionChange,
  overviewActive = true,
  onEditBrief,
  onBudgetChange,
  onRouteUpdate,
}: {
  onBudgetChange?: (budget: BudgetSnapshot) => void;
  onRouteUpdate?: (destination: string, departure: string) => void;
  overviewActive?: boolean;
  onEditBrief?: () => void;
  section?: TravelSection;
  onSectionChange?: (section: TravelSection) => void;
  brief: PlannerDraft;
  initialIdeas: TripIdeas;
  onEdited: () => void;
}) {
  const [journey, setJourney] = useState<Journey>(
    brief.journey
      ? {
          ...brief.journey,
          selectedFlight:
            brief.journey.selectedFlight?.evidence === "demo"
              ? undefined
              : brief.journey.selectedFlight,
        }
      : {
          departure: "",
          flightBudget: 0,
          hotelComfort: "Comfortable",
          flightsRequired: false,
        },
  );
  const [placesRequest, setPlacesRequest] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const [activityEdited, setActivityEdited] = useState(false);
  const [stay, setStay] = useState<StayChoice | null>(
    brief.stay?.evidence === "demo" ? null : (brief.stay ?? null),
  );
  const [ideas, setIdeas] = useState(initialIdeas);
  useEffect(() => {
    saveGuestSimulation({ ...brief, ideas, journey, stay: stay ?? undefined });
  }, [brief, ideas, journey, stay]);
  const budgets = dailyBudgets(brief.budget, brief.days, brief.travelers, brief.start);
  const effectiveBrief = {
    ...brief,
    ...(journey
      ? {
          flightBudget: flightCost(brief, journey),
          hotelComfort: journey.hotelComfort,
          hotelRooms: journey.hotelRooms,
        }
      : {}),
  };
  const stayPlan = stayBudget(effectiveBrief, stay);
  const connected = connectedBudget(brief, journey, stay);
  useEffect(() => {
    onBudgetChange?.({
      planned: connected.planned,
      remaining: connected.remaining,
      currency: brief.currency,
    });
  }, [connected.planned, connected.remaining, brief.currency, onBudgetChange]);
  function editIdeas(change: (current: TripIdeas) => TripIdeas) {
    onEdited();
    setActivityEdited(true);
    setIdeas(change);
  }
  function update(
    dayIndex: number,
    itemIndex: number,
    field: "time" | "title" | "location" | "notes",
    value: string,
  ) {
    editIdeas((current) => ({
      ...current,
      days: current.days.map((day, di) =>
        di !== dayIndex
          ? day
          : {
              ...day,
              items: day.items.map((item, ii) =>
                ii !== itemIndex ? item : { ...item, [field]: value },
              ),
            },
      ),
    }));
  }
  return (
    <div id="whole-trip-plan" className="contents">
      <WorkspacePanel active={section === "planner" && overviewActive} label="AI Travel Overview">
        {(ideas.activityRevision !== 1 || (brief.persona && ideas.personaRevision !== 2)) && (
          <div className="rounded-2xl border border-secondary bg-secondary/10 p-4 text-sm">
            <p>
              Updated plans include at least three daily activities and visible backup places. Your
              current edits are kept until you review and rebuild.
            </p>
            <Button
              className="mt-3 h-auto whitespace-normal py-2"
              variant="outline"
              onClick={onEditBrief}
            >
              Review & rebuild this plan
            </Button>
          </div>
        )}
        <div className="grid gap-6 rounded-2xl border bg-card p-5 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              <Check className="h-3 w-3" /> Your whole trip is ready · free template plan
            </span>
            <h2 id="whole-plan-heading" tabIndex={-1} className="mt-4 text-3xl font-semibold">
              {brief.days} days in {brief.destination}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brief.start} · {brief.travelers} travelers · an editable template plan
            </p>
            {personaSummary(brief) && (
              <p className="mt-3 text-sm font-medium text-secondary">{personaSummary(brief)}</p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                About these suggestions
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ideas.summary}</p>
            </details>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose your favorites. Make the plan yours.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={onEditBrief}>
                Edit trip details
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPlacesRequest((request) => request + 1);
                  onSectionChange?.("attractions");
                }}
              >
                Browse more places
              </Button>
              <SavePlanButton
                prepare={() => {
                  if (ideas.days.some((day) => day.items.some((item) => !item.title.trim()))) {
                    toast.error("Give each activity a title before saving.");
                    return false;
                  }
                  if (
                    !savePlannerDraft({
                      ...brief,
                      ...(journey ? { journey } : {}),
                      ideas,
                      ...(stay ? { stay } : { stay: undefined }),
                    })
                  ) {
                    toast.error("Your browser could not keep this plan. Download a copy instead.");
                    return false;
                  }
                  return true;
                }}
              />
              <DownloadTripPdf
                trip={{
                  brief,
                  summary: ideas.summary,
                  interest: brief.interest,
                  journey,
                  stay,
                  days: ideas.days,
                }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Explore freely. Sign in only to save your plan.
            </p>
          </div>
          <TripCover
            active={section === "planner" && overviewActive}
            destination={brief.destination}
            locations={ideas.days.flatMap((day) => day.items.map((item) => item.location ?? ""))}
          />
        </div>
        <TripBudgetDashboard
          brief={brief}
          journey={journey}
          stay={stay}
          onChange={(next) => {
            setJourney(next);
            onEdited();
          }}
        />
      </WorkspacePanel>
      <WorkspacePanel active={section === "flights"} label="Flights">
        <FlightRecommendations
          active={section === "flights"}
          onContinue={() => onSectionChange?.("hotels")}
          onEditTrip={() => {
            onSectionChange?.("planner");
            onEditBrief?.();
          }}
          brief={brief}
          journey={journey}
          onChange={(next, route) => {
            const nextBrief = route ? { ...brief, destination: route.destination } : brief;
            const nextStay = route && route.destination !== brief.destination ? null : stay;
            if (route) {
              next = {
                ...next,
                departure: route.departure,
                selectedFlight: next.selectedFlight
                  ? { ...next.selectedFlight, scope: flightScope(nextBrief, route.departure) }
                  : undefined,
              };
              onRouteUpdate?.(route.destination, route.departure);
              setStay(nextStay);
            }
            setJourney(next);
            onEdited();
            if (!activityEdited) setIdeas(createJourneyIdeas(nextBrief, next, nextStay));
          }}
        />
      </WorkspacePanel>
      <WorkspacePanel active={section === "hotels"} label="Hotels">
        <HotelRecommendations
          onContinue={() => onSectionChange?.("attractions")}
          onEditTrip={() => {
            onSectionChange?.("planner");
            onEditBrief?.();
          }}
          active={section === "hotels"}
          brief={brief}
          journey={journey}
          stay={stay}
          onChoose={(choice) => {
            setStay(choice);
            onEdited();
            if (!activityEdited) setIdeas(createJourneyIdeas(brief, journey, choice));
          }}
        />
        {activityEdited && journey && (
          <p className="text-xs text-muted-foreground">
            Your edited activities are kept when the budget changes. Check admission prices against
            the updated sightseeing allowance.
          </p>
        )}
      </WorkspacePanel>
      <WorkspacePanel active={section === "cars"} label="Car Rental">
        <CarRental
          active={section === "cars"}
          brief={brief}
          allowance={connected.estimates.transport}
          chosen={journey.selectedCar}
          onChoose={(choice) => {
            setJourney({ ...journey, selectedCar: choice });
            onEdited();
          }}
        />
      </WorkspacePanel>
      <WorkspacePanel active={section === "attractions"} label="Attractions & Activities">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary">
            Make every day a discovery
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Your days, thoughtfully connected.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Places, stories and local flavors, one day at a time. Check opening hours before you go.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <label htmlFor="itinerary-day" className="mr-3 text-sm font-medium">
            Explore a day
          </label>
          <select
            id="itinerary-day"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
            value={activeDay}
            onChange={(e) => setActiveDay(Number(e.target.value))}
          >
            {ideas.days.map((day) => (
              <option key={day.day} value={day.day}>
                Day {day.day} · {budgets[day.day - 1]?.date}
              </option>
            ))}
          </select>
        </div>
        {ideas.days.map((day, dayIndex) => (
          <section
            hidden={day.day !== activeDay}
            id={day.day === 1 ? "trip-explore" : undefined}
            key={day.day}
            className="rounded-2xl border bg-card p-5 shadow-card md:p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold">
                Day {day.day}{" "}
                <span className="text-sm text-muted-foreground">· {budgets[dayIndex]?.date}</span>
              </h3>
              <DayWeather
                destination={brief.destination}
                date={budgets[dayIndex]?.date}
                active={section === "attractions" && day.day === activeDay}
              />
            </div>
            <DayBudgetSummary
              afterStay={
                journey || stayPlan.quoted !== null || !stayPlan.nights
                  ? stayPlan.daily[dayIndex]?.amount
                  : undefined
              }
              includesFlights={!!journey}
              amount={budgets[dayIndex]?.amount ?? 0}
              travelers={brief.travelers}
              currency={brief.currency}
              style={brief.style}
            />
            <div className="space-y-3">
              <DayVisuals
                personaDetails={brief}
                activities={day.items}
                ticketBudget={
                  brief.currency === "EUR" && journey
                    ? connected.estimates.activities / brief.days
                    : undefined
                }
                travelers={brief.travelers}
                date={budgets[dayIndex]?.date}
                destination={brief.destination}
                day={day.day}
                style={brief.style}
                foodPerPerson={
                  brief.currency === "EUR"
                    ? journey
                      ? connected.estimates.food / brief.days / brief.travelers
                      : (budgetAllocation(budgets[dayIndex]?.amount ?? 0, brief.style).find(
                          (item) => item.label === "Food",
                        )?.amount ?? 0) / brief.travelers
                    : undefined
                }
              />
              {day.items.map((item, itemIndex) => (
                <details key={itemIndex} className="rounded-xl border bg-background/40">
                  <summary className="cursor-pointer p-4 text-sm">
                    <span className="mr-3 font-medium text-secondary">
                      {item.time || "Any time"}
                    </span>
                    {item.title || "Your activity"}
                    <span className="ml-2 text-xs text-muted-foreground">· Edit</span>
                  </summary>
                  <div className="space-y-3 border-t p-4">
                    <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
                      <div>
                        <Label htmlFor={`instant-time-${day.day}-${itemIndex}`}>Time</Label>
                        <Input
                          id={`instant-time-${day.day}-${itemIndex}`}
                          type="time"
                          value={item.time}
                          onChange={(e) => update(dayIndex, itemIndex, "time", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`instant-title-${day.day}-${itemIndex}`}>Activity</Label>
                        <Input
                          id={`instant-title-${day.day}-${itemIndex}`}
                          maxLength={200}
                          value={item.title}
                          onChange={(e) => update(dayIndex, itemIndex, "title", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`instant-place-${day.day}-${itemIndex}`}>Place</Label>
                      <Input
                        id={`instant-place-${day.day}-${itemIndex}`}
                        maxLength={300}
                        value={item.location}
                        onChange={(e) => update(dayIndex, itemIndex, "location", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`instant-notes-${day.day}-${itemIndex}`}>Notes</Label>
                      <Textarea
                        id={`instant-notes-${day.day}-${itemIndex}`}
                        maxLength={1000}
                        value={item.notes}
                        onChange={(e) => update(dayIndex, itemIndex, "notes", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={day.items.length <= 1}
                      onClick={() =>
                        editIdeas((current) => ({
                          ...current,
                          days: current.days.map((value, index) =>
                            index !== dayIndex
                              ? value
                              : {
                                  ...value,
                                  items: value.items.filter((_, index) => index !== itemIndex),
                                },
                          ),
                        }))
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove activity
                    </Button>
                  </div>
                </details>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3"
              disabled={day.items.length >= 8}
              onClick={() =>
                editIdeas((current) => ({
                  ...current,
                  days: current.days.map((value, index) =>
                    index !== dayIndex
                      ? value
                      : {
                          ...value,
                          items: [
                            ...value.items,
                            {
                              time: "16:00",
                              title: "My own discovery",
                              location: brief.destination,
                              notes: "",
                            },
                          ],
                        },
                  ),
                }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add an activity
            </Button>
          </section>
        ))}
        <MorePlaces
          backups
          key={brief.destination}
          destination={brief.destination}
          days={brief.days}
          day={activeDay}
          active={section === "attractions"}
          openRequest={placesRequest}
          maxPerDay={8}
          current={ideas.days.flatMap((day) =>
            day.items.map((item) => ({ ...item, day: day.day })),
          )}
          onAdd={(place, targetDay) => {
            const target = ideas.days.find((day) => day.day === targetDay);
            if (!target || target.items.length >= 8) return false;
            editIdeas((current) => ({
              ...current,
              days: current.days.map((day) =>
                day.day === targetDay
                  ? { ...day, items: [...day.items, extraActivity(place)] }
                  : day,
              ),
            }));
            return true;
          }}
        />
      </WorkspacePanel>
      <WorkspacePanel active={section === "shopping"} label="Local Shopping">
        <LocalShopping destination={brief.destination} />
      </WorkspacePanel>
    </div>
  );
}
