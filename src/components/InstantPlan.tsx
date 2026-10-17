import { JourneyPlanner } from "./JourneyPlanner";
import { createJourneyIdeas } from "@/lib/journey-plan";
import type { Journey } from "@/lib/journey-planning";
import { AccommodationPlanner } from "./AccommodationPlanner";
import { stayCost, stayBudget, type StayChoice } from "@/lib/stay-planning";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { TripIdeas } from "../../supabase/functions/_shared/trip-ideas";
import { savePlannerDraft, type PlannerDraft } from "@/lib/planner-draft";
import { dailyBudgets, downloadText, budgetAllocation } from "@/lib/planning";
import { DayVisuals } from "./DayVisuals";
import { DayBudgetSummary } from "./DailyBudget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { TripWeather } from "./TripWeather";

export function InstantPlan({
  brief,
  initialIdeas,
  onEdited,
}: {
  brief: PlannerDraft;
  initialIdeas: TripIdeas;
  onEdited: () => void;
}) {
  const [journey, setJourney] = useState<Journey | null>(brief.journey ?? null);
  const [activityEdited, setActivityEdited] = useState(false);
  const [stay, setStay] = useState<StayChoice | null>(brief.stay ?? null);
  const [ideas, setIdeas] = useState(initialIdeas);
  const navigate = useNavigate();
  const budgets = dailyBudgets(brief.budget, brief.days, brief.travelers, brief.start);
  const effectiveBrief = {
    ...brief,
    ...(journey ? { flightBudget: journey.flightBudget, hotelComfort: journey.hotelComfort } : {}),
  };
  const stayPlan = stayBudget(effectiveBrief, stay);
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
    <section id="whole-trip-plan" aria-labelledby="whole-plan-heading" className="mt-8 space-y-5">
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
          <Check className="h-3 w-3" /> Your whole trip is ready · free template plan
        </span>
        <h2 id="whole-plan-heading" tabIndex={-1} className="mt-4 text-3xl font-semibold">
          {brief.days} days in {brief.destination}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ideas.summary}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit any activity below. Change your trip details above and rebuild to create a different
          outline.
        </p>
        <nav aria-label="Trip planning steps" className="mt-5 flex flex-wrap gap-2">
          {[
            ["trip-flights", "1 · Flights"],
            ["trip-stay", "2 · Stay"],
            ["trip-explore", "3 · Explore & stories"],
          ].map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                document.getElementById(id!)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {label}
            </Button>
          ))}
        </nav>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => {
              if (ideas.days.some((day) => day.items.some((item) => !item.title.trim()))) {
                toast.error("Give each activity a title before saving.");
                return;
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
                return;
              }
              navigate({ to: "/trips" });
            }}
          >
            Save my whole plan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadText(
                "my-travel-plan.txt",
                [
                  `${brief.destination} · ${brief.days} days · ${brief.travelers} travelers`,
                  ideas.summary ?? "",
                  ...(journey
                    ? [
                        `Departure: ${journey.departure}`,
                        `Group return-flight allowance: ${journey.flightBudget.toFixed(2)} ${brief.currency}`,
                        `Hotel comfort: ${journey.hotelComfort}`,
                      ]
                    : []),
                  stay
                    ? `Chosen stay: ${stay.name} · ${stayCost(stay, brief) ?? "unverified"} ${brief.currency} whole group / stay; based on entered quote`
                    : "Accommodation not quoted yet.",
                  ...ideas.days.map((day, index) =>
                    [
                      `Day ${day.day} · ${budgets[index]?.date} · ${budgets[index]?.amount.toFixed(2)} ${brief.currency} group budget`,
                      ...day.items.map(
                        (item) => `${item.time} ${item.title} — ${item.location}\n${item.notes}`,
                      ),
                    ].join("\n"),
                  ),
                ].join("\n\n"),
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Download without signing in
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Free template planner · no AI API key or AI charges. Only saving to your account needs
          sign-in.
        </p>
      </div>
      <JourneyPlanner
        brief={brief}
        journey={journey}
        stay={stay}
        onChange={(next) => {
          setJourney(next);
          onEdited();
          if (!activityEdited) setIdeas(createJourneyIdeas(brief, next, stay));
        }}
      />
      {activityEdited && journey && (
        <p className="text-xs text-muted-foreground">
          Your edited activities are kept when the budget changes. Check admission prices against
          the updated sightseeing allowance.
        </p>
      )}
      <AccommodationPlanner
        brief={effectiveBrief}
        choice={stay}
        onChoose={(choice) => {
          setStay(choice);
          onEdited();
          if (journey && !activityEdited) setIdeas(createJourneyIdeas(brief, journey, choice));
        }}
      />
      <TripWeather
        key={`${brief.destination}-${brief.start}-${brief.days}`}
        destination={brief.destination}
        startDate={brief.start}
        days={brief.days}
      />
      {ideas.days.map((day, dayIndex) => (
        <section
          id={day.day === 1 ? "trip-explore" : undefined}
          key={day.day}
          className="rounded-2xl border bg-card p-5 shadow-card md:p-6"
        >
          <h3 className="text-2xl font-semibold">
            Day {day.day}{" "}
            <span className="text-sm text-muted-foreground">· {budgets[dayIndex]?.date}</span>
          </h3>
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
              ticketBudget={
                brief.currency === "EUR" && journey
                  ? (Math.max(0, stayPlan.remaining) * 0.25) / brief.days
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
                    ? (Math.max(0, stayPlan.remaining) * 0.4) / brief.days / brief.travelers
                    : (budgetAllocation(budgets[dayIndex]?.amount ?? 0, brief.style).find(
                        (item) => item.label === "Food",
                      )?.amount ?? 0) / brief.travelers
                  : undefined
              }
            />
            {day.items.map((item, itemIndex) => (
              <details key={itemIndex} className="rounded-xl border bg-background/40">
                <summary className="cursor-pointer p-4 text-sm">
                  <span className="mr-3 font-medium text-secondary">{item.time || "Any time"}</span>
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
    </section>
  );
}
