import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const insert = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
vi.mock("@/components/DayVisuals", () => ({
  DayVisuals: () => <div>Suggested map stops and restaurants</div>,
}));
vi.mock("@/components/EditActivity", () => ({ EditActivity: () => null }));
vi.mock("@/components/DayWeather", () => ({ DayWeather: () => null }));
import { ItineraryDay } from "@/components/ItineraryDay";
beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
});
afterEach(cleanup);
describe("day activity controls", () => {
  it("only reveals extra fields when Add activity is pressed, then hides them after saving", async () => {
    const refresh = vi.fn();
    render(
      <ItineraryDay
        day={1}
        items={[]}
        tripId="trip"
        destination="Lisbon, Portugal"
        style="Balanced"
        refresh={refresh}
      />,
    );
    expect(screen.queryByLabelText("Day 1 activity title")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
    fireEvent.change(screen.getByLabelText("Day 1 activity title"), {
      target: { value: "My Alfama walk" },
    });
    fireEvent.change(screen.getByLabelText("Day 1 activity place"), {
      target: { value: "Alfama, Lisbon" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Alfama walk",
        location: "Alfama, Lisbon",
        trip_id: "trip",
        day: 1,
      }),
    );
    expect(screen.queryByLabelText("Day 1 activity title")).not.toBeInTheDocument();
  });
  it("allows closing optional fields without creating an activity", () => {
    render(
      <ItineraryDay
        day={2}
        items={[]}
        tripId="trip"
        destination="Lisbon, Portugal"
        style="Balanced"
        refresh={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Day 2 activity place")).not.toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });
});
