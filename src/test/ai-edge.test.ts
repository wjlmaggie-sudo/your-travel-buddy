import { beforeEach, describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ getSession: vi.fn(), invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: api.getSession }, functions: { invoke: api.invoke } },
}));
import { generateTripIdeas } from "@/lib/ai.edge";
const input = {
  destination: "Lisbon",
  days: 1,
  interests: "Food",
  travelers: 2,
  budget: 1000,
  currency: "EUR",
  style: "Balanced" as const,
};
const ideas = {
  days: [
    {
      day: 1,
      items: [{ time: "10:00", title: "Explore", location: "Alfama", notes: "A relaxed walk." }],
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  api.getSession.mockResolvedValue({
    data: { session: { access_token: "test-user-session" } },
    error: null,
  });
});
describe("static AI client", () => {
  it("requires sign-in before invoking a paid AI backend", async () => {
    api.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const result = await generateTripIdeas({ data: input });
    expect(result.error).toContain("sign in");
    expect(api.invoke).not.toHaveBeenCalled();
  });
  it("invokes the Edge Function with travel settings and validates the result", async () => {
    api.invoke.mockResolvedValue({ data: { ideas }, error: null });
    expect(await generateTripIdeas({ data: input })).toEqual({ ideas, error: null });
    expect(api.invoke).toHaveBeenCalledWith("generate-trip-ideas", { body: input });
  });
  it("reports undeployed backend setup without claiming a generated plan", async () => {
    api.invoke.mockResolvedValue({
      data: null,
      error: { context: new Response("{}", { status: 404 }) },
    });
    const result = await generateTripIdeas({ data: input });
    expect(result.ideas).toBeNull();
    expect(result.error).toContain("deploy");
  });
  it("rejects invalid settings and incomplete plans", async () => {
    expect((await generateTripIdeas({ data: { ...input, budget: -1 } })).ideas).toBeNull();
    expect(api.invoke).not.toHaveBeenCalled();
    api.invoke.mockResolvedValue({ data: { ideas }, error: null });
    expect((await generateTripIdeas({ data: { ...input, days: 2 } })).error).toContain(
      "incomplete",
    );
  });
});
