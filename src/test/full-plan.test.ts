import { beforeEach, describe, expect, it, vi } from "vitest";
import { dailyBudgets, budgetAllocation } from "@/lib/planning";
import { collectPages } from "@/lib/pagination";
const api = vi.hoisted(() => ({ upsert: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => api } }));
import { prepareSuggestedPlan, saveSuggestedPlan } from "@/lib/suggested-plan";
import { tripIdeaInput } from "../../supabase/functions/_shared/trip-ideas";
import { randomUUID } from "node:crypto";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("crypto", { randomUUID });
});
describe("complete travel plans", () => {
  it("keeps daily group amounts exact across dates and small budgets", () => {
    const daily = dailyBudgets(1000, 3, 2, "2026-12-31");
    expect(daily.map((d) => d.amount)).toEqual([333.34, 333.33, 333.33]);
    expect(daily.map((d) => d.date)).toEqual(["2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(daily.reduce((sum, d) => sum + Math.round(d.amount * 100), 0)).toBe(100000);
    expect(dailyBudgets(0.02, 3, 2, "2026-10-17").map((d) => d.amount)).toEqual([0.01, 0.01, 0]);
    const parts = budgetAllocation(0.05, "Luxury");
    expect(parts.every((part) => part.amount >= 0)).toBe(true);
    expect(parts.reduce((sum, part) => sum + Math.round(part.amount * 100), 0)).toBe(5);
  });
  it("stores the whole plan in one statement and reuses IDs on a retry", async () => {
    const draft = prepareSuggestedPlan(
      "trip",
      {
        days: [
          {
            day: 1,
            items: [{ title: "Walk", time: "10:00", location: "Lisbon", notes: "Edit me" }],
          },
          { day: 2, items: [{ title: "Museum", time: "11:00", location: "Lisbon", notes: "" }] },
        ],
      },
      [{ day: 1, position: 4 }],
    );
    expect(draft.map((a) => [a.day, a.position])).toEqual([
      [1, 5],
      [2, 0],
    ]);
    api.upsert
      .mockResolvedValueOnce({ error: new Error("offline") })
      .mockResolvedValueOnce({ error: null });
    await expect(saveSuggestedPlan(draft)).rejects.toThrow("offline");
    draft[0]!.notes = "My edited note";
    await saveSuggestedPlan(draft);
    expect(api.upsert).toHaveBeenLastCalledWith(draft, { onConflict: "id" });
    expect(api.upsert.mock.calls[0]?.[0].map((a: { id: string }) => a.id)).toEqual(
      api.upsert.mock.calls[1]?.[0].map((a: { id: string }) => a.id),
    );
  });
  it("collects records beyond the default API page and fails on partial reads", async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: [3, 4], error: null })
      .mockResolvedValueOnce({ data: [5], error: null });
    expect(await collectPages(page, 2)).toEqual([1, 2, 3, 4, 5]);
    expect(page.mock.calls).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
    await expect(
      collectPages(() => Promise.resolve({ data: null, error: { message: "offline" } })),
    ).rejects.toThrow("offline");
  });
  it("accepts a whole 30-day trip instead of truncating at 14 days", () => {
    expect(
      tripIdeaInput.parse({
        destination: "Italy",
        days: 30,
        travelers: 2,
        budget: 4000,
        currency: "EUR",
        style: "Balanced",
        interests: "Museums",
      }).days,
    ).toBe(30);
  });
});
