import {
  activityAgeBands,
  CHILD_AGE_RANGES,
} from "../../supabase/functions/_shared/travel-persona";
import { useId } from "react";
import { PERSONAS, type PersonaDetails } from "@/lib/travel-personas";
import { Button } from "./ui/button";
export function PersonaPreferences({
  value,
  travelers,
  onChange,
}: {
  value: PersonaDetails;
  travelers: number;
  onChange: (next: PersonaDetails) => void;
}) {
  const id = useId();
  const ages = activityAgeBands(value);
  return (
    <fieldset className="space-y-3 rounded-xl border bg-card p-4">
      <legend className="px-2 text-sm font-semibold">How do you like to travel?</legend>
      <p className="text-xs text-muted-foreground">
        Optional · shapes your activities and pace, while keeping your budget.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PERSONAS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={value.persona === p.id ? "secondary" : "outline"}
            aria-label={p.label}
            aria-pressed={value.persona === p.id}
            className="h-auto flex-col items-start whitespace-normal p-3 text-left"
            onClick={() =>
              onChange({ ...value, persona: value.persona === p.id ? undefined : p.id })
            }
          >
            <span>{p.label}</span>
            <span className="mt-1 text-xs font-normal">{p.description}</span>
          </Button>
        ))}
      </div>
      {(value.persona === "family" || ages.length > 0) && (
        <div className="space-y-3">
          <label className="block text-sm" htmlFor={`${id}-children`}>
            Children in your group
          </label>
          <select
            id={`${id}-children`}
            className="h-10 w-full rounded-md border bg-background px-3"
            value={ages.length}
            onChange={(e) =>
              onChange({
                ...value,
                childrenAges: undefined,
                childrenAgeRanges: Array.from(
                  { length: Number(e.target.value) },
                  (_, index) => ages[index] ?? ("" as (typeof ages)[number]),
                ),
              })
            }
          >
            {[0, 1, 2, 3, ...(ages.length > 3 ? [ages.length] : [])].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "No children" : n}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Included in the total travelers below. At least one adult is required. Choose age ranges
            at travel; exact ages can be confirmed on the booking website.
          </p>
          <p className="text-sm font-medium">
            {Math.max(0, travelers - ages.length)} adults + {ages.length} children · {travelers}{" "}
            travelers total
          </p>
          {ages.length >= travelers && (
            <p role="alert" className="text-sm text-destructive">
              Increase total travelers or reduce the number of children to include at least one
              adult.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ages.map((age, index) => (
              <div key={index}>
                <label htmlFor={`${id}-age-${index}`} className="text-sm">
                  Child {index + 1} age range
                </label>
                <select
                  id={`${id}-age-${index}`}
                  required
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                  value={age}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      childrenAges: undefined,
                      childrenAgeRanges: ages.map((a, i) =>
                        i === index ? (e.target.value as typeof age) : a,
                      ),
                    })
                  }
                >
                  <option value="" disabled>
                    Select age range
                  </option>
                  {CHILD_AGE_RANGES.filter((range) => range !== "16-17" || age === "16-17").map(
                    (range) => (
                      <option key={range} value={range}>
                        {range.replace("-", "–")} years
                      </option>
                    ),
                  )}
                </select>
              </div>
            ))}
          </div>
          {ages.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Age ranges adapt the itinerary. Hotel test quotes and flight demos do not provide
              verified child prices.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
