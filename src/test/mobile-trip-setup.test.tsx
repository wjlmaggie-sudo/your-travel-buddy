import { useRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileTripSetup } from "@/components/MobileTripSetup";
import type { PlannerDraft } from "@/lib/planner-draft";

afterEach(cleanup);
const submit = vi.fn();
function Setup() {
  const [draft, setDraft] = useState<PlannerDraft>({
    destination: "",
    start: "2026-11-01",
    days: 3,
    travelers: 2,
    budget: 900,
    currency: "EUR",
    style: "Balanced",
    interest: "Food & culture",
  });
  const [budget, setBudget] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <MobileTripSetup
      draft={draft}
      onChange={setDraft}
      budgetInput={budget}
      onBudgetInput={setBudget}
      formRef={formRef}
      busy={false}
      onDiscover={vi.fn()}
      onPreferences={vi.fn()}
      onSubmit={(e) => {
        e.preventDefault();
        submit(draft);
      }}
    />
  );
}
describe("iPhone trip setup", () => {
  it("shows one small step at a time and submits the complete brief only at the end", () => {
    submit.mockClear();
    render(<Setup />);
    expect(screen.getByRole("heading", { name: "Where to next?" })).toBeVisible();
    expect(screen.queryByLabelText("Days away")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destination"), {
      target: { value: "Lisbon, Portugal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Departure date")).toHaveValue("2026-11-01");
    fireEvent.change(screen.getByLabelText("Travellers"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Total group budget (EUR)"), {
      target: { value: "1200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Build my trip" }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "Lisbon, Portugal",
        travelers: 4,
        budget: 1200,
        days: 3,
      }),
    );
  });
  it("keeps entered values when moving back to a previous step", () => {
    render(<Setup />);
    fireEvent.click(screen.getByRole("button", { name: "Kyoto" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous setup step" }));
    expect(screen.getByLabelText("Destination")).toHaveValue("Kyoto, Japan");
  });
});
