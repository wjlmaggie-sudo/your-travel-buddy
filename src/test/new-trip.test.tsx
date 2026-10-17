import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  navigate: vi.fn(),
  invalidate: vi.fn(),
  savePreferences: vi.fn(),
  insertTrip: vi.fn(),
  insertActivities: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => api.navigate }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: api.invalidate }),
}));
vi.mock("@/lib/travel-preferences", () => ({
  DEFAULT_PREFERENCES: { travelers: 2, style: "Balanced", interest: "Food & culture", packing: [] },
  saveTripPreferences: api.savePreferences,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) =>
      table === "trips"
        ? {
            insert: (value: unknown) => {
              api.insertTrip(value);
              return {
                select: () => ({ single: async () => ({ data: { id: "new-trip" }, error: null }) }),
              };
            },
          }
        : { insert: api.insertActivities },
  },
}));
import { NewTripDialog } from "@/components/NewTripDialog";
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  api.insertActivities.mockResolvedValue({ error: null });
  api.savePreferences.mockResolvedValue(undefined);
  api.invalidate.mockResolvedValue(undefined);
});
describe("creating an account trip from a template", () => {
  it("saves the chosen duration, group settings, and daily activities to the same trip", async () => {
    render(<NewTripDialog open onOpenChange={vi.fn()} templateId="lisbon" />);
    fireEvent.change(screen.getByLabelText("Departure"), { target: { value: "2026-12-31" } });
    fireEvent.change(screen.getByLabelText("Days"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Travelers"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Create trip" }));
    await waitFor(() =>
      expect(api.navigate).toHaveBeenCalledWith({
        to: "/trips/$tripId",
        params: { tripId: "new-trip" },
      }),
    );
    expect(api.insertTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "Lisbon, Portugal",
        start_date: "2026-12-31",
        end_date: "2027-01-02",
      }),
    );
    expect(api.savePreferences).toHaveBeenCalledWith(
      "new-trip",
      expect.objectContaining({ travelers: 4 }),
    );
    expect(api.insertActivities.mock.calls[0]?.[0]).toHaveLength(3);
    expect(
      api.insertActivities.mock.calls[0]?.[0].every(
        (a: { trip_id: string }) => a.trip_id === "new-trip",
      ),
    ).toBe(true);
  });
  it("does not attach destination-specific activities after the destination changes", async () => {
    render(<NewTripDialog open onOpenChange={vi.fn()} templateId="lisbon" />);
    fireEvent.change(screen.getByLabelText("Destination"), {
      target: { value: "Berlin, Germany" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create trip" }));
    await waitFor(() => expect(api.navigate).toHaveBeenCalled());
    expect(api.insertActivities).not.toHaveBeenCalled();
  });
});
