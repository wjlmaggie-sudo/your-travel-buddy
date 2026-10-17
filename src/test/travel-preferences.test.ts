import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn(), upsert: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth, from: () => ({ upsert: auth.upsert }) },
}));
import { DEFAULT_PREFERENCES, saveTripPreferences } from "@/lib/travel-preferences";

beforeEach(() => {
  vi.clearAllMocks();
  auth.upsert.mockResolvedValue({ error: { code: "PGRST205" } });
});
describe("account travel preferences", () => {
  it("saves travelers and packing without replacing another trip", async () => {
    const existing = { ...DEFAULT_PREFERENCES, travelers: 4, packing: ["camera"] };
    auth.getUser.mockResolvedValue({
      data: { user: { user_metadata: { travel_preferences: { existing } } } },
      error: null,
    });
    auth.updateUser.mockResolvedValue({ error: null });
    await saveTripPreferences("new-trip", {
      ...DEFAULT_PREFERENCES,
      travelers: 3,
      packing: ["bag"],
    });
    expect(auth.updateUser).toHaveBeenCalledWith({
      data: {
        travel_preferences: {
          existing,
          "new-trip": { ...DEFAULT_PREFERENCES, travelers: 3, packing: ["bag"] },
        },
      },
    });
  });
  it("reports a failed save instead of claiming persistence", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
    auth.updateUser.mockResolvedValue({ error: new Error("offline") });
    await expect(saveTripPreferences("trip", DEFAULT_PREFERENCES)).rejects.toThrow("offline");
  });
  it("uses the preferences table after the database upgrade", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
    auth.upsert.mockResolvedValue({ error: null });
    await saveTripPreferences("trip", DEFAULT_PREFERENCES);
    expect(auth.upsert).toHaveBeenCalledWith(
      { trip_id: "trip", ...DEFAULT_PREFERENCES },
      { onConflict: "trip_id" },
    );
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("does not hide a database permission failure behind legacy storage", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
    auth.upsert.mockResolvedValue({ error: { code: "42501", message: "permission denied" } });
    await expect(saveTripPreferences("trip", DEFAULT_PREFERENCES)).rejects.toMatchObject({
      code: "42501",
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
