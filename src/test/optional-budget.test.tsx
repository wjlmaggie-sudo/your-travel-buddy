import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/components/DayVisuals", () => ({ DayVisuals: () => <div>Day map</div> }));
vi.mock("@/components/DayWeather", () => ({ DayWeather: () => <span>Weather</span> }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn() } } }));
import { TravelPlanner } from "@/components/TravelPlanner";
import { readGuestSimulation } from "@/lib/planner-draft";
function setup() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TravelPlanner />
    </QueryClientProvider>,
  );
}
beforeEach(() => sessionStorage.clear());
afterEach(cleanup);
it("generates a plan with a blank optional budget, shows the assumptions and retains the estimate on refresh", () => {
  setup();
  expect(screen.getByLabelText("Total group budget (EUR)")).not.toBeRequired();
  expect(screen.getByLabelText("Total group budget (EUR)")).toHaveValue(null);
  fireEvent.click(screen.getByText("Lisbon", { exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: /^Continue to (flights|hotels)/, hidden: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner", hidden: true }));
  expect(screen.getByText("Suggested starting budget: €1,300.00")).toBeVisible();
  expect(readGuestSimulation()?.budget).toBe(1300);
  expect(readGuestSimulation()?.journey?.budgetSuggestion?.profile).toBe("Lisbon reference");
  cleanup();
  setup();
  expect(screen.getByText("Suggested starting budget: €1,300.00")).toBeVisible();
}, 15000);
it("respects an explicit zero budget instead of treating it as missing", () => {
  setup();
  fireEvent.change(screen.getByLabelText("Total group budget (EUR)"), { target: { value: "0" } });
  fireEvent.click(screen.getByText("Lisbon", { exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: /^Continue to (flights|hotels)/, hidden: true }),
  );
  expect(readGuestSimulation()?.budget).toBe(0);
  expect(readGuestSimulation()?.journey?.budgetSuggestion).toBeUndefined();
  expect(screen.queryByLabelText("Suggested budget estimate")).not.toBeInTheDocument();
}, 15000);

it("lets the guest replace a suggested total with their own budget", () => {
  setup();
  fireEvent.click(screen.getByText("Lisbon", { exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: /^Continue to (flights|hotels)/, hidden: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit trip details" }));
  fireEvent.change(screen.getByLabelText("Total group budget (EUR)"), { target: { value: "800" } });
  fireEvent.click(screen.getByRole("button", { name: "Update trip & continue", hidden: true }));
  expect(readGuestSimulation()?.budget).toBe(800);
  expect(readGuestSimulation()?.journey?.budgetSuggestion).toBeUndefined();
}, 15000);
