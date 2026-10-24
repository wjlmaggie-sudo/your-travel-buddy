import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  upsert: vi.fn(),
  range: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth,
    from: () => ({ upsert: auth.upsert, select: () => ({ order: () => ({ range: auth.range }) }) }),
  },
}));
import {
  DEFAULT_PREFERENCES,
  saveTripPreferences,
  preferencesQuery,
} from "@/lib/travel-preferences";

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

it("stores persona and ages privately in account metadata without requiring new table columns", async () => {
  auth.getUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
  auth.upsert.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  const family = {
    ...DEFAULT_PREFERENCES,
    travelers: 4,
    persona: "family" as const,
    childrenAgeRanges: ["0-3", "7-10"] as ("0-3" | "7-10")[],
  };
  await saveTripPreferences("family-trip", family);
  expect(auth.upsert).toHaveBeenCalledWith(
    { trip_id: "family-trip", ...DEFAULT_PREFERENCES, travelers: 4 },
    { onConflict: "trip_id" },
  );
  expect(auth.updateUser).toHaveBeenCalledWith({
    data: { travel_preferences: { "family-trip": family } },
  });
});

it("merges persisted persona and ages back into database-backed preferences", async () => {
  const family = {
    ...DEFAULT_PREFERENCES,
    travelers: 4,
    persona: "family" as const,
    childrenAgeRanges: ["0-3", "7-10"] as ("0-3" | "7-10")[],
  };
  auth.getUser.mockResolvedValue({
    data: { user: { user_metadata: { travel_preferences: { family } } } },
    error: null,
  });
  auth.range.mockResolvedValue({
    data: [{ trip_id: "family", ...DEFAULT_PREFERENCES, travelers: 4 }],
    error: null,
  });
  const query = preferencesQuery();
  const fn = query.queryFn as () => Promise<unknown>;
  expect(await fn()).toEqual({ family });
});
it("can clear an existing persona without leaving stale metadata", async () => {
  auth.getUser.mockResolvedValue({
    data: {
      user: {
        user_metadata: {
          travel_preferences: { trip: { ...DEFAULT_PREFERENCES, persona: "business" } },
        },
      },
    },
    error: null,
  });
  auth.upsert.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  await saveTripPreferences("trip", DEFAULT_PREFERENCES);
  expect(auth.updateUser).toHaveBeenCalledWith({
    data: { travel_preferences: { trip: DEFAULT_PREFERENCES } },
  });
});
