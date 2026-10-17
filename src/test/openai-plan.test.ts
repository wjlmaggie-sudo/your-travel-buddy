import { describe, it, expect, vi } from "vitest";
import { openAIPlan, providerErrorMessage } from "../../supabase/functions/_shared/openai-plan";
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
    const request = vi.fn().mockResolvedValue(
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
        vi.fn().mockResolvedValue(
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

describe("safe provider limit messages", () => {
  it("distinguishes credit exhaustion, spending caps, and temporary request limits", () => {
    expect(providerErrorMessage(429, "credit_balance_exhausted", "insufficient_quota")).toContain(
      "credit has run out",
    );
    expect(
      providerErrorMessage(429, "project_spend_limit_exceeded", "insufficient_quota"),
    ).toContain("project has reached its spending limit");
    expect(providerErrorMessage(429, "organization_usage_limit_exceeded", null)).toContain(
      "approved usage limit",
    );
    expect(providerErrorMessage(429, "rate_limit_exceeded", "rate_limit_error")).toContain("wait");
    expect(providerErrorMessage(429, "insufficient_quota", null)).toContain("check API billing");
  });
  it("does not expose untrusted provider messages or private identifiers", () => {
    expect(providerErrorMessage(429, "private-account-identifier", null)).not.toContain(
      "private-account-identifier",
    );
    expect(providerErrorMessage(401, null, null)).toContain("rejected the API key");
  });
});
