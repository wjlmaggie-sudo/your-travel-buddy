import { useId, useEffect, useState } from "react";
import { Check, ReceiptText } from "lucide-react";
import { dailyMoney } from "./DailyBudget";
import { exactPersonSplit, finalTripBudget, type FinalBudget } from "@/lib/final-trip-budget";
import { connectedBudget } from "@/lib/travel-workspace";
import type { Journey } from "@/lib/journey-planning";
import type { StayBrief, StayChoice } from "@/lib/stay-planning";

export function FinalBudgetSummary({
  review,
  savedAt,
}: {
  review: FinalBudget;
  savedAt?: string | undefined;
}) {
  const money = (value: number) => dailyMoney(value, review.currency);
  const split = exactPersonSplit(review);
  return (
    <section aria-label="Final trip budget" className="final-budget-card">
      <p className="companion-eyebrow flex items-center gap-2">
        <ReceiptText size={16} />
        FINAL BUDGET
      </p>
      <h2 className="mt-3 text-2xl font-semibold">Your whole trip, added up.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {review.travelers} travellers · {review.days} days · {review.currency}
      </p>
      <div className="final-budget-total mt-5" aria-live="polite" aria-label="Final budget total">
        <p className="text-xs font-semibold">Total trip estimate · whole group</p>
        <p className="mt-2 font-display text-4xl font-semibold">{money(review.total)}</p>
        <p className="mt-3 text-sm">About {money(review.total / review.travelers)} per person</p>
        <p className="mt-1 text-xs">
          {money(review.total / review.days)} per day on average for the group
        </p>
      </div>
      {savedAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Downloaded budget snapshot · {new Date(savedAt).toLocaleString()}. Prices have not been
          refreshed offline.
        </p>
      )}
      <div className="mt-5 space-y-4">
        <div className="flex justify-between gap-4 text-sm">
          <span>Selected prices & entered quotes</span>
          <strong>{money(review.selectedTotal)}</strong>
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <span>Remaining estimates & allowances</span>
          <strong>{money(review.estimatedTotal)}</strong>
        </div>
      </div>
      <dl className="final-budget-rows mt-5">
        {review.rows.map((row) => (
          <div key={row.id} className="py-4">
            <div className="flex justify-between gap-4">
              <dt className="text-sm font-semibold">{row.label}</dt>
              <dd className="shrink-0 text-sm font-semibold tabular-nums">{money(row.amount)}</dd>
            </div>
            <dd className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <span
                className={`final-budget-badge ${row.kind === "selected" ? "is-selected" : ""}`}
              >
                {row.kind === "selected"
                  ? "Selected"
                  : row.kind === "not-needed"
                    ? "Not needed"
                    : row.kind === "missing"
                      ? "Needs review"
                      : "Estimate"}
              </span>
              {row.detail}
            </dd>
          </div>
        ))}
      </dl>
      <div
        className={`mt-5 rounded-2xl p-4 ${review.remaining < 0 ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"}`}
        aria-live="polite"
      >
        <div className="flex justify-between gap-4 text-sm">
          <span>Your budget</span>
          <strong>{money(review.budget)}</strong>
        </div>
        <div className="mt-3 flex justify-between gap-4 font-semibold">
          <span>{review.remaining < 0 ? "Over budget" : "Left in your budget"}</span>
          <span>{money(Math.abs(review.remaining))}</span>
        </div>
      </div>
      {review.missing.length ? (
        <div className="mt-5 rounded-xl border border-primary/40 p-4">
          <h3 className="font-sans text-sm font-semibold">Selections still to review</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {review.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 flex gap-2 text-sm text-secondary">
          <Check size={18} className="shrink-0" />
          Main selections are included. Review the remaining estimates before booking.
        </p>
      )}
      <details className="mt-5 text-xs text-muted-foreground">
        <summary className="cursor-pointer py-2">Exact split & what this total includes</summary>
        <p className="mt-2">
          For an equal split: {review.travelers - split.extraPeople}{" "}
          {review.travelers - split.extraPeople === 1 ? "traveller pays" : "travellers pay"}{" "}
          {money(split.base)}
          {split.extraPeople
            ? ` and ${split.extraPeople} ${split.extraPeople === 1 ? "traveller pays" : "travellers pay"} ${money(split.base + 0.01)}`
            : ""}
          . These shares add up to the group total.
        </p>
        <p className="mt-3 leading-relaxed">
          Selected offers and entered quotes are included once. Hotel nightly rates are multiplied
          by the booked room count and planned nights; whole-stay prices are not multiplied again.
          Activities, meals, transport and shopping stay estimates until you update them. Verify
          taxes, baggage, insurance, deposits, availability and final checkout prices with
          providers. This is a trip estimate, not a booking or guaranteed payable price.
        </p>
      </details>
    </section>
  );
}

export function FinalTripBudget({
  brief,
  journey,
  stay,
  onChange,
}: {
  brief: StayBrief;
  journey: Journey;
  stay?: StayChoice | null | undefined;
  onChange?: (journey: Journey) => void;
}) {
  const id = useId();
  const review = finalTripBudget(brief, journey, stay);
  const estimates = connectedBudget(brief, journey, stay).estimates;
  const [draft, setDraft] = useState(estimates);
  const estimateKey = JSON.stringify(estimates);
  useEffect(() => {
    setDraft(JSON.parse(estimateKey));
  }, [estimateKey]);
  return (
    <div className="space-y-4">
      <FinalBudgetSummary review={review} />
      {onChange && (
        <details className="mobile-setup-details">
          <summary>Adjust activities, meals, transport & shopping</summary>
          <p className="mt-3 text-xs text-muted-foreground">
            Enter totals for the whole group and the whole trip. These replace the matching
            allowance; they are not added a second time.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onChange({ ...journey, estimates: draft });
            }}
          >
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["activities", "Activities & tickets"],
                  ["food", "Food & drinks"],
                  ["transport", "Local transport"],
                  ["shopping", "Shopping & buffer"],
                ] as const
              ).map(([key, label]) => (
                <label className="text-sm" key={key} htmlFor={`${id}-${key}`}>
                  {label} ({brief.currency})
                  <input
                    id={`${id}-${key}`}
                    type="number"
                    inputMode="decimal"
                    required
                    min={0}
                    max={1000000}
                    step="0.01"
                    className="mt-2 h-12 w-full rounded-lg border bg-background px-3"
                    value={draft[key]}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value) && value >= 0 && value <= 1000000)
                        setDraft({ ...draft, [key]: value });
                    }}
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="mt-4 min-h-11 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
            >
              Apply costs to final budget
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
