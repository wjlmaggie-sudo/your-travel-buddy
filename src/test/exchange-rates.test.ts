import { describe, it, expect, vi } from "vitest";
import { fetchExchangeRate } from "@/lib/exchange-rates";
describe("free reference currency rates", () => {
  it("uses a pinned ECB rate without sending amounts, budgets or API keys", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        Response.json({ base: "EUR", quote: "USD", date: "2026-10-16", rate: 1.1253 }),
      );
    expect((await fetchExchangeRate("EUR", "USD", undefined, request)).rate).toBe(1.1253);
    expect(request.mock.calls[0]?.[0]).toBe(
      "https://api.frankfurter.dev/v2/providers/ecb/rate/eur/usd",
    );
    expect(request.mock.calls[0]?.[1]).not.toHaveProperty("headers");
  });
  it("rejects mismatched, invalid or unavailable rates", async () => {
    await expect(
      fetchExchangeRate(
        "EUR",
        "USD",
        undefined,
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ base: "USD", quote: "EUR", date: "2026-10-16", rate: 1.2 }),
          ),
      ),
    ).rejects.toThrow("does not match");
    await expect(
      fetchExchangeRate(
        "EUR",
        "USD",
        undefined,
        vi.fn().mockResolvedValue(new Response("", { status: 503 })),
      ),
    ).rejects.toThrow("unavailable");
    const request = vi.fn();
    await expect(fetchExchangeRate("FAKE", "USD", undefined, request)).rejects.toThrow("supported");
    expect(request).not.toHaveBeenCalled();
  });
});
