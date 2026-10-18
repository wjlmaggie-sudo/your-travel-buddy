vi.mock("@/components/DayVisuals", () => ({
  DayVisuals: () => <div>Day map and restaurants</div>,
}));
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const navigate = vi.hoisted(() => vi.fn());
const paidAI = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai.functions", () => ({ generateTripIdeas: paidAI }));
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
  it("creates flights, a stay and every day from departure and destination without sign-in", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("Departure city / airport"), {
      target: { value: "Berlin, Germany" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeInTheDocument();
    expect(screen.getAllByText(/^Breakfast and/)).toHaveLength(4);
    expect(navigate).not.toHaveBeenCalled();
    expect(paidAI).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /live AI/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download without signing in" })).toBeInTheDocument();
  }, 15000);
  it("updates hotel comfort without losing an edited activity", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("Departure city / airport"), {
      target: { value: "Berlin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    fireEvent.change(screen.getAllByLabelText("Activity")[0]!, {
      target: { value: "My arrival plan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hotels" }));
    fireEvent.click(screen.getByRole("button", { name: "Premium" }));
    expect(screen.getAllByLabelText("Activity")[0]).toHaveValue("My arrival plan");
    expect(screen.getAllByText("€675.00").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner" }));
    fireEvent.click(screen.getByRole("button", { name: "Save my whole plan" }));
    expect(readPlannerDraft()?.journey?.hotelComfort).toBe("Premium");
    expect(readPlannerDraft()?.ideas?.days[0]?.items[0]?.title).toBe("My arrival plan");
  }, 15000);
  it("rebuilds for different budgets, retains daily caps, and carries edits into sign-in", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("Departure city / airport"), {
      target: { value: "Berlin, Germany" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.change(screen.getByLabelText("How many days?"), { target: { value: "3" } });
    const presets = screen.getByLabelText("Compare budget presets");
    fireEvent.click(within(presets).getByRole("button", { name: /Budget/ }));
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    expect(screen.getAllByText(/A picnic or market lunch/)).toHaveLength(3);
    fireEvent.click(within(presets).getByRole("button", { name: /Luxury/ }));
    fireEvent.click(screen.getByRole("button", { name: "Rebuild my whole trip" }));
    expect(screen.getAllByText(/A leisurely regional lunch/)).toHaveLength(3);
    const firstActivity = screen.getAllByLabelText("Activity")[0]!;
    fireEvent.change(firstActivity, { target: { value: "My edited arrival" } });
    fireEvent.click(screen.getByRole("button", { name: "Save my whole plan" }));
    expect(readPlannerDraft()?.ideas?.days[0]?.items[0]?.title).toBe("My edited arrival");
    expect(readPlannerDraft()?.budget).toBe(1800);
    expect(readPlannerDraft()?.journey?.departure).toBe("Berlin, Germany");
    expect(readPlannerDraft()?.journey?.flightBudget).toBe(450);
    expect(navigate).toHaveBeenCalledWith({ to: "/trips" });
  }, 15000);
  it("connects flight and hotel selections, flags overspend, and keeps demo provenance through saving", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("Departure city / airport"), {
      target: { value: "Berlin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Flights" }));
    expect(screen.getByText(/Demonstration data · not real flight offers/)).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Try this demo flight" })[2]!);
    const dashboard = screen.getByRole("region", { name: "Connected trip budget" });
    expect(within(dashboard).getByText("€465.00")).toBeVisible();
    expect(within(dashboard).getByText("Over budget")).toBeVisible();
    expect(within(dashboard).getByText("€90.00")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Hotels" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Try this demo hotel" })[2]!);
    expect(within(dashboard).getByText("€648.00")).toBeVisible();
    expect(within(dashboard).getByText("€231.75")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner" }));
    fireEvent.click(screen.getByRole("button", { name: "Save my whole plan" }));
    expect(readPlannerDraft()?.journey?.selectedFlight?.evidence).toBe("demo");
    expect(readPlannerDraft()?.journey?.selectedFlight?.amount).toBe(465);
    expect(readPlannerDraft()?.stay?.evidence).toBe("demo");
    expect(readPlannerDraft()?.stay?.amount).toBe(648);
    expect(paidAI).not.toHaveBeenCalled();
  }, 15000);
  it("allows a complete plan without flights or departure", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TravelPlanner />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Include flights in my trip" }));
    fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Flights" }));
    expect(screen.getByRole("heading", { name: "A trip without flights" })).toBeVisible();
  }, 15000);
});
