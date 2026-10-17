vi.mock("@/components/DayVisuals", () => ({
  DayVisuals: () => <div>Day map and restaurants</div>,
}));
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/TripWeather", () => ({ TripWeather: () => <div>Destination weather</div> }));
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TravelPlanner } from "@/components/TravelPlanner";
import { readPlannerDraft } from "@/lib/planner-draft";
beforeEach(() => {
  sessionStorage.clear();
  navigate.mockClear();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("public instant planner", () => {
  it("shows the whole trip from a destination alone, with no sign-in navigation", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.click(screen.getByRole("button", { name: "Suggest my whole trip" }));
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeInTheDocument();
    expect(screen.getAllByText(/^Breakfast and/)).toHaveLength(5);
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Download without signing in" })).toBeInTheDocument();
  });
  it("rebuilds for different budgets, retains daily caps, and carries edits into sign-in", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.change(screen.getByLabelText("How many days?"), { target: { value: "3" } });
    const presets = screen.getByLabelText("Compare budget presets");
    fireEvent.click(within(presets).getByRole("button", { name: /Budget/ }));
    fireEvent.click(screen.getByRole("button", { name: "Suggest my whole trip" }));
    expect(screen.getAllByText(/A picnic or market lunch/)).toHaveLength(3);
    fireEvent.click(within(presets).getByRole("button", { name: /Luxury/ }));
    fireEvent.click(screen.getByRole("button", { name: "Rebuild my whole trip" }));
    expect(screen.getAllByText(/A leisurely regional lunch/)).toHaveLength(3);
    const firstActivity = screen.getAllByLabelText("Activity")[0]!;
    fireEvent.change(firstActivity, { target: { value: "My edited arrival" } });
    fireEvent.click(screen.getByRole("button", { name: "Save my whole plan" }));
    expect(readPlannerDraft()?.ideas?.days[0]?.items[0]?.title).toBe("My edited arrival");
    expect(readPlannerDraft()?.budget).toBe(1800);
    expect(navigate).toHaveBeenCalledWith({ to: "/trips" });
  });
});
