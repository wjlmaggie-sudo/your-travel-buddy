vi.mock("@/components/DayVisuals", () => ({
  DayVisuals: () => <div>Day map and restaurants</div>,
}));
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const navigate = vi.hoisted(() => vi.fn());
const paidAI = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: session } } }));
vi.mock("@/lib/ai.functions", () => ({ generateTripIdeas: paidAI }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/TripWeather", () => ({ TripWeather: () => <div>Destination weather</div> }));
vi.mock("@/components/DayWeather", () => ({ DayWeather: () => <span>Daily weather</span> }));
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TravelPlanner } from "@/components/TravelPlanner";
import { readPlannerDraft, readGuestSimulation } from "@/lib/planner-draft";
function setup() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TravelPlanner />
    </QueryClientProvider>,
  );
}
function start(departure = "Berlin") {
  if (departure)
    fireEvent.change(screen.getByLabelText("Departure city / airport"), {
      target: { value: departure },
    });
  fireEvent.click(screen.getByRole("button", { name: "Lisbon" }));
  fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
}
function go(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
beforeEach(() => {
  sessionStorage.clear();
  navigate.mockClear();
  session.mockClear();
  session.mockResolvedValue({ data: { session: null }, error: null });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("guest workspace", () => {
  it("uses child ages in family plans and retains them through refresh and save handoff", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("How many people?"), { target: { value: "4" } });
    go("Family");
    fireEvent.change(screen.getByLabelText("Children in your group"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Child 1 age"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Child 2 age"), { target: { value: "9" } });
    start("");
    expect(screen.getByText(/^Family planning.*3, 9/)).toBeVisible();
    expect(readGuestSimulation()?.childrenAges).toEqual([3, 9]);
    expect(
      readGuestSimulation()?.ideas?.days[0]?.items.some((i) => i.title.includes("nap break")),
    ).toBe(true);
    expect(readGuestSimulation()?.budget).toBe(1500);
    cleanup();
    setup();
    expect(screen.getByText(/^Family planning.*3, 9/)).toBeVisible();
    go("Save my whole plan");
    await screen.findByRole("button", { name: "Sign in or create an account" });
    go("Sign in or create an account");
    expect(readPlannerDraft()?.persona).toBe("family");
    expect(readPlannerDraft()?.childrenAges).toEqual([3, 9]);
    expect(paidAI).not.toHaveBeenCalled();
  }, 15000);

  it("reviews a persona rebuild before replacing manually edited activities", () => {
    setup();
    start("");
    fireEvent.change(screen.getAllByLabelText("Activity")[0]!, {
      target: { value: "Keep my own activity" },
    });
    go("Edit trip details");
    go("Business");
    go("Rebuild my whole trip");
    expect(screen.getByRole("dialog", { name: "Rebuild this simulation?" })).toBeVisible();
    go("Keep my edits");
    expect(readGuestSimulation()?.ideas?.days[0]?.items[0]?.title).toBe("Keep my own activity");
    go("Rebuild my whole trip");
    go("Rebuild and replace edits");
    expect(readGuestSimulation()?.persona).toBe("business");
    expect(
      readGuestSimulation()?.ideas?.days[0]?.items.some((i) => i.title.includes("work or meeting")),
    ).toBe(true);
  }, 15000);
  it("generates a complete plan without auth or automatic scrolling and keeps tools separate", () => {
    setup();
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    const scroll = vi.spyOn(window, "scrollTo");
    start();
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeVisible();
    expect(screen.getAllByText(/^Breakfast and/)).toHaveLength(4);
    expect(session).not.toHaveBeenCalled();
    expect(paidAI).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Currency converter" })).not.toBeInTheDocument();
    go("Currency");
    expect(screen.getByRole("region", { name: "Currency converter" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Connected trip budget" })).not.toBeInTheDocument();
    go("Weather");
    expect(screen.getByLabelText("Weather destination")).toHaveValue("Lisbon, Portugal");
    expect(session).not.toHaveBeenCalled();
  }, 15000);
  it("prompts only at Save and keeps the guest simulation after dismissing", async () => {
    setup();
    start();
    go("Save my whole plan");
    expect(
      await screen.findByText(
        "Create a free account to save your travel plans and access them anytime.",
      ),
    ).toBeVisible();
    expect(navigate).not.toHaveBeenCalled();
    expect(readPlannerDraft()).toBeNull();
    go("Keep exploring as a guest");
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeVisible();
    expect(readGuestSimulation()?.ideas?.days).toHaveLength(5);
    go("Save my whole plan");
    await screen.findByRole("button", { name: "Sign in or create an account" });
    go("Sign in or create an account");
    expect(readPlannerDraft()?.journey?.departure).toBe("Berlin");
    expect(navigate).toHaveBeenCalledWith({ to: "/trips" });
  }, 15000);
  it("retains edited activities and selections across sections and same-tab refresh", () => {
    setup();
    start();
    fireEvent.change(screen.getAllByLabelText("Activity")[0]!, {
      target: { value: "My arrival plan" },
    });
    go("Hotels");
    fireEvent.click(screen.getAllByRole("button", { name: "Try this demo hotel" })[0]!);
    go("AI Travel Planner");
    expect(readGuestSimulation()?.stay?.evidence).toBe("demo");
    expect(readGuestSimulation()?.ideas?.days[0]?.items[0]?.title).toBe("My arrival plan");
    cleanup();
    setup();
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeVisible();
    expect(screen.getAllByLabelText("Activity")[0]).toHaveValue("My arrival plan");
    expect(session).not.toHaveBeenCalled();
  }, 15000);
  it("changes estimates through preferences and regenerates with the new budget", () => {
    setup();
    fireEvent.change(screen.getByLabelText("How many days?"), { target: { value: "3" } });
    go("Preferences");
    fireEvent.click(
      within(screen.getByLabelText("Compare budget presets")).getByRole("button", {
        name: /Budget/,
      }),
    );
    go("Done");
    start();
    expect(screen.getAllByText(/A picnic or market lunch/)).toHaveLength(3);
    go("Edit trip details");
    go("Preferences");
    fireEvent.click(
      within(screen.getByLabelText("Compare budget presets")).getByRole("button", {
        name: /Luxury/,
      }),
    );
    go("Done");
    go("Rebuild my whole trip");
    expect(screen.getAllByText(/A leisurely regional lunch/)).toHaveLength(3);
    expect(readGuestSimulation()?.budget).toBe(1800);
  }, 15000);
  it("updates one budget without silently reducing other estimates, and preserves demo labels on save", async () => {
    session.mockResolvedValue({ data: { session: { user: { id: "test-user" } } }, error: null });
    setup();
    start();
    go("Flights");
    fireEvent.click(screen.getAllByRole("button", { name: "Try this demo flight" })[2]!);
    go("AI Travel Planner");
    expect(screen.getByRole("status", { name: "Trip budget summary" })).toHaveTextContent(
      "€90.00 over budget",
    );
    let dashboard = screen.getByRole("region", { name: "Connected trip budget" });
    expect(within(dashboard).getByText("€465.00")).toBeVisible();
    expect(within(dashboard).getByText("€90.00")).toBeVisible();
    go("Hotels");
    fireEvent.click(screen.getAllByRole("button", { name: "Try this demo hotel" })[2]!);
    go("AI Travel Planner");
    dashboard = screen.getByRole("region", { name: "Connected trip budget" });
    expect(within(dashboard).getByText("€648.00")).toBeVisible();
    expect(within(dashboard).getByText("€231.75")).toBeVisible();
    go("Save my whole plan");
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(readPlannerDraft()?.journey?.selectedFlight?.evidence).toBe("demo");
    expect(readPlannerDraft()?.stay?.amount).toBe(648);
  }, 15000);
  it("allows departure to be omitted and requires it only when adding flights", () => {
    setup();
    start("");
    expect(screen.getByRole("heading", { name: "5 days in Lisbon, Portugal" })).toBeVisible();
    go("Flights");
    expect(screen.getByRole("heading", { name: "A trip without flights" })).toBeVisible();
  }, 15000);
  it("confirms replacing edits in-app and lets guests cancel without losing their plan", () => {
    setup();
    start();
    fireEvent.change(screen.getAllByLabelText("Activity")[0]!, {
      target: { value: "Keep my special stop" },
    });
    go("Edit trip details");
    fireEvent.change(screen.getByLabelText("Total group budget (EUR)"), {
      target: { value: "2000" },
    });
    go("Rebuild my whole trip");
    expect(screen.getByRole("dialog", { name: "Rebuild this simulation?" })).toBeVisible();
    go("Keep my edits");
    go("Back to overview");
    expect(readGuestSimulation()?.budget).toBe(1500);
    expect(screen.getAllByLabelText("Activity")[0]).toHaveValue("Keep my special stop");
    go("Edit trip details");
    go("Rebuild my whole trip");
    go("Rebuild and replace edits");
    expect(readGuestSimulation()?.budget).toBe(2000);
    expect(screen.getAllByLabelText("Activity")[0]).not.toHaveValue("Keep my special stop");
    expect(session).not.toHaveBeenCalled();
  }, 25000);
});
