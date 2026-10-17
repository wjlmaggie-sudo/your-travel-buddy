vi.mock("@/components/DayVisuals", () => ({
  DayVisuals: () => <div>Day map and restaurants</div>,
}));
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
const api = vi.hoisted(() => ({ generate: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/ai.functions", () => ({ generateTripIdeas: api.generate }));
vi.mock("@/lib/travel-preferences", () => ({
  useTripPreferences: () => ({
    preference: { travelers: 2, style: "Balanced", interest: "Culture" },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/lib/place-directory", () => ({
  searchDestinations: async () => [],
  nearbyPlaces: async () => [],
}));
vi.mock("@/lib/suggested-plan", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/suggested-plan")>()),
  saveSuggestedPlan: api.save,
}));
vi.mock("@/lib/stay-planning", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stay-planning")>()),
  readStayChoice: async () => null,
  stayCost: () => null,
}));
import { TripSuggestions } from "@/components/TripSuggestions";
const trip = {
  id: "trip",
  user_id: "user",
  destination: "Lisbon",
  start_date: "2026-10-20",
  end_date: "2026-10-21",
  budget: 500,
  currency: "EUR",
  created_at: "",
};
const ideas = {
  summary: "A relaxed city trip.",
  days: [
    {
      day: 1,
      items: [
        { time: "10:00", title: "Old town", location: "Lisbon", notes: "Walk the old town." },
      ],
    },
    {
      day: 2,
      items: [{ time: "11:00", title: "Museum", location: "Lisbon", notes: "See the museum." }],
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("crypto", { randomUUID });
  api.generate.mockResolvedValue({ ideas, error: null });
  api.save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("whole-trip suggestion workflow", () => {
  it("creates every day without calling a paid AI service", async () => {
    api.generate.mockResolvedValue({ ideas: null, error: "AI setup is pending" });
    render(<TripSuggestions trip={trip} activities={[]} onSaved={vi.fn()} onApplied={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    await screen.findByText(/This is a template-based plan/);
    expect(api.generate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /AI enhancement|live AI/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Activity")).toHaveLength(10);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("lets users edit the suggestion before saving every day together", async () => {
    const onSaved = vi.fn(),
      onApplied = vi.fn();
    render(<TripSuggestions trip={trip} activities={[]} onSaved={onSaved} onApplied={onApplied} />);
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    await screen.findByText(/This is a template-based plan/);
    fireEvent.change(screen.getAllByLabelText("Activity")[0]!, {
      target: { value: "My custom walk" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save whole itinerary" }));
    await waitFor(() => expect(onApplied).toHaveBeenCalledOnce());
    expect(api.save.mock.calls[0]?.[0]).toHaveLength(10);
    expect(api.save.mock.calls[0]?.[0][0].title).toBe("My custom walk");
    expect(onSaved).toHaveBeenCalledOnce();
  });
  it("keeps the editable draft when a cloud save fails", async () => {
    api.save.mockRejectedValueOnce(new Error("offline"));
    render(<TripSuggestions trip={trip} activities={[]} onSaved={vi.fn()} onApplied={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Create my travel plan" }));
    await screen.findByText(/This is a template-based plan/);
    fireEvent.click(screen.getByRole("button", { name: "Save whole itinerary" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save whole itinerary" })).not.toBeDisabled(),
    );
    expect(screen.getAllByLabelText("Activity")[0]).toHaveValue("Breakfast and an easy start");
  });
  it("starts the complete suggestion flow once for a newly created trip", async () => {
    render(
      <TripSuggestions
        trip={trip}
        activities={[]}
        autoGenerate
        onSaved={vi.fn()}
        onApplied={vi.fn()}
      />,
    );
    await screen.findByText(/This is a template-based plan/);
    expect(api.generate).not.toHaveBeenCalled();
    expect(screen.getAllByLabelText("Activity")).toHaveLength(10);
  });
});
