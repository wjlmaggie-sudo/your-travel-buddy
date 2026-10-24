import {
  activityAgeBands,
  childAgeDescription,
} from "../../supabase/functions/_shared/travel-persona";
import type { PersonaDetails } from "../../supabase/functions/_shared/travel-persona";
import type { TripIdeas } from "../../supabase/functions/_shared/trip-ideas";
export type { PersonaDetails };
export const PERSONAS = [
  { id: "business", label: "Business", description: "Work time first, nearby discoveries later." },
  { id: "family", label: "Family", description: "Shared experiences at your group's pace." },
  {
    id: "budget-travel",
    label: "Budget Travel",
    description: "More local discovery, less spending.",
  },
] as const;
export function personaSummary(value: PersonaDetails) {
  const label = PERSONAS.find((p) => p.id === value.persona)?.label;
  const ages = activityAgeBands(value);
  return [
    label ? `${label} planning` : "",
    ages.length
      ? `Children's ${value.childrenAgeRanges?.length ? "age ranges" : "ages"} at travel: ${childAgeDescription(value)}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Local preference rules, not venue age certification, live availability or a paid model. */
export function applyPersona(plan: TripIdeas, input: PersonaDetails & { destination: string }) {
  if (!input.persona) return plan;
  const ages = activityAgeBands(input);
  const young = ages.some((age) => age === "0-3" || age === "4-6");
  const school = ages.some((age) => age === "7-10");
  const location = input.destination;
  const note =
    "Suggested outline: check opening hours, access, admission and travel time before visiting.";
  const days = plan.days.map((day) => {
    const original = day.items[1]!;
    const landmark = original.location === location ? "a nearby cultural stop" : original.location;
    const short = day.day === 1 || day.day === plan.days.length;
    if (input.persona === "business")
      return {
        ...day,
        items: [
          {
            time: "08:00",
            title: "Breakfast and preparation",
            location,
            notes: "Leave time to prepare and confirm your work location and transport.",
          },
          {
            time: "09:00",
            title: "Flexible work or meeting time",
            location,
            notes:
              "Placeholder, not a scheduled meeting. Edit this block to your actual commitments; no employer or meeting details are needed.",
          },
          {
            time: "12:30",
            title: "Lunch near your work area",
            location,
            notes: "Keep transfers short; confirm menu prices and dietary needs.",
          },
          {
            time: "14:00",
            title: "Work time and a transfer buffer",
            location,
            notes:
              "Keep this free for work, rest or your actual meetings. Times are editable assumptions, not a feasibility guarantee.",
          },
          {
            time: "18:00",
            title: `Optional nearby discovery: ${landmark}`.slice(0, 200),
            location: original.location,
            notes: `A short cultural visit only if it fits after work; check closing hours and return transport. ${note}`,
          },
          {
            time: "19:00",
            title: "Dinner and an unhurried evening",
            location,
            notes:
              "Stay near your base and leave room for tomorrow's preparation. Business does not increase your budget.",
          },
        ],
      };
    if (input.persona === "family")
      return {
        ...day,
        items: [
          {
            time: "08:30",
            title: "Breakfast and a relaxed start",
            location,
            notes:
              "Allow time for everyone to get ready. Keep arrival and departure days flexible.",
          },
          {
            time: "10:00",
            title:
              `${young ? "A short discovery walk and a play break" : school ? "A family discovery quest" : ages.length ? "A culture and photo challenge" : "A shared cultural discovery"}: ${landmark}`.slice(
                0,
                200,
              ),
            location: original.location,
            notes: `${young ? "Favor a short visit with frequent breaks; skip strenuous or long ticketed visits if unsuitable." : school ? "Look for shapes, colors and stories together; choose a hands-on option only after checking age suitability." : ages.length ? "Let teenagers choose a theme, take photos and explore local stories together." : "Choose one main experience together and adapt to everyone's interests and mobility."} ${ages.length ? `Suggested for the entered ages ${childAgeDescription(input)}; venue age restrictions and child prices are unverified.` : "No children assumed. Add ages if children are traveling."} ${note}`,
          },
          {
            time: "12:00",
            title: "An easy lunch nearby",
            location: original.location,
            notes:
              "Leave time for dietary needs, queues and an unhurried meal. Verify full-group prices; child discounts are not assumed.",
          },
          {
            time: "13:00",
            title: young ? "Quiet time or a nap break" : "Rest and recharge together",
            location,
            notes:
              "Protect this break from extra sightseeing. Use your accommodation if accessible, or choose a suitable quiet space.",
          },
          {
            time: "15:30",
            title: short
              ? "An optional short stop or travel buffer"
              : young
                ? "Optional nearby park or simple play time"
                : school
                  ? "Optional hands-on activity or a park"
                  : "Optional local market, park or creative activity",
            location: original.location,
            notes: `${young ? "Keep it short and near your base; choose an indoor alternative if weather makes outdoor play unsuitable." : "Let the group choose or skip this second stop; avoid another cross-city journey."} This is an activity idea, not a verified venue recommendation. ${note}`,
          },
          {
            time: "18:00",
            title: "Early dinner and a relaxed return",
            location,
            notes:
              "Keep the evening flexible and avoid tiring late transfers. Check actual return travel arrangements.",
          },
        ],
      };
    return {
      ...day,
      items: [
        {
          time: "09:00",
          title: "Breakfast within the food allowance",
          location,
          notes:
            "Compare a simple café, groceries or an included breakfast; do not count included meals twice.",
        },
        {
          time: "10:00",
          title: `Self-guided local stories: ${landmark}`.slice(0, 200),
          location: original.location,
          notes: `Prefer public areas or an exterior visit; do not assume the interior or a viewpoint is free. Check access and any mandatory fees. ${note}`,
        },
        {
          time: "12:30",
          title: "A picnic, market meal or simple café",
          location: original.location,
          notes:
            "Choose an adequate meal within your group food allowance, respecting dietary needs.",
        },
        {
          time: "14:30",
          title: "A free public-space walk or a rest break",
          location: original.location,
          notes:
            "Stay in the same area to limit travel costs; walk only where practical for your group. Verify public access. Choose a paid must-see only after checking the total group cost.",
        },
        {
          time: "18:30",
          title: short ? "Simple dinner and a travel buffer" : "Simple dinner and a quiet evening",
          location,
          notes:
            "Include necessary transport, luggage and other fees in the trip total. Low prices do not prove that every essential cost fits.",
        },
      ],
    };
  });
  return {
    ...plan,
    days,
    summary:
      `${plan.summary ?? ""} ${personaSummary(input)}. ${input.persona === "family" ? "Activities and breaks adapt to the youngest entered age; suitability and child fares need confirmation." : input.persona === "business" ? "Work blocks are editable placeholders, not confirmed meetings." : "Prioritizes public-space experiences and whole-trip costs; no free entry or live price is guaranteed."}`.slice(
        0,
        1200,
      ),
  };
}
