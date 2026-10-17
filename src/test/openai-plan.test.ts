import { describe, it, expect, vi } from "vitest";
import { openAIPlan } from "../../supabase/functions/_shared/openai-plan";
const input = {
  destination: "Lisbon",
  days: 1,
  travelers: 2,
  budget: 100,
  currency: "EUR",
  interests: "Food",
  style: "Budget" as const,
  accommodationTotal: 80,
};
const ideas = {
  summary: "Estimates only",
  days: [
    { day: 1, items: [{ time: "10:00", title: "Walk", location: "Alfama", notes: "Free walk" }] },
  ],
};
describe("live OpenAI plan provider", () => {
  it("requests structured output privately, includes chosen stay cost and validates coverage", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          status: "completed",
          output: [
            { type: "message", content: [{ type: "output_text", text: JSON.stringify(ideas) }] },
          ],
        }),
      );
    expect(await openAIPlan(input, "test-private-key", "gpt-5.4-mini", request)).toEqual(ideas);
    const body = JSON.parse(request.mock.calls[0]![1].body);
    expect(body.text.format.strict).toBe(true);
    expect(body.store).toBe(false);
    expect(body.input).toContain("Remaining for food");
    expect(body.input).toContain("20.00 EUR");
    expect(body).not.toHaveProperty("apiKey");
  });
  it("never treats an interrupted or incomplete response as a full trip", async () => {
    await expect(
      openAIPlan(
        input,
        "test",
        undefined,
        vi.fn().mockResolvedValue(Response.json({ status: "incomplete" })),
      ),
    ).rejects.toThrow("incomplete");
    await expect(
      openAIPlan(
        { ...input, days: 2 },
        "test",
        undefined,
        vi
          .fn()
          .mockResolvedValue(
            Response.json({
              status: "completed",
              output: [
                {
                  type: "message",
                  content: [{ type: "output_text", text: JSON.stringify(ideas) }],
                },
              ],
            }),
          ),
      ),
    ).rejects.toThrow("incomplete");
  });
  it("returns a useful limit error without exposing provider response details", async () => {
    await expect(
      openAIPlan(
        input,
        "test",
        undefined,
        vi.fn().mockResolvedValue(new Response("provider secret error", { status: 429 })),
      ),
    ).rejects.toThrow("billing limit");
  });
});
